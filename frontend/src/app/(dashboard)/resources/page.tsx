'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi } from '@/lib/api';
import { Resource } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { DataTable, Column } from '@/components/shared/DataTable';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import {
  Users,
  UserCheck,
  Building2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Percent,
} from 'lucide-react';

// ─── Resource type badge ──────────────────────────────────────

function ResourceTypeBadge({ type }: { type: Resource['resourceType'] }) {
  const config: Record<Resource['resourceType'], { label: string; variant: 'info' | 'purple' | 'warning' }> = {
    INTERNAL: { label: 'Internal', variant: 'info' },
    CONTRACTOR: { label: 'Contractor', variant: 'purple' },
    VENDOR: { label: 'Vendor', variant: 'warning' },
  };
  const { label, variant } = config[type];
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Add Resource Form state ──────────────────────────────────

interface ResourceFormData {
  name: string;
  email: string;
  resourceType: Resource['resourceType'];
  roleTitle: string;
  skills: string;
  dailyRate: string;
  availabilityPercent: string;
}

const DEFAULT_FORM: ResourceFormData = {
  name: '',
  email: '',
  resourceType: 'INTERNAL',
  roleTitle: '',
  skills: '',
  dailyRate: '',
  availabilityPercent: '100',
};

// ─── Page ─────────────────────────────────────────────────────

export default function ResourcesPage() {
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────
  const { data: resourcesData, isLoading } = useQuery<{ data: Resource[] }>({
    queryKey: ['resources'],
    queryFn: () => resourcesApi.getAll() as any,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => resourcesApi.create(data) as any,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setShowModal(false);
      setForm(DEFAULT_FORM);
    },
  });

  // ── UI state ───────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ResourceFormData>(DEFAULT_FORM);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Resource['resourceType'] | ''>('');
  const [availFilter, setAvailFilter] = useState<'all' | 'available' | 'overallocated'>('all');

  const resources = resourcesData?.data ?? [];

  // ── KPI calculations ───────────────────────────────────────
  const kpis = useMemo(() => {
    const total = resources.length;
    const internal = resources.filter((r) => r.resourceType === 'INTERNAL').length;
    const external = resources.filter(
      (r) => r.resourceType === 'CONTRACTOR' || r.resourceType === 'VENDOR',
    ).length;
    const avgAvail =
      total > 0
        ? resources.reduce((sum, r) => sum + r.availabilityPercent, 0) / total
        : 0;
    const overallocated = resources.filter((r) => r.isOverAllocated).length;
    return { total, internal, external, avgAvail, overallocated };
  }, [resources]);

  // ── Filtered data ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.roleTitle?.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || r.resourceType === typeFilter;
      const matchAvail =
        availFilter === 'all' ||
        (availFilter === 'overallocated' && r.isOverAllocated) ||
        (availFilter === 'available' && !r.isOverAllocated);
      return matchSearch && matchType && matchAvail;
    });
  }, [resources, search, typeFilter, availFilter]);

  // ── Table columns ──────────────────────────────────────────
  const columns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{r.name}</p>
          {r.email && <p className="text-xs text-gray-500">{r.email}</p>}
        </div>
      ),
    },
    {
      key: 'resourceType',
      label: 'Type',
      render: (r) => <ResourceTypeBadge type={r.resourceType} />,
    },
    {
      key: 'roleTitle',
      label: 'Role / Title',
      render: (r) => <span className="text-sm text-gray-700">{r.roleTitle ?? '—'}</span>,
    },
    {
      key: 'skills',
      label: 'Skills',
      render: (r) => {
        const visible = r.skills.slice(0, 3);
        const extra = r.skills.length - 3;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
              >
                {s}
              </span>
            ))}
            {extra > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-400">
                +{extra}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'dailyRate',
      label: 'Daily Rate',
      sortable: true,
      render: (r) => (
        <span className="text-sm text-gray-700">
          {r.dailyRate != null ? formatCurrency(r.dailyRate, r.currency) : '—'}
        </span>
      ),
    },
    {
      key: 'availabilityPercent',
      label: 'Availability',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(r.availabilityPercent, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{formatPercent(r.availabilityPercent)}</span>
        </div>
      ),
    },
    {
      key: 'totalAllocation',
      label: 'Allocation',
      sortable: true,
      render: (r) => (
        <span className="text-sm text-gray-700">
          {r.totalAllocation != null ? formatPercent(r.totalAllocation) : '—'}
        </span>
      ),
    },
    {
      key: 'isOverAllocated',
      label: 'Status',
      render: (r) =>
        r.isOverAllocated ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            Over-allocated
          </span>
        ) : (
          <span className="text-xs text-green-600 font-medium">OK</span>
        ),
    },
  ];

  // ── Form submit ────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email || undefined,
      resourceType: form.resourceType,
      roleTitle: form.roleTitle || undefined,
      skills: form.skills
        ? form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      availabilityPercent: form.availabilityPercent ? parseFloat(form.availabilityPercent) : 100,
    };
    createMutation.mutate(payload);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Resource Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage internal staff, contractors, and vendors across your projects
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Resource
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Resources"
          value={kpis.total}
          icon={Users}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Internal"
          value={kpis.internal}
          sub={`${kpis.external} contractors / vendors`}
          icon={UserCheck}
          iconColor="text-blue-600"
        />
        <KPICard
          label="Avg Availability"
          value={formatPercent(kpis.avgAvail)}
          icon={Percent}
          iconColor="text-green-600"
        />
        <KPICard
          label="Over-allocated"
          value={kpis.overallocated}
          sub={kpis.overallocated > 0 ? 'Requires attention' : 'All within capacity'}
          icon={AlertTriangle}
          iconColor={kpis.overallocated > 0 ? 'text-red-600' : 'text-gray-400'}
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as Resource['resourceType'] | '')}
            className="input w-44"
          >
            <option value="">All Types</option>
            <option value="INTERNAL">Internal</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="VENDOR">Vendor</option>
          </select>
          <select
            value={availFilter}
            onChange={(e) =>
              setAvailFilter(e.target.value as 'all' | 'available' | 'overallocated')
            }
            className="input w-44"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="overallocated">Over-allocated</option>
          </select>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} of {resources.length} resources
        </span>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Add your first resource or adjust the filters."
          icon={Users}
          action={
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Resource
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
        />
      )}

      {/* ── Add Resource Modal ── */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(DEFAULT_FORM);
        }}
        title="Add Resource"
        size="md"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                setForm(DEFAULT_FORM);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !form.name}
            >
              {createMutation.isPending ? 'Saving...' : 'Add Resource'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input w-full"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Resource Type</label>
              <select
                className="input w-full"
                value={form.resourceType}
                onChange={(e) =>
                  setForm({ ...form, resourceType: e.target.value as Resource['resourceType'] })
                }
              >
                <option value="INTERNAL">Internal</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>
            <div>
              <label className="label">Role / Title</label>
              <input
                className="input w-full"
                placeholder="e.g. Senior Developer"
                value={form.roleTitle}
                onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Skills{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              className="input w-full"
              placeholder="e.g. React, TypeScript, Node.js"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Rate (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input w-full"
                placeholder="e.g. 500"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Availability %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input w-full"
                placeholder="100"
                value={form.availabilityPercent}
                onChange={(e) => setForm({ ...form, availabilityPercent: e.target.value })}
              />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to create resource. Please try again.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
