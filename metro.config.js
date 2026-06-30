const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

// Escape a filesystem path for safe interpolation into a RegExp.
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Absolute path of the in-repo `vendor/core` submodule (anchor for the blockList).
const vendorCorePath = escapeRegExp(path.join(__dirname, 'vendor', 'core'));

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
 * The pattern is ANCHORED to the absolute project-root `vendor/core` path. An
 * unanchored `/vendor[/\\]core/` ALSO matches React Native's own
 * `node_modules/react-native/Libraries/vendor/core/` (ErrorUtils, …) and breaks
 * the bundle (HTTP 500: Unable to resolve `../vendor/core/ErrorUtils`).
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: new RegExp(`^${vendorCorePath}[/\\\\].*`),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
  },
};

module.exports = withNativeWind(mergeConfig(defaultConfig, config), {
  input: './global.css',
});
