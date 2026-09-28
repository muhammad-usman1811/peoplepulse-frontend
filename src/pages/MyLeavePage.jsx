import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Check, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import {
  applyLeave,
  getLeaveBalances,
  getLeaveRequests,
  LEAVE_TYPES,
  DURATIONS,
} from '../services/leaveWfhApi';
import { todayKey, formatRange } from '../utils/dates';
import {
  cardClass,
  cardTitleClass,
  labelClass,
  inputClass,
  StatusPill,
  SubmitButton,
  FormMessage,
  TableState,
} from '../components/requestUi';

const BALANCE_CARDS = [
  { key: 'annual', label: 'Annual Leave', icon: Calendar },
  { key: 'sick', label: 'Sick Leave', icon: Clock },
  { key: 'casual', label: 'Casual Leave', icon: Check },
];

function StatCard({ icon: Icon, label, balance }) {
  const value = balance?.remaining != null && balance?.total != null
    ? `${balance.remaining} / ${balance.total}`
    : '—';
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" strokeWidth={2.25} />
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1.5 text-xs text-slate-500">days remaining</div>
    </div>
  );
}

const emptyForm = () => ({
  leaveType: LEAVE_TYPES[0].value,
  duration: DURATIONS[0].value,
  fromDate: todayKey(),
  toDate: todayKey(),
  reason: '',
});

export default function MyLeavePage() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    const [balanceResult, requestResult] = await Promise.allSettled([
      getLeaveBalances(),
      getLeaveRequests(),
    ]);
    if (balanceResult.status === 'fulfilled') setBalances(balanceResult.value);
    if (requestResult.status === 'fulfilled') {
      setRequests([...requestResult.value].sort((a, b) => String(b.from).localeCompare(String(a.from))));
      setLoadError('');
    } else {
      setLoadError(requestResult.reason?.message ?? "Couldn't load your leave history.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isHalfDay = form.duration === 'half_day';

  function update(field, value) {
    setSuccess('');
    setFormError('');
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (next.duration === 'half_day' || next.toDate < next.fromDate) next.toDate = next.fromDate;
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    if (!form.fromDate || !form.toDate) return setFormError('Please choose both dates.');
    if (form.toDate < form.fromDate) return setFormError("The 'To' date can't be before the 'From' date.");

    setSubmitting(true);
    try {
      const created = await applyLeave(form);
      setRequests((current) => [created, ...current]);
      setSuccess("Leave request submitted — it's now pending approval.");
      setForm((current) => ({ ...emptyForm(), leaveType: current.leaveType, duration: current.duration }));
      load({ silent: true });
    } catch (error) {
      setFormError(error.message || "Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const balanceFor = (key) => balances.find((balance) => balance.type.toLowerCase().includes(key));

  return (
    <DashboardLayout title="My Leave" breadcrumbs="Home / My Leave">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BALANCE_CARDS.map(({ key, label, icon }) => (
            <StatCard key={key} icon={icon} label={label} balance={balanceFor(key)} />
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className={cardClass} noValidate>
            <h2 className={cardTitleClass}>Apply for Leave</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="leaveType">Leave Type</label>
                <select id="leaveType" className={inputClass} value={form.leaveType} onChange={(event) => update('leaveType', event.target.value)}>
                  {LEAVE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="duration">Duration</label>
                <select id="duration" className={inputClass} value={form.duration} onChange={(event) => update('duration', event.target.value)}>
                  {DURATIONS.map((duration) => <option key={duration.value} value={duration.value}>{duration.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="fromDate">From</label>
                <input id="fromDate" type="date" className={inputClass} value={form.fromDate} onChange={(event) => update('fromDate', event.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="toDate">To</label>
                <input id="toDate" type="date" className={inputClass} value={form.toDate} min={form.fromDate} disabled={isHalfDay} onChange={(event) => update('toDate', event.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass} htmlFor="reason">Reason</label>
              <textarea id="reason" rows={3} placeholder="Brief reason for leave" className={`${inputClass} resize-y`} value={form.reason} onChange={(event) => update('reason', event.target.value)} />
            </div>
            <SubmitButton submitting={submitting}>Submit Request</SubmitButton>
            <FormMessage error={formError} success={success} />
          </form>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>Leave History</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Dates</th>
                    <th className="px-4 py-2.5">Days</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <TableState colSpan={4} loading={loading} error={loadError} empty={requests.length === 0} emptyText="No leave requests yet." onRetry={() => load()} />
                  {!loading && !loadError && requests.map((request) => (
                    <tr key={request.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-800">{request.type}</td>
                      <td className="px-4 py-3 text-slate-700">{formatRange(request.from, request.to)}</td>
                      <td className="px-4 py-3 text-slate-700">{request.days ?? '—'}</td>
                      <td className="px-4 py-3"><StatusPill status={request.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}