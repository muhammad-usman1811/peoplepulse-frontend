import React, { useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  MapPin,
  Timer,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const TIMESHEET = [
  { date: 'Fri, Sep 25', clockIn: '09:02 AM', clockOut: '06:10 PM', hours: '8h 48m', status: 'On Time' },
  { date: 'Thu, Sep 24', clockIn: '09:41 AM', clockOut: '06:12 PM', hours: '8h 31m', status: 'Late' },
  { date: 'Wed, Sep 23', clockIn: '08:56 AM', clockOut: '06:04 PM', hours: '9h 08m', status: 'On Time' },
  { date: 'Tue, Sep 22', clockIn: '09:00 AM', clockOut: '05:30 PM', hours: '8h 30m', status: 'Remote' },
  { date: 'Mon, Sep 21', clockIn: '08:52 AM', clockOut: '06:06 PM', hours: '9h 14m', status: 'On Time' },
];

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

export default function AttendanceManagementPage() {
  const [clockInAt, setClockInAt] = useState(null);
  const [clockOutAt, setClockOutAt] = useState(null);
  const isClockedIn = clockInAt !== null && clockOutAt === null;
  const isComplete = clockInAt !== null && clockOutAt !== null;

  const handleClockIn = () => setClockInAt(formatTime(new Date()));
  const handleClockOut = () => setClockOutAt(formatTime(new Date()));

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
                <p className="text-sm font-medium text-slate-500">Monday, September 28, 2026</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Today&apos;s attendance</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isComplete
                    ? `Day completed · ${clockInAt} – ${clockOutAt}`
                    : isClockedIn
                      ? `Clocked in at ${clockInAt} · Remember to clock out at the end of your day.`
                      : 'You haven’t clocked in yet. Have a good day.'}
                </p>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleClockIn}
                disabled={isClockedIn || isComplete}
                className="brand-action-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:flex-none"
              >
                <CheckCircle2 size={17} />
                {isClockedIn || isComplete ? 'Clocked In' : 'Clock In'}
              </button>
              <button
                type="button"
                onClick={handleClockOut}
                disabled={!isClockedIn}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:flex-none ${
                  isClockedIn
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <Timer size={17} />
                {isComplete ? 'Clocked Out' : 'Clock Out'}
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
              <p className="mt-0.5 text-sm text-slate-500">September 21–25, 2026</p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
                {TIMESHEET.map((row) => (
                  <tr key={row.date} className="border-t border-slate-100">
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