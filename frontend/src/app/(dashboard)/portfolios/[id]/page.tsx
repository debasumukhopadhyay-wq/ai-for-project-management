'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Network,
  Activity,
  Target,
  User,
  Calendar,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Portfolio, Program } from '@/types';
import { portfoliosApi } from '@/lib/api';
import { formatCurrency, formatDate, formatPercent, cn } from '@/lib/utils';
import { KPICard } from '@/components/shared/Card';
import { RAGBadge, ProjectStatusBadge } from '@/components/shared/Badge';
import { DataTable, Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';

// ─── Programs Table ───────────────────────────────────────────

interface ProgramsTableProps {
  programs: Program[];
  onRowClick: (program: Program) => void;
}

function ProgramsTable({ programs, onRowClick }: ProgramsTableProps) {
  const columns: Column<Program>[] = [
    {
      key: 'name',
      label: 'Program Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Network className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
            {row.description && (
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{row.description}</p>
            )}
          </div>
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
        <span className="text-sm font-medium text-gray-700">
          {row._count?.projects ?? row.projects?.length ?? 0}
        </span>
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
            {formatCurrency(row.allocatedBudget)} allocated
          </p>
        </div>
      ),
    },
    {
      key: 'programManager',
      label: 'Program Manager',
      render: (row) =>
        row.programManager ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-sm text-gray-700 truncate">
              {row.programManager.firstName} {row.programManager.lastName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        ),
    },
    {
      key: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.endDate)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500" />
      ),
      className: 'w-10',
    },
  ];

  if (programs.length === 0) {
    return (
      <EmptyState
        title="No programs yet"
        description="This portfolio has no programs. Add programs to start tracking them here."
        icon={Network}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={programs}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
    />
  );
}

// ─── Strategic Objectives Section ────────────────────────────

function StrategicObjectivesSection({ objectives }: { objectives: string }) {
  const lines = objectives
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center">
          <Target className="w-4 h-4 text-brand-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Strategic Objectives</h2>
      </div>
      {lines.length > 0 ? (
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{objectives}</p>
      )}
    </div>
  );
}

// ─── RAG Summary strip ───────────────────────────────────────

function RAGSummaryStrip({ programs }: { programs: Program[] }) {
  const green = programs.filter((p) => p.ragStatus === 'GREEN').length;
  const amber = programs.filter((p) => p.ragStatus === 'AMBER').length;
  const red = programs.filter((p) => p.ragStatus === 'RED').length;
  const total = programs.length;

  if (total === 0) return null;

  const items = [
    { label: 'Green', value: green, color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Amber', value: amber, color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Red', value: red, color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
  ];

  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', item.bg, item.textColor)}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', item.color)} />
          {item.value} {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading } = useQuery<{ data: Portfolio }>({
    queryKey: ['portfolio', id],
    queryFn: () => portfoliosApi.getOne(id) as any,
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  const portfolio: Portfolio | undefined = data?.data;

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-base font-semibold text-gray-700">Portfolio not found</h2>
        <p className="text-sm text-gray-400 mt-1">
          The portfolio you are looking for does not exist or you may not have access.
        </p>
        <button onClick={() => router.push('/portfolios')} className="btn-secondary mt-6">
          Back to Portfolios
        </button>
      </div>
    );
  }

  const programs: Program[] = portfolio.programs ?? [];
  const programCount = portfolio._count?.programs ?? programs.length;
  const totalBudget = portfolio.totalBudget;
  const allocatedBudget = portfolio.allocatedBudget;
  const allocatedPercent = totalBudget > 0 ? (allocatedBudget / totalBudget) * 100 : 0;
  const ownerName = portfolio.owner
    ? `${portfolio.owner.firstName} ${portfolio.owner.lastName}`
    : 'Unassigned';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/portfolios')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolios
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-brand-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 truncate">{portfolio.name}</h1>
              <RAGBadge status={portfolio.ragStatus} />
            </div>
            {portfolio.description && (
              <p className="text-sm text-gray-500 mt-2 ml-12">{portfolio.description}</p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{ownerName}</span>
            </div>
            {portfolio.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {formatDate(portfolio.startDate)}
                  {portfolio.endDate && ` — ${formatDate(portfolio.endDate)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <KPICard
          label="Allocated Budget"
          value={formatCurrency(allocatedBudget)}
          sub={`${formatPercent(allocatedPercent)} of total`}
          icon={TrendingUp}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Programs"
          value={programCount}
          sub="active programs"
          icon={Network}
          iconColor="text-purple-600"
        />
        <KPICard
          label="Portfolio Health"
          value={portfolio.ragStatus}
          sub={
            portfolio.ragStatus === 'GREEN'
              ? 'On track'
              : portfolio.ragStatus === 'AMBER'
              ? 'Needs attention'
              : 'At risk'
          }
          icon={Activity}
          iconColor={
            portfolio.ragStatus === 'GREEN'
              ? 'text-green-600'
              : portfolio.ragStatus === 'AMBER'
              ? 'text-amber-500'
              : 'text-red-600'
          }
        />
      </div>

      {/* Budget utilization bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Budget Utilization</h2>
          <span className="text-xs text-gray-500">
            {formatCurrency(allocatedBudget)} of {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={cn(
              'h-2.5 rounded-full transition-all',
              allocatedPercent > 90
                ? 'bg-red-500'
                : allocatedPercent > 70
                ? 'bg-amber-400'
                : 'bg-green-500',
            )}
            style={{ width: `${Math.min(100, allocatedPercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span className="font-medium text-gray-700">{formatPercent(allocatedPercent)} allocated</span>
          <span>100%</span>
        </div>
      </div>

      {/* Programs section */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Programs</h2>
            <p className="text-xs text-gray-400 mt-0.5">{programCount} program{programCount !== 1 ? 's' : ''} in this portfolio</p>
          </div>
          <RAGSummaryStrip programs={programs} />
        </div>

        <div className={cn(programs.length > 0 ? 'p-0' : 'p-5')}>
          <ProgramsTable
            programs={programs}
            onRowClick={(program) => router.push(`/programs/${program.id}`)}
          />
        </div>
      </div>

      {/* Strategic Objectives */}
      {portfolio.strategicObjectives && (
        <StrategicObjectivesSection objectives={portfolio.strategicObjectives} />
      )}

      {/* Additional details footer */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</dt>
            <dd className="mt-1 text-sm text-gray-900">{ownerName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(portfolio.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(portfolio.endDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Health Status</dt>
            <dd className="mt-1">
              <RAGBadge status={portfolio.ragStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Budget</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(totalBudget)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Allocated Budget</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatCurrency(allocatedBudget)}{' '}
              <span className="text-xs text-gray-400">({formatPercent(allocatedPercent)})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(portfolio.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(portfolio.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
