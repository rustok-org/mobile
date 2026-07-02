import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useWalletStore } from './src/stores/walletStore';
import './global.css';

// Dark-only product decision (NORTH-STAR), independent of the device's
// system theme — not a NativeWind concern (tailwind.config.js has no
// scheme-switching to force), but the native RN Appearance state itself.
// Without this, anything that reads the system scheme later (e.g. a
// react-navigation NavigationContainer with no explicit `theme`) defaults
// to the OS setting instead of staying locked dark.
Appearance.setColorScheme('dark');

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
