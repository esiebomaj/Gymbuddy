import React, {createContext, useContext, useState, useEffect, useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DarkColors, LightColors, type AppColors} from '../theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type ThemeContextType = {
  isDark: boolean;
  colors: AppColors;
  barStyle: 'light-content' | 'dark-content';
  toggleTheme: () => void;
};

// ── Context ───────────────────────────────────────────────────────────────────

const THEME_KEY = '@gymbuddy:theme';

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: DarkColors,
  barStyle: 'light-content',
  toggleTheme: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isDark, setIsDark] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(val => {
        if (val !== null) {setIsDark(val === 'dark');}
      })
      .catch(() => {});
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {}
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      colors: isDark ? DarkColors : LightColors,
      barStyle: isDark ? 'light-content' : 'dark-content',
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useTheme = () => useContext(ThemeContext);
