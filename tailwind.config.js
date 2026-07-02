/**
 * NativeWind (Tailwind) config. Semantic color roles only — components must
 * consume roles (`bg-canvas`, `text-textPrimary`, `text-riskWarnFg`, …), never
 * primitive palette scales, so a future theme swap is one map change here.
 * Values mirror `src/theme/theme.ts` (dark, canonical for v1). Static hex —
 * no CSS-var scheme switching (dark-only; see A1b spec).
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
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
        riskWarnFg: '#FFB020',
        riskBlockFg: '#FF4D4D',
        riskBlockFgStrong: '#FF8A8A',
      },
      borderRadius: {
        chip: '8px', cell: '11px', field: '12px', controlSm: '14px', control: '15px', card: '22px', pill: '20px',
      },
      fontFamily: {
        ui: ['Archivo'],
        mono: ['JetBrains Mono'],
      },
      fontSize: {
        micro: '9px', tiny: '10px', xs: '11px', sm: '12px', base: '13px',
        md: '14px', lg: '18px', xl: '22px', action: '23px', display: '26px',
      },
    },
  },
  plugins: [],
};
