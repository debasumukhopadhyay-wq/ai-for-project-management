'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Edit,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  Milestone,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  User,
  Layers,
  Tag,
  BarChart3,
  ListTree,
  KanbanSquare,
  Plus,
  Sparkles,
  ShieldAlert,
  FileText,
  GitPullRequest,
  Users,
  Star,
  GripVertical,
  Clock,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  projectsApi,
  tasksApi,
  milestonesApi,
  risksApi,
  financialsApi,
  aiApi,
  usersApi,
} from '@/lib/api';
import {
  Project,
  Task,
  Milestone as MilestoneType,
  Risk,
  Budget,
  ChangeRequest,
  ProjectMember,
  EVMMetrics,
  TaskStatus,
  TaskPriority,
  RiskStatus,
  MilestoneStatus,
  User as UserType,
} from '@/types';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  cn,
  getRiskScoreColor,
  getCPIColor,
  getSPIColor,
  getInitials,
} from '@/lib/utils';
import {
  RAGBadge,
  ProjectStatusBadge,
  TaskStatusBadge,
  PriorityBadge,
  RiskStatusBadge,
  MilestoneStatusBadge,
} from '@/components/shared/Badge';
import { KPICard } from '@/components/shared/Card';
import { Modal } from '@/components/shared/Modal';
import { DataTable, Column } from '@/components/shared/DataTable';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCopilotStore } from '@/store/copilot.store';

// ─── Tab definition ───────────────────────────────────────────

type Tab = 'overview' | 'tasks' | 'milestones' | 'risks' | 'financials' | 'change-requests';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'milestones', label: 'Milestones', icon: Milestone },
  { id: 'risks', label: 'Risks', icon: ShieldAlert },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'change-requests', label: 'Change Requests', icon: GitPullRequest },
];

const TASK_STATUS_ORDER: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
];

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-gray-100 border-gray-200',
  TODO: 'bg-blue-50 border-blue-100',
  IN_PROGRESS: 'bg-indigo-50 border-indigo-100',
  IN_REVIEW: 'bg-purple-50 border-purple-100',
  DONE: 'bg-green-50 border-green-100',
  BLOCKED: 'bg-red-50 border-red-100',
};

const TASK_STATUS_HEADER_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'text-gray-600 bg-gray-100',
  TODO: 'text-blue-700 bg-blue-100',
  IN_PROGRESS: 'text-indigo-700 bg-indigo-100',
  IN_REVIEW: 'text-purple-700 bg-purple-100',
  DONE: 'text-green-700 bg-green-100',
  BLOCKED: 'text-red-700 bg-red-100',
};

// ─── New Task Modal ────────────────────────────────────────────

interface NewTaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedHours: string;
  wbsCode: string;
}

const EMPTY_TASK_FORM: NewTaskFormData = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assigneeId: '',
  plannedStart: '',
  plannedEnd: '',
  estimatedHours: '',
  wbsCode: '',
};

function NewTaskModal({
  open,
  onClose,
  projectId,
  users,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewTaskFormData>(EMPTY_TASK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewTaskFormData, string>>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
      setForm(EMPTY_TASK_FORM);
      setErrors({});
      onClose();
    },
  });

  function validate() {
    const errs: Partial<Record<keyof NewTaskFormData, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || undefined,
      plannedStart: form.plannedStart || undefined,
      plannedEnd: form.plannedEnd || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      wbsCode: form.wbsCode.trim() || undefined,
    });
  }

  function handleClose() {
    setForm(EMPTY_TASK_FORM);
    setErrors({});
    onClose();
  }

  const field = (key: keyof NewTaskFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Task"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-task-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </>
      }
    >
      <form id="new-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="task-title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            className={cn('input', errors.title && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Design system architecture"
            value={form.title}
            onChange={(e) => field('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="label" htmlFor="task-desc">
            Description
          </label>
          <textarea
            id="task-desc"
            className="input min-h-[64px] resize-none"
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              className="input"
              value={form.status}
              onChange={(e) => field('status', e.target.value as TaskStatus)}
            >
              {TASK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="input"
              value={form.priority}
              onChange={(e) => field('priority', e.target.value as TaskPriority)}
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="task-assignee">
              Assignee
            </label>
            <select
              id="task-assignee"
              className="input"
              value={form.assigneeId}
              onChange={(e) => field('assigneeId', e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-wbs">
              WBS Code
            </label>
            <input
              id="task-wbs"
              className="input"
              placeholder="e.g. 1.2.3"
              value={form.wbsCode}
              onChange={(e) => field('wbsCode', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="task-start">
              Planned Start
            </label>
            <input
              id="task-start"
              type="date"
              className="input"
              value={form.plannedStart}
              onChange={(e) => field('plannedStart', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="task-end">
              Planned End
            </label>
            <input
              id="task-end"
              type="date"
              className="input"
              value={form.plannedEnd}
              onChange={(e) => field('plannedEnd', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="task-hours">
            Estimated Hours
          </label>
          <input
            id="task-hours"
            type="number"
            min="0"
            step="0.5"
            className="input"
            placeholder="e.g. 8"
            value={form.estimatedHours}
            onChange={(e) => field('estimatedHours', e.target.value)}
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create task. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── New Milestone Modal ───────────────────────────────────────

function NewMilestoneModal({
  open,
  onClose,
  projectId,
  users,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    plannedDate: '',
    ownerId: '',
    isKeyMilestone: false,
  });
  const [nameError, setNameError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => milestonesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      setForm({ name: '', description: '', plannedDate: '', ownerId: '', isKeyMilestone: false });
      setNameError('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Milestone name is required');
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      plannedDate: form.plannedDate || undefined,
      ownerId: form.ownerId || undefined,
      isKeyMilestone: form.isKeyMilestone,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Milestone"
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-milestone-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Milestone'}
          </button>
        </>
      }
    >
      <form id="new-milestone-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="ms-name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="ms-name"
            className={cn('input', nameError && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Phase 1 Complete"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        <div>
          <label className="label" htmlFor="ms-desc">
            Description
          </label>
          <textarea
            id="ms-desc"
            className="input min-h-[64px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="ms-date">
              Planned Date
            </label>
            <input
              id="ms-date"
              type="date"
              className="input"
              value={form.plannedDate}
              onChange={(e) => setForm((f) => ({ ...f, plannedDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="ms-owner">
              Owner
            </label>
            <select
              id="ms-owner"
              className="input"
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
            >
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="ms-key"
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            checked={form.isKeyMilestone}
            onChange={(e) => setForm((f) => ({ ...f, isKeyMilestone: e.target.checked }))}
          />
          <label htmlFor="ms-key" className="text-sm text-gray-700 select-none cursor-pointer">
            Key Milestone
          </label>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create milestone. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── New Risk Modal ────────────────────────────────────────────

function NewRiskModal({
  open,
  onClose,
  projectId,
  users,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    probability: 'MEDIUM' as string,
    impact: 'MEDIUM' as string,
    status: 'OPEN' as RiskStatus,
    ownerId: '',
    mitigationPlan: '',
    dueDate: '',
  });
  const [titleError, setTitleError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => risksApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      setForm({
        title: '',
        description: '',
        category: '',
        probability: 'MEDIUM',
        impact: 'MEDIUM',
        status: 'OPEN',
        ownerId: '',
        mitigationPlan: '',
        dueDate: '',
      });
      setTitleError('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Risk title is required');
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      probability: form.probability,
      impact: form.impact,
      status: form.status,
      ownerId: form.ownerId || undefined,
      mitigationPlan: form.mitigationPlan.trim() || undefined,
      dueDate: form.dueDate || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Risk"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-risk-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Risk'}
          </button>
        </>
      }
    >
      <form id="new-risk-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="risk-title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="risk-title"
            className={cn('input', titleError && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Key vendor dependency risk"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
        </div>

        <div>
          <label className="label" htmlFor="risk-desc">
            Description
          </label>
          <textarea
            id="risk-desc"
            className="input min-h-[64px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="risk-prob">
              Probability
            </label>
            <select
              id="risk-prob"
              className="input"
              value={form.probability}
              onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))}
            >
              <option value="VERY_HIGH">Very High</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="VERY_LOW">Very Low</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="risk-impact">
              Impact
            </label>
            <select
              id="risk-impact"
              className="input"
              value={form.impact}
              onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="VERY_LOW">Very Low</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="risk-status">
              Status
            </label>
            <select
              id="risk-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RiskStatus }))}
            >
              <option value="OPEN">Open</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="ESCALATED">Escalated</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="risk-category">
              Category
            </label>
            <input
              id="risk-category"
              className="input"
              placeholder="e.g. Technical, Operational..."
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="risk-owner">
              Owner
            </label>
            <select
              id="risk-owner"
              className="input"
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
            >
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="risk-due">
              Due Date
            </label>
            <input
              id="risk-due"
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="risk-mitigation">
            Mitigation Plan
          </label>
          <textarea
            id="risk-mitigation"
            className="input min-h-[64px] resize-none"
            placeholder="Describe actions to reduce probability or impact..."
            value={form.mitigationPlan}
            onChange={(e) => setForm((f) => ({ ...f, mitigationPlan: e.target.value }))}
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create risk. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── New Budget Line Modal ─────────────────────────────────────

function NewBudgetModal({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    budgetType: 'OPEX' as 'CAPEX' | 'OPEX',
    category: '',
    plannedAmount: '',
    actualAmount: '',
    forecastAmount: '',
  });
  const [nameError, setNameError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => financialsApi.createBudget(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
      setForm({
        name: '',
        budgetType: 'OPEX',
        category: '',
        plannedAmount: '',
        actualAmount: '',
        forecastAmount: '',
      });
      setNameError('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Name is required');
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      budgetType: form.budgetType,
      category: form.category.trim() || undefined,
      plannedAmount: form.plannedAmount ? Number(form.plannedAmount) : 0,
      actualAmount: form.actualAmount ? Number(form.actualAmount) : 0,
      forecastAmount: form.forecastAmount ? Number(form.forecastAmount) : 0,
      currency: 'USD',
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Budget Line"
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-budget-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Budget Line'}
          </button>
        </>
      }
    >
      <form id="new-budget-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="budget-name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="budget-name"
            className={cn('input', nameError && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Software Licenses"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="budget-type">
              Budget Type
            </label>
            <select
              id="budget-type"
              className="input"
              value={form.budgetType}
              onChange={(e) =>
                setForm((f) => ({ ...f, budgetType: e.target.value as 'CAPEX' | 'OPEX' }))
              }
            >
              <option value="CAPEX">CAPEX</option>
              <option value="OPEX">OPEX</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="budget-category">
              Category
            </label>
            <input
              id="budget-category"
              className="input"
              placeholder="e.g. Technology, Labour..."
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="budget-planned">
              Planned (USD)
            </label>
            <input
              id="budget-planned"
              type="number"
              min="0"
              step="100"
              className="input"
              placeholder="0"
              value={form.plannedAmount}
              onChange={(e) => setForm((f) => ({ ...f, plannedAmount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="budget-actual">
              Actual (USD)
            </label>
            <input
              id="budget-actual"
              type="number"
              min="0"
              step="100"
              className="input"
              placeholder="0"
              value={form.actualAmount}
              onChange={(e) => setForm((f) => ({ ...f, actualAmount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="budget-forecast">
              Forecast (USD)
            </label>
            <input
              id="budget-forecast"
              type="number"
              min="0"
              step="100"
              className="input"
              placeholder="0"
              value={form.forecastAmount}
              onChange={(e) => setForm((f) => ({ ...f, forecastAmount: e.target.value }))}
            />
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create budget line. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── New Change Request Modal ──────────────────────────────────

function NewCRModal({
  open,
  onClose,
  projectId,
  users,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    justification: '',
    impactBudget: '',
    impactScope: '',
    impactSchedule: '',
    requestedById: '',
  });
  const [titleError, setTitleError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/v1/projects/${projectId}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests', projectId] });
      setForm({
        title: '',
        description: '',
        justification: '',
        impactBudget: '',
        impactScope: '',
        impactSchedule: '',
        requestedById: '',
      });
      setTitleError('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || '',
      justification: form.justification.trim() || undefined,
      impactBudget: form.impactBudget ? Number(form.impactBudget) : 0,
      impactScope: form.impactScope.trim() || undefined,
      impactSchedule: form.impactSchedule.trim() || undefined,
      requestedById: form.requestedById || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Change Request"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-cr-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit CR'}
          </button>
        </>
      }
    >
      <form id="new-cr-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="cr-title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="cr-title"
            className={cn('input', titleError && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Extend project timeline by 2 weeks"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
        </div>

        <div>
          <label className="label" htmlFor="cr-desc">
            Description
          </label>
          <textarea
            id="cr-desc"
            className="input min-h-[72px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="cr-just">
            Justification
          </label>
          <textarea
            id="cr-just"
            className="input min-h-[64px] resize-none"
            placeholder="Why is this change necessary?"
            value={form.justification}
            onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="cr-budget">
              Budget Impact (USD)
            </label>
            <input
              id="cr-budget"
              type="number"
              step="100"
              className="input"
              placeholder="e.g. 50000"
              value={form.impactBudget}
              onChange={(e) => setForm((f) => ({ ...f, impactBudget: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="cr-requester">
              Requested By
            </label>
            <select
              id="cr-requester"
              className="input"
              value={form.requestedById}
              onChange={(e) => setForm((f) => ({ ...f, requestedById: e.target.value }))}
            >
              <option value="">— Select —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="cr-scope">
            Scope Impact
          </label>
          <input
            id="cr-scope"
            className="input"
            placeholder="Describe the scope change..."
            value={form.impactScope}
            onChange={(e) => setForm((f) => ({ ...f, impactScope: e.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="cr-schedule">
            Schedule Impact
          </label>
          <input
            id="cr-schedule"
            className="input"
            placeholder="e.g. +2 weeks to Phase 2 completion"
            value={form.impactSchedule}
            onChange={(e) => setForm((f) => ({ ...f, impactSchedule: e.target.value }))}
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to submit change request. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Edit Project Modal ────────────────────────────────────────

function EditProjectModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? '',
    projectType: project.projectType ?? '',
    totalBudget: String(project.totalBudget),
    plannedStartDate: project.plannedStartDate?.split('T')[0] ?? '',
    plannedEndDate: project.plannedEndDate?.split('T')[0] ?? '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      projectType: form.projectType.trim() || undefined,
      totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
      plannedStartDate: form.plannedStartDate || undefined,
      plannedEndDate: form.plannedEndDate || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Project"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="edit-project-form"
            className="btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="edit-name">
            Project Name
          </label>
          <input
            id="edit-name"
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-desc">
            Description
          </label>
          <textarea
            id="edit-desc"
            className="input min-h-[80px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="edit-type">
              Project Type
            </label>
            <input
              id="edit-type"
              className="input"
              value={form.projectType}
              onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-budget">
              Total Budget (USD)
            </label>
            <input
              id="edit-budget"
              type="number"
              min="0"
              className="input"
              value={form.totalBudget}
              onChange={(e) => setForm((f) => ({ ...f, totalBudget: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="edit-start">
              Planned Start
            </label>
            <input
              id="edit-start"
              type="date"
              className="input"
              value={form.plannedStartDate}
              onChange={(e) => setForm((f) => ({ ...f, plannedStartDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-end">
              Planned End
            </label>
            <input
              id="edit-end"
              type="date"
              className="input"
              value={form.plannedEndDate}
              onChange={(e) => setForm((f) => ({ ...f, plannedEndDate: e.target.value }))}
            />
          </div>
        </div>

        {updateMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to update project. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Kanban: Sortable Task Card ────────────────────────────────

function KanbanTaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assigneeInitials =
    task.assignee
      ? getInitials(task.assignee.firstName, task.assignee.lastName)
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'hover:shadow-md hover:border-brand-200 transition-all',
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 flex-shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 leading-snug line-clamp-2">
            {task.title}
          </p>

          {task.plannedEnd && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(task.plannedEnd)}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <PriorityBadge priority={task.priority} />
            {assigneeInitials && (
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {assigneeInitials}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban: Droppable Column ──────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  activeId,
}: {
  status: TaskStatus;
  tasks: Task[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border min-w-[220px] w-[220px] flex-shrink-0',
        TASK_STATUS_COLORS[status],
        isOver && 'ring-2 ring-brand-400',
      )}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              TASK_STATUS_HEADER_COLORS[status],
            )}
          >
            {TASK_STATUS_LABELS[status]}
          </span>
          <span className="text-xs text-gray-500 font-medium">{tasks.length}</span>
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={cn('flex-1 flex flex-col gap-2 p-2 min-h-[120px]')}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              isDragging={activeId === task.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────

function TasksTab({
  projectId,
  users,
}: {
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [taskView, setTaskView] = useState<'kanban' | 'wbs'>('kanban');
  const [showNewTask, setShowNewTask] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const { data: kanbanData, isLoading: kanbanLoading } = useQuery<{
    data: Record<TaskStatus, Task[]>;
  }>({
    queryKey: ['kanban', projectId],
    queryFn: () => tasksApi.getKanban(projectId) as any,
    enabled: taskView === 'kanban',
  });

  const { data: wbsData, isLoading: wbsLoading } = useQuery<{ data: Task[] }>({
    queryKey: ['wbs', projectId],
    queryFn: () => tasksApi.getWBS(projectId) as any,
    enabled: taskView === 'wbs',
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      tasksApi.update(projectId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
    },
  });

  const kanban: Record<TaskStatus, Task[]> = kanbanData?.data ?? {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
    BLOCKED: [],
  };

  function findTaskColumn(taskId: string): TaskStatus | null {
    for (const status of TASK_STATUS_ORDER) {
      if (kanban[status]?.some((t) => t.id === taskId)) {
        return status;
      }
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    for (const status of TASK_STATUS_ORDER) {
      const found = kanban[status]?.find((t) => t.id === id);
      if (found) {
        setActiveTask(found);
        break;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Determine target column
    let targetStatus: TaskStatus | null = null;
    if (TASK_STATUS_ORDER.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      targetStatus = findTaskColumn(overId);
    }

    if (!targetStatus) return;

    const currentStatus = findTaskColumn(taskId);
    if (currentStatus === targetStatus) return;

    updateTaskMutation.mutate({ taskId, data: { status: targetStatus } });
  }

  const wbsTasks = wbsData?.data ?? [];

  const wbsColumns: Column<Task>[] = [
    {
      key: 'wbsCode',
      label: 'WBS',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500">{row.wbsCode ?? '—'}</span>
      ),
    },
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.title}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <TaskStatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: 'assignee',
      label: 'Assignee',
      render: (row) =>
        row.assignee
          ? `${row.assignee.firstName} ${row.assignee.lastName}`
          : '—',
    },
    {
      key: 'plannedStart',
      label: 'Start',
      render: (row) => formatDate(row.plannedStart),
    },
    {
      key: 'plannedEnd',
      label: 'End',
      render: (row) => formatDate(row.plannedEnd),
    },
    {
      key: 'percentComplete',
      label: '% Done',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                row.percentComplete >= 100
                  ? 'bg-green-500'
                  : row.percentComplete >= 50
                  ? 'bg-brand-500'
                  : 'bg-amber-400',
              )}
              style={{ width: `${Math.min(row.percentComplete, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 w-8 text-right">
            {formatPercent(row.percentComplete)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setTaskView('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
              taskView === 'kanban'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50',
            )}
          >
            <KanbanSquare className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setTaskView('wbs')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
              taskView === 'wbs'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50',
            )}
          >
            <ListTree className="w-4 h-4" />
            WBS
          </button>
        </div>

        <button
          className="btn-primary btn-sm flex items-center gap-1.5"
          onClick={() => setShowNewTask(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </button>
      </div>

      {/* Kanban board */}
      {taskView === 'kanban' && (
        <>
          {kanbanLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading tasks...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-3 overflow-x-auto pb-4">
                {TASK_STATUS_ORDER.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={kanban[status] ?? []}
                    activeId={activeId}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div className="rotate-2 shadow-xl">
                    <KanbanTaskCard task={activeTask} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {/* WBS table */}
      {taskView === 'wbs' && (
        <>
          {wbsLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading tasks...
            </div>
          ) : wbsTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks yet"
              description="Create your first task to start tracking work."
              action={
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => setShowNewTask(true)}
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
              }
            />
          ) : (
            <DataTable
              columns={wbsColumns}
              data={wbsTasks}
              rowKey={(row) => row.id}
              emptyMessage="No tasks found."
            />
          )}
        </>
      )}

      <NewTaskModal
        open={showNewTask}
        onClose={() => setShowNewTask(false)}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}

// ─── Milestones Tab ────────────────────────────────────────────

function MilestonesTab({
  projectId,
  users,
}: {
  projectId: string;
  users: UserType[];
}) {
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery<{ data: MilestoneType[] }>({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.getByProject(projectId) as any,
  });

  const milestones = (data?.data ?? []).sort(
    (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading milestones...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
        </h3>
        <button
          className="btn-primary btn-sm flex items-center gap-1.5"
          onClick={() => setShowNew(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          New Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={Milestone}
          title="No milestones yet"
          description="Add milestones to track key deliverables and dates."
          action={
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowNew(true)}
            >
              <Plus className="w-4 h-4" />
              New Milestone
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {milestones.map((ms) => (
            <div
              key={ms.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm transition-all"
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0',
                  ms.status === 'COMPLETED' && 'bg-green-500',
                  ms.status === 'IN_PROGRESS' && 'bg-blue-500',
                  ms.status === 'AT_RISK' && 'bg-amber-500',
                  ms.status === 'DELAYED' && 'bg-red-500',
                  ms.status === 'NOT_STARTED' && 'bg-gray-300',
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ms.name}</p>
                  {ms.isKeyMilestone && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                </div>
                {ms.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{ms.description}</p>
                )}
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-500 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Planned</p>
                  <p className="font-medium text-gray-700 mt-0.5">{formatDate(ms.plannedDate)}</p>
                </div>

                {ms.actualDate && (
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Actual</p>
                    <p className="font-medium text-gray-700 mt-0.5">{formatDate(ms.actualDate)}</p>
                  </div>
                )}

                {ms.owner && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {ms.owner.firstName} {ms.owner.lastName}
                    </span>
                  </div>
                )}

                <MilestoneStatusBadge status={ms.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <NewMilestoneModal
        open={showNew}
        onClose={() => setShowNew(false)}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}

// ─── Risks Tab ─────────────────────────────────────────────────

function RisksTab({
  projectId,
  users,
}: {
  projectId: string;
  users: UserType[];
}) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: Risk[] }>({
    queryKey: ['risks', projectId],
    queryFn: () => risksApi.getByProject(projectId) as any,
  });

  const risks = data?.data ?? [];
  const openRisks = risks.filter((r) => r.status === 'OPEN' || r.status === 'ESCALATED').length;

  async function handleAiAnalysis() {
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await aiApi.analyzeRisks(projectId) as any;
      setAiResult(result?.data?.analysis ?? result?.data ?? 'Analysis complete.');
    } catch {
      setAiResult('Failed to complete AI risk analysis. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  const columns: Column<Risk>[] = [
    {
      key: 'title',
      label: 'Risk',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          {row.category && <p className="text-xs text-gray-400">{row.category}</p>}
        </div>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (row) => (
        <span className="text-xs text-gray-700 capitalize">
          {row.probability.replace('_', ' ').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'impact',
      label: 'Impact',
      render: (row) => (
        <span className="text-xs text-gray-700 capitalize">
          {row.impact.replace('_', ' ').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Score',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold',
            getRiskScoreColor(row.riskScore),
          )}
        >
          {row.riskScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <RiskStatusBadge status={row.status} />,
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (row) =>
        row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '—',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => formatDate(row.dueDate),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{risks.length}</span> risks &mdash;{' '}
          <span className="font-semibold text-red-600">{openRisks}</span> open
        </p>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary btn-sm flex items-center gap-1.5"
            onClick={handleAiAnalysis}
            disabled={aiLoading}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {aiLoading ? 'Analysing...' : 'AI Risk Analysis'}
          </button>
          <button
            className="btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setShowNew(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Risk
          </button>
        </div>
      </div>

      {/* AI result */}
      {aiResult && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-800">AI Risk Analysis</p>
          </div>
          <p className="text-sm text-amber-900 whitespace-pre-line">{String(aiResult)}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading risks...
        </div>
      ) : risks.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No risks identified"
          description="Add risks to your register to track and mitigate potential issues."
          action={
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowNew(true)}
            >
              <Plus className="w-4 h-4" />
              New Risk
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={risks}
          rowKey={(row) => row.id}
          emptyMessage="No risks found."
        />
      )}

      <NewRiskModal
        open={showNew}
        onClose={() => setShowNew(false)}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}

// ─── Financials Tab ────────────────────────────────────────────

function FinancialsTab({
  projectId,
  project,
}: {
  projectId: string;
  project: Project;
}) {
  const [showNew, setShowNew] = useState(false);

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery<{ data: Budget[] }>({
    queryKey: ['budgets', projectId],
    queryFn: () => financialsApi.getBudgets(projectId) as any,
  });

  const { data: evmData, isLoading: evmLoading } = useQuery<{ data: EVMMetrics }>({
    queryKey: ['evm', projectId],
    queryFn: () => projectsApi.getEVM(projectId) as any,
  });

  const budgets = budgetsData?.data ?? [];
  const evm = evmData?.data;

  const totalPlanned = budgets.reduce((s, b) => s + b.plannedAmount, 0);
  const totalActual = budgets.reduce((s, b) => s + b.actualAmount, 0);
  const totalForecast = budgets.reduce((s, b) => s + b.forecastAmount, 0);

  const budgetColumns: Column<Budget>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.category && <p className="text-xs text-gray-400">{row.category}</p>}
        </div>
      ),
    },
    {
      key: 'budgetType',
      label: 'Type',
      render: (row) => (
        <span
          className={cn(
            'badge',
            row.budgetType === 'CAPEX' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
          )}
        >
          {row.budgetType}
        </span>
      ),
    },
    {
      key: 'plannedAmount',
      label: 'Planned',
      sortable: true,
      render: (row) => formatCurrency(row.plannedAmount),
    },
    {
      key: 'actualAmount',
      label: 'Actual',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            row.actualAmount > row.plannedAmount ? 'text-red-600 font-medium' : 'text-gray-900',
          )}
        >
          {formatCurrency(row.actualAmount)}
        </span>
      ),
    },
    {
      key: 'forecastAmount',
      label: 'Forecast',
      render: (row) => formatCurrency(row.forecastAmount),
    },
    {
      key: 'variance',
      label: 'Variance',
      render: (row) => {
        const variance = row.plannedAmount - row.actualAmount;
        return (
          <span className={cn('text-sm font-medium', variance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {variance >= 0 ? '+' : ''}
            {formatCurrency(variance)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* EVM Summary */}
      {!evmLoading && evm && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Earned Value Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CPI</p>
              <p className={cn('text-2xl font-bold', getCPIColor(evm.cpi))}>
                {evm.cpi.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{evm.costPerformance.replace(/_/g, ' ')}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">SPI</p>
              <p className={cn('text-2xl font-bold', getSPIColor(evm.spi))}>
                {evm.spi.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{evm.schedulePerformance.replace(/_/g, ' ')}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">EAC</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(evm.eac)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Est. at completion</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ETC</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(evm.etc)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Est. to complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget lines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Budget Breakdown</h3>
          <button
            className="btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setShowNew(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Budget Line
          </button>
        </div>

        {budgetsLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading budget lines...
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No budget lines"
            description="Add budget lines to track planned, actual, and forecast costs."
            action={
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowNew(true)}
              >
                <Plus className="w-4 h-4" />
                New Budget Line
              </button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={budgetColumns}
              data={budgets}
              rowKey={(row) => row.id}
              emptyMessage="No budget lines found."
            />

            {/* Totals row */}
            <div className="mt-3 flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <span className="font-semibold text-gray-700 flex-1">Totals</span>
              <span className="w-28 text-right font-semibold text-gray-900">
                {formatCurrency(totalPlanned)}
              </span>
              <span
                className={cn(
                  'w-28 text-right font-semibold',
                  totalActual > totalPlanned ? 'text-red-600' : 'text-gray-900',
                )}
              >
                {formatCurrency(totalActual)}
              </span>
              <span className="w-28 text-right font-semibold text-gray-900">
                {formatCurrency(totalForecast)}
              </span>
              <span
                className={cn(
                  'w-28 text-right font-semibold',
                  totalPlanned - totalActual >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {totalPlanned - totalActual >= 0 ? '+' : ''}
                {formatCurrency(totalPlanned - totalActual)}
              </span>
            </div>
          </>
        )}
      </div>

      <NewBudgetModal
        open={showNew}
        onClose={() => setShowNew(false)}
        projectId={projectId}
      />
    </div>
  );
}

// ─── Change Requests Tab ───────────────────────────────────────

const CR_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IMPLEMENTED: 'bg-purple-100 text-purple-700',
};

function ChangeRequestsTab({
  projectId,
  users,
}: {
  projectId: string;
  users: UserType[];
}) {
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery<{ data: ChangeRequest[] }>({
    queryKey: ['change-requests', projectId],
    queryFn: async () => {
      const result = await fetch(`/api/v1/projects/${projectId}/change-requests`, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
        },
      });
      return result.json();
    },
  });

  const changeRequests = data?.data ?? [];

  const columns: Column<ChangeRequest>[] = [
    {
      key: 'crNumber',
      label: 'CR #',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500">{row.crNumber ?? '—'}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.title}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={cn('badge', CR_STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-600')}>
          {row.status.replace(/_/g, ' ').charAt(0) +
            row.status.replace(/_/g, ' ').slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'impactBudget',
      label: 'Budget Impact',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'text-sm font-medium',
            row.impactBudget > 0 ? 'text-red-600' : row.impactBudget < 0 ? 'text-green-600' : 'text-gray-600',
          )}
        >
          {row.impactBudget >= 0 ? '+' : ''}
          {formatCurrency(row.impactBudget)}
        </span>
      ),
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (row) =>
        row.requestedBy
          ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}`
          : '—',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{changeRequests.length}</span> change request
          {changeRequests.length !== 1 ? 's' : ''}
        </p>
        <button
          className="btn-primary btn-sm flex items-center gap-1.5"
          onClick={() => setShowNew(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          New CR
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading change requests...
        </div>
      ) : changeRequests.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="No change requests"
          description="Submit change requests to track scope, schedule, or budget changes."
          action={
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowNew(true)}
            >
              <Plus className="w-4 h-4" />
              New CR
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={changeRequests}
          rowKey={(row) => row.id}
          emptyMessage="No change requests found."
        />
      )}

      <NewCRModal
        open={showNew}
        onClose={() => setShowNew(false)}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────

function OverviewTab({ project }: { project: Project }) {
  const { data: evmData } = useQuery<{ data: EVMMetrics }>({
    queryKey: ['evm', project.id],
    queryFn: () => projectsApi.getEVM(project.id) as any,
  });

  const evm = evmData?.data;

  const managerName = project.projectManager
    ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
    : '—';

  const milestones = (project.milestones ?? []).sort(
    (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
  );

  const members = project.members ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-5">
        {/* Description */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Description</h3>
          {project.description ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No description provided.</p>
          )}
        </div>

        {/* Project Details */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Project Details</h3>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Project Manager
              </dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {managerName}
              </dd>
            </div>
            {project.program && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Program</dt>
                <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {project.program.name}
                </dd>
              </div>
            )}
            {project.projectType && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type</dt>
                <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  {project.projectType}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Planned Start
              </dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(project.plannedStartDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Planned End</dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(project.plannedEndDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                % Complete
              </dt>
              <dd className="text-sm font-semibold text-gray-900">
                {formatPercent(project.percentComplete)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Milestones timeline */}
        {milestones.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Milestones</h3>
            <div className="space-y-2">
              {milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full flex-shrink-0',
                      ms.status === 'COMPLETED' && 'bg-green-500',
                      ms.status === 'IN_PROGRESS' && 'bg-blue-500',
                      ms.status === 'AT_RISK' && 'bg-amber-500',
                      ms.status === 'DELAYED' && 'bg-red-500',
                      ms.status === 'NOT_STARTED' && 'bg-gray-300',
                    )}
                  />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{ms.name}</p>
                      {ms.isKeyMilestone && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(ms.plannedDate)}</span>
                      <MilestoneStatusBadge status={ms.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        {members.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Team Members</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wide py-2 font-medium">
                      Member
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wide py-2 font-medium">
                      Role
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wide py-2 font-medium">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {getInitials(m.user.firstName, m.user.lastName)}
                          </div>
                          <span className="text-sm text-gray-900">
                            {m.user.firstName} {m.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs text-gray-500 capitalize">
                          {m.role.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs text-gray-400">{formatDate(m.joinedAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right column: EVM metrics */}
      <div className="space-y-4">
        {evm && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-gray-800">EVM Metrics</h3>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">CPI</dt>
                <dd className={cn('text-sm font-bold', getCPIColor(evm.cpi))}>
                  {evm.cpi.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">SPI</dt>
                <dd className={cn('text-sm font-bold', getSPIColor(evm.spi))}>
                  {evm.spi.toFixed(2)}
                </dd>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Planned Value (PV)</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.plannedValue)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Earned Value (EV)</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.earnedValue)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Actual Cost (AC)</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.actualCost)}
                </dd>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">BAC</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.bac)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">EAC</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.eac)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">ETC</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatCurrency(evm.etc)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">VAC</dt>
                <dd
                  className={cn(
                    'text-sm font-medium',
                    evm.vac >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {evm.vac >= 0 ? '+' : ''}
                  {formatCurrency(evm.vac)}
                </dd>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Cost Variance (CV)</dt>
                <dd
                  className={cn(
                    'text-sm font-medium',
                    evm.cv >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {evm.cv >= 0 ? '+' : ''}
                  {formatCurrency(evm.cv)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Schedule Variance (SV)</dt>
                <dd
                  className={cn(
                    'text-sm font-medium',
                    evm.sv >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {evm.sv >= 0 ? '+' : ''}
                  {formatCurrency(evm.sv)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Budget card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Budget Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Budget</span>
              <span className="font-medium text-gray-900">{formatCurrency(project.totalBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Actual Cost</span>
              <span
                className={cn(
                  'font-medium',
                  project.actualCost > project.totalBudget ? 'text-red-600' : 'text-gray-900',
                )}
              >
                {formatCurrency(project.actualCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Forecast Cost</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(project.forecastCost)}
              </span>
            </div>
            {project.totalBudget > 0 && (
              <>
                <div className="h-px bg-gray-100" />
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Budget utilisation</span>
                    <span>
                      {Math.round((project.actualCost / project.totalBudget) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        project.actualCost / project.totalBudget >= 1
                          ? 'bg-red-500'
                          : project.actualCost / project.totalBudget >= 0.85
                          ? 'bg-amber-500'
                          : 'bg-green-500',
                      )}
                      style={{
                        width: `${Math.min(
                          Math.round((project.actualCost / project.totalBudget) * 100),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const { openCopilot } = useCopilotStore();

  // Project data
  const { data: projectData, isLoading, isError } = useQuery<{ data: Project }>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getOne(id) as any,
    enabled: !!id,
  });

  // Users for forms
  const { data: usersData } = useQuery<{ data: UserType[] }>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll() as any,
  });

  // Milestones for KPI
  const { data: milestonesData } = useQuery<{ data: MilestoneType[] }>({
    queryKey: ['milestones', id],
    queryFn: () => milestonesApi.getByProject(id) as any,
    enabled: !!id,
  });

  // EVM for KPI
  const { data: evmData } = useQuery<{ data: EVMMetrics }>({
    queryKey: ['evm', id],
    queryFn: () => projectsApi.getEVM(id) as any,
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  if (isError || !projectData?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">Project not found or failed to load.</p>
        <button className="btn-secondary" onClick={() => router.push('/projects')}>
          Back to Projects
        </button>
      </div>
    );
  }

  const project = projectData.data;
  const users = usersData?.data ?? [];
  const evm = evmData?.data;

  const allMilestones = milestonesData?.data ?? project.milestones ?? [];
  const nextMilestone = allMilestones
    .filter((m) => m.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())[0];

  const openRisksCount = 0; // Will be loaded in the Risks tab
  const taskCount = project._count?.tasks ?? 0;

  const budgetUtilPct =
    project.totalBudget > 0
      ? Math.round((project.actualCost / project.totalBudget) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/projects')}
            className="btn-ghost btn-sm mt-0.5 flex items-center gap-1.5 text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Projects
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <RAGBadge status={project.ragStatus} />
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.projectType && (
              <p className="text-sm text-gray-500 mt-0.5">
                Type:{' '}
                <span className="font-medium text-gray-700">{project.projectType}</span>
              </p>
            )}
            {project.program && (
              <p className="text-sm text-gray-500 mt-0.5">
                Program:{' '}
                <span className="font-medium text-gray-700">{project.program.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowEdit(true)}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => openCopilot({ projectId: id })}
          >
            <Bot className="w-4 h-4" />
            AI Copilot
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="% Complete"
          value={formatPercent(project.percentComplete)}
          sub={`${project.sitesCompleted}/${project.siteCount} sites`}
          icon={Activity}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Budget"
          value={formatCurrency(project.actualCost)}
          sub={`of ${formatCurrency(project.totalBudget)} — ${budgetUtilPct}%`}
          icon={DollarSign}
          iconColor={
            evm
              ? getCPIColor(evm.cpi)
              : budgetUtilPct >= 100
              ? 'text-red-600'
              : budgetUtilPct >= 85
              ? 'text-amber-600'
              : 'text-green-600'
          }
        />
        <KPICard
          label="Tasks"
          value={taskCount}
          sub={`${project._count?.issues ?? 0} issues`}
          icon={CheckSquare}
          iconColor="text-indigo-600"
        />
        <KPICard
          label="Open Risks"
          value={project._count?.risks ?? 0}
          sub="in risk register"
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <KPICard
          label="Next Milestone"
          value={nextMilestone ? formatDate(nextMilestone.plannedDate) : '—'}
          sub={nextMilestone?.name ?? 'No upcoming milestones'}
          icon={Milestone}
          iconColor="text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'tasks' && taskCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                    {taskCount}
                  </span>
                )}
                {tab.id === 'risks' && (project._count?.risks ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                    {project._count?.risks}
                  </span>
                )}
                {tab.id === 'change-requests' && (project._count?.changeRequests ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                    {project._count?.changeRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab project={project} />}
          {activeTab === 'tasks' && <TasksTab projectId={id} users={users} />}
          {activeTab === 'milestones' && <MilestonesTab projectId={id} users={users} />}
          {activeTab === 'risks' && <RisksTab projectId={id} users={users} />}
          {activeTab === 'financials' && <FinancialsTab projectId={id} project={project} />}
          {activeTab === 'change-requests' && (
            <ChangeRequestsTab projectId={id} users={users} />
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditProjectModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          project={project}
        />
      )}
    </div>
  );
}
