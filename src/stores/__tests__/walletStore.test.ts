/**
 * walletStore tests — phase routing off the on-device storage truth. The real
 * deviceWallet + keystoreSecret + walletStorage run; only the native boundaries
 * (keychain + FFI bridge + MMKV) are mocked via `__mocks__`, matching the
 * deviceWallet suite. We drive real state with `createWallet` rather than
 * stubbing `hasWallet`, so a regression in the storage layer surfaces here too.
 */

import * as Keychain from 'react-native-keychain';
import * as MMKV from 'react-native-mmkv';

import { createWallet } from '../../lib/deviceWallet';
import { useWalletStore } from '../walletStore';

const keychainMock = Keychain as unknown as {
  __resetKeychain: () => void;
  __failNextKeychainOp: (error: Error) => void;
};
const bridgeMock = jest.requireMock('react-native-rustok-bridge') as { __resetBridge: () => void };
const mmkvMock = MMKV as unknown as { __resetMMKV: () => void };

/** Reset the singleton store to its initial (pre-hydrate) state between tests. */
function resetStore(): void {
  useWalletStore.setState({ phase: 'loading', address: null });
}

beforeEach(() => {
  jest.restoreAllMocks();
  keychainMock.__resetKeychain();
  bridgeMock.__resetBridge();
  mmkvMock.__resetMMKV();
  resetStore();
});

describe('useWalletStore', () => {
  it('starts in the loading phase with no address before hydrate', () => {
    expect(useWalletStore.getState().phase).toBe('loading');
    expect(useWalletStore.getState().address).toBeNull();
  });

  describe('hydrate', () => {
    it('routes to no_wallet with no address when the device has no wallet', async () => {
      await useWalletStore.getState().hydrate();

      expect(useWalletStore.getState().phase).toBe('no_wallet');
      expect(useWalletStore.getState().address).toBeNull();
    });

    it('routes to locked with the stored address when a wallet exists', async () => {
      const created = await createWallet();
      resetStore(); // simulate a fresh launch over the persisted wallet

      await useWalletStore.getState().hydrate();

      expect(useWalletStore.getState().phase).toBe('locked');
      expect(useWalletStore.getState().address).toBe(created.address);
    });

    it('still routes locked by the blob truth when reconcile\'s keychain probe fails', async () => {
      await createWallet();
      resetStore();
      // The next keychain op is reconcile's secret probe; failing it makes
      // reconcile reject. The blob is still in MMKV, so phase must not regress
      // to no_wallet — hydrate swallows the cleanup failure and routes locked.
      keychainMock.__failNextKeychainOp(new Error('keystore unavailable'));

      await expect(useWalletStore.getState().hydrate()).resolves.toBeUndefined();

      expect(useWalletStore.getState().phase).toBe('locked');
    });
  });
});
