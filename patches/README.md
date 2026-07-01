# patches/

Local dependency patches applied by [`patch-package`](https://github.com/ds300/patch-package)
on `postinstall` (see the root `package.json` `postinstall` script).

## `uniffi-bindgen-react-native+0.31.0-3.patch`

Adds `"./package.json": "./package.json"` to the package's `exports`.

**Why.** ubrn's generated `android/CMakeLists.txt` resolves its bundled C++
runtime (e.g. `UniffiCallInvoker.h`) by running
`require.resolve('uniffi-bindgen-react-native/package.json')`. Node ≥ 17 strict
`exports` rejects that subpath (`ERR_PACKAGE_PATH_NOT_EXPORTED`), so the resolve
returns empty, the include path becomes `/cpp/includes`, and the native Android
build fails with `fatal error: 'UniffiCallInvoker.h' file not found`. Exporting
`./package.json` makes the resolve work again.

**Upstream tracker — remove this patch when fixed.**
- Repo: `jhugman/uniffi-bindgen-react-native`. The package should export
  `./package.json` (or the generated CMakeLists should not depend on resolving
  it). Latest version as of 2026-06-30 = `0.31.0-3` — no fix yet.
- On every ubrn bump: re-check whether this patch still applies and is still
  needed; drop it once upstream ships the fix.

## `react-native-argon2+4.0.0.patch`

Replaces `jcenter()` with `mavenCentral()` in the package's `android/build.gradle`
(one line).

**Why.** `react-native-argon2@4.0.0`'s `android/build.gradle` still declares the
long-dead `jcenter()` repository. JCenter was sunset in 2021 and the `jcenter()`
DSL method was removed from modern Gradle, so project evaluation fails with
`Could not find method jcenter()` before anything compiles. `mavenCentral()` (which
the package's own `buildscript` block already uses) resolves the same artifacts.

**Note — old-architecture module.** `react-native-argon2` is a legacy bridge
NativeModule (no TurboModule/codegen). It builds and its `.so`s (`libargon2jni`,
`libargon2native`) package into the APK under RN 0.85 new-arch via the interop
layer, but the runtime interop is exercised on-device only at the PIN slice; the
onboarding spec keeps a fallback (PIN-Argon2id in the Rust FFI) if it regresses.

**Upstream tracker — remove when fixed.**
- Repo: `poowf/react-native-argon2`. Latest as of 2026-07-01 = `4.0.0`, still
  ships `jcenter()`. Drop this patch if a release migrates off jcenter.
