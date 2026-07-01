import { ActivityIndicator, Text, View } from 'react-native';

// Accent periwinkle (--color-accent-periwinkle). ActivityIndicator takes a color
// prop, not a className; A1b's theme.ts will expose tokens programmatically so
// this literal can be replaced with the themed value.
const SPINNER_COLOR = '#8387C3';

/** Shown while the wallet phase is being hydrated from storage at launch. */
export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas">
      <Text className="text-2xl text-ink-primary">Rustok</Text>
      <ActivityIndicator color={SPINNER_COLOR} />
    </View>
  );
}
