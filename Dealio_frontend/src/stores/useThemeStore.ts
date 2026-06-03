import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

const STORAGE_KEY = 'dealio_theme';

const saved = localStorage.getItem(STORAGE_KEY);
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const initialDark = saved !== null ? saved === 'dark' : prefersDark;

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
}

// Apply on load
applyTheme(initialDark);

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: initialDark,
  toggle: () => set(state => {
    const next = !state.isDark;
    applyTheme(next);
    return { isDark: next };
  }),
  setDark: (dark) => set(() => {
    applyTheme(dark);
    return { isDark: dark };
  }),
}));
