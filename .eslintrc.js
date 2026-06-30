module.exports = {
  root: true,
  extends: '@react-native',
  // The ubrn bridge package is fully generated/scaffolded (no hand-written
  // source); it is not linted by the app's config — it is reproduced by
  // `npm run ubrn:android`.
  ignorePatterns: ['packages/react-native-rustok-bridge/'],
};
