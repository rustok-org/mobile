import { assertNever } from '../lib/assertNever';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { useWalletStore } from '../stores/walletStore';

/**
 * Top-level shell: renders exactly one destination for the current wallet phase.
 * A pure function of `walletStore.phase` — the one-time `hydrate` that drives the
 * phase lives in `App`, keeping this a testable phase→screen map. Real per-phase
 * navigators (onboarding stack, home tabs) replace the placeholders in later
 * A-slices; the `switch` is exhaustive so adding a phase is a compile error here.
 */
export function RootNavigator() {
  const phase = useWalletStore((state) => state.phase);
  const address = useWalletStore((state) => state.address);

  switch (phase) {
    case 'loading':
      return <SplashScreen />;
    case 'no_wallet':
      return <PlaceholderScreen title="Onboarding" subtitle="Create or import a wallet (A2)." />;
    case 'locked':
      return (
        <PlaceholderScreen
          title="Wallet locked"
          subtitle="Unlock with PIN or biometrics (A3)."
          detail={address ?? undefined}
        />
      );
    case 'unlocked':
      return <PlaceholderScreen title="Home" subtitle="Wallet tabs (A2+)." />;
    default:
      return assertNever(phase);
  }
}
