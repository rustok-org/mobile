import { riskColors, themes, tracking, type SemanticColors } from '../theme';

// Explicit key list (not Object.keys(themes.dark)) so a key silently dropped
// from the `dark` object literal fails this test even though TS already
// enforces SemanticColors — this is the runtime backstop for that guarantee.
const SEMANTIC_KEYS: readonly (keyof SemanticColors)[] = [
  'canvas', 'navBar', 'surface', 'surfaceRaised', 'surfaceInset', 'controlTrack',
  'borderSubtle', 'borderDefault', 'borderStrong', 'borderDisabled',
  'textPrimary', 'textSecondary', 'textTertiary', 'textMuted', 'textOnAccent',
  'accent', 'accentInk',
  'connectionOnline', 'connectionOffline',
  'armFrom', 'armTo',
  'riskAllowFg', 'riskAllowBg', 'riskAllowBorder',
  'riskWarnFg', 'riskWarnBg', 'riskWarnBorder',
  'riskBlockFg', 'riskBlockFgStrong', 'riskBlockBg', 'riskBlockBorder',
];

// Literal expected values (not themes.dark.* — comparing riskColors() output
// against the same source object it reads from would be tautological and
// couldn't catch a corrupted token value, only wiring bugs).
describe('riskColors', () => {
  it('resolves ALLOW to the green foreground/background/border/glyph', () => {
    expect(riskColors('ALLOW')).toEqual({
      fg: '#2FD27A',
      bg: 'rgba(47,210,122,0.06)',
      border: 'rgba(47,210,122,0.25)',
      glyph: '✓',
    });
  });

  it('resolves WARN to the amber foreground/background/border/glyph', () => {
    expect(riskColors('WARN')).toEqual({
      fg: '#FFB020',
      bg: 'rgba(255,176,32,0.12)',
      border: 'rgba(255,176,32,0.40)',
      glyph: '▲',
    });
  });

  it('resolves BLOCK to the red foreground/background/border/glyph', () => {
    expect(riskColors('BLOCK')).toEqual({
      fg: '#FF4D4D',
      bg: 'rgba(255,77,77,0.10)',
      border: 'rgba(255,77,77,0.45)',
      glyph: '⛔',
    });
  });
});

describe('themes.dark', () => {
  it('has every SemanticColors key populated with a non-empty string', () => {
    for (const key of SEMANTIC_KEYS) {
      expect(typeof themes.dark[key]).toBe('string');
      expect(themes.dark[key].length).toBeGreaterThan(0);
    }
  });
});

describe('themes.light', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to the matching dark value and warns in __DEV__ for every key', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    for (const key of SEMANTIC_KEYS) {
      expect(themes.light[key]).toBe(themes.dark[key]);
    }

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('canvas'));
    expect(warnSpy).toHaveBeenCalledTimes(SEMANTIC_KEYS.length);
  });
});

describe('connection ≠ risk invariant', () => {
  it('keeps the connection and risk color channels disjoint', () => {
    const connectionColors = new Set([themes.dark.connectionOnline, themes.dark.connectionOffline]);
    const riskColorValues = [
      themes.dark.riskAllowFg, themes.dark.riskAllowBg, themes.dark.riskAllowBorder,
      themes.dark.riskWarnFg, themes.dark.riskWarnBg, themes.dark.riskWarnBorder,
      themes.dark.riskBlockFg, themes.dark.riskBlockFgStrong, themes.dark.riskBlockBg, themes.dark.riskBlockBorder,
    ];

    for (const riskColor of riskColorValues) {
      expect(connectionColors.has(riskColor)).toBe(false);
    }
  });
});

describe('tracking', () => {
  it('converts an em value to dp by multiplying by the fontSize', () => {
    expect(tracking(0.16, 22)).toBeCloseTo(3.52);
  });

  it('returns zero tracking for the normal (zero-em) case', () => {
    expect(tracking(0, 18)).toBe(0);
  });
});
