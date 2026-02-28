'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  FolderOpen,
  TrendingUp,
  Activity,
  Bot,
  Calendar,
  User,
  Target,
  Sparkles,
  ChevronRight,
  FileText,
  ShieldAlert,
  BarChart3,
  Users,
  Layers,
} from 'lucide-react';

import { programsApi } from '@/lib/api';
import { Program, Project } from '@/types';
import { formatCurrency, formatDate, formatPercent, cn } from '@/lib/utils';
import { RAGBadge, ProjectStatusBadge } from '@/components/shared/Badge';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, Column } from '@/components/shared/DataTable';
import { useCopilotStore } from '@/store/copilot.store';

// ─── Tab definition ───────────────────────────────────────────

type Tab = 'overview' | 'projects' | 'raid' | 'documents';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'raid', label: 'RAID', icon: ShieldAlert },
  { id: 'documents', label: 'Documents', icon: FileText },
];

// ─── Overview Tab ─────────────────────────────────────────────

function OverviewTab({ program }: { program: Program }) {
  const managerName = program.programManager
    ? `${program.programManager.firstName} ${program.programManager.lastName}`
    : '—';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: objectives + benefits */}
      <div className="lg:col-span-2 space-y-4">
        {/* Strategic Objectives */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Strategic Objectives</h3>
          </div>
          {program.objectives ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {program.objectives}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No strategic objectives defined.</p>
          )}
        </div>

        {/* Expected Benefits */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">Expected Benefits</h3>
          </div>
          {program.benefits ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {program.benefits}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No benefits defined.</p>
          )}
        </div>

        {/* Description */}
        {program.description && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {program.description}
            </p>
          </div>
        )}
      </div>

      {/* Right column: metadata */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Program Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Program Manager
              </dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {managerName}
              </dd>
            </div>

            {program.portfolio && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                  Portfolio
                </dt>
                <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {program.portfolio.name}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Start Date
              </dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(program.startDate)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                End Date
              </dt>
              <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(program.endDate)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Health Status
              </dt>
              <dd className="mt-1">
                <RAGBadge status={program.ragStatus} />
              </dd>
            </div>

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Program Status
              </dt>
              <dd className="mt-1">
                <ProjectStatusBadge status={program.status} />
              </dd>
            </div>

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Created
              </dt>
              <dd className="text-sm text-gray-700">{formatDate(program.createdAt)}</dd>
            </div>

            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                Last Updated
              </dt>
              <dd className="text-sm text-gray-700">{formatDate(program.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Budget breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Budget Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Budget</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(program.totalBudget)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Allocated</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(program.allocatedBudget)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Remaining</span>
              <span
                className={cn(
                  'font-medium',
                  program.totalBudget - program.allocatedBudget < 0
                    ? 'text-red-600'
                    : 'text-green-600',
                )}
              >
                {formatCurrency(program.totalBudget - program.allocatedBudget)}
              </span>
            </div>

            {/* Progress bar */}
            {program.totalBudget > 0 && (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Utilization</span>
                    <span>
                      {Math.round((program.allocatedBudget / program.totalBudget) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        program.allocatedBudget / program.totalBudget >= 1
                          ? 'bg-red-500'
                          : program.allocatedBudget / program.totalBudget >= 0.85
                          ? 'bg-amber-500'
                          : 'bg-brand-500',
                      )}
                      style={{
                        width: `${Math.min(
                          Math.round((program.allocatedBudget / program.totalBudget) * 100),
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

// ─── Projects Tab ─────────────────────────────────────────────

function ProjectsTab({ projects, programId }: { projects: Project[]; programId: string }) {
  const router = useRouter();

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.description && (
            <p className="text-xs text-gray-400 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ProjectStatusBadge status={row.status} />,
    },
    {
      key: 'ragStatus',
      label: 'Health',
      render: (row) => <RAGBadge status={row.ragStatus} />,
    },
    {
      key: 'projectManager',
      label: 'PM',
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
      render: (row) => formatCurrency(row.totalBudget),
    },
    {
      key: 'plannedEndDate',
      label: 'Due Date',
      render: (row) => formatDate(row.plannedEndDate),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
      ),
    },
  ];

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No projects in this program"
        description="Projects assigned to this program will appear here."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={projects}
      rowKey={(row) => row.id}
      onRowClick={(row) => router.push(`/projects/${row.id}`)}
      emptyMessage="No projects found."
    />
  );
}

// ─── RAID Placeholder Tab ─────────────────────────────────────

function RAIDTab({ programId }: { programId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(['Risks', 'Assumptions', 'Issues', 'Dependencies'] as const).map((category) => (
        <div key={category} className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">{category}</h3>
          </div>
          <p className="text-sm text-gray-400 italic">
            Program-level {category.toLowerCase()} will appear here.
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Documents Placeholder Tab ────────────────────────────────

function DocumentsTab({ programId }: { programId: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents yet"
      description="Upload program documents such as charters, plans, and reports."
      action={
        <button className="btn-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Upload Document
        </button>
      }
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { openCopilot } = useCopilotStore();

  const { data, isLoading, isError } = useQuery<{ data: Program }>({
    queryKey: ['program', id],
    queryFn: () => programsApi.getOne(id) as any,
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">Program not found or failed to load.</p>
        <button className="btn-secondary" onClick={() => router.push('/programs')}>
          Back to Programs
        </button>
      </div>
    );
  }

  const program = data.data;
  const projects = program.projects ?? [];
  const projectCount = program._count?.projects ?? projects.length;

  const budgetUtilization =
    program.totalBudget > 0
      ? Math.round((program.allocatedBudget / program.totalBudget) * 100)
      : 0;

  // Compute avg completion from embedded projects if available
  const avgCompletion =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.percentComplete ?? 0), 0) / projects.length,
        )
      : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/programs')}
            className="btn-ghost btn-sm mt-0.5 flex items-center gap-1.5 text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Programs
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
              <RAGBadge status={program.ragStatus} />
              <ProjectStatusBadge status={program.status} />
            </div>
            {program.portfolio && (
              <p className="text-sm text-gray-500 mt-0.5">
                Portfolio:{' '}
                <span className="font-medium text-gray-700">{program.portfolio.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* AI Copilot button */}
        <button
          className="btn-primary flex items-center gap-2 flex-shrink-0"
          onClick={() => openCopilot({ programId: id })}
        >
          <Bot className="w-4 h-4" />
          AI Copilot
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Budget"
          value={formatCurrency(program.totalBudget)}
          sub={`${formatCurrency(program.allocatedBudget)} allocated`}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <KPICard
          label="Projects"
          value={projectCount}
          sub={projects.length > 0 ? `${projects.filter((p) => p.status === 'EXECUTION').length} in execution` : undefined}
          icon={FolderOpen}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Budget Utilized"
          value={`${budgetUtilization}%`}
          sub={formatCurrency(program.totalBudget - program.allocatedBudget) + ' remaining'}
          icon={TrendingUp}
          iconColor={
            budgetUtilization >= 90
              ? 'text-red-600'
              : budgetUtilization >= 75
              ? 'text-amber-600'
              : 'text-green-600'
          }
        />
        <KPICard
          label="Portfolio Health"
          value={program.ragStatus}
          sub={avgCompletion !== undefined ? `${avgCompletion}% avg completion` : undefined}
          icon={Activity}
          iconColor={
            program.ragStatus === 'GREEN'
              ? 'text-green-600'
              : program.ragStatus === 'AMBER'
              ? 'text-amber-600'
              : 'text-red-600'
          }
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
                {tab.id === 'projects' && projectCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                    {projectCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab program={program} />}
          {activeTab === 'projects' && (
            <ProjectsTab projects={projects} programId={id} />
          )}
          {activeTab === 'raid' && <RAIDTab programId={id} />}
          {activeTab === 'documents' && <DocumentsTab programId={id} />}
        </div>
      </div>
    </div>
  );
}
