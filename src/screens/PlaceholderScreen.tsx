import { Text, View } from 'react-native';

interface PlaceholderScreenProps {
  readonly title: string;
  readonly subtitle: string;
  /** Optional secondary line (e.g. the stored address on the locked screen). */
  readonly detail?: string;
}

/**
 * Temporary destination for a wallet phase whose real screen lands in a later
 * A-slice (onboarding A2, unlock A3, home tabs). Renders the phase name so the
 * shell's phase→screen routing is visible on device; carries no logic.
 */
export function PlaceholderScreen({ title, subtitle, detail }: PlaceholderScreenProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-canvas px-8">
      <Text className="text-xl text-ink-primary">{title}</Text>
      <Text className="text-center text-sm text-ink-muted">{subtitle}</Text>
      {detail !== undefined && <Text className="text-xs text-ink-muted">{detail}</Text>}
    </View>
  );
}
