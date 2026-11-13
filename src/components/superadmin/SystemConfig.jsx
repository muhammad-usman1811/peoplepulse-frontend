import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import './SystemConfig.css';

const API_BASE_URL = 'https://peoplepulse-backend.vercel.app/api';

const TABS = [
  'Leave Policy',
  'Holiday Calendar',
  'Payroll Settings',
  'WFH Policy',
];

const INITIAL_LEAVE_TYPES = [
  { name: 'Annual Leave', quota: '18 days', accrual: '1.5 / month', carry: 'Up to 6 days' },
  { name: 'Sick Leave', quota: '10 days', accrual: 'Fixed yearly', carry: 'Not allowed' },
  { name: 'Casual Leave', quota: '8 days', accrual: 'Fixed yearly', carry: 'Not allowed' },
  { name: 'Unpaid Leave', quota: 'Unlimited', accrual: 'N/A', carry: 'N/A' },
];

const INITIAL_HOLIDAYS = [
  { name: 'Pakistan Day', date: '2026-03-23', type: 'Public Holiday' },
  { name: 'Labour Day', date: '2026-05-01', type: 'Public Holiday' },
  { name: 'Independence Day', date: '2026-08-14', type: 'Public Holiday' },
];

const getAuthToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('authToken');

async function apiRequest(path, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'Authentication token not found. Check the token key used by your login page.'
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new Error(
      body.message ||
        `System configuration request failed (HTTP ${response.status}).`
    );
  }

  return body;
}

const getSetting = (settings, key, fallback) =>
  Object.prototype.hasOwnProperty.call(settings, key)
    ? settings[key]
    : fallback;

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('Leave Policy');

  const [settings, setSettings] = useState({});
  const [leaveTypes, setLeaveTypes] = useState(INITIAL_LEAVE_TYPES);
  const [wfhDays, setWfhDays] = useState('4');
  const [managerApproval, setManagerApproval] = useState('Yes');

  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);

  const [payroll, setPayroll] = useState({
    currency: 'PKR',
    payDate: '25',
    overtime: '1.5',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [addingLeave, setAddingLeave] = useState(false);
  const [newLeave, setNewLeave] = useState({
    name: '',
    quota: '',
    accrual: 'Fixed yearly',
    carry: 'Not allowed',
  });

  const applySettings = useCallback(data => {
    const map = {};

    for (const setting of data) {
      if (setting && typeof setting.key === 'string') {
        map[setting.key] = setting.value;
      }
    }

    setSettings(map);

    // Map settings returned by the backend to the existing UI.
    const annualAllocation = map['leave.annualAllocation'];

    if (
      annualAllocation &&
      annualAllocation.days !== undefined
    ) {
      setLeaveTypes(current =>
        current.map(item =>
          item.name === 'Annual Leave'
            ? {
                ...item,
                quota: `${annualAllocation.days} days`,
              }
            : item
        )
      );
    }

    if (map['wfh.maxDaysPerMonth'] !== undefined) {
      setWfhDays(String(map['wfh.maxDaysPerMonth']));
    }

    if (map['wfh.managerApprovalRequired'] !== undefined) {
      setManagerApproval(
        map['wfh.managerApprovalRequired'] ? 'Yes' : 'No'
      );
    }

    if (Array.isArray(map['holidays.calendar'])) {
      setHolidays(map['holidays.calendar']);
    }

    setPayroll(current => ({
      currency: map['payroll.currency'] ?? current.currency,
      payDate: String(
        map['payroll.payDate'] ?? current.payDate
      ),
      overtime: String(
        map['payroll.overtimeMultiplier'] ?? current.overtime
      ),
    }));
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const body = await apiRequest('/system-config');
      const list = body.data?.settings;

      if (!Array.isArray(list)) {
        throw new Error(
          'Unexpected API response: data.settings is not an array.'
        );
      }

      applySettings(list);
      setNotice('System configuration loaded successfully.');
    } catch (err) {
      setError(err.message || 'Unable to load system configuration.');
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Each call persists one setting through PUT /system-config.
  const saveSettings = async entries => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updated = { ...settings };

      for (const entry of entries) {
        const body = await apiRequest('/system-config', {
          method: 'PUT',
          body: JSON.stringify({
            key: entry.key,
            value: entry.value,
          }),
        });

        const savedSetting = body.data?.setting;

        if (savedSetting?.key) {
          updated[savedSetting.key] = savedSetting.value;
        } else {
          updated[entry.key] = entry.value;
        }
      }

      setSettings(updated);
      setNotice('Settings saved successfully to the backend.');
    } catch (err) {
      setError(err.message || 'Unable to save system configuration.');
    } finally {
      setSaving(false);
    }
  };

  const saveLeavePolicy = () => {
    const annualQuota = leaveTypes.find(
      item => item.name === 'Annual Leave'
    )?.quota;

    const days = Number.parseInt(annualQuota, 10);

    if (!Number.isFinite(days) || days < 0) {
      setError('Annual leave quota must be a non-negative number of days.');
      return;
    }

    saveSettings([
      {
        key: 'leave.annualAllocation',
        value: { days },
      },
      {
        key: 'wfh.maxDaysPerMonth',
        value: Number(wfhDays),
      },
      {
        key: 'wfh.managerApprovalRequired',
        value: managerApproval === 'Yes',
      },
    ]);
  };

  const saveHolidays = () => {
    if (holidays.some(item => !item.name.trim() || !item.date)) {
      setError('Please complete every holiday name and date.');
      return;
    }

    saveSettings([
      {
        key: 'holidays.calendar',
        value: holidays,
      },
    ]);
  };

  const savePayroll = () => {
    const payDate = Number(payroll.payDate);
    const overtime = Number(payroll.overtime);

    if (
      !Number.isInteger(payDate) ||
      payDate < 1 ||
      payDate > 28
    ) {
      setError('Pay date must be between 1 and 28.');
      return;
    }

    if (!Number.isFinite(overtime) || overtime < 1 || overtime > 5) {
      setError('Overtime multiplier must be between 1 and 5.');
      return;
    }

    saveSettings([
      { key: 'payroll.currency', value: payroll.currency },
      { key: 'payroll.payDate', value: payDate },
      { key: 'payroll.overtimeMultiplier', value: overtime },
    ]);
  };

  const saveWfhPolicy = () => {
    const days = Number(wfhDays);

    if (!Number.isInteger(days) || days < 0 || days > 31) {
      setError('Maximum WFH days must be between 0 and 31.');
      return;
    }

    saveSettings([
      { key: 'wfh.maxDaysPerMonth', value: days },
      {
        key: 'wfh.managerApprovalRequired',
        value: managerApproval === 'Yes',
      },
    ]);
  };

  const addLeaveType = event => {
    event.preventDefault();

    // The documented API does not define a leave-types endpoint.
    // Do not imply this new row has been persisted.
    setLeaveTypes(current => [...current, newLeave]);

    setNewLeave({
      name: '',
      quota: '',
      accrual: 'Fixed yearly',
      carry: 'Not allowed',
    });

    setAddingLeave(false);
    setNotice(
      'Leave type added to this page only. A dedicated leave-type API is needed to persist it.'
    );
  };

  const updateHoliday = (index, field, value) => {
    setHolidays(current =>
      current.map((holiday, i) =>
        i === index ? { ...holiday, [field]: value } : holiday
      )
    );
  };

  return (
    <DashboardLayout
      role="super_admin"
      title="System Configuration"
      breadcrumbs="Admin / System Configuration"
    >
      <div className="sc-page">
        <div
          className="sc-tabs"
          role="tablist"
          aria-label="Configuration sections"
        >
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab);
                setNotice('');
                setError('');
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {(loading || saving) && (
          <div className="sc-notice" role="status">
            {loading
              ? 'Loading configuration...'
              : 'Saving configuration...'}
          </div>
        )}

        {error && (
          <div className="sc-notice" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {notice && (
          <div className="sc-notice" role="status">
            {notice}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="sc-btn sc-btn-outline"
            onClick={fetchSettings}
            disabled={loading || saving}
          >
            <RefreshCw size={14} />
            Refresh from server
          </button>
        </div>

        {activeTab === 'Leave Policy' && (
          <>
            <section className="sc-card">
              <div className="sc-card-heading">
                <div>
                  <h2>Leave Types &amp; Accrual</h2>
                  <p>Configure leave types available company-wide</p>
                </div>

                <button
                  type="button"
                  className="sc-btn sc-btn-outline"
                  onClick={() => setAddingLeave(true)}
                >
                  <Plus size={14} /> Add Leave Type
                </button>
              </div>

              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Annual Quota</th>
                      <th>Accrual</th>
                      <th>Carry Forward</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaveTypes.map((item, index) => (
                      <tr key={`${item.name}-${index}`}>
                        <td>{item.name}</td>
                        <td>
                          {item.name === 'Annual Leave' ? (
                            <input
                              className="sc-inline-input"
                              value={item.quota}
                              onChange={event =>
                                setLeaveTypes(current =>
                                  current.map((leave, i) =>
                                    i === index
                                      ? { ...leave, quota: event.target.value }
                                      : leave
                                  )
                                )
                              }
                            />
                          ) : (
                            item.quota
                          )}
                        </td>
                        <td>{item.accrual}</td>
                        <td>{item.carry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="sc-card sc-wfh-card">
              <h2>WFH Policy Limits</h2>

              <div className="sc-form-row">
                <label>
                  Max WFH days / month
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={wfhDays}
                    onChange={event => setWfhDays(event.target.value)}
                  />
                </label>

                <label>
                  Requires manager approval
                  <select
                    value={managerApproval}
                    onChange={event => setManagerApproval(event.target.value)}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="sc-btn sc-btn-primary"
                onClick={saveLeavePolicy}
                disabled={saving || loading}
              >
                {saving ? 'Saving...' : 'Save Policy'}
              </button>
            </section>
          </>
        )}

        {activeTab === 'Holiday Calendar' && (
          <section className="sc-card">
            <div className="sc-card-heading">
              <div>
                <h2>Holiday Calendar</h2>
                <p>Company-wide holidays and observances</p>
              </div>

              <button
                type="button"
                className="sc-btn sc-btn-outline"
                onClick={() => {
                  setHolidays(current => [
                    ...current,
                    {
                      name: 'New Holiday',
                      date: '',
                      type: 'Public Holiday',
                    },
                  ]);
                }}
              >
                <Plus size={14} /> Add Holiday
              </button>
            </div>

            <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Holiday</th>
                    <th>Date</th>
                    <th>Type</th>
                  </tr>
                </thead>

                <tbody>
                  {holidays.map((holiday, index) => (
                    <tr key={`${holiday.name}-${index}`}>
                      <td>
                        <input
                          className="sc-inline-input"
                          value={holiday.name}
                          onChange={event =>
                            updateHoliday(index, 'name', event.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="sc-inline-input"
                          type="date"
                          value={holiday.date}
                          onChange={event =>
                            updateHoliday(index, 'date', event.target.value)
                          }
                        />
                      </td>

                      <td>
                        <select
                          className="sc-inline-input"
                          value={holiday.type}
                          onChange={event =>
                            updateHoliday(index, 'type', event.target.value)
                          }
                        >
                          <option>Public Holiday</option>
                          <option>Company Holiday</option>
                          <option>Optional Holiday</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="sc-btn sc-btn-primary sc-save-gap"
              onClick={saveHolidays}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Holidays'}
            </button>
          </section>
        )}

        {activeTab === 'Payroll Settings' && (
          <section className="sc-card">
            <h2>Payroll Settings</h2>
            <p className="sc-subtitle">
              Configure organization-wide payroll defaults
            </p>

            <div className="sc-form-row">
              <label>
                Currency
                <select
                  value={payroll.currency}
                  onChange={event =>
                    setPayroll(current => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                >
                  <option>PKR</option>
                  <option>USD</option>
                  <option>AED</option>
                  <option>GBP</option>
                </select>
              </label>

              <label>
                Monthly pay date (day)
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={payroll.payDate}
                  onChange={event =>
                    setPayroll(current => ({
                      ...current,
                      payDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Overtime multiplier
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={payroll.overtime}
                  onChange={event =>
                    setPayroll(current => ({
                      ...current,
                      overtime: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className="sc-btn sc-btn-primary"
              onClick={savePayroll}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Payroll Settings'}
            </button>
          </section>
        )}

        {activeTab === 'WFH Policy' && (
          <section className="sc-card">
            <h2>Work From Home Policy</h2>
            <p className="sc-subtitle">
              Set remote-work limits for employees
            </p>

            <div className="sc-form-row">
              <label>
                Maximum WFH days per month
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={wfhDays}
                  onChange={event => setWfhDays(event.target.value)}
                />
              </label>

              <label>
                Manager approval required
                <select
                  value={managerApproval}
                  onChange={event => setManagerApproval(event.target.value)}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="sc-btn sc-btn-primary"
              onClick={saveWfhPolicy}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save WFH Policy'}
            </button>
          </section>
        )}

        {addingLeave && (
          <div
            className="sc-modal-backdrop"
            onClick={() => setAddingLeave(false)}
          >
            <form
              className="sc-modal"
              onSubmit={addLeaveType}
              onClick={event => event.stopPropagation()}
            >
              <h2>Add Leave Type</h2>

              <label>
                Leave type name
                <input
                  required
                  value={newLeave.name}
                  onChange={event =>
                    setNewLeave(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Annual quota
                <input
                  required
                  value={newLeave.quota}
                  placeholder="e.g. 12 days or Unlimited"
                  onChange={event =>
                    setNewLeave(current => ({
                      ...current,
                      quota: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Accrual
                <select
                  value={newLeave.accrual}
                  onChange={event =>
                    setNewLeave(current => ({
                      ...current,
                      accrual: event.target.value,
                    }))
                  }
                >
                  <option>Fixed yearly</option>
                  <option>Monthly accrual</option>
                  <option>N/A</option>
                </select>
              </label>

              <label>
                Carry forward
                <select
                  value={newLeave.carry}
                  onChange={event =>
                    setNewLeave(current => ({
                      ...current,
                      carry: event.target.value,
                    }))
                  }
                >
                  <option>Not allowed</option>
                  <option>Up to 3 days</option>
                  <option>Up to 6 days</option>
                  <option>Unlimited</option>
                  <option>N/A</option>
                </select>
              </label>

              <div className="sc-modal-actions">
                <button
                  type="button"
                  className="sc-btn sc-btn-outline"
                  onClick={() => setAddingLeave(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="sc-btn sc-btn-primary">
                  Add Leave Type
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
