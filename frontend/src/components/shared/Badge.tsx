import { cn } from '@/lib/utils';
import { RagStatus, ProjectStatus, TaskStatus, TaskPriority, RiskStatus, MilestoneStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_STYLES = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── RAG Status Badge ─────────────────────────────────────────

export function RAGBadge({ status }: { status: RagStatus }) {
  const config = {
    GREEN: { label: 'Green', className: 'bg-green-100 text-green-700' },
    AMBER: { label: 'Amber', className: 'bg-amber-100 text-amber-800' },
    RED: { label: 'Red', className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-green-500': status === 'GREEN',
        'bg-amber-500': status === 'AMBER',
        'bg-red-500': status === 'RED',
      })} />
      {label}
    </span>
  );
}

// ─── Project Status Badge ─────────────────────────────────────

const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  INITIATION: 'bg-blue-100 text-blue-700',
  PLANNING: 'bg-indigo-100 text-indigo-700',
  EXECUTION: 'bg-brand-100 text-brand-700',
  MONITORING: 'bg-cyan-100 text-cyan-700',
  CLOSURE: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
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

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('badge', PROJECT_STATUS_STYLES[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Task Status Badge ────────────────────────────────────────

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  BACKLOG: 'bg-gray-100 text-gray-600',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('badge', TASK_STATUS_STYLES[status])}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Priority Badge ────────────────────────────────────────────

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('badge', PRIORITY_STYLES[priority])}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Risk Status Badge ────────────────────────────────────────

const RISK_STATUS_STYLES: Record<RiskStatus, string> = {
  OPEN: 'bg-red-100 text-red-700',
  MITIGATED: 'bg-green-100 text-green-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ESCALATED: 'bg-orange-100 text-orange-700',
};

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  return (
    <span className={cn('badge', RISK_STATUS_STYLES[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Milestone Status Badge ───────────────────────────────────

const MILESTONE_STATUS_STYLES: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DELAYED: 'bg-red-100 text-red-700',
  AT_RISK: 'bg-amber-100 text-amber-800',
};

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
  AT_RISK: 'At Risk',
};

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span className={cn('badge', MILESTONE_STATUS_STYLES[status])}>
      {MILESTONE_STATUS_LABELS[status]}
    </span>
  );
}
