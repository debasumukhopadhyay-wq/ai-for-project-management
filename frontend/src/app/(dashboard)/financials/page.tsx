'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { projectsApi, financialsApi } from '@/lib/api';
import { Project, Budget } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/shared/Badge';
import { DataTable, Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BudgetWithProject extends Budget {
  projectName: string;
}

export default function FinancialsPage() {
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll() as any,
  });

  const projects = projectsData?.data || [];

  // Aggregate project-level financial data
  const totalBudget = projects.reduce((s, p) => s + (p.totalBudget || 0), 0);
  const totalActual = projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const totalForecast = projects.reduce((s, p) => s + (p.forecastCost || 0), 0);
  const avgCPI =
    projects.length > 0
      ? projects.reduce((s, p) => s + (p.earnedValue / Math.max(p.actualCost, 1)), 0) / projects.length
      : 0;

  const overBudgetProjects = projects.filter((p) => p.actualCost > p.totalBudget);

  const chartData = projects.slice(0, 8).map((p) => ({
    name: p.name.slice(0, 14),
    Budget: p.totalBudget,
    Actual: p.actualCost,
    Forecast: p.forecastCost,
  }));

  const projectColumns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      render: (p) => <span className="font-medium text-gray-900">{p.name}</span>,
    },
    {
      key: 'totalBudget',
      label: 'Total Budget',
      sortable: true,
      render: (p) => <span>{formatCurrency(p.totalBudget)}</span>,
    },
    {
      key: 'actualCost',
      label: 'Actual Cost',
      sortable: true,
      render: (p) => (
        <span className={p.actualCost > p.totalBudget ? 'text-red-600 font-semibold' : ''}>
          {formatCurrency(p.actualCost)}
        </span>
      ),
    },
    {
      key: 'forecastCost',
      label: 'Forecast',
      render: (p) => <span>{formatCurrency(p.forecastCost)}</span>,
    },
    {
      key: 'variance',
      label: 'Variance',
      render: (p) => {
        const variance = p.totalBudget - p.actualCost;
        return (
          <span className={cn('font-medium', variance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
          </span>
        );
      },
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (p) => {
        const pct = p.totalBudget > 0 ? (p.actualCost / p.totalBudget) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
              <div
                className={cn('h-1.5 rounded-full', pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-green-500')}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{formatPercent(pct)}</span>
          </div>
        );
      },
    },
    {
      key: 'earnedValue',
      label: 'CPI',
      render: (p) => {
        const cpi = p.actualCost > 0 ? p.earnedValue / p.actualCost : 0;
        return (
          <span className={cn('font-semibold', cpi >= 1 ? 'text-green-600' : cpi >= 0.9 ? 'text-amber-600' : 'text-red-600')}>
            {cpi.toFixed(2)}
          </span>
        );
      },
    },
  ];

  if (projectsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Portfolio Budget"
          value={formatCurrency(totalBudget)}
          icon={DollarSign}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Total Actual Cost"
          value={formatCurrency(totalActual)}
          sub={`${formatPercent((totalActual / Math.max(totalBudget, 1)) * 100)} of budget`}
          icon={TrendingUp}
          iconColor={totalActual > totalBudget ? 'text-red-600' : 'text-green-600'}
        />
        <KPICard
          label="Forecast at Completion"
          value={formatCurrency(totalForecast)}
          sub={`Variance: ${formatCurrency(totalBudget - totalForecast)}`}
          icon={BarChart3}
          iconColor="text-purple-600"
        />
        <KPICard
          label="Over-Budget Projects"
          value={overBudgetProjects.length}
          sub={`of ${projects.length} total projects`}
          icon={AlertCircle}
          iconColor={overBudgetProjects.length > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* Budget Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget vs Actual vs Forecast by Project</h3>
        {chartData.length === 0 ? (
          <EmptyState title="No financial data" description="Projects with budgets will appear here." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Forecast" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Projects Financial Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Project Financial Summary</h3>
          <p className="text-xs text-gray-500 mt-0.5">Budget, actuals, and CPI across all projects</p>
        </div>
        <div className="p-4">
          <DataTable
            columns={projectColumns}
            data={projects}
            rowKey={(p) => p.id}
            emptyMessage="No projects with financial data yet."
          />
        </div>

        {/* Totals row */}
        {projects.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-8 text-sm">
            <span className="font-semibold text-gray-700">Totals:</span>
            <span>Budget: <strong>{formatCurrency(totalBudget)}</strong></span>
            <span>Actual: <strong className={totalActual > totalBudget ? 'text-red-600' : ''}>{formatCurrency(totalActual)}</strong></span>
            <span>Forecast: <strong>{formatCurrency(totalForecast)}</strong></span>
            <span>Variance: <strong className={totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(totalBudget - totalActual)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
