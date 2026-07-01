/**
 * keystoreSecret — hardware-backed storage for the wallet's keystore password.
 *
 * The keystore password is a random 256-bit secret (64 hex chars) that encrypts
 * the exported keyring blob. It is the ONLY thing that can decrypt that blob, so
 * it lives exclusively in the OS Keychain / Android Keystore behind
 * `BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE` — biometric OR device passcode, never
 * biometric-only (a biometric reset must not lock the user out; recovery is the
 * written-down mnemonic). It must never touch MMKV, logs, or the JS heap longer
 * than a single unlock.
 *
 * This is NOT the user's PIN: the PIN is a soft app-side gate (separate module,
 * A-slice) and is never a KDF input to the keystore. The trust boundary is this
 * Keychain entry's access control, not the PIN.
 *
 * `react-native-get-random-values` must be imported before this module is used
 * (see `index.js`) so `crypto.getRandomValues` is available for secret generation.
 */

import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

import { KEYSTORE_SECRET_BYTES } from './bytes';

/** Stable service id — changing it orphans existing keystore secrets. */
const SERVICE = 'com.rustokwallet.keystore';

/** Required by the keychain API; not otherwise meaningful (single secret per service). */
const ACCOUNT = 'rustok-keystore';

const AUTH_PROMPT = { title: 'Unlock Rustok wallet', cancel: 'Cancel' } as const;

const SET_OPTIONS = {
  service: SERVICE,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  authenticationPrompt: AUTH_PROMPT,
} as const;

const GET_OPTIONS = {
  service: SERVICE,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
  authenticationPrompt: AUTH_PROMPT,
} as const;

const SERVICE_ONLY = { service: SERVICE } as const;

/** Expected length of the stored secret in hex characters. */
const SECRET_HEX_LEN = KEYSTORE_SECRET_BYTES * 2;

/**
 * Coarse failure kind for callers to switch on. Fine-grained cases (biometric
 * cancel vs `KeyPermanentlyInvalidated`) are read from {@link KeystoreSecretException.nativeMessage}
 * at the call site — the wrapper deliberately does not parse native message text.
 * iOS errors all fold to `unknown` until an iOS pass adds the `errSec*` mapping.
 */
export type KeystoreSecretErrorKind =
  | 'empty_parameters'
  | 'crypto_failed'
  | 'keystore_access'
  | 'biometry_unsupported'
  | 'unknown';

export class KeystoreSecretException extends Error {
  override readonly name = 'KeystoreSecretException';

  constructor(
    readonly kind: KeystoreSecretErrorKind,
    /** Raw native error code (Android `E_*`); undefined for non-keychain failures. */
    readonly nativeCode: string | undefined,
    /** Raw native message — for call-site discrimination/logging, never shown verbatim. */
    readonly nativeMessage: string | undefined,
    /** Underlying throwable, kept as an own field (Hermes lacks the `cause` overload). */
    readonly cause?: unknown,
  ) {
    super(nativeMessage ?? `keystoreSecret ${kind}`);
  }
}

function extractCode(error: unknown): string | undefined {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function androidCodeToKind(code: string): KeystoreSecretErrorKind {
  switch (code) {
    case 'E_EMPTY_PARAMETERS':
      return 'empty_parameters';
    case 'E_CRYPTO_FAILED':
      return 'crypto_failed';
    case 'E_KEYSTORE_ACCESS_ERROR':
      return 'keystore_access';
    case 'E_SUPPORTED_BIOMETRY_ERROR':
      return 'biometry_unsupported';
    default:
      return 'unknown';
  }
}

function mapKeychainError(error: unknown): KeystoreSecretException {
  const message = error instanceof Error ? error.message : undefined;
  const code = extractCode(error);
  if (Platform.OS === 'ios' || typeof code !== 'string') {
    return new KeystoreSecretException('unknown', code, message, error);
  }
  return new KeystoreSecretException(androidCodeToKind(code), code, message, error);
}

/**
 * Persists a keystore secret (64 lowercase-hex) to the Keychain, replacing any
 * existing entry for this service. The caller (deviceWallet) generates the secret
 * so it can encrypt the keyring with the same value before storing it here.
 */
export async function saveKeystoreSecret(secretHex: string): Promise<void> {
  const stored = await Keychain.setGenericPassword(ACCOUNT, secretHex, SET_OPTIONS).catch(
    (error: unknown): never => {
      throw mapKeychainError(error);
    },
  );
  if (stored === false) {
    throw new KeystoreSecretException(
      'unknown',
      undefined,
      'setGenericPassword returned false — keychain rejected the write',
      undefined,
    );
  }
}

/**
 * Retrieves the keystore secret, triggering the biometric / device-passcode
 * prompt. Throws {@link KeystoreSecretException} if the entry is missing or the
 * read fails. A `crypto_failed` whose `nativeMessage` mentions
 * `Key permanently invalidated` means the biometric set changed — the caller
 * must route to mnemonic recovery (the wrapper never auto-wipes).
 */
export async function retrieveKeystoreSecret(): Promise<string> {
  const result = await Keychain.getGenericPassword(GET_OPTIONS).catch((error: unknown): never => {
    throw mapKeychainError(error);
  });
  if (result === false) {
    throw new KeystoreSecretException('unknown', undefined, 'no keystore secret stored', undefined);
  }
  // Trust-boundary guard: reject a malformed secret (partial write / corruption)
  // before it reaches the Rust crypto path, where it would surface as an opaque
  // decryption failure. `randomKeystoreSecretHex` only emits lowercase hex.
  if (result.password.length !== SECRET_HEX_LEN || !/^[0-9a-f]+$/.test(result.password)) {
    throw new KeystoreSecretException(
      'unknown',
      undefined,
      `stored secret has unexpected shape (length=${result.password.length})`,
      undefined,
    );
  }
  return result.password;
}

/** Removes the keystore secret. Idempotent — no-op if already absent. */
export async function wipeKeystoreSecret(): Promise<void> {
  await Keychain.resetGenericPassword(SERVICE_ONLY).catch((error: unknown): never => {
    throw mapKeychainError(error);
  });
}

/**
 * Whether a keystore secret exists, without prompting for biometrics (used by
 * startup reconciliation and phase routing). Throws only on an actual keystore
 * access failure — callers distinguish "absent" (route to onboarding) from
 * "broken" (route to recovery).
 */
export async function hasKeystoreSecret(): Promise<boolean> {
  return Keychain.hasGenericPassword(SERVICE_ONLY).catch((error: unknown): never => {
    throw mapKeychainError(error);
  });
}
