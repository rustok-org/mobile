# AGENTS.md — Rustok Mobile

> Overrides `meta/AGENTS.md` for `mobile/` subtree.
> Read `meta/AGENTS.md` first, then this file.

---

## Stack

- **Framework:** React Native 0.76+ (New Architecture) — **stay on 0.76 until Phase 4 kickoff**, then evaluate latest stable
- **Language:** TypeScript 5.6+, strict mode
- **Navigation:** React Navigation v7 (native-stack + bottom-tabs)
- **State:** Zustand 5 + MMKV persistence
- **Styling:** NativeWind 4 + TailwindCSS 3
- **Source of truth:** this file. **Fallback:** `~/Workspace/Codex/standards/react.md` + `typescript.md` for deep context.

## Security Note

Metro dev server (RN CLI) has a known dev-only vulnerability (CVE-2025-11953). **Mitigation:** always run Metro with `--host 127.0.0.1` (never expose to LAN). This does **not** affect production builds.

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

## TypeScript Rules (Codex Compact)

Active rules from Codex typescript/react, inlined for token efficiency.

### TS-001: Strict mode
- **DO:** `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- **DONT:** `any`, `@ts-ignore`
- **WHY:** Type safety is non-negotiable

### TS-002: Types
- **DO:** `interface` for objects, `type` for unions/aliases, `satisfies` for configs
- **DONT:** `type` for object shapes, `I` prefix on interfaces
- **WHY:** Consistency with ecosystem

### TS-003: Error handling
- **DO:** `catch (error: unknown)` + `instanceof Error` narrowing
- **DONT:** `catch (e: any)`
- **WHY:** `any` infects everything it touches

### TS-004: Exports
- **DO:** Named exports only
- **DONT:** `export default`
- **WHY:** Refactor-friendly, explicit imports

### TS-005: Async
- **DO:** `Promise.all` for independent parallel ops
- **DONT:** Sequential `await` when order does not matter
- **WHY:** Latency

### TS-006: Type assertions
- **DO:** `@ts-expect-error` with explanation if truly unavoidable
- **DONT:** `@ts-ignore`, non-null `!` without guarantee
- **WHY:** Masked bugs

---

## React Native Rules (Codex Compact)

### RN-001: Hooks
- **DO:** Only at top level, unconditionally
- **DONT:** Hooks in conditions, loops, nested functions
- **WHY:** React rules of hooks

### RN-002: State
- **DO:** Max 4 stores (wallet, chat, ui, settings), `useShallow` for multi-field selects
- **DONT:** Redux, god stores
- **WHY:** Zustand + MMKV is project standard

### RN-003: Metro security
- **DO:** `npx react-native start --host 127.0.0.1`
- **DONT:** Expose Metro to LAN
- **WHY:** CVE-2025-11953 (dev-only, but serious)

### RN-004: Platform
- **DO:** `Platform.OS` or `.ios.tsx` / `.android.tsx` extensions
- **DONT:** Inline platform checks scattered in logic
- **WHY:** Maintainability

### RN-005: SafeArea
- **DO:** Wrap screens with `SafeAreaView` or `react-native-safe-area-context`
- **WHY:** Notch / home indicator handling

### RN-006: E2E
- **DO:** `testID` on interactive elements
- **WHY:** E2E testing infrastructure

### RN-007: Crypto
- **DO:** All crypto via `react-native-rustok-bridge` (uniffi)
- **DONT:** Any JS crypto library
- **WHY:** Security boundary; Rust handles all secret material

### RN-008: Effects
- **DO:** Effects only for external sync (subscriptions, timers)
- **DONT:** Effects for data transformation or derived state
- **WHY:** `useMemo` for derived values

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
