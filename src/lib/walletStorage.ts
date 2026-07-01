/**
 * walletStorage — on-device persistence of the encrypted keyring blob.
 *
 * The blob is the ciphertext returned by `FfiWallet.exportKeystore()` — an
 * encrypted keyring that is useless without the keystore secret (kept separately
 * in the Keychain, see `keystoreSecret.ts`). Because it is already encrypted, it
 * is safe at rest in plain MMKV. The public 0x address is stored alongside it so
 * the locked UI can show the account before an unlock without deriving it.
 *
 * The presence of the blob is the SOURCE OF TRUTH for wallet phase: the FFI is
 * stateless (no Rust-side wallet state), so `hasWalletRecord()` — not any PIN or
 * Rust call — decides `no_wallet` vs `locked`/`unlocked`.
 */

import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'rustok.wallet' });

const BLOB_KEY = 'wallet.keystoreBlob';
const ADDRESS_KEY = 'wallet.address';

export interface WalletRecord {
  /** Encrypted keyring blob from `exportKeystore()`. */
  readonly blob: ArrayBuffer;
  /** Public 0x-hex Ethereum address. */
  readonly address: string;
}

/**
 * Persists the wallet record. The blob is written LAST so its presence is the
 * atomic commit marker: a crash after the address write but before the blob
 * write leaves `hasWalletRecord() === false` (an orphan address that startup
 * reconciliation clears), never a "wallet exists but cannot load" state.
 */
export function saveWalletRecord(record: WalletRecord): void {
  storage.set(ADDRESS_KEY, record.address);
  storage.set(BLOB_KEY, record.blob);
}

/**
 * Reads the wallet record, or `null` if no complete record is stored. A partial
 * record (blob without address, or vice versa) is treated as absent — the caller
 * reconciles it to a clean state.
 */
export function readWalletRecord(): WalletRecord | null {
  const blob = storage.getBuffer(BLOB_KEY);
  const address = storage.getString(ADDRESS_KEY);
  if (blob === undefined || address === undefined) {
    return null;
  }
  return { blob, address };
}

/** Whether a keystore blob is stored — the wallet-phase source of truth. */
export function hasWalletRecord(): boolean {
  return storage.contains(BLOB_KEY);
}

/** Removes the wallet record. Idempotent. */
export function clearWalletRecord(): void {
  storage.remove(BLOB_KEY);
  storage.remove(ADDRESS_KEY);
}
