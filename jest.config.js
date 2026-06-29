module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // `import './global.css'` is compiled by Metro at build time; in Jest it has
  // no meaning — stub it.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/cssMock.js',
  },
  // The RN preset only transforms RN core. NativeWind / css-interop ship
  // untranspiled TS/ESM, and the native-module packages ship Flow/ESM — allow
  // Babel to transform them so Jest can load them.
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-mmkv|react-native-nitro-modules)/)',
  ],
};
