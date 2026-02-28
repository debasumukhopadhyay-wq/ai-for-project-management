'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FolderOpen,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckSquare,
} from 'lucide-react';

import { projectsApi, programsApi, usersApi } from '@/lib/api';
import { Project, Program, User as UserType, ProjectStatus, RagStatus } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  PROJECT_STATUS_LABELS,
  cn,
} from '@/lib/utils';
import { RAGBadge, ProjectStatusBadge } from '@/components/shared/Badge';
import { Modal } from '@/components/shared/Modal';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, Column } from '@/components/shared/DataTable';

// ─── New Project Form ──────────────────────────────────────────

interface NewProjectFormData {
  name: string;
  description: string;
  programId: string;
  projectManagerId: string;
  status: ProjectStatus | '';
  projectType: string;
  totalBudget: string;
  plannedStartDate: string;
  plannedEndDate: string;
}

const EMPTY_FORM: NewProjectFormData = {
  name: '',
  description: '',
  programId: '',
  projectManagerId: '',
  status: '',
  projectType: '',
  totalBudget: '',
  plannedStartDate: '',
  plannedEndDate: '',
};

const ALL_STATUSES: ProjectStatus[] = [
  'DRAFT',
  'INITIATION',
  'PLANNING',
  'EXECUTION',
  'MONITORING',
  'CLOSURE',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED',
];

const ALL_RAG: RagStatus[] = ['GREEN', 'AMBER', 'RED'];

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  programs: Program[];
  users: UserType[];
  onSuccess: () => void;
}

function NewProjectModal({ open, onClose, programs, users, onSuccess }: NewProjectModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewProjectFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewProjectFormData, string>>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setForm(EMPTY_FORM);
      setErrors({});
      onSuccess();
      onClose();
    },
  });

  function validate(): boolean {
    const newErrors: Partial<Record<keyof NewProjectFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Project name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      programId: form.programId || undefined,
      projectManagerId: form.projectManagerId || undefined,
      status: form.status || 'DRAFT',
      projectType: form.projectType.trim() || undefined,
      totalBudget: form.totalBudget ? Number(form.totalBudget) : 0,
      plannedStartDate: form.plannedStartDate || undefined,
      plannedEndDate: form.plannedEndDate || undefined,
    });
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  const field = (key: keyof NewProjectFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Project"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-project-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </>
      }
    >
      <form id="new-project-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="label" htmlFor="proj-name">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            id="proj-name"
            className={cn('input', errors.name && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. ERP System Upgrade"
            value={form.name}
            onChange={(e) => field('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="proj-desc">
            Description
          </label>
          <textarea
            id="proj-desc"
            className="input min-h-[72px] resize-none"
            placeholder="Brief description of this project..."
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
          />
        </div>

        {/* Program + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="proj-program">
              Program
            </label>
            <select
              id="proj-program"
              className="input"
              value={form.programId}
              onChange={(e) => field('programId', e.target.value)}
            >
              <option value="">— None —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="proj-status">
              Status
            </label>
            <select
              id="proj-status"
              className="input"
              value={form.status}
              onChange={(e) => field('status', e.target.value as ProjectStatus | '')}
            >
              <option value="">— Select Status —</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Manager + Project Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="proj-pm">
              Project Manager
            </label>
            <select
              id="proj-pm"
              className="input"
              value={form.projectManagerId}
              onChange={(e) => field('projectManagerId', e.target.value)}
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
            <label className="label" htmlFor="proj-type">
              Project Type
            </label>
            <input
              id="proj-type"
              className="input"
              placeholder="e.g. Infrastructure, Software..."
              value={form.projectType}
              onChange={(e) => field('projectType', e.target.value)}
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="label" htmlFor="proj-budget">
            Total Budget (USD)
          </label>
          <input
            id="proj-budget"
            type="number"
            min="0"
            step="1000"
            className="input"
            placeholder="e.g. 1000000"
            value={form.totalBudget}
            onChange={(e) => field('totalBudget', e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="proj-start">
              Planned Start Date
            </label>
            <input
              id="proj-start"
              type="date"
              className="input"
              value={form.plannedStartDate}
              onChange={(e) => field('plannedStartDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="proj-end">
              Planned End Date
            </label>
            <input
              id="proj-end"
              type="date"
              className="input"
              value={form.plannedEndDate}
              onChange={(e) => field('plannedEndDate', e.target.value)}
            />
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create project. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Project Card ──────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const taskCount = project._count?.tasks ?? 0;
  const riskCount = project._count?.risks ?? 0;
  const managerName = project.projectManager
    ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
    : '—';

  const budgetUsed =
    project.totalBudget > 0
      ? Math.round((project.actualCost / project.totalBudget) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="card p-0 overflow-hidden cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
    >
      {/* RAG accent strip */}
      <div
        className={cn(
          'h-1 w-full',
          project.ragStatus === 'GREEN' && 'bg-green-500',
          project.ragStatus === 'AMBER' && 'bg-amber-500',
          project.ragStatus === 'RED' && 'bg-red-500',
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
              {project.name}
            </h3>
            {project.program && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{project.program.name}</p>
            )}
            {project.projectType && !project.program && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{project.projectType}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <RAGBadge status={project.ragStatus} />
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <ProjectStatusBadge status={project.status} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>% Complete</span>
            <span className="font-medium text-gray-700">
              {formatPercent(project.percentComplete)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                project.percentComplete >= 100
                  ? 'bg-green-500'
                  : project.percentComplete >= 50
                  ? 'bg-brand-500'
                  : 'bg-amber-400',
              )}
              style={{ width: `${Math.min(project.percentComplete, 100)}%` }}
            />
          </div>
        </div>

        {/* Budget utilization */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Budget</span>
            <span className="font-medium text-gray-700">
              {formatCurrency(project.actualCost)} / {formatCurrency(project.totalBudget)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetUsed >= 100
                  ? 'bg-red-500'
                  : budgetUsed >= 85
                  ? 'bg-amber-500'
                  : 'bg-green-500',
              )}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{managerName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {project.plannedEndDate ? formatDate(project.plannedEndDate) : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>
              <span className="font-semibold text-gray-800">{taskCount}</span> tasks
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>
              <span className="font-semibold text-gray-800">{riskCount}</span> risks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Projects Table View ───────────────────────────────────────

function ProjectsTable({
  projects,
  onRowClick,
}: {
  projects: Project[];
  onRowClick: (p: Project) => void;
}) {
  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.program && <p className="text-xs text-gray-400">{row.program.name}</p>}
          {row.projectType && !row.program && (
            <p className="text-xs text-gray-400">{row.projectType}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ragStatus',
      label: 'Health',
      render: (row) => <RAGBadge status={row.ragStatus} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ProjectStatusBadge status={row.status} />,
    },
    {
      key: 'projectManager',
      label: 'Project Manager',
      render: (row) =>
        row.projectManager
          ? `${row.projectManager.firstName} ${row.projectManager.lastName}`
          : '—',
    },
    {
      key: 'percentComplete',
      label: '% Complete',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[100px]">
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
          <span className="text-xs font-medium text-gray-700 w-9 text-right">
            {formatPercent(row.percentComplete)}
          </span>
        </div>
      ),
    },
    {
      key: 'totalBudget',
      label: 'Budget',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{formatCurrency(row.totalBudget)}</p>
          <p className="text-xs text-gray-400">
            {formatCurrency(row.actualCost)} actual
          </p>
        </div>
      ),
    },
    {
      key: 'plannedStartDate',
      label: 'Start',
      render: (row) => formatDate(row.plannedStartDate),
    },
    {
      key: 'plannedEndDate',
      label: 'End',
      render: (row) => formatDate(row.plannedEndDate),
    },
    {
      key: '_count',
      label: 'Tasks / Risks',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row._count?.tasks ?? 0} / {row._count?.risks ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: () => <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
      emptyMessage="No projects match your filters."
    />
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [ragFilter, setRagFilter] = useState<RagStatus | ''>('');
  const [programFilter, setProgramFilter] = useState('');

  // Fetch data
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll() as any,
  });

  const { data: programsData } = useQuery<{ data: Program[] }>({
    queryKey: ['programs'],
    queryFn: () => programsApi.getAll() as any,
  });

  const { data: usersData } = useQuery<{ data: UserType[] }>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll() as any,
  });

  const projects = projectsData?.data ?? [];
  const programs = programsData?.data ?? [];
  const users = usersData?.data ?? [];

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchProgram = p.program?.name.toLowerCase().includes(q);
        const matchManager =
          p.projectManager &&
          `${p.projectManager.firstName} ${p.projectManager.lastName}`
            .toLowerCase()
            .includes(q);
        if (!matchName && !matchProgram && !matchManager) return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (ragFilter && p.ragStatus !== ragFilter) return false;
      if (programFilter && p.programId !== programFilter) return false;
      return true;
    });
  }, [projects, search, statusFilter, ragFilter, programFilter]);

  const hasFilters = search || statusFilter || ragFilter || programFilter;

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setRagFilter('');
    setProgramFilter('');
  }

  if (projectsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Project Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} across{' '}
            {programs.length} program{programs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowNewModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 py-1.5 text-sm"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="input py-1.5 text-sm w-auto min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {/* RAG filter */}
          <select
            className="input py-1.5 text-sm w-auto min-w-[120px]"
            value={ragFilter}
            onChange={(e) => setRagFilter(e.target.value as RagStatus | '')}
          >
            <option value="">All Health</option>
            {ALL_RAG.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Program filter */}
          <select
            className="input py-1.5 text-sm w-auto min-w-[160px]"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="">All Programs</option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button
              className="btn-ghost btn-sm flex items-center gap-1.5 text-xs"
              onClick={clearFilters}
            >
              <Filter className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50',
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400">Filters:</span>
            {statusFilter && (
              <span className="badge bg-brand-50 text-brand-700">
                Status: {PROJECT_STATUS_LABELS[statusFilter]}
              </span>
            )}
            {ragFilter && (
              <span className="badge bg-brand-50 text-brand-700">Health: {ragFilter}</span>
            )}
            {programFilter && (
              <span className="badge bg-brand-50 text-brand-700">
                Program: {programs.find((p) => p.id === programFilter)?.name}
              </span>
            )}
            {search && (
              <span className="badge bg-brand-50 text-brand-700">Search: "{search}"</span>
            )}
            <span className="text-xs text-gray-500 ml-1">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Projects content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first project to start tracking work, milestones, and budgets.'
          }
          action={
            !hasFilters ? (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowNewModal(true)}
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            ) : (
              <button className="btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <ProjectsTable
          projects={filtered}
          onRowClick={(p) => router.push(`/projects/${p.id}`)}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        programs={programs}
        users={users}
        onSuccess={() => {}}
      />
    </div>
  );
}
