import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { applyWfh, getWfhRequests } from '../services/leaveWfhApi';
import { todayKey, formatLong, parseKey, toKey, addDays, startOfWeek } from '../utils/dates';
import {
  BRAND,
  cardClass,
  cardTitleClass,
  labelClass,
  inputClass,
  StatusPill,
  SubmitButton,
  FormMessage,
  TableState,
} from '../components/requestUi';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const emptyForm = () => ({ date: todayKey(), reason: '' });

function buildWeek(requests) {
  const byDate = {};
  for (const request of requests) {
    const key = String(request.date ?? '').slice(0, 10);
    if (request.status === 'Approved' || (request.status === 'Pending' && byDate[key] !== 'Approved')) {
      byDate[key] = request.status;
    }
  }
  const monday = startOfWeek(new Date());
  return DAY_LABELS.map((label, index) => {
    const date = addDays(monday, index);
    const status = byDate[toKey(date)];
    let note = index >= 5 ? '—' : 'Office';
    if (status === 'Approved') note = 'WFH';
    if (status === 'Pending') note = 'Pending';
    return { label, day: date.getDate(), note, isWfh: status === 'Approved', isPending: status === 'Pending' };
  });
}

function DayTile({ label, day, note, isWfh, isPending }) {
  return (
    <div
      className={`rounded-lg border px-1 py-2 text-center ${isWfh ? '' : isPending ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
      style={isWfh ? { backgroundColor: BRAND.tealBg, borderColor: BRAND.teal } : undefined}
    >
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-slate-900">{day}</div>
      <div className={`mt-0.5 text-[9px] ${isWfh ? 'font-bold' : 'font-medium'}`} style={{ color: isWfh ? BRAND.tealText : isPending ? '#B45309' : '#94A3B8' }}>
        {note}
      </div>
    </div>
  );
}

export default function MyWFHPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await getWfhRequests();
      setRequests([...list].sort((a, b) => String(b.date).localeCompare(String(a.date))));
      setLoadError('');
    } catch (error) {
      setLoadError(error.message ?? "Couldn't load your WFH history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const week = useMemo(() => buildWeek(requests), [requests]);

  function update(field, value) {
    setSuccess('');
    setFormError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    if (!parseKey(form.date)) return setFormError('Please choose a date.');
    setSubmitting(true);
    try {
      const created = await applyWfh(form);
      setRequests((current) => [created, ...current]);
      setSuccess("WFH request submitted — it's now pending approval.");
      setForm(emptyForm());
      load({ silent: true });
    } catch (error) {
      setFormError(error.message || "Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="My WFH" breadcrumbs="Home / My WFH">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className={cardClass} noValidate>
          <h2 className={cardTitleClass}>Apply for Work From Home</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass} htmlFor="wfhDate">Date</label>
              <input id="wfhDate" type="date" className={inputClass} value={form.date} onChange={(event) => update('date', event.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <label className={labelClass} htmlFor="wfhReason">Reason</label>
            <textarea id="wfhReason" rows={3} placeholder="e.g. Home internet appointment" className={`${inputClass} resize-y`} value={form.reason} onChange={(event) => update('reason', event.target.value)} />
          </div>
          <SubmitButton submitting={submitting} className="border-0">Submit Request</SubmitButton>
          <FormMessage error={formError} success={success} />
        </form>

        <div className="space-y-4">
          <section className={cardClass}>
            <h2 className={cardTitleClass}>My Remote-Day Calendar</h2>
            <p className="text-xs" style={{ color: BRAND.tealText }}>This week</p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {week.map((day) => <DayTile key={day.label} {...day} />)}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>WFH History</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[260px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <TableState colSpan={2} loading={loading} error={loadError} empty={requests.length === 0} emptyText="No WFH requests yet." onRetry={() => load()} />
                  {!loading && !loadError && requests.map((request) => (
                    <tr key={request.id} className="border-t border-slate-100">
                      <td className="px-4 py-3.5 text-slate-800">{formatLong(request.date)}</td>
                      <td className="px-4 py-3.5"><StatusPill status={request.status} /></td>
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