import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  MapPin,
  Timer,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { clockIn, clockOut, getMyAttendance } from '../services/api';

const STATUS_STYLES = {
  'On Time': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Late: 'bg-amber-50 text-amber-700 ring-amber-200',
  Remote: 'bg-sky-50 text-sky-700 ring-sky-200',
  Complete: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Recorded: 'bg-slate-50 text-slate-700 ring-slate-200',
};

function StatusBadge({ status }) {
  const dotStyles = {
    'On Time': 'bg-emerald-500',
    Late: 'bg-amber-500',
    Remote: 'bg-sky-500',
    Complete: 'bg-emerald-500',
    'In Progress': 'bg-amber-500',
    Recorded: 'bg-slate-500',
  };
  const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.Recorded;
  const dotStyle = dotStyles[status] || dotStyles.Recorded;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractAttendanceRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['attendance', 'records', 'items', 'history', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
    const records = extractAttendanceRecords(payload[key]);
    if (records.length) return records;
  }
  return [];
}

function getRecordDate(record) {
  return String(record.date || record.attendanceDate || record.clockInAt || record.clockIn || record.createdAt || '').slice(0, 10);
}

function getRecordTime(value) {
  if (!value) return null;
  const text = String(value);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) || !text.includes('T') ? text : formatTime(parsed);
}

function getWorkedHours(record) {
  const existing = record.hours ?? record.totalHours ?? record.duration;
  if (existing != null) return String(existing);

  const start = new Date(record.clockInAt || record.clockIn || record.checkIn || '');
  const end = new Date(record.clockOutAt || record.clockOut || record.checkOut || '');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';

  const minutes = Math.max(0, Math.round((end - start) / 60000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatRecordDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value || '—' : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function getRecordStatus(record) {
  const status = String(record.status || '').toLowerCase();
  if (status.includes('late')) return 'Late';
  if (status.includes('remote') || status.includes('wfh')) return 'Remote';
  if (status.includes('on time') || status === 'ontime') return 'On Time';
  if (status) return record.status;
  if (record.clockOutAt || record.clockOut || record.checkOut) return 'Complete';
  if (record.clockInAt || record.clockIn || record.checkIn) return 'In Progress';
  return 'Recorded';
}

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [todayStatusError, setTodayStatusError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [todayStatusAvailable, setTodayStatusAvailable] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ from: '', to: '', limit: '30' });
  const [appliedFilters, setAppliedFilters] = useState({ limit: 30 });

  const loadAttendance = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setTodayStatusAvailable(false);
    try {
      const today = getLocalDateKey();
      const [historyResult, todayResult] = await Promise.all([
        getMyAttendance(appliedFilters),
        getMyAttendance({ from: today, to: today, limit: 1 })
      ]);

      if (historyResult.success) {
        setRecords(extractAttendanceRecords(historyResult.data)
          .sort((left, right) => getRecordDate(right).localeCompare(getRecordDate(left))));
        setLoadError('');
      } else {
        setLoadError(historyResult.error || 'Could not load attendance history.');
      }

      if (todayResult.success) {
        const [record] = extractAttendanceRecords(todayResult.data);
        setTodayRecord(record || null);
        setTodayStatusAvailable(true);
        setTodayStatusError('');
      } else {
        setTodayStatusError(todayResult.error || 'Could not load today’s attendance status.');
      }
    } catch (error) {
      setLoadError(error.message || 'Could not load attendance history.');
      setTodayStatusError(error.message || 'Could not load today’s attendance status.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const clockInAt = getRecordTime(todayRecord?.clockInAt || todayRecord?.clockIn || todayRecord?.checkIn);
  const clockOutAt = getRecordTime(todayRecord?.clockOutAt || todayRecord?.clockOut || todayRecord?.checkOut);
  const location = todayRecord?.workLocation || todayRecord?.location || todayRecord?.workMode;
  const workLocation = typeof location === 'string' ? location : location?.name || location?.type || '—';
  const isClockedIn = clockInAt !== null && clockOutAt === null;
  const isComplete = clockInAt !== null && clockOutAt !== null;
  const tableRows = useMemo(() => records.map((record, index) => ({
    id: record.id || record._id || `${getRecordDate(record)}-${index}`,
    date: formatRecordDate(getRecordDate(record)),
    clockIn: getRecordTime(record.clockInAt || record.clockIn || record.checkIn) || '—',
    clockOut: getRecordTime(record.clockOutAt || record.clockOut || record.checkOut) || '—',
    hours: getWorkedHours(record),
    status: getRecordStatus(record)
  })), [records]);

  const performClockAction = async (action) => {
    setSubmitting(true);
    setActionError('');
    try {
      const result = await action();
      if (!result.success) throw new Error(result.error || 'The attendance action failed.');
      await loadAttendance({ silent: true });
    } catch (error) {
      setActionError(error.message || 'The attendance action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    if (historyFilters.from && historyFilters.to && historyFilters.from > historyFilters.to) {
      setLoadError('The start date must be on or before the end date.');
      return;
    }
    setAppliedFilters({
      ...(historyFilters.from ? { from: historyFilters.from } : {}),
      ...(historyFilters.to ? { to: historyFilters.to } : {}),
      limit: Number(historyFilters.limit)
    });
  };

  const exportAttendance = () => {
    const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['Date', 'Clock in', 'Clock out', 'Hours', 'Status'],
      ...tableRows.map((row) => [row.date, row.clockIn, row.clockOut, row.hours, row.status])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${getLocalDateKey()}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <DashboardLayout title="My Attendance" breadcrumbs="Home / My Attendance">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="brand-accent-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <Clock3 size={23} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Today&apos;s attendance</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? 'Loading today’s attendance…'
                    : actionError || todayStatusError || (!todayStatusAvailable ? 'Checking today’s attendance status…' : isComplete
                    ? `Day completed · ${clockInAt} – ${clockOutAt}`
                    : isClockedIn
                      ? `Clocked in at ${clockInAt} · Remember to clock out at the end of your day.`
                      : 'You haven’t clocked in yet. Have a good day.')}
                </p>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => performClockAction(clockIn)}
                disabled={!todayStatusAvailable || isClockedIn || isComplete || loading || submitting}
                className="brand-action-button border-0 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:flex-none"
              >
                <CheckCircle2 size={17} />
                {submitting ? 'Working…' : isComplete ? 'Day Complete' : isClockedIn ? 'Clocked In' : 'Clock In'}
              </button>
              <button
                type="button"
                onClick={() => performClockAction(clockOut)}
                disabled={!todayStatusAvailable || !isClockedIn || loading || submitting}
                className={`border-0 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:flex-none ${
                  isClockedIn
                    ? 'bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <Timer size={17} />
                {submitting ? 'Working…' : isComplete ? 'Clocked Out' : 'Clock Out'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock3 size={16} className="text-slate-400" />
              <span>Clock in</span>
              <strong className="ml-auto font-semibold text-slate-900">{clockInAt || '—'}</strong>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Timer size={16} className="text-slate-400" />
              <span>Clock out</span>
              <strong className="ml-auto font-semibold text-slate-900">{clockOutAt || '—'}</strong>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={16} className="text-slate-400" />
              <span>Work location</span>
              <strong className="ml-auto font-semibold text-slate-900">{workLocation}</strong>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">My timesheet</h2>
              <p className="mt-0.5 text-sm text-slate-500">Recent attendance history</p>
            </div>
            <button
              type="button"
              onClick={exportAttendance}
              disabled={!tableRows.length}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border-0 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownToLine size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:px-6">
            <div className="flex-1">
              <label htmlFor="attendance-from" className="mb-1 block text-xs font-medium text-slate-600">From</label>
              <input
                id="attendance-from"
                type="date"
                value={historyFilters.from}
                onChange={(event) => setHistoryFilters((current) => ({ ...current, from: event.target.value }))}
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="attendance-to" className="mb-1 block text-xs font-medium text-slate-600">To</label>
              <input
                id="attendance-to"
                type="date"
                value={historyFilters.to}
                onChange={(event) => setHistoryFilters((current) => ({ ...current, to: event.target.value }))}
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
              />
            </div>
            <div className="sm:w-32">
              <label htmlFor="attendance-limit" className="mb-1 block text-xs font-medium text-slate-600">Records</label>
              <select
                id="attendance-limit"
                value={historyFilters.limit}
                onChange={(event) => setHistoryFilters((current) => ({ ...current, limit: event.target.value }))}
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                {[30, 60, 100].map((limit) => <option key={limit} value={limit}>{limit}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brand-action-button min-h-10 rounded-lg border-0 px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
            >
              Apply filters
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 sm:px-6">Date</th>
                  <th className="px-5 py-3">Clock in</th>
                  <th className="px-5 py-3">Clock out</th>
                  <th className="px-5 py-3">Hours</th>
                  <th className="px-5 py-3 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500">Loading attendance history…</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-red-600">{loadError} <button type="button" className="font-semibold underline" onClick={() => loadAttendance()}>Retry</button></td></tr>
                ) : tableRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500">No attendance records yet.</td></tr>
                ) : tableRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900 sm:px-6">{row.date}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{row.clockIn}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{row.clockOut}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{row.hours}</td>
                    <td className="whitespace-nowrap px-5 py-4 sm:px-6"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}