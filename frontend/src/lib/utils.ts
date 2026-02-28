import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { RagStatus, TaskStatus, TaskPriority, ProjectStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatters ──────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function fromNow(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

// ─── Number formatters ───────────────────────────────────────

export function formatCurrency(
  amount: number | string | undefined,
  currency = 'USD',
): string {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatNumber(n: number | string | undefined): string {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat('en-US').format(Number(n));
}

export function formatPercent(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  return `${Math.round(Number(n))}%`;
}

// ─── Status mappers ───────────────────────────────────────────

export const RAG_COLORS: Record<RagStatus, { bg: string; text: string; dot: string }> = {
  GREEN: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  AMBER: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  RED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-gray-100 text-gray-700',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-gray-500',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  INITIATION: 'Initiation',
  PLANNING: 'Planning',
  EXECUTION: 'Execution',
  MONITORING: 'Monitoring',
  CLOSURE: 'Closure',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

// ─── Risk score ───────────────────────────────────────────────

export function getRiskScoreColor(score: number): string {
  if (score >= 20) return 'text-red-600 bg-red-50';
  if (score >= 12) return 'text-orange-600 bg-orange-50';
  if (score >= 6) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export function getRiskScoreLabel(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

// ─── EVM helpers ──────────────────────────────────────────────

export function getCPIColor(cpi: number): string {
  if (cpi >= 1.0) return 'text-green-600';
  if (cpi >= 0.9) return 'text-amber-600';
  return 'text-red-600';
}

export function getSPIColor(spi: number): string {
  if (spi >= 1.0) return 'text-green-600';
  if (spi >= 0.9) return 'text-amber-600';
  return 'text-red-600';
}

// ─── String helpers ───────────────────────────────────────────

export function truncate(str: string, length = 80): string {
  if (!str) return '';
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
