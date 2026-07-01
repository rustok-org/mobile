/**
 * RootNavigator render-smoke — the shell is a pure phase→screen map, so we set
 * the store phase directly (no hydrate/async) and assert the rendered
 * destination. Text is read out of the serialized tree, which is robust to the
 * NativeWind className wrapping under Jest. Each render mounts and unmounts
 * inside act() so no lingering tree re-renders on the next test's setState.
 */

import TestRenderer, { act } from 'react-test-renderer';

import { RootNavigator } from '../RootNavigator';
import { useWalletStore, type WalletPhase } from '../../stores/walletStore';

function renderAt(phase: WalletPhase, address: string | null = null): string {
  let tree: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    useWalletStore.setState({ phase, address });
    tree = TestRenderer.create(<RootNavigator />);
  });
  const json = JSON.stringify(tree?.toJSON());
  act(() => {
    tree?.unmount();
  });
  return json;
}

afterEach(() => {
  act(() => {
    useWalletStore.setState({ phase: 'loading', address: null });
  });
});

describe('RootNavigator', () => {
  it('renders the splash screen while loading', () => {
    expect(renderAt('loading')).toContain('Rustok');
  });

  it('renders the onboarding destination when there is no wallet', () => {
    expect(renderAt('no_wallet')).toContain('Onboarding');
  });

  it('renders the locked destination carrying the stored address', () => {
    const view = renderAt('locked', '0xABCDEF');
    expect(view).toContain('Wallet locked');
    expect(view).toContain('0xABCDEF');
  });

  it('renders the home destination when unlocked', () => {
    expect(renderAt('unlocked')).toContain('Home');
  });
});
