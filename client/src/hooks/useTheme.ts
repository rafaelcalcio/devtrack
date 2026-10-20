import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../context/theme-context';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }

  return context;
}
