import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colorScheme } from 'nativewind';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useWalletStore } from './src/stores/walletStore';
import './global.css';

// Dark-theme-only design (mission-control). Force dark at startup so the
// `.dark:root` design tokens apply. Without this NativeWind defaults to the
// light `:root`, which renders `bg-canvas` near-white and hides light text.
colorScheme.set('dark');

function App() {
  const hydrate = useWalletStore((state) => state.hydrate);

  // Derive the wallet phase from on-device storage once at launch. The store
  // owns the async read/reconcile; the shell just renders the resulting phase.
  // Fire-and-forget: hydrate resolves by design (a reconcile probe failure is
  // swallowed and routing falls back to the synchronous blob read); the catch
  // only guards an unexpected throw from becoming an unhandled rejection.
  useEffect(() => {
    hydrate().catch(() => undefined);
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-canvas">
        <RootNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
