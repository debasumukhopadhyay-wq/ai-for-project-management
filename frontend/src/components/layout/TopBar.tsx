'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { ThemePicker } from '@/components/shared/ThemePicker';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/portfolios': 'Portfolio Management',
  '/programs': 'Program Management',
  '/projects': 'Project Management',
  '/resources': 'Resource Management',
  '/financials': 'Financial Management',
  '/risks': 'Risk & Issue Management',
  '/reports': 'Reports & Analytics',
  '/documents': 'Document Management',
};

function getTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'BEATS PPM Portal';
}

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const title = getTitle(pathname);

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 sticky top-0 z-20" style={{ backgroundColor: 'var(--bg-topbar)' }}>
      <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1">{title}</h1>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects, programs..."
          className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-56"
        />
      </div>

      {/* Theme picker */}
      <ThemePicker variant="dropdown" />

      {/* Notifications */}
      <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* User chip */}
      {user && (
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user.firstName}
          </span>
        </div>
      )}
    </header>
  );
}
