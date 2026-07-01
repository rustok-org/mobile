/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Slice-0 placeholder: the D1 proof-of-life surface was removed (the FFI is now
// async, so the old sync call no longer compiles). This is a render-smoke — the
// shell mounts without throwing and shows the brand label. Real onboarding
// screens and their behavioral assertions arrive in the following slices.
test('renders the placeholder shell without crashing', async () => {
  let tree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Read toJSON() AFTER act() so the tree is committed (inside act it is null).
  expect(JSON.stringify(tree?.toJSON())).toContain('Rustok');
});
