'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Network,
  Search,
  Filter,
  DollarSign,
  FolderOpen,
  Calendar,
  User,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';

import { programsApi, portfoliosApi } from '@/lib/api';
import { Program, Portfolio, ProjectStatus, RagStatus } from '@/types';
import { formatCurrency, formatDate, formatPercent, PROJECT_STATUS_LABELS, cn } from '@/lib/utils';
import { RAGBadge, ProjectStatusBadge } from '@/components/shared/Badge';
import { Modal } from '@/components/shared/Modal';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, Column } from '@/components/shared/DataTable';

// ─── New Program Form ──────────────────────────────────────────

interface NewProgramFormData {
  name: string;
  description: string;
  portfolioId: string;
  totalBudget: string;
  startDate: string;
  endDate: string;
  objectives: string;
  benefits: string;
}

const EMPTY_FORM: NewProgramFormData = {
  name: '',
  description: '',
  portfolioId: '',
  totalBudget: '',
  startDate: '',
  endDate: '',
  objectives: '',
  benefits: '',
};

interface NewProgramModalProps {
  open: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  onSuccess: () => void;
}

function NewProgramModal({ open, onClose, portfolios, onSuccess }: NewProgramModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewProgramFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<NewProgramFormData>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => programsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setForm(EMPTY_FORM);
      setErrors({});
      onSuccess();
      onClose();
    },
  });

  function validate(): boolean {
    const newErrors: Partial<NewProgramFormData> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.totalBudget || isNaN(Number(form.totalBudget))) {
      newErrors.totalBudget = 'Valid budget is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      portfolioId: form.portfolioId || undefined,
      totalBudget: Number(form.totalBudget),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      objectives: form.objectives.trim() || undefined,
      benefits: form.benefits.trim() || undefined,
    });
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  const field = (key: keyof NewProgramFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Program"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-program-form"
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Program'}
          </button>
        </>
      }
    >
      <form id="new-program-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="label" htmlFor="prog-name">
            Program Name <span className="text-red-500">*</span>
          </label>
          <input
            id="prog-name"
            className={cn('input', errors.name && 'border-red-400 focus:ring-red-300')}
            placeholder="e.g. Digital Transformation Initiative"
            value={form.name}
            onChange={(e) => field('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="prog-desc">
            Description
          </label>
          <textarea
            id="prog-desc"
            className="input min-h-[72px] resize-none"
            placeholder="Brief description of this program..."
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
          />
        </div>

        {/* Portfolio + Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="prog-portfolio">
              Portfolio
            </label>
            <select
              id="prog-portfolio"
              className="input"
              value={form.portfolioId}
              onChange={(e) => field('portfolioId', e.target.value)}
            >
              <option value="">— None —</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="prog-budget">
              Total Budget (USD) <span className="text-red-500">*</span>
            </label>
            <input
              id="prog-budget"
              type="number"
              min="0"
              step="1000"
              className={cn('input', errors.totalBudget && 'border-red-400 focus:ring-red-300')}
              placeholder="e.g. 5000000"
              value={form.totalBudget}
              onChange={(e) => field('totalBudget', e.target.value)}
            />
            {errors.totalBudget && (
              <p className="text-xs text-red-500 mt-1">{errors.totalBudget}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="prog-start">
              Start Date
            </label>
            <input
              id="prog-start"
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => field('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="prog-end">
              End Date
            </label>
            <input
              id="prog-end"
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => field('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Objectives */}
        <div>
          <label className="label" htmlFor="prog-objectives">
            Strategic Objectives
          </label>
          <textarea
            id="prog-objectives"
            className="input min-h-[72px] resize-none"
            placeholder="What strategic goals does this program support?"
            value={form.objectives}
            onChange={(e) => field('objectives', e.target.value)}
          />
        </div>

        {/* Benefits */}
        <div>
          <label className="label" htmlFor="prog-benefits">
            Expected Benefits
          </label>
          <textarea
            id="prog-benefits"
            className="input min-h-[72px] resize-none"
            placeholder="What measurable benefits are expected?"
            value={form.benefits}
            onChange={(e) => field('benefits', e.target.value)}
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            Failed to create program. Please try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Program Card ─────────────────────────────────────────────

function ProgramCard({ program, onClick }: { program: Program; onClick: () => void }) {
  const projectCount = program._count?.projects ?? program.projects?.length ?? 0;
  const managerName = program.programManager
    ? `${program.programManager.firstName} ${program.programManager.lastName}`
    : '—';

  const budgetUsed =
    program.totalBudget > 0
      ? Math.round((program.allocatedBudget / program.totalBudget) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="card p-0 overflow-hidden cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
    >
      {/* Card top accent strip */}
      <div
        className={cn(
          'h-1 w-full',
          program.ragStatus === 'GREEN' && 'bg-green-500',
          program.ragStatus === 'AMBER' && 'bg-amber-500',
          program.ragStatus === 'RED' && 'bg-red-500',
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
              {program.name}
            </h3>
            {program.portfolio && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{program.portfolio.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <RAGBadge status={program.ragStatus} />
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <ProjectStatusBadge status={program.status} />
        </div>

        {/* Budget bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Budget allocated</span>
            <span className="font-medium text-gray-700">{budgetUsed}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetUsed >= 90 ? 'bg-red-500' : budgetUsed >= 75 ? 'bg-amber-500' : 'bg-green-500',
              )}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>
              <span className="font-semibold text-gray-800">{projectCount}</span> projects
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{formatCurrency(program.totalBudget)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{managerName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {program.endDate ? formatDate(program.endDate) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Programs List Table View ─────────────────────────────────

function ProgramsTable({
  programs,
  onRowClick,
}: {
  programs: Program[];
  onRowClick: (p: Program) => void;
}) {
  const columns: Column<Program>[] = [
    {
      key: 'name',
      label: 'Program',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.portfolio && (
            <p className="text-xs text-gray-500">{row.portfolio.name}</p>
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
      key: 'projects',
      label: 'Projects',
      render: (row) => (
        <span className="font-medium">{row._count?.projects ?? row.projects?.length ?? 0}</span>
      ),
    },
    {
      key: 'totalBudget',
      label: 'Total Budget',
      sortable: true,
      render: (row) => formatCurrency(row.totalBudget),
    },
    {
      key: 'allocatedBudget',
      label: 'Allocated',
      render: (row) => (
        <span className={cn(
          row.allocatedBudget > row.totalBudget ? 'text-red-600 font-medium' : ''
        )}>
          {formatCurrency(row.allocatedBudget)}
        </span>
      ),
    },
    {
      key: 'programManager',
      label: 'Program Manager',
      render: (row) =>
        row.programManager
          ? `${row.programManager.firstName} ${row.programManager.lastName}`
          : '—',
    },
    {
      key: 'startDate',
      label: 'Start',
      render: (row) => formatDate(row.startDate),
    },
    {
      key: 'endDate',
      label: 'End',
      render: (row) => formatDate(row.endDate),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={programs}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
      emptyMessage="No programs match your filters."
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────

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

export default function ProgramsPage() {
  const router = useRouter();
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [ragFilter, setRagFilter] = useState<RagStatus | ''>('');
  const [portfolioFilter, setPortfolioFilter] = useState('');

  // Fetch programs
  const { data: programsData, isLoading: programsLoading } = useQuery<{ data: Program[] }>({
    queryKey: ['programs'],
    queryFn: () => programsApi.getAll() as any,
  });

  // Fetch portfolios for filter + create form
  const { data: portfoliosData } = useQuery<{ data: Portfolio[] }>({
    queryKey: ['portfolios'],
    queryFn: () => portfoliosApi.getAll() as any,
  });

  const programs = programsData?.data ?? [];
  const portfolios = portfoliosData?.data ?? [];

  // Filtered programs
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchPortfolio = p.portfolio?.name.toLowerCase().includes(q);
        const matchManager =
          p.programManager &&
          `${p.programManager.firstName} ${p.programManager.lastName}`
            .toLowerCase()
            .includes(q);
        if (!matchName && !matchPortfolio && !matchManager) return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (ragFilter && p.ragStatus !== ragFilter) return false;
      if (portfolioFilter && p.portfolioId !== portfolioFilter) return false;
      return true;
    });
  }, [programs, search, statusFilter, ragFilter, portfolioFilter]);

  const hasFilters = search || statusFilter || ragFilter || portfolioFilter;

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setRagFilter('');
    setPortfolioFilter('');
  }

  if (programsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {programs.length} program{programs.length !== 1 ? 's' : ''} across{' '}
            {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowNewModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Program
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
              placeholder="Search programs..."
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

          {/* Portfolio filter */}
          <select
            className="input py-1.5 text-sm w-auto min-w-[160px]"
            value={portfolioFilter}
            onChange={(e) => setPortfolioFilter(e.target.value)}
          >
            <option value="">All Portfolios</option>
            {portfolios.map((pf) => (
              <option key={pf.id} value={pf.id}>
                {pf.name}
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
              <span className="badge bg-brand-50 text-brand-700">
                Health: {ragFilter}
              </span>
            )}
            {portfolioFilter && (
              <span className="badge bg-brand-50 text-brand-700">
                Portfolio: {portfolios.find((p) => p.id === portfolioFilter)?.name}
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

      {/* Programs content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Network}
          title={hasFilters ? 'No programs match your filters' : 'No programs yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first program to start organizing projects under strategic goals.'
          }
          action={
            !hasFilters ? (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowNewModal(true)}
              >
                <Plus className="w-4 h-4" />
                New Program
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
          {filtered.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => router.push(`/programs/${program.id}`)}
            />
          ))}
        </div>
      ) : (
        <ProgramsTable
          programs={filtered}
          onRowClick={(p) => router.push(`/programs/${p.id}`)}
        />
      )}

      {/* New Program Modal */}
      <NewProgramModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        portfolios={portfolios}
        onSuccess={() => {}}
      />
    </div>
  );
}
