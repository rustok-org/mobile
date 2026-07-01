/**
 * deviceWallet — the on-device wallet lifecycle over the stateless FFI.
 *
 * Our core FFI is stateless: `importKeystore(blob, secret)` re-derives the
 * signing wallet on every unlock. This module wires that to on-device storage,
 * splitting the two secrets across two trust domains:
 *   - the encrypted keyring **blob** → MMKV (`walletStorage`, ciphertext at rest);
 *   - the random keystore **secret** that decrypts it → OS Keychain
 *     (`keystoreSecret`, behind biometric / device passcode).
 * An attacker with the MMKV blob still cannot decrypt it without the Keychain
 * secret, and recovery after device loss is always the written-down mnemonic —
 * the blob is an encrypted derived key, NOT the seed.
 *
 * Commit ordering + reconciliation guarantee there is never a "wallet exists but
 * cannot be unlocked" state: a partial write reconciles to a clean slate, and the
 * user re-onboards (no resumable half-state — the FFI can't reveal a mnemonic).
 */

import { FfiWallet, FfiWordCount, generateWallet } from 'react-native-rustok-bridge';
import type { FfiWalletLike } from 'react-native-rustok-bridge';

import { asciiToArrayBuffer, randomKeystoreSecretHex } from './bytes';
import {
  hasKeystoreSecret,
  retrieveKeystoreSecret,
  saveKeystoreSecret,
  wipeKeystoreSecret,
} from './keystoreSecret';
import {
  clearWalletRecord,
  hasWalletRecord,
  readWalletRecord,
  saveWalletRecord,
} from './walletStorage';

/** Thrown by {@link createWallet} when a wallet already exists (single-wallet). */
export class WalletExistsError extends Error {
  override readonly name = 'WalletExistsError';
  constructor() {
    super('a wallet already exists on this device');
  }
}

/** Thrown by {@link unlock} when no wallet is stored. */
export class NoWalletError extends Error {
  override readonly name = 'NoWalletError';
  constructor() {
    super('no wallet stored on this device');
  }
}

/** The freshly created wallet. The mnemonic MUST be backed up then discarded. */
export interface CreatedWallet {
  readonly address: string;
  /** Show once for backup; unrecoverable afterwards (the blob is not the seed). */
  readonly mnemonic: string;
}

/**
 * An unlocked session. Holds the keystore secret in a closure so it never
 * escapes into module state; signing re-passes it to the stateless FFI.
 */
export interface UnlockedSession {
  readonly address: string;
  signMessage(message: ArrayBuffer): Promise<ArrayBuffer>;
}

let inFlightCreate: Promise<CreatedWallet> | null = null;

/**
 * Creates a fresh wallet and commits it, generating the mnemonic + a random
 * keystore secret, then persisting {blob → MMKV, secret → Keychain}.
 *
 * Commit order is Keychain-first, MMKV-blob-last (the blob write is the atomic
 * commit point). If the MMKV write fails after the secret was stored, the secret
 * is rolled back so no orphan is left. Concurrent calls dedupe via single-flight.
 *
 * @throws {WalletExistsError} if a wallet already exists (never overwrites).
 */
export function createWallet(): Promise<CreatedWallet> {
  // Synchronous precondition, kept OUT of the single-flight so its rejection
  // never becomes the cached in-flight promise.
  if (hasWalletRecord()) {
    return Promise.reject(new WalletExistsError());
  }
  if (inFlightCreate !== null) {
    return inFlightCreate;
  }
  // `.finally` clears the slot on a microtask after the commit settles, so a
  // fast/synchronous failure inside `commitNewWallet` can't leave a stale promise.
  inFlightCreate = commitNewWallet().finally(() => {
    inFlightCreate = null;
  });
  return inFlightCreate;
}

async function commitNewWallet(): Promise<CreatedWallet> {
  const generated = generateWallet(FfiWordCount.Words24);
  const secretHex = randomKeystoreSecretHex();
  const password = asciiToArrayBuffer(secretHex);

  const wallet = await FfiWallet.importMnemonic(generated.mnemonic, password);
  const blob = wallet.exportKeystore();

  // Keychain first (may prompt); MMKV blob last = commit marker.
  await saveKeystoreSecret(secretHex);
  try {
    saveWalletRecord({ blob, address: generated.address });
  } catch (error: unknown) {
    // Roll back everything so a failed commit leaves nothing behind: clear any
    // partially-written record (address lands before the blob) and wipe the
    // just-stored secret.
    clearWalletRecord();
    await wipeKeystoreSecret().catch(() => undefined);
    throw error;
  }

  return { address: generated.address, mnemonic: generated.mnemonic };
}

/**
 * Unlocks the stored wallet: retrieves the keystore secret (biometric prompt),
 * reads the blob, and re-imports the wallet. A wrong/rotated secret or a corrupt
 * blob surfaces as an `FfiError::Wallet` from `importKeystore`, which propagates.
 *
 * @throws {NoWalletError} if no wallet is stored.
 */
export async function unlock(): Promise<UnlockedSession> {
  const record = readWalletRecord();
  if (record === null) {
    throw new NoWalletError();
  }
  const secretHex = await retrieveKeystoreSecret();
  const password = asciiToArrayBuffer(secretHex);
  const wallet: FfiWalletLike = await FfiWallet.importKeystore(record.blob, password);
  return {
    address: wallet.address(),
    signMessage: (message: ArrayBuffer): Promise<ArrayBuffer> =>
      wallet.signMessage(asciiToArrayBuffer(secretHex), message),
  };
}

/** Whether a wallet is stored (phase source of truth: MMKV blob presence). */
export function hasWallet(): boolean {
  return hasWalletRecord();
}

/** The stored public address without unlocking (for locked UI), or `null`. */
export function getStoredAddress(): string | null {
  return readWalletRecord()?.address ?? null;
}

/** Destroys the wallet: clears the blob and wipes the keystore secret. */
export async function wipeWallet(): Promise<void> {
  clearWalletRecord();
  await wipeKeystoreSecret();
}

/**
 * Reconciles a partial-write state on startup so phase never lies:
 *   - blob without secret → clear the blob (unloadable → clean re-onboarding);
 *   - secret without blob → wipe the orphan secret.
 * Idempotent; safe to call on every launch before routing.
 */
export async function reconcile(): Promise<void> {
  const blobPresent = hasWalletRecord();
  const secretPresent = await hasKeystoreSecret();
  if (blobPresent && !secretPresent) {
    clearWalletRecord();
  } else if (!blobPresent && secretPresent) {
    await wipeKeystoreSecret();
  }
}
