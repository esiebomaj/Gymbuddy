export const DarkColors = {
  // ── Backgrounds ──
  background: '#060614',
  surface: 'rgba(255,255,255,0.07)',
  surfaceElevated: 'rgba(255,255,255,0.12)',
  surfaceStrong: 'rgba(255,255,255,0.17)',
  // ── Glass tokens ──
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.15)',
  glassHighlight: 'rgba(255,255,255,0.22)',
  // ── Brand ──
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  accent: '#BF5AF2',
  // ── Base ──
  white: '#FFFFFF',
  black: '#000000',
  // ── Text ──
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
  // ── Borders ──
  border: 'rgba(255,255,255,0.12)',
  borderFocused: '#FF6B35',
  borderLight: 'rgba(255,255,255,0.07)',
  // ── States ──
  error: '#FF453A',
  success: '#30D158',
  // ── Glows ──
  glowPrimary: 'rgba(255,107,53,0.30)',
  glowError: 'rgba(255,69,58,0.25)',
  glowSuccess: 'rgba(48,209,88,0.25)',
  googleBg: '#FFFFFF',
  appleBg: '#000000',
} as const;

export const LightColors = {
  // ── Backgrounds ──
  background: '#F2F2F7',
  surface: 'rgba(255,255,255,0.78)',
  surfaceElevated: 'rgba(255,255,255,0.92)',
  surfaceStrong: '#FFFFFF',
  // ── Glass tokens ──
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.95)',
  glassHighlight: '#FFFFFF',
  // ── Brand ──
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  accent: '#BF5AF2',
  // ── Base ──
  white: '#FFFFFF',
  black: '#000000',
  // ── Text ──
  textPrimary: '#000000',
  textSecondary: 'rgba(0,0,0,0.58)',
  textMuted: 'rgba(0,0,0,0.36)',
  // ── Borders ──
  border: 'rgba(60,60,67,0.13)',
  borderFocused: '#FF6B35',
  borderLight: 'rgba(60,60,67,0.06)',
  // ── States ──
  error: '#FF3B30',
  success: '#34C759',
  // ── Glows ──
  glowPrimary: 'rgba(255,107,53,0.15)',
  glowError: 'rgba(255,59,48,0.12)',
  glowSuccess: 'rgba(52,199,89,0.12)',
  googleBg: '#FFFFFF',
  appleBg: '#000000',
} as const;

/** Backward-compat alias — prefer useTheme().colors in components */
export const Colors = DarkColors;

export type AppColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceStrong: string;
  glass: string;
  glassBorder: string;
  glassHighlight: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  white: string;
  black: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderFocused: string;
  borderLight: string;
  error: string;
  success: string;
  glowPrimary: string;
  glowError: string;
  glowSuccess: string;
  googleBg: string;
  appleBg: string;
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const Typography = {
  h1: { fontSize: 38, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 22, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  bodySmall: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.5 },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;
