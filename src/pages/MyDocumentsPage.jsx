import React, { useRef, useState } from 'react';
import { Eye, FileText, Upload } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { cardClass, cardTitleClass } from '../components/requestUi';

const INITIAL_DOCUMENTS = [
  { id: 1, name: 'Employment Contract.pdf', uploaded: 'Jan 5, 2026', size: '240 KB' },
  { id: 2, name: 'CNIC Copy.pdf', uploaded: 'Jan 5, 2026', size: '180 KB' },
  { id: 3, name: 'Degree Certificate.pdf', uploaded: 'Jan 5, 2026', size: '310 KB' },
];

const POLICIES = [
  { id: 1, name: 'Leave Policy 2026', category: 'HR Policies', updated: 'Jan 2026' },
  { id: 2, name: 'Code of Conduct', category: 'Company Policies', updated: 'Mar 2025' },
  { id: 3, name: 'WFH Guidelines', category: 'HR Policies', updated: 'Jun 2026' },
  { id: 4, name: 'IT & Security Policy', category: 'IT Policies', updated: 'Feb 2026' },
];

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const added = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      uploaded: formatDate(new Date()),
      size: formatSize(file.size),
      url: URL.createObjectURL(file),
    }));
    setDocuments((current) => [...added, ...current]);
    event.target.value = '';
  }

  return (
    <DashboardLayout title="My Documents" breadcrumbs="Home / My Documents">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className={cardClass}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className={cardTitleClass}>My Documents</h2>
              <p className="mt-0.5 text-xs text-slate-500">Uploaded personal documents</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="brand-action-button inline-flex shrink-0 items-center gap-1.5 rounded-md border-0 px-3 py-2 text-xs font-semibold"
            >
              <Upload size={14} />
              Upload Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

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
                {documents.length === 0 ? (
                  <tr><td colSpan={4} className="h-16 text-center text-xs text-slate-500">No documents yet.</td></tr>
                ) : documents.map((document) => (
                  <tr key={document.id} className="h-11 border-t border-slate-100 first:border-t-0">
                    <td className="truncate px-3 text-xs text-slate-800">{document.name}</td>
                    <td className="px-3 text-xs text-slate-600">{document.uploaded}</td>
                    <td className="px-3 text-xs text-slate-600">{document.size}</td>
                    <td className="px-3">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(document)}
                        className="inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C6F7F]"
                      >
                        <Eye size={13} />
                        View
                      </button>
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
