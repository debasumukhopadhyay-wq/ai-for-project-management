'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Network,
  FolderOpen,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useCopilotStore } from '@/store/copilot.store';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Portfolios', href: '/portfolios', icon: Briefcase },
  { label: 'Programs', href: '/programs', icon: Network },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'Resources', href: '/resources', icon: Users },
  { label: 'Financials', href: '/financials', icon: DollarSign },
  { label: 'Risks', href: '/risks', icon: AlertTriangle },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Documents', href: '/documents', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { toggleCopilot } = useCopilotStore();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    router.push('/login');
    toast.success('Signed out successfully');
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 transition-all duration-300 z-30',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
      style={{ backgroundColor: 'var(--bg-sidebar)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/10">
        {sidebarCollapsed ? (
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center mx-auto">
            <span className="text-white font-black text-base leading-none">B</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-black text-base leading-none">B</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">BEATS</p>
              <p className="text-gray-400 text-[10px] leading-tight truncate">PPM Portal · PoC</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 flex-shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                active && 'active',
                sidebarCollapsed && 'justify-center px-2',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* AI Copilot button */}
        <div className="pt-2 mt-2 border-t border-white/10">
          <button
            onClick={toggleCopilot}
            className={cn(
              'sidebar-link w-full text-left',
              sidebarCollapsed && 'justify-center px-2',
            )}
            title={sidebarCollapsed ? 'AI Copilot' : undefined}
          >
            <Bot className="w-4 h-4 flex-shrink-0 text-brand-400" />
            {!sidebarCollapsed && (
              <span className="text-brand-400 font-semibold">AI Copilot</span>
            )}
          </button>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        {user && (
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-400 text-xs truncate capitalize">
                  {user.role.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex justify-center p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
