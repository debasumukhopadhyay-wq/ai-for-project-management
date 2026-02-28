'use client';

import { useState, useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { projectsApi, risksApi } from '@/lib/api';
import { Project, Risk, RiskStatus, RiskProbability, RiskImpact } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RiskStatusBadge, Badge } from '@/components/shared/Badge';
import { DataTable, Column } from '@/components/shared/DataTable';
import {
  cn,
  formatDate,
  getRiskScoreColor,
  getRiskScoreLabel,
  truncate,
} from '@/lib/utils';
import {
  AlertTriangle,
  ShieldAlert,
  CalendarClock,
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { isAfter, addDays, parseISO } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────

const RISK_STATUSES: RiskStatus[] = ['OPEN', 'MITIGATED', 'ACCEPTED', 'CLOSED', 'ESCALATED'];

const PROB_LEVELS: RiskProbability[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
const IMPACT_LEVELS: RiskImpact[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const PROB_LABELS: Record<RiskProbability, string> = {
  VERY_LOW: 'Very Low',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High',
};

const IMPACT_LABELS: Record<RiskImpact, string> = {
  VERY_LOW: 'Very Low',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PROB_VARIANTS: Record<RiskProbability, string> = {
  VERY_LOW: 'bg-green-100 text-green-700',
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  VERY_HIGH: 'bg-red-100 text-red-700',
};

const IMPACT_VARIANTS: Record<RiskImpact, string> = {
  VERY_LOW: 'bg-green-100 text-green-700',
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

// Heatmap axes
const HEATMAP_PROB: RiskProbability[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
const HEATMAP_IMPACT: RiskImpact[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ─── Risk Heatmap ─────────────────────────────────────────────

function RiskHeatmap({ risks }: { risks: Risk[] }) {
  // Count open risks per probability × impact cell
  const grid: Record<RiskProbability, Record<RiskImpact, number>> = {} as any;
  HEATMAP_PROB.forEach((p) => {
    grid[p] = {} as any;
    HEATMAP_IMPACT.forEach((i) => {
      grid[p][i] = 0;
    });
  });

  risks.forEach((r) => {
    if (r.status === 'CLOSED' || r.status === 'MITIGATED') return;
    const p = r.probability;
    const i = r.impact;
    if (grid[p] && grid[p][i] !== undefined) {
      grid[p][i]++;
    }
  });

  function cellStyle(count: number): string {
    if (count >= 4) return 'bg-red-500 text-white font-bold';
    if (count >= 2) return 'bg-amber-400 text-gray-900 font-semibold';
    if (count >= 1) return 'bg-yellow-300 text-gray-800';
    return 'bg-gray-50 text-gray-200';
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
          Probability vs Impact Matrix (open risks only)
        </p>
        {/* Column headers */}
        <div className="flex items-center gap-1 mb-1 pl-[90px]">
          {HEATMAP_IMPACT.map((imp) => (
            <div key={imp} className="flex-1 text-center text-xs text-gray-500 font-medium truncate px-0.5">
              {IMPACT_LABELS[imp]}
            </div>
          ))}
        </div>
        {/* Rows */}
        {[...HEATMAP_PROB].reverse().map((prob) => (
          <div key={prob} className="flex items-center gap-1 mb-1">
            <div className="w-[90px] text-xs text-gray-500 font-medium text-right pr-2 flex-shrink-0">
              {PROB_LABELS[prob]}
            </div>
            {HEATMAP_IMPACT.map((imp) => {
              const count = grid[prob][imp];
              return (
                <div
                  key={imp}
                  className={cn(
                    'flex-1 h-10 rounded flex items-center justify-center text-sm transition-colors cursor-default',
                    cellStyle(count),
                  )}
                  title={`P: ${PROB_LABELS[prob]} | I: ${IMPACT_LABELS[imp]} | ${count} open risk(s)`}
                >
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        ))}
        {/* X-axis label */}
        <div className="pl-[90px] mt-1">
          <p className="text-xs text-gray-400 text-center">Impact →</p>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3">
          {[
            { label: '≥4 risks', cls: 'bg-red-500' },
            { label: '≥2 risks', cls: 'bg-amber-400' },
            { label: '1 risk', cls: 'bg-yellow-300' },
            { label: '0 risks', cls: 'bg-gray-100 border border-gray-200' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded', l.cls)} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Risk table columns ────────────────────────────────────────

interface FlatRisk extends Risk {
  projectName?: string;
}

function buildColumns(projects: Project[]): Column<FlatRisk>[] {
  return [
    {
      key: 'projectName',
      label: 'Project',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-gray-500 font-medium">{r.projectName ?? '—'}</span>
      ),
    },
    {
      key: 'title',
      label: 'Risk Title',
      sortable: true,
      render: (r) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-medium text-gray-900 truncate" title={r.title}>
            {r.title}
          </p>
          {r.category && <p className="text-xs text-gray-400">{r.category}</p>}
        </div>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (r) => (
        <span className={cn('badge', PROB_VARIANTS[r.probability])}>
          {PROB_LABELS[r.probability]}
        </span>
      ),
    },
    {
      key: 'impact',
      label: 'Impact',
      render: (r) => (
        <span className={cn('badge', IMPACT_VARIANTS[r.impact])}>
          {IMPACT_LABELS[r.impact]}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Score',
      sortable: true,
      render: (r) => (
        <span
          className={cn(
            'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold',
            getRiskScoreColor(r.riskScore),
          )}
          title={getRiskScoreLabel(r.riskScore)}
        >
          {r.riskScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <RiskStatusBadge status={r.status} />,
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (r) =>
        r.owner ? (
          <span className="text-xs text-gray-600">
            {r.owner.firstName} {r.owner.lastName}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">Unassigned</span>
        ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (r) => {
        if (!r.dueDate) return <span className="text-gray-300 text-xs">—</span>;
        const isOverdue = isAfter(new Date(), parseISO(r.dueDate));
        const isDueSoon =
          !isOverdue && isAfter(addDays(new Date(), 7), parseISO(r.dueDate));
        return (
          <span
            className={cn(
              'text-xs',
              isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-amber-600' : 'text-gray-600',
            )}
          >
            {formatDate(r.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'mitigationPlan',
      label: 'Mitigation',
      render: (r) => (
        <span className="text-xs text-gray-500" title={r.mitigationPlan}>
          {r.mitigationPlan ? truncate(r.mitigationPlan, 60) : '—'}
        </span>
      ),
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────

const MAX_PROJECTS_TO_FETCH = 5;

export default function RisksPage() {
  // ── Filters ────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RiskStatus | ''>('');
  const [probabilityFilter, setProbabilityFilter] = useState<RiskProbability | ''>('');
  const [impactFilter, setImpactFilter] = useState<RiskImpact | ''>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // ── Fetch projects ─────────────────────────────────────────
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsApi.getAll() as any,
  });

  const projects = projectsData?.data ?? [];

  // ── Fetch risks for top projects in parallel ───────────────
  // Use top 5 projects (or all if <= 5), then show combined view
  const topProjects = useMemo(
    () => projects.slice(0, MAX_PROJECTS_TO_FETCH),
    [projects],
  );

  const riskQueries = useQueries({
    queries: topProjects.map((p) => ({
      queryKey: ['risks', p.id],
      queryFn: () => risksApi.getByProject(p.id) as any,
      enabled: topProjects.length > 0,
    })),
  });

  const risksLoading = riskQueries.some((q) => q.isLoading);

  // ── Flatten all risks with project name ─────────────────────
  const allRisks: FlatRisk[] = useMemo(() => {
    const flat: FlatRisk[] = [];
    riskQueries.forEach((q, i) => {
      const project = topProjects[i];
      const data: any = q.data;
      const risks: Risk[] = data?.data ?? [];
      risks.forEach((r) => {
        flat.push({ ...r, projectName: project?.name });
      });
    });
    return flat;
  }, [riskQueries, topProjects]);

  // ── KPI calculations ───────────────────────────────────────
  const kpis = useMemo(() => {
    const open = allRisks.filter((r) => r.status === 'OPEN' || r.status === 'ESCALATED');
    const critical = open.filter((r) => r.riskScore >= 20);
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const dueSoon = open.filter(
      (r) => r.dueDate && !isAfter(parseISO(r.dueDate), nextWeek),
    );
    const mitigated = allRisks.filter((r) => r.status === 'MITIGATED');
    return {
      totalOpen: open.length,
      critical: critical.length,
      dueSoon: dueSoon.length,
      mitigated: mitigated.length,
    };
  }, [allRisks]);

  // ── Filtered risks ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return allRisks.filter((r) => {
      const matchSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.projectName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchProb = !probabilityFilter || r.probability === probabilityFilter;
      const matchImpact = !impactFilter || r.impact === impactFilter;
      const matchProject = !projectFilter || r.projectId === projectFilter;
      return matchSearch && matchStatus && matchProb && matchImpact && matchProject;
    });
  }, [allRisks, search, statusFilter, probabilityFilter, impactFilter, projectFilter]);

  const columns = useMemo(() => buildColumns(projects), [projects]);

  if (projectsLoading || risksLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Risk & Issue Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cross-project risk register and heatmap — showing risks from{' '}
            {topProjects.length} project(s)
            {projects.length > MAX_PROJECTS_TO_FETCH && (
              <span className="text-amber-600">
                {' '}
                (top {MAX_PROJECTS_TO_FETCH} of {projects.length})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Open Risks"
          value={kpis.totalOpen}
          sub="Open + Escalated"
          icon={AlertTriangle}
          iconColor="text-amber-600"
        />
        <KPICard
          label="Critical Risks"
          value={kpis.critical}
          sub="Risk score ≥ 20"
          icon={ShieldAlert}
          iconColor="text-red-600"
        />
        <KPICard
          label="Due This Week"
          value={kpis.dueSoon}
          sub="Need immediate attention"
          icon={CalendarClock}
          iconColor={kpis.dueSoon > 0 ? 'text-orange-600' : 'text-gray-400'}
        />
        <KPICard
          label="Mitigated"
          value={kpis.mitigated}
          sub="Successfully resolved"
          icon={ShieldCheck}
          iconColor="text-green-600"
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search risks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RiskStatus | '')}
            className="input w-36"
          >
            <option value="">All Statuses</option>
            {RISK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Probability */}
          <select
            value={probabilityFilter}
            onChange={(e) => setProbabilityFilter(e.target.value as RiskProbability | '')}
            className="input w-36"
          >
            <option value="">All Probabilities</option>
            {PROB_LEVELS.map((p) => (
              <option key={p} value={p}>
                {PROB_LABELS[p]}
              </option>
            ))}
          </select>

          {/* Impact */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value as RiskImpact | '')}
            className="input w-36"
          >
            <option value="">All Impacts</option>
            {IMPACT_LEVELS.map((i) => (
              <option key={i} value={i}>
                {IMPACT_LABELS[i]}
              </option>
            ))}
          </select>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input w-44"
          >
            <option value="">All Projects</option>
            {topProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} of {allRisks.length} risks
        </span>
      </div>

      {/* ── Risk Heatmap toggle ── */}
      <div className="card p-0 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          onClick={() => setShowHeatmap((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Risk Heatmap</p>
              <p className="text-xs text-gray-500">
                5×5 probability-impact matrix for open risks
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              showHeatmap && 'rotate-180',
            )}
          />
        </button>
        {showHeatmap && (
          <div className="border-t border-gray-100 px-6 py-5">
            <RiskHeatmap risks={filtered} />
          </div>
        )}
      </div>

      {/* ── Risk Register Table ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No risks found"
          description={
            allRisks.length === 0
              ? 'No risks have been logged for the loaded projects yet.'
              : 'No risks match the current filters. Try adjusting your search.'
          }
          icon={ShieldCheck}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Risk Register</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
                Critical (≥20)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-orange-400 inline-block" />
                High (≥12)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-yellow-300 inline-block" />
                Medium (≥6)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-green-200 inline-block" />
                Low (&lt;6)
              </span>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
          />
        </div>
      )}
    </div>
  );
}
