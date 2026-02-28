'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, projectsApi, risksApi } from '@/lib/api';
import { ExecutiveDashboard, Project, Risk } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { RAGBadge, ProjectStatusBadge } from '@/components/shared/Badge';
import { formatCurrency, formatPercent, formatDate, getCPIColor, getSPIColor } from '@/lib/utils';
import {
  Briefcase,
  Network,
  FolderOpen,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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

const RAG_COLORS_MAP = { GREEN: '#22c55e', AMBER: '#f59e0b', RED: '#ef4444' };

export default function DashboardPage() {
  const router = useRouter();

  const { data: dashData, isLoading } = useQuery<{ data: ExecutiveDashboard }>({
    queryKey: ['executive-dashboard'],
    queryFn: () => reportsApi.getExecutiveDashboard() as any,
  });

  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects', 'recent'],
    queryFn: () => projectsApi.getAll({ limit: 5 }) as any,
  });

  if (isLoading) return <PageLoader />;

  const dash = dashData?.data;
  const projects = projectsData?.data || [];

  const ragPieData = dash
    ? [
        { name: 'Green', value: dash.ragDistribution.green, color: '#22c55e' },
        { name: 'Amber', value: dash.ragDistribution.amber, color: '#f59e0b' },
        { name: 'Red', value: dash.ragDistribution.red, color: '#ef4444' },
      ]
    : [];

  const budgetChartData = projects.slice(0, 6).map((p) => ({
    name: p.name.slice(0, 15),
    Budget: p.totalBudget,
    Actual: p.actualCost,
    Forecast: p.forecastCost,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Portfolios"
          value={dash?.summary.portfolios ?? '—'}
          icon={Briefcase}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Programs"
          value={dash?.summary.programs ?? '—'}
          icon={Network}
          iconColor="text-purple-600"
        />
        <KPICard
          label="Active Projects"
          value={dash?.summary.projects ?? '—'}
          icon={FolderOpen}
          iconColor="text-cyan-600"
        />
        <KPICard
          label="Total Budget"
          value={formatCurrency(dash?.summary.totalBudget)}
          sub={`${formatPercent(dash?.summary.budgetUtilization)} utilized`}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <KPICard
          label="Actual Cost"
          value={formatCurrency(dash?.summary.totalActualCost)}
          icon={TrendingUp}
          iconColor="text-orange-600"
        />
        <KPICard
          label="Avg Completion"
          value={formatPercent(dash?.summary.avgCompletion)}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
        <KPICard
          label="Top Risks"
          value={dash?.topRisks.length ?? '—'}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
        <KPICard
          label="Portfolio Health"
          value={`${ragPieData.find((r) => r.name === 'Green')?.value ?? 0} GREEN`}
          icon={Activity}
          iconColor="text-green-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget vs Actual vs Forecast</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetChartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Forecast" fill="#6b7280" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RAG distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">RAG Distribution</h3>
          {ragPieData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ragPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ragPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1.5">
            {ragPieData.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="font-semibold text-gray-700">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects table + Top Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Recent Projects</h3>
            <button
              onClick={() => router.push('/projects')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {projects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No projects yet</p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPercent(p.percentComplete)} complete · Due {formatDate(p.plannedEndDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RAGBadge status={p.ragStatus} />
                  <ProjectStatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top risks */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Top Risks</h3>
            <button
              onClick={() => router.push('/risks')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {(!dash?.topRisks || dash.topRisks.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">No high risks</p>
            )}
            {dash?.topRisks.map((risk) => (
              <div key={risk.id} className="px-5 py-3.5 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    risk.riskScore >= 20
                      ? 'bg-red-100 text-red-700'
                      : risk.riskScore >= 12
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {risk.riskScore}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{risk.title}</p>
                  <p className="text-xs text-gray-500">
                    {risk.probability} probability · {risk.impact} impact · {risk.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
