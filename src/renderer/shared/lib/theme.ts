export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}
