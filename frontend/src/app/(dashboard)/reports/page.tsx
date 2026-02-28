'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi, projectsApi, aiApi } from '@/lib/api';
import { ExecutiveDashboard, Project, Risk } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { RAGBadge, ProjectStatusBadge, RiskStatusBadge } from '@/components/shared/Badge';
import { formatCurrency, formatPercent, formatDate, getCPIColor, getSPIColor } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart2,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────

const RAG_COLORS_MAP: Record<string, string> = {
  GREEN: '#22c55e',
  AMBER: '#f59e0b',
  RED: '#ef4444',
};

const RISK_PROB_LEVELS = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;
const RISK_IMPACT_LEVELS = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const PROB_SCORE: Record<string, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
};
const IMPACT_SCORE: Record<string, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  CRITICAL: 5,
};

// ─── Helper components ────────────────────────────────────────

function SectionToggle({
  title,
  subtitle,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-0 overflow-hidden">
      <button
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="border-t border-gray-100 px-6 py-5">{children}</div>}
    </div>
  );
}

function CPISPIIcon({ value }: { value: number }) {
  if (value >= 1.0) return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
  if (value >= 0.9) return <Minus className="w-3.5 h-3.5 text-amber-500" />;
  return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
}

// ─── Risk Heatmap component ────────────────────────────────────

function RiskHeatmap({ risks }: { risks: Risk[] }) {
  // Build a 5x5 grid: rows = probability (very_low→very_high), cols = impact (very_low→critical)
  const grid: Record<string, Record<string, number>> = {};
  RISK_PROB_LEVELS.forEach((p) => {
    grid[p] = {};
    RISK_IMPACT_LEVELS.forEach((i) => {
      grid[p][i] = 0;
    });
  });

  risks.forEach((r) => {
    if (r.status === 'CLOSED' || r.status === 'MITIGATED') return;
    const pKey = r.probability;
    const iKey = r.impact === 'CRITICAL' ? 'CRITICAL' : r.impact;
    if (grid[pKey] && grid[pKey][iKey] !== undefined) {
      grid[pKey][iKey]++;
    }
  });

  function getCellColor(count: number): string {
    if (count >= 4) return 'bg-red-500 text-white';
    if (count >= 2) return 'bg-amber-400 text-white';
    if (count >= 1) return 'bg-yellow-300 text-gray-800';
    return 'bg-gray-100 text-gray-300';
  }

  const probLabels: Record<string, string> = {
    VERY_HIGH: 'Very High',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    VERY_LOW: 'Very Low',
  };
  const impLabels: Record<string, string> = {
    VERY_LOW: 'Very Low',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        {/* Column headers (impact) */}
        <div className="flex items-center gap-1 mb-1 pl-24">
          {RISK_IMPACT_LEVELS.map((impact) => (
            <div
              key={impact}
              className="flex-1 text-center text-xs font-medium text-gray-500 truncate"
            >
              {impLabels[impact]}
            </div>
          ))}
        </div>
        {/* Rows (probability — high to low visually) */}
        {[...RISK_PROB_LEVELS].reverse().map((prob) => (
          <div key={prob} className="flex items-center gap-1 mb-1">
            <div className="w-24 text-xs font-medium text-gray-500 text-right pr-2 flex-shrink-0">
              {probLabels[prob]}
            </div>
            {RISK_IMPACT_LEVELS.map((impact) => {
              const count = grid[prob][impact];
              return (
                <div
                  key={impact}
                  className={cn(
                    'flex-1 h-10 rounded-md flex items-center justify-center text-sm font-bold transition-colors',
                    getCellColor(count),
                  )}
                  title={`Probability: ${probLabels[prob]} | Impact: ${impLabels[impact]} | Risks: ${count}`}
                >
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        ))}
        {/* Axis label */}
        <div className="pl-24 mt-2">
          <p className="text-xs text-gray-400 text-center">Impact →</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pl-24">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-gray-500">≥4 risks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span className="text-xs text-gray-500">≥2 risks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-300" />
            <span className="text-xs text-gray-500">1 risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
            <span className="text-xs text-gray-500">0 risks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function ReportsPage() {
  const [openSection, setOpenSection] = useState<'executive' | 'status' | 'risk' | null>(
    'executive',
  );
  const [aiContext, setAiContext] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function toggle(section: 'executive' | 'status' | 'risk') {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  // ── Executive dashboard data ───────────────────────────────
  const { data: dashData, isLoading: dashLoading } = useQuery<{ data: ExecutiveDashboard }>({
    queryKey: ['executive-dashboard'],
    queryFn: () => reportsApi.getExecutiveDashboard() as any,
  });

  // ── Projects data ──────────────────────────────────────────
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsApi.getAll() as any,
  });

  const dash = dashData?.data;
  const projects = projectsData?.data ?? [];
  const allRisks = dash?.topRisks ?? [];

  // Chart data
  const ragPieData = dash
    ? [
        { name: 'Green', value: dash.ragDistribution.green, color: '#22c55e' },
        { name: 'Amber', value: dash.ragDistribution.amber, color: '#f59e0b' },
        { name: 'Red', value: dash.ragDistribution.red, color: '#ef4444' },
      ]
    : [];

  const budgetBarData = projects.slice(0, 8).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    Budget: p.totalBudget,
    Actual: p.actualCost,
  }));

  // Project status distribution for pie
  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  });
  const statusPieData = Object.entries(statusCounts).map(([status, count], i) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    color: [
      '#3b82f6',
      '#8b5cf6',
      '#22c55e',
      '#f59e0b',
      '#ef4444',
      '#06b6d4',
      '#64748b',
      '#f97316',
    ][i % 8],
  }));

  // EVM metrics from projects
  function calcCPI(p: Project) {
    return p.earnedValue && p.actualCost ? p.earnedValue / p.actualCost : null;
  }
  function calcSPI(p: Project) {
    return p.earnedValue && p.plannedValue ? p.earnedValue / p.plannedValue : null;
  }

  // ── AI report generation ───────────────────────────────────
  async function handleGenerateReport() {
    if (!aiContext.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);
    try {
      const prompt = `Generate a concise board-level executive summary report for project/program management.
Context provided: ${aiContext}

Include: overall status, key risks, budget health, schedule performance, and recommended actions.`;
      const res: any = await aiApi.query(prompt);
      const content = res?.data?.response ?? res?.response ?? JSON.stringify(res);
      setAiReport(content);
    } catch (err: any) {
      setAiError('Failed to generate AI report. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  if (dashLoading || projectsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Executive dashboards, project status overview, and risk analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileBarChart className="w-4 h-4" />
          {projects.length} projects · {allRisks.length} top risks
        </div>
      </div>

      {/* ── Section 1: Executive Dashboard ── */}
      <SectionToggle
        title="Executive Dashboard"
        subtitle="Portfolio-level budget utilization and project health summary"
        icon={BarChart2}
        open={openSection === 'executive'}
        onToggle={() => toggle('executive')}
      >
        {/* Summary KPIs */}
        {dash && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Total Budget"
              value={formatCurrency(dash.summary.totalBudget)}
              sub={`${formatPercent(dash.summary.budgetUtilization)} utilized`}
            />
            <KPICard
              label="Actual Cost"
              value={formatCurrency(dash.summary.totalActualCost)}
            />
            <KPICard label="Avg Completion" value={formatPercent(dash.summary.avgCompletion)} />
            <KPICard label="Active Projects" value={dash.summary.projects} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget utilisation bar chart */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Budget vs Actual by Project
            </h3>
            {budgetBarData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No project data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={budgetBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Budget" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Actual" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Project status pie */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Project Status Distribution
            </h3>
            {statusPieData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* RAG summary */}
            {dash && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  RAG Health
                </p>
                {ragPieData.map((r) => (
                  <div key={r.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.name}
                    </span>
                    <span className="font-semibold text-gray-700">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionToggle>

      {/* ── Section 2: Project Status Overview ── */}
      <SectionToggle
        title="Project Status Overview"
        subtitle="RAG status, completion %, and earned value metrics per project"
        icon={ClipboardList}
        open={openSection === 'status'}
        onToggle={() => toggle('status')}
      >
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No projects available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Project', 'Status', 'RAG', 'Complete', 'CPI', 'SPI', 'Budget', 'End Date'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((p) => {
                  const cpi = calcCPI(p);
                  const spi = calcSPI(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                        {p.program && (
                          <p className="text-xs text-gray-400 truncate">{p.program.name}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <RAGBadge status={p.ragStatus} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${Math.min(p.percentComplete, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {formatPercent(p.percentComplete)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {cpi !== null ? (
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs font-semibold',
                              getCPIColor(cpi),
                            )}
                          >
                            <CPISPIIcon value={cpi} />
                            {cpi.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {spi !== null ? (
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs font-semibold',
                              getSPIColor(spi),
                            )}
                          >
                            <CPISPIIcon value={spi} />
                            {spi.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600">
                        {formatCurrency(p.totalBudget)}
                      </td>
                      <td className="py-2.5 text-xs text-gray-500">
                        {formatDate(p.plannedEndDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionToggle>

      {/* ── Section 3: Risk Heatmap ── */}
      <SectionToggle
        title="Risk Heatmap"
        subtitle="5×5 probability-impact matrix from top risks across your portfolio"
        icon={AlertTriangle}
        open={openSection === 'risk'}
        onToggle={() => toggle('risk')}
      >
        {allRisks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No risk data available</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Displaying {allRisks.length} top risk(s) from the executive dashboard. Open and
              escalated risks are plotted; mitigated/closed risks are excluded.
            </p>
            <RiskHeatmap risks={allRisks} />
          </div>
        )}
      </SectionToggle>

      {/* ── AI Report Generator ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Generate AI Board Report</h3>
            <p className="text-xs text-gray-500">
              Provide context and let AI generate a concise executive-level report
            </p>
          </div>
        </div>

        <div>
          <label className="label">Context / Instructions</label>
          <textarea
            className="input w-full resize-none"
            rows={4}
            placeholder="e.g. Q1 2026 portfolio review for the board. Focus on budget overruns, schedule delays, and critical risks. Include recommendations for the next quarter..."
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleGenerateReport}
          disabled={aiLoading || !aiContext.trim()}
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate Report
            </>
          )}
        </button>

        {aiError && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
            {aiError}
          </div>
        )}

        {aiReport && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                AI-Generated Board Report
              </span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {aiReport}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
