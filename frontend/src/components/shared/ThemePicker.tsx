'use client';

import { useState } from 'react';
import { useUIStore, THEMES, AppTheme } from '@/store/ui.store';
import { cn } from '@/lib/utils';

interface ThemePickerProps {
  /** 'dropdown' = compact button + popover (TopBar), 'inline' = full grid (Login/Settings) */
  variant?: 'dropdown' | 'inline';
  className?: string;
}

export function ThemePicker({ variant = 'dropdown', className }: ThemePickerProps) {
  const { theme, setTheme } = useUIStore();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[1];

  if (variant === 'inline') {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all',
              theme === t.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700',
            )}
          >
            <span className="text-base shrink-0">{t.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight truncate">{t.label}</p>
              <p className="text-xs text-gray-400 leading-tight truncate hidden sm:block">
                {t.description}
              </p>
            </div>
            {theme === t.id && (
              <span className="ml-auto text-blue-500 text-xs shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
        title="Change theme"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 animate-fade-in">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5">
              UI Theme
            </p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  theme === t.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700',
                )}
              >
                <span className="text-base">{t.icon}</span>
                <div>
                  <p className="text-sm font-medium leading-tight">{t.label}</p>
                  <p className="text-xs text-gray-400 leading-tight">{t.description}</p>
                </div>
                {theme === t.id && (
                  <span className="ml-auto text-blue-500 font-bold text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
