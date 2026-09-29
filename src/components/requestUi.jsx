import React from 'react';

export const BRAND = {
  teal: '#2C6F7F',
  tealDark: '#245D69',
  tealText: '#2C6F7F',
  tealBg: '#EAF3F5',
  pageBg: '#F3F5F8',
};

export const cardClass = 'rounded-xl border border-slate-200 bg-white p-5';
export const cardTitleClass = 'text-sm font-bold text-slate-900';
export const labelClass = 'mb-1 block text-xs font-bold text-slate-800';
export const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2C6F7F] focus:ring-1 focus:ring-[#2C6F7F] disabled:bg-slate-50 disabled:text-slate-400';

const PILL_STYLES = {
  Approved: 'bg-emerald-100 text-emerald-800',
  Pending: 'bg-amber-100 text-amber-800',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-600',
};

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${PILL_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function SubmitButton({ submitting, children }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="brand-action-button mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
    >
      {submitting && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M21 12a9 9 0 11-9-9" strokeLinecap="round" />
        </svg>
      )}
      {submitting ? 'Submitting…' : children}
    </button>
  );
}

export function FormMessage({ error, success }) {
  if (error) return <p className="mt-3 text-xs font-medium text-red-600">{error}</p>;
  if (success) return <p className="mt-3 text-xs font-medium text-emerald-700">{success}</p>;
  return null;
}

export function TableState({ loading, error, empty, emptyText, onRetry, colSpan }) {
  if (!loading && !error && !empty) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-xs text-slate-500">
        {loading && 'Loading…'}
        {!loading && error && (
          <>
            {error}{' '}
            <button type="button" onClick={onRetry} className="font-bold underline" style={{ color: BRAND.tealText }}>
              Retry
            </button>
          </>
        )}
        {!loading && !error && empty && emptyText}
      </td>
    </tr>
  );
}