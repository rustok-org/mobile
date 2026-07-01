/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Slice B renders the crypto-storage round-trip harness. This is a render-smoke:
// App mounts (including the harness's async reconcile against the mocked native
// boundaries) without throwing and shows the harness title. The real crypto
// round-trip is the on-device proof, not this Jest mount.
test('renders the dev harness without crashing', async () => {
  let tree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(JSON.stringify(tree?.toJSON())).toContain('Slice B');
});
