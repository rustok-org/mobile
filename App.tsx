import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colorScheme } from 'nativewind';
import './global.css';

// Dark-theme-only design (mission-control). Force dark mode at startup so the
// `.dark:root` design tokens apply. Without this NativeWind defaults to the
// light `:root`, which renders `bg-canvas` near-white and hides the light text.
colorScheme.set('dark');

// Slice-0 placeholder. The D1 proof-of-life block (sync `FfiWallet.importMnemonic`)
// was removed here: the FFI is now async (core bc70f07 off-thread), so the old
// sync call no longer type-checks. The onboarding shell + screens land in the
// following slices (B crypto-storage de-risk, then A1+ UI).
const styles = StyleSheet.create({
  title: { fontFamily: 'monospace', fontSize: 20, color: '#e5e7eb' },
});

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <View>
          <Text style={styles.title}>Rustok</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
