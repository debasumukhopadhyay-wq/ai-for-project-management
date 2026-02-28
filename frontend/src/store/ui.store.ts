import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Theme definitions ────────────────────────────────────────
export type AppTheme = 'light' | 'professional' | 'dark' | 'high-contrast';

export const THEMES: { id: AppTheme; label: string; description: string; icon: string }[] = [
  { id: 'light',         label: 'Light',         description: 'Clean white background, ideal for bright environments', icon: '☀️' },
  { id: 'professional',  label: 'Professional',   description: 'Slate-blue sidebar, enterprise-grade look', icon: '💼' },
  { id: 'dark',          label: 'Dark',           description: 'Dark background, easy on the eyes in low-light', icon: '🌙' },
  { id: 'high-contrast', label: 'High Contrast',  description: 'Maximum contrast for accessibility', icon: '⬛' },
];

// CSS variables applied per theme to :root
export const THEME_CSS: Record<AppTheme, Record<string, string>> = {
  light: {
    '--bg-page':      '#f8fafc',
    '--bg-card':      '#ffffff',
    '--bg-sidebar':   '#1e293b',
    '--bg-topbar':    '#ffffff',
    '--text-primary': '#0f172a',
    '--text-muted':   '#94a3b8',
    '--border':       '#e2e8f0',
    '--accent':       '#2563eb',
  },
  professional: {
    '--bg-page':      '#f0f4f8',
    '--bg-card':      '#ffffff',
    '--bg-sidebar':   '#0f172a',
    '--bg-topbar':    '#ffffff',
    '--text-primary': '#0f172a',
    '--text-muted':   '#64748b',
    '--border':       '#cbd5e1',
    '--accent':       '#1d4ed8',
  },
  dark: {
    '--bg-page':      '#0f172a',
    '--bg-card':      '#1e293b',
    '--bg-sidebar':   '#020617',
    '--bg-topbar':    '#1e293b',
    '--text-primary': '#f1f5f9',
    '--text-muted':   '#64748b',
    '--border':       '#334155',
    '--accent':       '#3b82f6',
  },
  'high-contrast': {
    '--bg-page':      '#ffffff',
    '--bg-card':      '#ffffff',
    '--bg-sidebar':   '#000000',
    '--bg-topbar':    '#000000',
    '--text-primary': '#000000',
    '--text-muted':   '#333333',
    '--border':       '#000000',
    '--accent':       '#0000cc',
  },
};

export function applyThemeVars(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  const vars = THEME_CSS[theme];
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', theme);
  // Toggle Tailwind dark class so all dark: variants activate correctly
  root.classList.toggle('dark', theme === 'dark' || theme === 'high-contrast');
}

// ─── Store ────────────────────────────────────────────────────
interface UIState {
  sidebarCollapsed: boolean;
  theme: AppTheme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: AppTheme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'professional',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => {
        applyThemeVars(theme);
        set({ theme });
      },
    }),
    {
      name: 'ppm-ui',
      // Re-apply theme after Zustand rehydrates from localStorage on page load
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeVars(state.theme);
      },
    },
  ),
);
