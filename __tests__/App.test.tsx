/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The native FFI bridge is mocked in jest.setup.js (a boundary), so this asserts
// the D1 proof-of-life SURFACE mounts — NOT the cryptographic derivation, which
// is verified on-device (the falsifiable artifact, not a Jest mock).
test('renders the D1 bridge proof-of-life surface', async () => {
  let tree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  // toJSON() is read AFTER act() so the tree is committed (inside act it is
  // still null). The expected-address anchor proves the surface mounted.
  expect(JSON.stringify(tree?.toJSON())).toContain(
    '0x9858EfFD232B4033E47d90003D41EC34EcaEda94',
  );
});
