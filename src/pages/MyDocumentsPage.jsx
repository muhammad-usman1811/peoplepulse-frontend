import React, { useEffect, useRef, useState } from 'react';
import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { cardClass, cardTitleClass } from '../components/requestUi';
import { deleteMyDocument, getMyDocumentFile, getMyDocuments, uploadMyDocument } from '../services/api';

const POLICIES = [
  { id: 1, name: 'Leave Policy 2026', category: 'HR Policies', updated: 'Jan 2026' },
  { id: 2, name: 'Code of Conduct', category: 'Company Policies', updated: 'Mar 2025' },
  { id: 3, name: 'WFH Guidelines', category: 'HR Policies', updated: 'Jun 2026' },
  { id: 4, name: 'IT & Security Policy', category: 'IT Policies', updated: 'Feb 2026' },
];

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PreviewDialog({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FileText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="document-preview-title" className="break-words text-sm font-bold text-slate-900">{item.name}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {item.category ? `${item.category} · Updated ${item.updated}` : `Uploaded ${item.uploaded} · ${item.size}`}
            </p>
          </div>
          <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-semibold text-[#2C6F7F] underline">
            Open uploaded file
          </a>
        )}
      </section>
    </div>
  );
}

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  async function loadDocuments() {
    setIsLoading(true);
    setError('');
    const result = await getMyDocuments();
    if (!result.success || result.data?.success === false) {
      setError(result.error || result.data?.message || 'Could not load your documents.');
    } else if (!Array.isArray(result.data?.data?.documents)) {
      setError('The documents service returned an unexpected list.');
    } else {
      setDocuments(result.data.data.documents);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!previewItem?.url) return undefined;
    return () => URL.revokeObjectURL(previewItem.url);
  }, [previewItem]);

  async function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const documentCategory = category.trim();
    if (!documentCategory) {
      setUploadError('Enter a document category before uploading.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    let uploadedAny = false;
    const uploadFailures = [];
    try {
      for (const file of files) {
        const result = await uploadMyDocument(file, documentCategory);
        if (!result.success || result.data?.success === false) {
          uploadFailures.push(`${file.name}: ${result.error || result.data?.message || 'Upload failed.'}`);
        } else {
          uploadedAny = true;
        }
      }

      if (uploadedAny) {
        const result = await getMyDocuments();
        if (!result.success || result.data?.success === false || !Array.isArray(result.data?.data?.documents)) {
          setError(result.error || result.data?.message || 'Upload succeeded, but the document list could not be refreshed.');
        } else {
          setDocuments(result.data.data.documents);
        }
      }
      if (uploadFailures.length) setUploadError(uploadFailures.join(' '));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(document) {
    const documentId = document._id || document.id;
    if (!documentId || deletingDocumentId !== null) return;
    if (!window.confirm(`Delete ${document.originalName || document.name || 'this document'}?`)) return;

    setDeletingDocumentId(documentId);
    setError('');
    try {
      const result = await deleteMyDocument(documentId);
      if (!result.success || result.data?.success === false) {
        setError(result.error || result.data?.message || 'Could not delete this document.');
      } else {
        setDocuments((current) => current.filter((item) => (item._id || item.id) !== documentId));
      }
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleView(document) {
    const documentId = document._id || document.id;
    if (!documentId || viewingDocumentId !== null) return;

    setViewingDocumentId(documentId);
    setError('');
    try {
      const result = await getMyDocumentFile(documentId);
      if (!result.success || !(result.data instanceof Blob)) {
        setError(result.error || 'Could not open this document.');
        return;
      }

      setPreviewItem({
        ...document,
        name: document.originalName || document.name || 'Untitled document',
        uploaded: formatDate(document.createdAt || document.uploaded),
        size: formatSize(document.size),
        url: URL.createObjectURL(result.data),
      });
    } finally {
      setViewingDocumentId(null);
    }
  }

  return (
    <DashboardLayout title="My Documents" breadcrumbs="Home / My Documents">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className={cardClass}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={cardTitleClass}>My Documents</h2>
              <p className="mt-0.5 text-xs text-slate-500">Uploaded personal documents</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Category
                <input
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  maxLength={50}
                  placeholder="e.g. certificate"
                  className="mt-1 block h-8 w-36 rounded-md border border-slate-300 px-2 text-xs font-normal text-slate-700 outline-none focus:border-[#2C6F7F] focus:ring-1 focus:ring-[#2C6F7F]"
                />
              </label>
              <button
                type="button"
                disabled={!category.trim() || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="brand-action-button inline-flex shrink-0 items-center gap-1.5 rounded-md border-0 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={14} />
                {isUploading ? 'Uploading…' : 'Upload Document'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {uploadError && <p role="alert" className="mb-3 text-xs text-red-600">{uploadError}</p>}
          {error && documents.length > 0 && <p role="alert" className="mb-3 text-xs text-red-600">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '16%' }} />
                <col />
              </colgroup>
              <thead>
                <tr className="h-9 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3">Document</th>
                  <th className="px-3">Uploaded</th>
                  <th className="px-3">Size</th>
                  <th className="px-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="h-16 text-center text-xs text-slate-500">Loading documents…</td></tr>
                ) : error && documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-16 text-center text-xs text-slate-500">
                      {error}{' '}
                      <button type="button" onClick={loadDocuments} className="font-semibold underline">Retry</button>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan={4} className="h-16 text-center text-xs text-slate-500">No documents yet.</td></tr>
                ) : documents.map((document) => (
                  <tr key={document._id || document.id} className="h-11 border-t border-slate-100 first:border-t-0">
                    <td className="truncate px-3 text-xs text-slate-800">{document.originalName || document.name || 'Untitled document'}</td>
                    <td className="px-3 text-xs text-slate-600">{formatDate(document.createdAt || document.uploaded)}</td>
                    <td className="px-3 text-xs text-slate-600">{formatSize(document.size)}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={viewingDocumentId !== null}
                          onClick={() => handleView(document)}
                          className="inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C6F7F]"
                        >
                          <Eye size={13} />
                          {viewingDocumentId === (document._id || document.id) ? 'Loading…' : 'View'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingDocumentId !== null}
                          onClick={() => handleDelete(document)}
                          aria-label={`Delete ${document.originalName || document.name || 'document'}`}
                          className="inline-flex h-7 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={`${cardTitleClass} mb-3`}>Company Policy Library</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '37%' }} />
                <col />
              </colgroup>
              <thead>
                <tr className="h-9 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3">Policy</th>
                  <th className="px-3">Category</th>
                  <th className="px-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {POLICIES.map((policy) => (
                  <tr key={policy.id} className="h-10 border-t border-slate-100 first:border-t-0">
                    <td className="px-3 text-xs text-slate-800">
                      <button type="button" onClick={() => setPreviewItem(policy)} className="text-left hover:underline focus-visible:underline">
                        {policy.name}
                      </button>
                    </td>
                    <td className="px-3 text-xs text-slate-600">{policy.category}</td>
                    <td className="px-3 text-xs text-slate-600">{policy.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
    </DashboardLayout>
  );
}
