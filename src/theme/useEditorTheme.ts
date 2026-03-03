import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from './ThemeProvider';

export function useEditorTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEditorTheme must be used within ThemeProvider');
  }
  return context;
}
