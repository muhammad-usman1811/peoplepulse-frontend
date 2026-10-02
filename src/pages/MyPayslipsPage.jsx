import React, { useEffect, useState } from 'react';
import { Download, DollarSign, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { cardClass, cardTitleClass } from '../components/requestUi';
import { getMyPayslip, getMyPayslips } from '../services/api';

const formatPkR = (value) => `PKR ${Number(value || 0).toLocaleString('en-US')}`;

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const sum = (items) => items.reduce((total, item) => total + toAmount(item.amount), 0);

function normalizeLines(value, fallbackLabel) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      if (Array.isArray(entry)) return { label: String(entry[0] || fallbackLabel), amount: toAmount(entry[1]) };
      if (typeof entry !== 'object' || entry === null) return { label: `${fallbackLabel} ${index + 1}`, amount: toAmount(entry) };
      return {
        label: entry.label || entry.name || entry.title || entry.component || `${fallbackLabel} ${index + 1}`,
        amount: toAmount(entry.amount ?? entry.value ?? entry.total ?? entry.monthlyAmount)
      };
    });
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(([label, entry]) => ({
      label,
      amount: toAmount(typeof entry === 'object' && entry !== null ? entry.amount ?? entry.value ?? entry.total : entry)
    }));
  }

  return value == null ? [] : [{ label: fallbackLabel, amount: toAmount(value) }];
}

function extractPayslips(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of ['payslips', 'items', 'results', 'records', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
    const nested = extractPayslips(payload[key]);
    if (nested.length) return nested;
  }

  return [];
}

function unwrapPayslip(payload) {
  return payload?.payslip || payload?.data?.payslip || payload?.data?.data || payload?.data || payload;
}

function formatPeriod(record) {
  const period = record.period || record.payPeriod || record.payrollMonth || record.month || record.date;
  if (period && typeof period === 'object') {
    return [period.month || period.name, period.year].filter(Boolean).join(' ') || 'Payslip';
  }

  const year = record.year;
  if (year && /^\d{1,2}$/.test(String(period))) {
    return new Date(Number(year), Number(period) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const monthMatch = String(period || '').match(/^(\d{4})-(\d{1,2})$/);
  if (monthMatch) {
    return new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return period ? String(period) : year ? String(year) : 'Payslip';
}

function normalizePayslip(record, index = 0) {
  const earnings = normalizeLines(record.earnings ?? record.allowances ?? record.components ?? record.salaryBreakdown, 'Earnings');
  const deductionsList = normalizeLines(record.deductionItems ?? record.deductions ?? record.deductionBreakdown, 'Deductions');
  const grossValue = record.grossPay ?? record.grossSalary ?? record.grossAmount ?? record.totalEarnings ?? record.gross;
  const deductionValue = typeof record.deductions === 'number'
    ? record.deductions
    : record.totalDeductions ?? record.deductionsTotal ?? record.deductionAmount;
  const netValue = record.netPay ?? record.netSalary ?? record.netAmount ?? record.net;
  const gross = grossValue == null ? sum(earnings) : toAmount(grossValue);
  const deductions = deductionValue == null ? sum(deductionsList) : toAmount(deductionValue);
  const period = formatPeriod(record);

  return {
    ...record,
    id: record.id || record._id || record.payslipId || `${period}-${index}`,
    period,
    earnings,
    deductionsList,
    gross,
    deductions,
    net: netValue == null ? gross - deductions : toAmount(netValue)
  };
}

const styles = `
  .payslips-page {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .payslips-card {
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
  }
  .payslips-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .payslips-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 0.75rem;
  }
  .payslips-table th {
    padding: 0.8rem 0.9rem;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
    background: #f8fafc;
  }
  .payslips-table td {
    padding: 0.9rem;
    border-top: 1px solid #edf2f7;
    font-size: 13px;
    color: #0f172a;
  }
  .payslips-table tbody tr {
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .payslips-table tbody tr:hover {
    background: #f8fafc;
  }
  .payslips-table tbody tr[aria-selected='true'] td:first-child {
    box-shadow: inset 4px 0 0 #2C6F7F;
  }
  .payslips-download-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    background: #2C6F7F;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.55rem 0.9rem;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .payslips-download-btn:hover {
    background: #245D69;
  }
  .payslips-download-btn.secondary {
    background: white;
    border: 1px solid #2C6F7F;
    color: #2C6F7F;
  }
  .payslips-download-btn.secondary:hover {
    background: #EAF3F5;
  }
  .payslips-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }
  .payslips-detail-block {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    padding: 0.85rem 0.9rem 0.2rem;
  }
  .payslips-detail-block h3 {
    margin: 0 0 0.75rem;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  }
  .payslips-line {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 0.2rem;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    color: #0f172a;
  }
  .payslips-line:last-child {
    border-bottom: none;
  }
  .payslips-empty {
    padding: 0.9rem 0.2rem 0.3rem;
    font-size: 13px;
    color: #64748b;
  }
  @media (max-width: 900px) {
    .payslips-detail-grid {
      grid-template-columns: 1fr;
    }
    .payslips-table {
      min-width: 620px;
    }
    .payslips-scroll {
      overflow-x: auto;
    }
  }
`;

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRetryCount, setDetailRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadPayslips = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const result = await getMyPayslips({ page: 1, limit: 100 });
        if (!result.success) throw new Error(result.error || 'Could not load your payslips.');
        const records = extractPayslips(result.data);
        const normalized = records
          .filter((record) => record && typeof record === 'object')
          .map(normalizePayslip);
        if (!active) return;
        setPayslips(normalized);
        setSelectedId((currentId) => normalized.some((payslip) => payslip.id === currentId)
          ? currentId
          : normalized[0]?.id || '');
      } catch (error) {
        if (!active) return;
        setPayslips([]);
        setSelectedId('');
        setLoadError(error.message || 'Could not load your payslips.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPayslips();
    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError('');
      return undefined;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError('');

    getMyPayslip(selectedId).then((result) => {
      if (!active) return;
      if (!result.success) throw new Error(result.error || 'Could not load this payslip detail.');
      const record = unwrapPayslip(result.data);
      if (!record || typeof record !== 'object') throw new Error('The payslip detail response was empty.');
      setDetail(normalizePayslip(record));
    }).catch((error) => {
      if (active) {
        setDetail(null);
        setDetailError(error.message || 'Could not load this payslip detail.');
      }
    }).finally(() => {
      if (active) setDetailLoading(false);
    });

    return () => {
      active = false;
    };
  }, [selectedId, detailRetryCount]);

  const selectedFromList = payslips.find((payslip) => payslip.id === selectedId);
  const selected = detail?.id === selectedId ? { ...selectedFromList, ...detail } : selectedFromList;

  const handleDownload = (payslip) => {
    if (!payslip) return;
    console.log(`Download payslip: ${payslip.period}`);
  };

  return (
    <DashboardLayout title="My Payslips" breadcrumbs="Home / My Payslips">
      <style>{styles}</style>

      <div className="payslips-page">
        <section className={cardClass}>
          <div className="payslips-header">
            <div>
              <h2 className={cardTitleClass}>Payslip History</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{loading ? 'Loading payroll data…' : 'Current year'}</span>
            </div>
          </div>

          {loadError && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              <span>{loadError}</span>
              <button type="button" className="font-semibold underline" onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </button>
            </div>
          )}

          <div className="payslips-scroll">
            <table className="payslips-table">
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-500">Loading payslips…</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-red-600">Payslips could not be loaded.</td></tr>
                ) : payslips.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-500">No payslips available.</td></tr>
                ) : payslips.map((payslip) => (
                  <tr
                    key={payslip.id}
                    aria-selected={payslip.id === selectedId}
                    onClick={() => setSelectedId(payslip.id)}
                  >
                    <td>{payslip.period}</td>
                    <td>{formatPkR(payslip.gross)}</td>
                    <td>{formatPkR(payslip.deductions)}</td>
                    <td>{formatPkR(payslip.net)}</td>
                    <td>
                      <button
                        type="button"
                        className="payslips-download-btn secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownload(payslip);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cardClass}>
          <div className="payslips-header">
            <div>
              <h2 className={cardTitleClass}>{selected?.period || 'Payslip'} — Detail</h2>
              <div className="mt-1 text-xs text-slate-500">Net pay: {selected ? formatPkR(selected.net) : '—'}</div>
            </div>
            <button
              type="button"
              className="payslips-download-btn"
              onClick={() => handleDownload(selected)}
            >
              <FileText className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>

          {detailLoading && <p className="mt-3 text-xs text-slate-500">Loading payslip details…</p>}
          {detailError && (
            <p className="mt-3 text-xs text-red-600" role="alert">
              {detailError}{' '}
              <button type="button" className="font-semibold underline" onClick={() => setDetailRetryCount((count) => count + 1)}>
                Retry
              </button>
            </p>
          )}

          <div className="payslips-detail-grid">
            <div className="payslips-detail-block">
              <h3>Earnings</h3>
              {selected?.earnings?.length ? (
                selected.earnings.map((entry) => (
                  <div className="payslips-line" key={entry.label}>
                    <span>{entry.label}</span>
                    <strong>{formatPkR(entry.amount)}</strong>
                  </div>
                ))
              ) : (
                <div className="payslips-empty">{selected ? 'No earnings available.' : 'Select a payslip to view details.'}</div>
              )}
            </div>

            <div className="payslips-detail-block">
              <h3>Deductions</h3>
              {selected?.deductionsList?.length ? (
                selected.deductionsList.map((entry, index) => (
                  <div className="payslips-line" key={`${entry.label}-${index}`}>
                    <span>{entry.label}</span>
                    <strong>{formatPkR(entry.amount)}</strong>
                  </div>
                ))
              ) : (
                <div className="payslips-empty">{selected ? 'No deductions available.' : 'Select a payslip to view details.'}</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
