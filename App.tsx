import { Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './global.css';

/**
 * PR-D0 placeholder — empty, buildable shell.
 *
 * Proves the RN 0.85 + NativeWind v4 pipeline is alive (the `className`
 * tokens below resolve via `global.css` / `tailwind.config.js`). Real screens
 * (onboarding, the mission-control console) are harvested in D2+.
 */
function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-ink-primary text-lg">Rustok</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
