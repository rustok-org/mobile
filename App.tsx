import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FfiWallet } from 'react-native-rustok-bridge';
import './global.css';

/* ─── PR-D1 proof-of-life · TEMPORARY ────────────────────────────────────────
 * TODO(D2): DELETE this whole block. It exists only to prove the ubrn FFI
 * bridge is alive *on the device* — it re-derives the canonical BIP-39 ABANDON
 * address ACROSS the uniffi boundary (not re-checking Rust logic, which is
 * proven in-crate at mobile-bindings/src/lib.rs:216). The onboarding UI of
 * slice D2 replaces it. Keep it falsifiable: render BOTH the derived and the
 * expected address so a wrong result is visible, and shout on any failure.
 * ──────────────────────────────────────────────────────────────────────────── */
const ABANDON_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const EXPECTED_ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
// Keystore password that encrypts the in-memory keyring (NOT the BIP-39
// passphrase — that is None inside the FFI). Matches the crate's own test
// vector (mobile-bindings/src/lib.rs:218).
const KEYSTORE_PASSWORD = 'test-keystore-password';

type ProofResult =
  | { kind: 'match'; derived: string }
  | { kind: 'mismatch'; derived: string }
  | { kind: 'bridgeError'; message: string };

/**
 * Encode the (ASCII) keystore password to a standalone `ArrayBuffer` — the FFI
 * `password` type (uniffi maps Rust `Vec<u8>` to `ArrayBuffer`, not `number[]`).
 * ASCII-only is sufficient and deliberate: the password is a fixed ASCII
 * constant, and RN/Hermes does not guarantee a global `TextEncoder`.
 */
function asciiArrayBuffer(text: string): ArrayBuffer {
  const buffer = new ArrayBuffer(text.length);
  const bytes = new Uint8Array(buffer);
  // ASCII code points fit in a byte, so no masking is needed.
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i);
  }
  return buffer;
}

function runProofOfLife(): ProofResult {
  try {
    const wallet = FfiWallet.importMnemonic(
      ABANDON_MNEMONIC,
      asciiArrayBuffer(KEYSTORE_PASSWORD),
    );
    const derived = wallet.address();
    return derived === EXPECTED_ADDRESS
      ? { kind: 'match', derived }
      : { kind: 'mismatch', derived };
  } catch (error: unknown) {
    // Distinguishes "bridge did not load / .so missing" from "address wrong"
    // so the screen tells which of the three D1 artifacts failed.
    const message = error instanceof Error ? error.message : String(error);
    return { kind: 'bridgeError', message };
  }
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 24 },
  header: { fontSize: 18, marginBottom: 12, color: '#e5e7eb' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#e5e7eb' },
  verdict: { fontFamily: 'monospace', fontSize: 16, marginTop: 6 },
  pass: { color: '#22c55e' },
  fail: { color: '#ef4444' },
});

function ProofOfLife() {
  const result = runProofOfLife();
  const passed = result.kind === 'match';
  return (
    <View style={styles.block}>
      <Text style={styles.header}>Rustok · D1 bridge proof-of-life</Text>
      <Text style={styles.mono}>expected: {EXPECTED_ADDRESS}</Text>
      {result.kind === 'bridgeError' ? (
        <Text style={[styles.verdict, styles.fail]}>
          ❌ BRIDGE ERROR: {result.message}
        </Text>
      ) : (
        <>
          <Text style={styles.mono}>derived:  {result.derived}</Text>
          <Text style={[styles.verdict, passed ? styles.pass : styles.fail]}>
            {passed ? '✅ MATCH — bridge alive on device' : '❌ MISMATCH'}
          </Text>
        </>
      )}
    </View>
  );
}
/* ─── end PR-D1 proof-of-life ─────────────────────────────────────────────── */

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <ProofOfLife />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
