/* eslint-env jest */

// Reanimated (pulled in transitively by NativeWind's css-interop) ships a Jest
// mock; use it so the native bridge isn't required under Node.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// safe-area-context's native spec can't render under Jest — passthrough mock.
// Return `children` directly (no `createElement` of a host component) so the
// NativeWind Babel transform doesn't inject css-interop wrappers into this
// out-of-scope `jest.mock` factory.
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

// Native boundary mocks (no native modules under Node). The contract mocks live
// in `__mocks__/` and are stateful — the on-device run is the falsifiable crypto
// proof, not Jest. See `__mocks__/react-native-rustok-bridge.ts` (secret-decrypts-
// blob contract) and `__mocks__/react-native-keychain.ts` (in-memory keychain).
jest.mock('react-native-rustok-bridge');
jest.mock('react-native-keychain');
jest.mock('react-native-mmkv');
