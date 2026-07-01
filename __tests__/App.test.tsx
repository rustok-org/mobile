/**
 * @format
 *
 * App boot integration smoke — App wires the one-time `hydrate` on mount and
 * RootNavigator routes on the resulting phase. With no wallet in the mocked
 * native boundaries, the boot path resolves to the onboarding destination. The
 * `act` wrapper flushes the mount effect. Real crypto is proven on device.
 */

import TestRenderer, { act } from 'react-test-renderer';

import App from '../App';

test('boots to the onboarding destination when no wallet is stored', async () => {
  let tree: ReturnType<typeof TestRenderer.create> | undefined;
  await act(async () => {
    tree = TestRenderer.create(<App />);
    // Drain the fire-and-forget hydrate chain (reconcile → keychain probe →
    // set) inside act so its final phase update is act-wrapped, not a warning.
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
  expect(JSON.stringify(tree?.toJSON())).toContain('Onboarding');
  await act(async () => {
    tree?.unmount();
  });
});
