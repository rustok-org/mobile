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

// Native uniffi FFI bridge (ubrn turbo-module) — boundary mock for Jest. There
// is no native module under Node, and the real `src/index.tsx` installs the
// Rust crate at import time. Return a CLEARLY-FAKE address: the on-device run is
// the falsifiable proof, not Jest, so the rendered surface must not pass here.
jest.mock('react-native-rustok-bridge', () => ({
  FfiWallet: {
    importMnemonic: () => ({
      address: () => '0xJEST_MOCK_not_a_real_derivation',
    }),
  },
}));
