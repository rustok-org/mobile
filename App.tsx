import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colorScheme } from 'nativewind';
import DevHarnessB from './src/screens/_DevHarnessB';
import './global.css';

// Dark-theme-only design (mission-control). Force dark mode at startup so the
// `.dark:root` design tokens apply. Without this NativeWind defaults to the
// light `:root`, which renders `bg-canvas` near-white and hides the light text.
colorScheme.set('dark');

// Slice B renders the throwaway crypto-storage round-trip harness. The real
// onboarding shell + screens (navigation, phase routing) land in the A-slices
// and replace this entry point.
function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-canvas">
        <DevHarnessB />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
