# AGENTS.md — Rustok Mobile

> Overrides `meta/AGENTS.md` for `mobile/` subtree.
> Read `meta/AGENTS.md` first, then this file.

---

## Stack

- **Framework:** React Native 0.76+ (New Architecture)
- **Language:** TypeScript 5.6+, strict mode
- **Navigation:** React Navigation v7 (native-stack + bottom-tabs)
- **State:** Zustand 5 + MMKV persistence
- **Styling:** NativeWind 4 + TailwindCSS 3
- **Standards:** `~/Workspace/Codex/standards/react.md` + `typescript.md`

---

## Architecture

### Chat-first UI

Main screen is **conversation**, not dashboard. Wallet actions are tools that LLM invokes.

```
AppShell
├── RootNavigator (phase-based)
│   ├── loading → SplashScreen
│   ├── no_wallet → OnboardingNavigator
│   ├── locked → UnlockPinScreen
│   └── unlocked → TabsNavigator
│       ├── ChatTab (PRIMARY)
│       ├── WalletTab (secondary)
│       ├── ActivityTab
│       └── SettingsTab
```

### State Management

Consolidate to **4 stores max**:
1. `walletStore` — phase, balance, address
2. `chatStore` — messages, tool calls, LLM state
3. `uiStore` — theme, modals, toasts
4. `settingsStore` — auto-lock, biometric, network

Use `useShallow` selectors. No Redux.

### Crypto Bridge

- **All crypto in Rust** — no JS crypto libraries
- `react-native-rustok-bridge` (uniffi-generated)
- Lazy singleton `WalletHandle`
- Numeric types cross FFI as **decimal strings** (U256 wei)

---

## Key Rules

- **Named exports only** — no `export default`
- **Props:** `interface`, optional with defaults in destructuring
- **Hooks:** only at top level, unconditionally
- **Effects:** only for external sync, not data transformation
- **Types:** `interface` for objects, `type` for unions, `satisfies` for configs
- **Errors:** `catch (error: unknown)` + `instanceof Error`
- **Async:** `async/await`, `Promise.all` for independent ops

---

## CI Gates

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # jest
# Android build: ./gradlew assembleDebug
```

---

## Bridge Contract

When adding new Rust → JS exports:
1. Add to `crates/rustok-mobile-bindings/src/lib.rs`
2. Regenerate bridge: `uniffi-bindgen-react-native`
3. Add TypeScript types in `mobile/src/lib/walletHandle.ts`
4. Test on both iOS and Android simulators
