/**
 * Orchestration tests for the on-device wallet storage layer. The real
 * keystoreSecret + walletStorage + deviceWallet run; only the native boundaries
 * are mocked (keychain + FFI bridge via `__mocks__`, MMKV via its built-in Jest
 * mock). The genuine crypto round-trip is proven on-device — these tests cover
 * commit ordering, rollback, reconciliation, and error propagation.
 */

import * as Keychain from 'react-native-keychain';
import * as MMKV from 'react-native-mmkv';

import {
  createWallet,
  getStoredAddress,
  hasWallet,
  NoWalletError,
  reconcile,
  unlock,
  WalletExistsError,
  wipeWallet,
} from '../deviceWallet';
import { hasKeystoreSecret } from '../keystoreSecret';
import * as walletStorage from '../walletStorage';
import { clearWalletRecord } from '../walletStorage';

const keychainMock = Keychain as unknown as {
  __resetKeychain: () => void;
  __failNextKeychainOp: (error: Error) => void;
};
const bridgeMock = jest.requireMock('react-native-rustok-bridge') as { __resetBridge: () => void };
const mmkvMock = MMKV as unknown as { __resetMMKV: () => void };

const KEYSTORE_SERVICE = 'com.rustokwallet.keystore';

beforeEach(() => {
  jest.restoreAllMocks();
  keychainMock.__resetKeychain();
  bridgeMock.__resetBridge();
  mmkvMock.__resetMMKV();
});

describe('createWallet', () => {
  it('commits the blob to MMKV and the secret to the keychain, returning address + mnemonic', async () => {
    const created = await createWallet();

    expect(created.address).toMatch(/^0xMOCK[0-9a-f]{12}$/);
    expect(created.mnemonic.length).toBeGreaterThan(0);
    expect(hasWallet()).toBe(true);
    expect(getStoredAddress()).toBe(created.address);
    expect(await hasKeystoreSecret()).toBe(true);
  });

  it('rejects with WalletExistsError when a wallet already exists (never overwrites)', async () => {
    await createWallet();
    await expect(createWallet()).rejects.toBeInstanceOf(WalletExistsError);
  });

  it('dedupes concurrent calls via single-flight (one wallet created)', async () => {
    const [a, b] = await Promise.all([createWallet(), createWallet()]);
    expect(a.address).toBe(b.address);
    expect(getStoredAddress()).toBe(a.address);
  });

  it('leaves a clean state when the keychain write fails (nothing persisted)', async () => {
    keychainMock.__failNextKeychainOp(new Error('keystore write failed'));
    await expect(createWallet()).rejects.toThrow();

    expect(hasWallet()).toBe(false);
    expect(await hasKeystoreSecret()).toBe(false);
  });

  it('rolls the keychain secret back when the MMKV write fails (no orphan secret)', async () => {
    jest.spyOn(walletStorage, 'saveWalletRecord').mockImplementation(() => {
      throw new Error('mmkv write failed');
    });

    await expect(createWallet()).rejects.toThrow('mmkv write failed');

    expect(hasWallet()).toBe(false);
    expect(getStoredAddress()).toBeNull(); // no orphan address left behind
    expect(await hasKeystoreSecret()).toBe(false); // secret was wiped on rollback
  });
});

describe('unlock', () => {
  it('re-imports the stored wallet and signs with the retained secret', async () => {
    const created = await createWallet();

    const session = await unlock();
    expect(session.address).toBe(created.address);

    const signature = await session.signMessage(new ArrayBuffer(4));
    expect(signature.byteLength).toBe(65);
  });

  it('rejects with NoWalletError when no wallet is stored', async () => {
    await expect(unlock()).rejects.toBeInstanceOf(NoWalletError);
  });

  it('propagates a Wallet error when the stored secret no longer matches the blob', async () => {
    await createWallet();
    // Overwrite the keychain with a different, well-formed secret so retrieval
    // passes the shape guard but decryption (importKeystore) fails.
    const wrongSecret = 'f'.repeat(64);
    await Keychain.setGenericPassword('rustok-keystore', wrongSecret, {
      service: KEYSTORE_SERVICE,
    });

    await expect(unlock()).rejects.toThrow(/wrong password/i);
  });

  it('rejects a malformed stored secret before it reaches the crypto path', async () => {
    await createWallet();
    await Keychain.setGenericPassword('rustok-keystore', 'too-short', {
      service: KEYSTORE_SERVICE,
    });

    await expect(unlock()).rejects.toThrow(/unexpected shape/i);
  });
});

describe('reconcile', () => {
  it('clears an orphan blob when its keystore secret is missing', async () => {
    await createWallet();
    await Keychain.resetGenericPassword({ service: KEYSTORE_SERVICE }); // secret gone, blob remains

    await reconcile();

    expect(hasWallet()).toBe(false);
  });

  it('wipes an orphan keystore secret when no blob is stored', async () => {
    await createWallet();
    clearWalletRecord(); // blob gone, secret remains

    await reconcile();

    expect(await hasKeystoreSecret()).toBe(false);
  });

  it('is a no-op for a consistent wallet', async () => {
    await createWallet();
    await reconcile();
    expect(hasWallet()).toBe(true);
    expect(await hasKeystoreSecret()).toBe(true);
  });
});

describe('wipeWallet', () => {
  it('clears both the blob and the keystore secret', async () => {
    await createWallet();
    await wipeWallet();
    expect(hasWallet()).toBe(false);
    expect(await hasKeystoreSecret()).toBe(false);
    expect(getStoredAddress()).toBeNull();
  });
});
