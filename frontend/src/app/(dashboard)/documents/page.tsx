'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api';
import { Document } from '@/types';
import { KPICard } from '@/components/shared/Card';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal, ConfirmDialog } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { cn, formatDate } from '@/lib/utils';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
  Tag,
  Sparkles,
  FolderArchive,
} from 'lucide-react';

// ─── Document categories ──────────────────────────────────────

const CATEGORIES = ['SOW', 'Contract', 'Report', 'Plan', 'Technical', 'Other'] as const;
type DocCategory = (typeof CATEGORIES)[number];

const CATEGORY_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'purple' | 'gray' | 'danger'> = {
  SOW: 'info',
  Contract: 'success',
  Report: 'warning',
  Plan: 'purple',
  Technical: 'gray',
  Other: 'gray',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Form state ───────────────────────────────────────────────

interface DocFormData {
  name: string;
  description: string;
  category: DocCategory;
  fileKey: string;
  fileName: string;
  version: string;
  tags: string;
}

const DEFAULT_FORM: DocFormData = {
  name: '',
  description: '',
  category: 'Other',
  fileKey: '',
  fileName: '',
  version: '1',
  tags: '',
};

// ─── Document card ────────────────────────────────────────────

interface DocCardProps {
  doc: Document;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  downloadLoading: boolean;
}

function DocumentCard({ doc, onDelete, onDownload, downloadLoading }: DocCardProps) {
  const variant = CATEGORY_VARIANTS[doc.category] ?? 'gray';

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={doc.name}>
              {doc.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
          </div>
        </div>
        <Badge variant={variant as any} size="sm">
          {doc.category}
        </Badge>
      </div>

      {/* Description */}
      {doc.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{doc.description}</p>
      )}

      {/* AI Summary */}
      {doc.aiSummary && (
        <div className="rounded-md bg-purple-50 border border-purple-100 p-2.5">
          <div className="flex items-center gap-1 text-purple-700 text-xs font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            AI Summary
          </div>
          <p className="text-xs text-purple-800 line-clamp-3">{doc.aiSummary}</p>
        </div>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-gray-400 space-y-0.5">
        <div className="flex items-center justify-between">
          <span>v{doc.version}</span>
          <span>{formatFileSize(doc.fileSize)}</span>
        </div>
        {doc.uploadedBy && (
          <span>
            By {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
          </span>
        )}
        <span>{formatDate(doc.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          className="btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5"
          onClick={() => onDownload(doc.id)}
          disabled={downloadLoading}
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => onDelete(doc.id)}
          title="Delete document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function DocumentsPage() {
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────
  const { data: docsData, isLoading } = useQuery<{ data: Document[] }>({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll() as any,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => documentsApi.create(data) as any,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowModal(false);
      setForm(DEFAULT_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id) as any,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteTarget(null);
    },
  });

  // ── UI state ───────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DocFormData>(DEFAULT_FORM);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const documents = docsData?.data ?? [];

  // ── KPI calculations ───────────────────────────────────────
  const kpis = useMemo(() => {
    const total = documents.length;
    const byCat: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      byCat[c] = documents.filter((d) => d.category === c).length;
    });
    const withAI = documents.filter((d) => d.aiSummary).length;
    return { total, byCat, withAI };
  }, [documents]);

  // ── All tags (for filter) ──────────────────────────────────
  const allTags = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => d.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [documents]);

  // ── Filtered data ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.fileName.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || d.category === categoryFilter;
      const matchTag = !tagFilter || d.tags.includes(tagFilter);
      return matchSearch && matchCat && matchTag;
    });
  }, [documents, search, categoryFilter, tagFilter]);

  // ── Download handler ───────────────────────────────────────
  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const res: any = await documentsApi.getDownloadUrl(id);
      const url = res?.data?.url ?? res?.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloadingId(null);
    }
  }

  // ── Form submit ────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      fileKey: form.fileKey,
      fileName: form.fileName || form.name,
      version: form.version ? parseInt(form.version, 10) : 1,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    createMutation.mutate(payload);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Document Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage project documents, contracts, reports, and technical files
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Document
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Documents"
          value={kpis.total}
          icon={FileText}
          iconColor="text-brand-600"
        />
        <KPICard
          label="Contracts & SOWs"
          value={(kpis.byCat['Contract'] ?? 0) + (kpis.byCat['SOW'] ?? 0)}
          sub={`${kpis.byCat['SOW'] ?? 0} SOW · ${kpis.byCat['Contract'] ?? 0} Contracts`}
          icon={FolderArchive}
          iconColor="text-green-600"
        />
        <KPICard
          label="Reports & Plans"
          value={(kpis.byCat['Report'] ?? 0) + (kpis.byCat['Plan'] ?? 0)}
          sub={`${kpis.byCat['Report'] ?? 0} Reports · ${kpis.byCat['Plan'] ?? 0} Plans`}
          icon={FileText}
          iconColor="text-purple-600"
        />
        <KPICard
          label="AI-Summarised"
          value={kpis.withAI}
          sub={`${kpis.total - kpis.withAI} pending summary`}
          icon={Sparkles}
          iconColor="text-purple-600"
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input w-36"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} of {documents.length} documents
        </span>
      </div>

      {/* ── Documents grid ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No documents found"
          description="Upload your first document or adjust the filters."
          icon={FileText}
          action={
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Document
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={(id) => setDeleteTarget(id)}
              onDownload={handleDownload}
              downloadLoading={downloadingId === doc.id}
            />
          ))}
        </div>
      )}

      {/* ── Upload Document Modal ── */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(DEFAULT_FORM);
        }}
        title="Upload Document"
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
              disabled={createMutation.isPending || !form.name || !form.fileKey}
            >
              {createMutation.isPending ? 'Saving...' : 'Register Document'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input w-full"
              placeholder="e.g. Project Charter v2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              placeholder="Brief description of the document..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input w-full"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DocCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Version</label>
              <input
                type="number"
                min="1"
                className="input w-full"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                File Key <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                placeholder="e.g. docs/charter.pdf"
                value={form.fileKey}
                onChange={(e) => setForm({ ...form, fileKey: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">File Name</label>
              <input
                className="input w-full"
                placeholder="e.g. charter.pdf"
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              className="input w-full"
              placeholder="e.g. charter, initiation, phase-1"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <p className="text-xs text-gray-400">
            Note: This registers the document metadata. Actual file storage is handled separately.
          </p>

          {createMutation.isError && (
            <p className="text-sm text-red-600">Failed to register document. Please try again.</p>
          )}
        </form>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
