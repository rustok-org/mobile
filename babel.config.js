module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  // `react-native-worklets/plugin` MUST be last. Reanimated 4 checks for it at
  // the root plugins list (NativeWind's preset includes it internally, but
  // Reanimated 4 fails to init its native bridge unless it also runs here).
  plugins: ['react-native-worklets/plugin'],
};
