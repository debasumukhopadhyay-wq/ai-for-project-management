'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Briefcase, DollarSign, CheckCircle2, Calendar, User, ChevronRight } from 'lucide-react';
import { Portfolio } from '@/types';
import { portfoliosApi } from '@/lib/api';
import { formatCurrency, formatDate, formatPercent, cn } from '@/lib/utils';
import { KPICard } from '@/components/shared/Card';
import { RAGBadge } from '@/components/shared/Badge';
import { Modal } from '@/components/shared/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';

// ─── New Portfolio Form ───────────────────────────────────────

interface PortfolioFormData {
  name: string;
  description: string;
  strategicObjectives: string;
  totalBudget: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: PortfolioFormData = {
  name: '',
  description: '',
  strategicObjectives: '',
  totalBudget: '',
  startDate: '',
  endDate: '',
};

interface NewPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function NewPortfolioModal({ open, onClose, onSuccess }: NewPortfolioModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PortfolioFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<PortfolioFormData>>({});

  const mutation = useMutation({
    mutationFn: (data: any) => portfoliosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      setForm(EMPTY_FORM);
      setErrors({});
      onSuccess();
      onClose();
    },
  });

  function validate(): boolean {
    const newErrors: Partial<PortfolioFormData> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.totalBudget || isNaN(Number(form.totalBudget)) || Number(form.totalBudget) < 0) {
      newErrors.totalBudget = 'Valid budget amount is required';
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      strategicObjectives: form.strategicObjectives.trim() || undefined,
      totalBudget: Number(form.totalBudget),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
  }

  function handleChange(field: keyof PortfolioFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Portfolio"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={handleClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? 'Creating...' : 'Create Portfolio'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="label" htmlFor="pf-name">
            Portfolio Name <span className="text-red-500">*</span>
          </label>
          <input
            id="pf-name"
            className={cn('input', errors.name && 'border-red-400 focus:ring-red-400')}
            placeholder="e.g. Digital Transformation 2026"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="pf-desc">
            Description
          </label>
          <textarea
            id="pf-desc"
            className="input min-h-[80px] resize-none"
            placeholder="Brief description of this portfolio..."
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        {/* Strategic Objectives */}
        <div>
          <label className="label" htmlFor="pf-objectives">
            Strategic Objectives
          </label>
          <textarea
            id="pf-objectives"
            className="input min-h-[80px] resize-none"
            placeholder="Key strategic objectives this portfolio supports..."
            value={form.strategicObjectives}
            onChange={(e) => handleChange('strategicObjectives', e.target.value)}
          />
        </div>

        {/* Total Budget */}
        <div>
          <label className="label" htmlFor="pf-budget">
            Total Budget (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              id="pf-budget"
              type="number"
              min="0"
              step="1000"
              className={cn('input pl-7', errors.totalBudget && 'border-red-400 focus:ring-red-400')}
              placeholder="0"
              value={form.totalBudget}
              onChange={(e) => handleChange('totalBudget', e.target.value)}
            />
          </div>
          {errors.totalBudget && <p className="text-xs text-red-500 mt-1">{errors.totalBudget}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="pf-start">
              Start Date
            </label>
            <input
              id="pf-start"
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-end">
              End Date
            </label>
            <input
              id="pf-end"
              type="date"
              className={cn('input', errors.endDate && 'border-red-400 focus:ring-red-400')}
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* API error */}
        {mutation.isError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Failed to create portfolio. Please try again.
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Portfolio Card ───────────────────────────────────────────

interface PortfolioCardProps {
  portfolio: Portfolio;
  onClick: () => void;
}

function PortfolioCard({ portfolio, onClick }: PortfolioCardProps) {
  const allocatedPercent =
    portfolio.totalBudget > 0
      ? Math.min(100, (portfolio.allocatedBudget / portfolio.totalBudget) * 100)
      : 0;

  const ownerName = portfolio.owner
    ? `${portfolio.owner.firstName} ${portfolio.owner.lastName}`
    : 'Unassigned';

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-200 group"
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
            {portfolio.name}
          </h3>
          {portfolio.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{portfolio.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RAGBadge status={portfolio.ragStatus} />
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
        </div>
      </div>

      {/* Budget progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Budget utilization</span>
          <span className="font-medium text-gray-700">{formatPercent(allocatedPercent)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all',
              allocatedPercent > 90
                ? 'bg-red-500'
                : allocatedPercent > 70
                ? 'bg-amber-400'
                : 'bg-green-500',
            )}
            style={{ width: `${allocatedPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="text-gray-500">
            Allocated: <span className="font-medium text-gray-700">{formatCurrency(portfolio.allocatedBudget)}</span>
          </span>
          <span className="text-gray-500">
            Total: <span className="font-medium text-gray-700">{formatCurrency(portfolio.totalBudget)}</span>
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          <span>
            <span className="font-medium text-gray-700">{portfolio._count?.programs ?? 0}</span> programs
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate max-w-[120px]">{ownerName}</span>
        </div>
        {portfolio.endDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatDate(portfolio.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function PortfoliosPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery<{ data: Portfolio[] }>({
    queryKey: ['portfolios'],
    queryFn: () => portfoliosApi.getAll() as any,
  });

  if (isLoading) return <PageLoader />;

  const portfolios: Portfolio[] = data?.data ?? [];

  // Computed KPIs
  const totalBudget = portfolios.reduce((sum, p) => sum + p.totalBudget, 0);
  const onTrackCount = portfolios.filter((p) => p.ragStatus === 'GREEN').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portfolios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and monitor your strategic investment portfolios
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Portfolio
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Portfolios"
          value={portfolios.length}
          icon={Briefcase}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          sub="across all portfolios"
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <KPICard
          label="On Track (Green)"
          value={onTrackCount}
          sub={portfolios.length > 0 ? `${formatPercent((onTrackCount / portfolios.length) * 100)} of portfolios` : 'No portfolios'}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
      </div>

      {/* Portfolio grid */}
      {portfolios.length === 0 ? (
        <EmptyState
          title="No portfolios yet"
          description="Create your first portfolio to start organizing your programs and projects."
          icon={Briefcase}
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Portfolio
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onClick={() => router.push(`/portfolios/${portfolio.id}`)}
            />
          ))}
        </div>
      )}

      {/* New Portfolio Modal */}
      <NewPortfolioModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
