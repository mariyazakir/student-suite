'use client';

import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { getSession, type UserGender } from '@/lib/auth/local-auth';
import { boyishTheme, girlishTheme, neutralTheme, type ThemeTokens } from '@/theme/themes';

type ThemeId = 'neutral' | 'girlish' | 'boyish';

type ThemeContextValue = {
  theme: ThemeId;
  setThemeByGender: (gender: UserGender | undefined) => void;
  setThemeDirect: (theme: ThemeId) => void;
};

const THEME_STORAGE_KEY = 'student-suite-theme';
const THEME_KEY_COMPAT = 'themeKey';
const GENDER_KEY_COMPAT = 'gender';
const VALID_THEMES: ThemeId[] = ['neutral', 'girlish', 'boyish'];

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'neutral',
  setThemeByGender: () => {},
  setThemeDirect: () => {},
});

const mapGenderToTheme = (gender?: UserGender | null): ThemeId => {
  if (gender === 'female') return 'girlish';
  if (gender === 'male') return 'boyish';
  return 'neutral';
};

const applyThemeVars = (tokens: ThemeTokens) => {
  if (typeof document === 'undefined') return;
  try {
    const root = document.documentElement;
    const map: Record<keyof Omit<ThemeTokens, 'name'>, string> = {
      bg: '--bg',
      cardBg: '--card-bg',
      sidebarBg: '--sidebar-bg',
      textPrimary: '--text-primary',
      textSecondary: '--text-secondary',
      primaryBtn: '--primary-btn',
      accent: '--accent',
      border: '--border',
      radius: '--radius',
      shadow: '--shadow',
    };

    (Object.keys(map) as (keyof typeof map)[]).forEach((key) => {
      root.style.setProperty(map[key], tokens[key]);
    });

    const classes: ThemeId[] = ['neutral', 'girlish', 'boyish'];
    classes.forEach((cls) => root.classList.remove(`theme-${cls}`));
    root.classList.add(`theme-${tokens.name}`);
    root.dataset.theme = tokens.name;
  } catch {
    // fallback handled by caller
  }
};

const getTokens = (id: ThemeId): ThemeTokens => {
  if (id === 'girlish') return girlishTheme;
  if (id === 'boyish') return boyishTheme;
  return neutralTheme;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>('neutral');

  const resolveValidThemeId = (maybe: string | null | undefined): ThemeId => {
    if (maybe && (VALID_THEMES as string[]).includes(maybe)) return maybe as ThemeId;
    return 'neutral';
  };

  const safeApplyTheme = (id: ThemeId) => {
    const validated = resolveValidThemeId(id);
    const tokens = (() => {
      try {
        return getTokens(validated);
      } catch {
        return neutralTheme;
      }
    })();
    applyThemeVars(tokens);
  };

  const readUrlOverride = (): ThemeId | null => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const override = params.get('theme');
      if (!override) return null;
      return resolveValidThemeId(override);
    } catch {
      return null;
    }
  };

  // Initialize from storage/session without flicker
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const urlOverride = readUrlOverride();
    const storedKey =
      (window.localStorage.getItem(THEME_KEY_COMPAT) as ThemeId | null) ||
      (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null);
    const storedGender = window.localStorage.getItem(GENDER_KEY_COMPAT) as UserGender | null;
    let next: ThemeId = 'neutral';
    if (urlOverride) {
      next = urlOverride;
    } else if (storedKey === 'girlish' || storedKey === 'boyish' || storedKey === 'neutral') {
      next = storedKey;
    } else if (storedGender === 'female' || storedGender === 'male' || storedGender === 'neutral') {
      next = mapGenderToTheme(storedGender);
    } else {
      const session = getSession();
      next = mapGenderToTheme(session?.gender ?? 'neutral');
    }
    const validated = resolveValidThemeId(next);
    setTheme(validated);
    safeApplyTheme(validated);
  }, []);

  const setThemeDirect = (next: ThemeId) => {
    const validated = resolveValidThemeId(next);
    setTheme(validated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, validated);
      window.localStorage.setItem(THEME_KEY_COMPAT, validated);
    }
    safeApplyTheme(validated);
  };

  const setThemeByGender = (gender: UserGender | undefined) => {
    const next = mapGenderToTheme(gender);
    setThemeDirect(next);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setThemeByGender,
      setThemeDirect,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
