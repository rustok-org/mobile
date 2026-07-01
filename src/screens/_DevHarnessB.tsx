/**
 * _DevHarnessB — THROWAWAY on-device harness for the Slice B crypto-storage
 * round-trip. Not production UI: the real onboarding/unlock screens land in the
 * A-slices and replace this. It exercises create → commit {blob→MMKV,
 * secret→Keychain} → (survive restart) → unlock → sign against a physical device.
 *
 * Restart proof: after "Create", kill and relaunch the app — this screen
 * re-hydrates the persisted address from MMKV (no unlock), proving the record
 * survived. "Unlock & sign" then retrieves the secret (biometric prompt),
 * re-imports the keystore, and signs, proving the two halves recombine.
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { arrayBufferToHex, asciiToArrayBuffer } from '../lib/bytes';
import {
  createWallet,
  getStoredAddress,
  hasWallet,
  reconcile,
  unlock,
} from '../lib/deviceWallet';

interface HarnessState {
  readonly status: string;
  readonly address: string | null;
  readonly mnemonic: string | null;
  readonly signature: string | null;
  readonly error: string | null;
}

const INITIAL: HarnessState = {
  status: 'starting…',
  address: null,
  mnemonic: null,
  signature: null,
  error: null,
};

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function DevHarnessB() {
  const [state, setState] = useState<HarnessState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async (): Promise<void> => {
      try {
        await reconcile();
        if (cancelled) return;
        const address = getStoredAddress();
        setState((s) => ({
          ...s,
          address,
          status: hasWallet() ? 'wallet persisted (locked)' : 'no wallet',
        }));
      } catch (error: unknown) {
        if (!cancelled) {
          setState((s) => ({ ...s, status: 'reconcile failed', error: errorText(error) }));
        }
      }
    };
    hydrate().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreate = useCallback(async () => {
    setState((s) => ({ ...s, status: 'creating…', error: null }));
    try {
      const created = await createWallet();
      setState((s) => ({
        ...s,
        status: 'created + committed',
        address: created.address,
        mnemonic: created.mnemonic,
      }));
    } catch (error: unknown) {
      setState((s) => ({ ...s, status: 'create failed', error: errorText(error) }));
    }
  }, []);

  const onUnlockSign = useCallback(async () => {
    setState((s) => ({ ...s, status: 'unlocking…', error: null, signature: null }));
    try {
      const session = await unlock();
      const signature = await session.signMessage(asciiToArrayBuffer('rustok slice-b'));
      const stored = getStoredAddress();
      const match = stored === session.address ? 'MATCH' : 'MISMATCH';
      setState((s) => ({
        ...s,
        status: `unlocked + signed · address ${match}`,
        address: session.address,
        signature: arrayBufferToHex(signature).slice(0, 24),
      }));
    } catch (error: unknown) {
      setState((s) => ({ ...s, status: 'unlock/sign failed', error: errorText(error) }));
    }
  }, []);

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="p-6 gap-3">
      <Text className="text-lg text-ink-primary" style={mono}>
        Slice B · storage round-trip
      </Text>
      <Row label="status" value={state.status} />
      <Row label="address" value={state.address ?? '—'} />
      <Row label="signature[:24]" value={state.signature ?? '—'} />
      {state.mnemonic !== null && <Row label="mnemonic (backup once)" value={state.mnemonic} />}
      {state.error !== null && <Row label="error" value={state.error} danger />}

      <Button label="Create wallet" onPress={onCreate} />
      <Button label="Unlock & sign" onPress={onUnlockSign} />
    </ScrollView>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View className="gap-1">
      <Text className="text-xs text-ink-muted" style={mono}>
        {label}
      </Text>
      <Text
        className={`text-sm ${danger === true ? 'text-semantic-danger' : 'text-ink-primary'}`}
        style={mono}
      >
        {value}
      </Text>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-2 rounded-rw-md bg-surface-card px-4 py-3 active:opacity-70"
    >
      <Text className="text-center text-ink-primary" style={mono}>
        {label}
      </Text>
    </Pressable>
  );
}

const { mono } = StyleSheet.create({ mono: { fontFamily: 'monospace' } });

export default DevHarnessB;
