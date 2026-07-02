import { ActivityIndicator, Text, View } from 'react-native';

import { themes } from '../theme/theme';

// ActivityIndicator takes a color prop, not a className — themed value from
// the non-className token layer (see src/theme/theme.ts).
const SPINNER_COLOR = themes.dark.accent;

/** Shown while the wallet phase is being hydrated from storage at launch. */
export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas">
      <Text className="text-2xl text-textPrimary">Rustok</Text>
      <ActivityIndicator color={SPINNER_COLOR} />
    </View>
  );
}
