import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { EDITOR_THEMES, DEFAULT_THEME, THEME_STORAGE_KEY, EditorThemeDefinition } from './theme-config';

export interface ThemeContextValue {
  theme: string;
  setTheme: (themeId: string) => void;
  availableThemes: EditorThemeDefinition[];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): string {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && EDITOR_THEMES.some(t => t.id === stored)) {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_THEME;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  const setTheme = useCallback((themeId: string) => {
    if (!EDITOR_THEMES.some(t => t.id === themeId)) return;

    // Add transitioning attribute for smooth CSS transitions
    document.documentElement.setAttribute('data-theme-transitioning', '');

    // Clear any pending timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setThemeState(themeId);

    // Remove transitioning attribute after animation completes
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.removeAttribute('data-theme-transitioning');
    }, 250);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: EDITOR_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
