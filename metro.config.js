const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration — NativeWind v4 (compiles `global.css`) + `.mjs`
 * resolution for packages that ship ES modules.
 *
 * [MINOR-1] `vendor/core` (the rustok-org/core git submodule consumed by the
 * uniffi bridge in PR-D1) is EXCLUDED from Metro: it is a full Rust repo
 * (crates + target/ + .git), and letting Metro crawl/watch it exhausts inotify
 * watchers on Linux (ENOSPC). It is in `resolver.blockList` and is NOT added to
 * `watchFolders`.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: /[/\\]vendor[/\\]core[/\\].*/,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
  },
};

module.exports = withNativeWind(mergeConfig(defaultConfig, config), {
  input: './global.css',
});
