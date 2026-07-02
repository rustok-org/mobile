import { assertNever } from '../lib/assertNever';

/**
 * Rustok — design tokens, typed access layer.
 * Stack: React Native 0.85.2 + NativeWind.
 *
 * Source of truth is ./tokens.json. This module is the *programmatic* surface:
 * use it where className can't reach — animated values (arm gradient stops,
 * progress width), Reanimated worklets, canvas/SVG tint, haptics thresholds.
 *
 * For static styling prefer NativeWind classNames (see tailwind.config.js),
 * which are generated from the same JSON.
 *
 * ── INVARIANT (brief) ────────────────────────────────────────────────────
 * `connection.*` (agent/online "wire", teal) and `risk.*` (allow/warn/block)
 * are SEPARATE channels. Never render a risk color as a connection signal or
 * vice-versa. Connection status ≠ risk status.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type ThemeName = 'dark' | 'light';
export type RiskTier = 'ALLOW' | 'WARN' | 'BLOCK';

export interface SemanticColors {
  canvas: string;
  navBar: string;
  surface: string;
  surfaceRaised: string;
  surfaceInset: string;
  controlTrack: string;

  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderDisabled: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textOnAccent: string;

  accent: string;
  accentInk: string;

  connectionOnline: string;
  connectionOffline: string;

  armFrom: string;
  armTo: string;

  riskAllowFg: string;
  riskAllowBg: string;
  riskAllowBorder: string;
  riskWarnFg: string;
  riskWarnBg: string;
  riskWarnBorder: string;
  riskBlockFg: string;
  riskBlockFgStrong: string;
  riskBlockBg: string;
  riskBlockBorder: string;
}

/** DARK — canonical for v1, fully populated. */
const dark: SemanticColors = {
  canvas: '#0A0C10',
  navBar: '#0B0E12',
  surface: '#12161B',
  surfaceRaised: '#13171D',
  surfaceInset: '#0D1014',
  controlTrack: '#0C0F13',

  borderSubtle: 'rgba(255,255,255,0.06)',
  borderDefault: '#232A33',
  borderStrong: '#2A313B',
  borderDisabled: '#3A424D',

  textPrimary: '#E7EBEF',
  textSecondary: '#8A93A0',
  textTertiary: '#9AA3AF',
  textMuted: '#586170',
  textOnAccent: '#06120F',

  accent: '#16E0C3',
  accentInk: '#06120F',

  connectionOnline: '#16E0C3',
  connectionOffline: '#586170',

  armFrom: '#7A45CC',
  armTo: '#16E0C3',

  riskAllowFg: '#2FD27A',
  riskAllowBg: 'rgba(47,210,122,0.06)',
  riskAllowBorder: 'rgba(47,210,122,0.25)',
  riskWarnFg: '#FFB020',
  riskWarnBg: 'rgba(255,176,32,0.12)',
  riskWarnBorder: 'rgba(255,176,32,0.40)',
  riskBlockFg: '#FF4D4D',
  riskBlockFgStrong: '#FF8A8A',
  riskBlockBg: 'rgba(255,77,77,0.10)',
  riskBlockBorder: 'rgba(255,77,77,0.45)',
};

/**
 * LIGHT — STRUCTURE ONLY. Do not ship. Every key is present (so the theme
 * type is satisfied and consumers can be written theme-agnostic today) but
 * intentionally falls back to dark until real light values are authored.
 * Replace this Proxy with a real object in the light-theme pass.
 */
const light: SemanticColors = new Proxy({} as SemanticColors, {
  get: (_t, key: string) => {
    if (__DEV__) {
      console.warn(`[tokens] light theme not authored yet — "${key}" falls back to dark.`);
    }
    // SemanticColors has no index signature by design (keeps static access
    // typed); this Proxy trap genuinely needs dynamic string-keyed access to
    // the same all-string object, so the double cast is the sound escape.
    return (dark as unknown as Record<string, string>)[key];
  },
});

export const themes: Record<ThemeName, SemanticColors> = { dark, light };

/** Resolve a risk tier to its foreground/background/border triple. */
export function riskColors(tier: RiskTier, c: SemanticColors = dark) {
  switch (tier) {
    case 'ALLOW':
      return { fg: c.riskAllowFg, bg: c.riskAllowBg, border: c.riskAllowBorder, glyph: '✓' as const };
    case 'WARN':
      return { fg: c.riskWarnFg, bg: c.riskWarnBg, border: c.riskWarnBorder, glyph: '▲' as const };
    case 'BLOCK':
      return { fg: c.riskBlockFg, bg: c.riskBlockBg, border: c.riskBlockBorder, glyph: '⛔' as const };
    default:
      return assertNever(tier);
  }
}

/** Non-color scales (unitless dp / RN points). */
export const font = {
  family: { ui: 'Archivo', mono: 'JetBrains Mono' },
  size: { micro: 9, tiny: 10, xs: 11, sm: 12, base: 13, md: 14, lg: 18, xl: 22, action: 23, display: 26 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' } as const,
  /** em values — multiply by fontSize for RN letterSpacing (dp). */
  tracking: { tight: -0.01, normal: 0, label: 0.1, labelWide: 0.16, eyebrow: 0.22 },
  lineHeight: { tight: 1.2, snug: 1.35, body: 1.45, relaxed: 1.6 },
};

/** RN letterSpacing helper: tracking is in em, RN wants dp. */
export const tracking = (em: number, fontSize: number) => em * fontSize;

export const radius = {
  chip: 8, badge: 8, cell: 11, field: 12, control: 15, controlSm: 14, card: 22, pill: 20, device: 38,
};

export const space = { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16, 9: 18, 10: 20, 11: 22, 12: 24 };

export const size = {
  armButtonHeight: 62, hitTargetMin: 44, tabIconBox: 20, statusDot: 7, screenWidth: 393, screenHeight: 838,
};

/** Arm-button timing + haptics (see specs/arm-button.md for the full state machine). */
export const arm = {
  armMs: 900,        // hold duration to reach armed
  decayMs: 340,      // release-before-armed → decay back to disarmed
  signingMs: 800,    // armed → tap → signing
  broadcastMs: 950,  // signing → broadcast
  doneResetMs: 1450, // done → auto reset
  hapticOnArm: 'medium' as const, // RN Haptics impact style when progress hits 1
};
