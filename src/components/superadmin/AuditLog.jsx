import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import './AuditLog.css';

const API_BASE_URL = 'https://peoplepulse-backend.vercel.app/api';

const ACTION_TYPES = [
  'All Actions',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_RESET',
  'ACTIVATE',
  'DEACTIVATE',
  'OTHER',
];

const getAuthToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('authToken');

const getDateRange = (filter) => {
  if (filter === 'All time') return {};

  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);

  fromDate.setUTCDate(
    fromDate.getUTCDate() - (filter === 'Last 7 days' ? 6 : 29)
  );

  return {
    from: fromDate.toISOString().slice(0, 10),
    to,
  };
};

const formatTimestamp = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateStr} · ${timeStr}`;
};

const formatDetails = (log) => {
  const before = log.meta?.before;
  const after = log.meta?.after;

  if (log.details) return log.details;

  if (before !== undefined || after !== undefined) {
    return [
      before !== undefined ? `Before: ${JSON.stringify(before)}` : '',
      after !== undefined ? `After: ${JSON.stringify(after)}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }

  return log.resourceId || log._id || '—';
};

const getErrorMessage = (body, status) => {
  return (
    body?.message ||
    body?.error ||
    `Failed to load audit logs (HTTP ${status}).`
  );
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [dateFilter, setDateFilter] = useState('Last 7 days');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error(
          'Authentication token not found. Please sign in again.'
        );
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (actionFilter !== 'All Actions') {
        params.set('action', actionFilter);
      }

      const range = getDateRange(dateFilter);

      if (range.from) params.set('from', range.from);
      if (range.to) params.set('to', range.to);

      const response = await fetch(
        `${API_BASE_URL}/audit-logs?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(body, response.status));
      }

      if (body.success === false) {
        throw new Error(body.message || 'Unable to retrieve audit logs.');
      }

      const data = body.data || {};
      const records = Array.isArray(data.logs)
        ? data.logs
        : Array.isArray(data)
          ? data
          : [];

      setLogs(records);

      setPagination({
        total: Number(data.pagination?.total ?? records.length),
        page: Number(data.pagination?.page ?? page),
        limit: Number(data.pagination?.limit ?? 20),
        totalPages: Math.max(
          1,
          Number(data.pagination?.totalPages ?? 1)
        ),
      });
    } catch (err) {
      setLogs([]);
      setPagination({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      setError(err.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return logs;

    return logs.filter((log) => {
      const details = formatDetails(log);

      const searchableText = [
        log.actorName,
        log.actor,
        log.actorRole,
        log.action,
        log.resource,
        log.resourceId,
        log._id,
        details,
        log.createdAt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [logs, search]);

  const exportCsv = (e) => {
    e.preventDefault();
    console.log("Export triggered. Records to export:", filteredLogs);

    if (!filteredLogs || filteredLogs.length === 0) {
      alert("No audit logs available to export.");
      return;
    }

    const columns = ['timestamp', 'actor', 'action', 'details'];

    const rows = filteredLogs.map(log => ({
      timestamp: log.createdAt || log.timestamp || '',
      actor: log.actorName || log.actor || '—',
      action: log.action || '—',
      details: formatDetails(log),
    }));

    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [
      columns.join(','),
      ...rows.map(row => columns.map(col => escapeCsv(row[col])).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'audit-log.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const changeAction = (value) => {
    setPage(1);
    setActionFilter(value);
  };

  const changeDate = (value) => {
    setPage(1);
    setDateFilter(value);
  };

  return (
    <DashboardLayout
      role="super_admin"
      title="Audit Log"
      breadcrumbs="Admin / Audit Log"
    >
      <div className="al-page">
        {/* Controls Bar */}
        <div className="al-toolbar">
          <div className="al-toolbar-left">
            <div className="al-search-box">
              <Search size={15} className="al-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit log..."
                aria-label="Search audit log"
              />
            </div>

            <div className="al-pill-filter">
              <Filter size={14} />
              <select
                value={actionFilter}
                onChange={(e) => changeAction(e.target.value)}
                aria-label="Filter by action"
              >
                {ACTION_TYPES.map((action) => (
                  <option key={action} value={action}>
                    {action === 'All Actions'
                      ? action
                      : action.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="al-pill-filter">
              <Calendar size={14} />
              <select
                value={dateFilter}
                onChange={(e) => changeDate(e.target.value)}
                aria-label="Filter by date"
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>All time</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="al-btn-export"
            onClick={(e) => {
              e.preventDefault();
              exportCsv();
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {error && (
          <div role="alert" className="al-error-alert">
            <strong>Could not load audit logs:</strong> {error}
          </div>
        )}

        {/* Data Table */}
        <section className="al-card">
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>ACTOR</th>
                  <th>ACTION</th>
                  <th>DETAILS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="al-empty">
                      Loading audit events...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="al-empty">
                      Audit events could not be loaded.
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="al-empty">
                      No audit events match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="al-col-timestamp">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="al-col-actor">
                        {log.actorName || log.actor || '—'}
                      </td>
                      <td className="al-col-action">{log.action || '—'}</td>
                      <td className="al-col-details">
                        {formatDetails(log)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="al-pagination">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <div className="al-pagination-btns">
                <button
                  type="button"
                  className="al-btn-nav"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <button
                  type="button"
                  className="al-btn-nav"
                  disabled={loading || page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}