import { assertNever } from '../assertNever';

describe('assertNever', () => {
  it('throws with the offending value when reached via an unsound cast', () => {
    // The only caller is an exhaustive switch default, unreachable for a covered
    // union; this documents the runtime guard for the unsound-cast case.
    expect(() => assertNever('unexpected' as never)).toThrow(/unexpected/);
  });
});
