/**
 * In-memory mock of react-native-mmkv for Jest. The real package imports
 * react-native-nitro-modules, which hits the native TurboModule registry at
 * import time (unavailable under Node), so we replace the whole module. Stores
 * are keyed by `id` so instances with the same id share state, as MMKV does.
 * Only the methods walletStorage uses are implemented.
 */

/* eslint-env jest */

type StoredValue = string | number | boolean | ArrayBuffer;

const stores = new Map<string, Map<string, StoredValue>>();

function backingStore(id: string): Map<string, StoredValue> {
  let store = stores.get(id);
  if (store === undefined) {
    store = new Map<string, StoredValue>();
    stores.set(id, store);
  }
  return store;
}

/**
 * Test helper: wipe all mock MMKV data between tests. Clears each map's contents
 * in place (not the registry) so references captured by module-level instances
 * stay valid and see the cleared state.
 */
export function __resetMMKV(): void {
  stores.forEach((store) => store.clear());
}

export function createMMKV(configuration?: { id?: string }) {
  const store = backingStore(configuration?.id ?? 'mmkv.default');
  return {
    set(key: string, value: StoredValue): void {
      store.set(key, value);
    },
    getString(key: string): string | undefined {
      const value = store.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getBuffer(key: string): ArrayBuffer | undefined {
      const value = store.get(key);
      return value instanceof ArrayBuffer ? value : undefined;
    },
    contains(key: string): boolean {
      return store.has(key);
    },
    remove(key: string): boolean {
      return store.delete(key);
    },
    clearAll(): void {
      store.clear();
    },
  };
}
