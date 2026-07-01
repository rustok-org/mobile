/**
 * walletStore — the top-level wallet phase the navigation shell routes on.
 *
 * The phase's single source of truth is on-device storage, NOT any in-memory
 * Rust state: our FFI is stateless, so "is there a wallet?" is answered by the
 * presence of the encrypted keyring blob in MMKV (see `deviceWallet.hasWallet`).
 * The store therefore never persists `phase` — persisting it would create a
 * second, divergable source of truth. Every launch re-derives it via `hydrate`.
 *
 *   loading   — startup; storage not read yet (initial state).
 *   no_wallet — no blob on device → onboarding.
 *   locked    — blob present, keystore secret not in memory → unlock.
 *   unlocked  — blob imported into an in-memory FfiWallet. Produced only by the
 *               unlock flow (a later slice); `hydrate` never yields it, because
 *               unlocking requires retrieving the Keychain secret behind a
 *               biometric / passcode prompt, which never runs on hydrate.
 */

import { create } from 'zustand';

import { getStoredAddress, hasWallet, reconcile } from '../lib/deviceWallet';

export type WalletPhase = 'loading' | 'no_wallet' | 'locked' | 'unlocked';

interface WalletState {
  readonly phase: WalletPhase;
  /** Stored public address for the locked UI; null until a wallet exists. */
  readonly address: string | null;
  /**
   * Reads storage truth and routes: reconciles any partial write, then sets the
   * phase from blob presence. Called once when the shell mounts. Idempotent.
   */
  hydrate: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  phase: 'loading',
  address: null,
  hydrate: async () => {
    // `reconcile` is best-effort cleanup of a partial write; it probes the
    // Keychain — a native boundary that can fail. Its failure must not strand
    // the app on Splash, and it must never flip a real wallet to `no_wallet`:
    // the authoritative signal below is the synchronous MMKV blob read, so we
    // route by that regardless of whether the cleanup probe succeeded.
    try {
      await reconcile();
    } catch {
      // fall through to blob-truth routing
    }
    set(
      hasWallet()
        ? { phase: 'locked', address: getStoredAddress() }
        : { phase: 'no_wallet', address: null },
    );
  },
}));
