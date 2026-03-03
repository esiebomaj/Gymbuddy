export const DarkColors = {
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

export const LightColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#EEEEF4',
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  accent: '#FF3CAC',
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#0B0B0F',
  textSecondary: '#4A4A6A',
  textMuted: '#8A8AA8',
  border: '#DDDDE8',
  borderFocused: '#FF6B35',
  borderLight: '#E8E8F0',
  error: '#FF4C6A',
  success: '#22E09A',
  googleBg: '#FFFFFF',
  appleBg: '#000000',
} as const;

/** Backward-compat alias — prefer useTheme().colors in components */
export const Colors = DarkColors;

export type AppColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
