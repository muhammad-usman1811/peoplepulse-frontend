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
};

function StatusBadge({ status }) {
  const dotStyles = {
    'On Time': 'bg-emerald-500',
    Late: 'bg-amber-500',
    Remote: 'bg-sky-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function extractAttendanceRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['attendance', 'records', 'items', 'history', 'data']) {
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
  return 'On Time';
}

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAttendance = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await getMyAttendance();
      if (!result.success) throw new Error(result.error || 'Could not load attendance history.');
      setRecords(extractAttendanceRecords(result.data).sort((left, right) => getRecordDate(right).localeCompare(getRecordDate(left))));
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Could not load attendance history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((record) => getRecordDate(record) === todayKey);
  const clockInAt = getRecordTime(todayRecord?.clockInAt || todayRecord?.clockIn || todayRecord?.checkIn);
  const clockOutAt = getRecordTime(todayRecord?.clockOutAt || todayRecord?.clockOut || todayRecord?.checkOut);
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
                    : actionError || loadError || (isComplete
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
                disabled={isClockedIn || isComplete || loading || submitting}
                className="brand-action-button border-0 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:flex-none"
              >
                <CheckCircle2 size={17} />
                {submitting ? 'Working…' : isClockedIn || isComplete ? 'Clocked In' : 'Clock In'}
              </button>
              <button
                type="button"
                onClick={() => performClockAction(clockOut)}
                disabled={!isClockedIn || loading || submitting}
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
              <strong className="ml-auto font-semibold text-slate-900">Office</strong>
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
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border-0 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <ArrowDownToLine size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

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