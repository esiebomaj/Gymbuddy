export const Colors = {
  background: '#0B0B0F',
  surface: '#161620',
  surfaceElevated: '#1E1E2C',
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  accent: '#FF3CAC',
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0BC',
  textMuted: '#6B6B88',
  border: '#2A2A3A',
  borderFocused: '#FF6B35',
  borderLight: '#383848',
  error: '#FF4C6A',
  success: '#22E09A',
  googleBg: '#FFFFFF',
  appleBg: '#000000',
} as const;

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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const Typography = {
  h1: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '400' as const },
} as const;
