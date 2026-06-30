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
