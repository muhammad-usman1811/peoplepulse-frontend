import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Users,
  Clock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
} from 'lucide-react';

import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './PayrollProcessing.css';

export default function PayrollProcessing() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [activeStep, setActiveStep] = useState(1);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getInitials = (name = '') => {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const formatCurrency = (amount = 0) => {
    return `$${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getMonthName = (month) => {
    if (!month) return '';

    const [year, monthNumber] = month.split('-');

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    );

    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // --------------------------------------------------
  // Fetch Payslips
  // --------------------------------------------------

  const fetchPayslips = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: '1',
      limit: '100',
      month: selectedMonth,
    });

    const result = await apiRequest(
      `/payroll/payslips?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    if (result.success) {
      const responseData = result.data;

      /*
       * Backend response may be:
       *
       * {
       *   payslips: [...]
       * }
       *
       * or:
       *
       * {
       *   data: {
       *     payslips: [...]
       *   }
       * }
       *
       * We support both.
       */

      const payrollList =
        responseData?.payslips ||
        responseData?.data?.payslips ||
        responseData?.data ||
        [];

      setPayslips(
        Array.isArray(payrollList)
          ? payrollList
          : []
      );
    } else {
      setPayslips([]);

      setError(
        result.error ||
          'Unable to load payroll data.'
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPayslips();
  }, [selectedMonth]);

  // --------------------------------------------------
  // Generate Payroll
  // --------------------------------------------------

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setError('');
    setMessage('');

    const result = await apiRequest(
      '/payroll/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          month: selectedMonth,
        }),
      }
    );

    if (result.success) {
      const responseData = result.data;

      const count =
        responseData?.count ??
        responseData?.data?.count ??
        0;

      setMessage(
        count
          ? `Payroll generated successfully for ${count} employee${count === 1 ? '' : 's'}.`
          : 'Payroll generated successfully.'
      );

      await fetchPayslips();
    } else {
      setError(
        result.error ||
          'Unable to generate payroll.'
      );
    }

    setGenerating(false);
  };

  // --------------------------------------------------
  // Normalize Payroll Data
  // --------------------------------------------------

  const normalizedEmployees = useMemo(() => {
    return payslips.map((payslip) => {
      const employee =
        payslip.employee ||
        payslip.user ||
        {};

      const employeeName =
        employee.name ||
        employee.fullName ||
        payslip.employeeName ||
        payslip.name ||
        'Unknown Employee';

      const department =
        employee.department?.name ||
        employee.department ||
        payslip.department ||
        '—';

      /*
       * Backend payroll API says:
       *
       * No deductions are configured.
       * Therefore:
       *
       * net pay = gross pay
       */

      const basicPay =
        payslip.basicPay ??
        payslip.basicSalary ??
        payslip.basic ??
        0;

      const allowances =
        payslip.allowancesTotal ??
        payslip.totalAllowances ??
        payslip.allowances ??
        0;

      const grossPay =
        payslip.grossPay ??
        payslip.grossSalary ??
        Number(basicPay || 0) +
          Number(
            typeof allowances === 'number'
              ? allowances
              : 0
          );

      const netPay =
        payslip.netPay ??
        payslip.netSalary ??
        grossPay;

      return {
        id: payslip._id || payslip.id,

        name: employeeName,

        department,

        initials: getInitials(employeeName),

        basicPay: Number(basicPay || 0),

        allowances:
          typeof allowances === 'number'
            ? allowances
            : 0,

        deductions: 0,

        grossPay: Number(grossPay || 0),

        netPay: Number(netPay || 0),

        status:
          payslip.status ||
          'pending',

        payslip,
      };
    });
  }, [payslips]);

  // --------------------------------------------------
  // Department Filter
  // --------------------------------------------------

  const departments = useMemo(() => {
    const uniqueDepartments = [
      ...new Set(
        normalizedEmployees
          .map((employee) => employee.department)
          .filter(
            (department) =>
              department &&
              department !== '—'
          )
      ),
    ];

    return [
      'All Departments',
      ...uniqueDepartments,
    ];
  }, [normalizedEmployees]);

  const filteredEmployees = useMemo(() => {
    if (
      selectedDepartment ===
      'All Departments'
    ) {
      return normalizedEmployees;
    }

    return normalizedEmployees.filter(
      (employee) =>
        employee.department ===
        selectedDepartment
    );
  }, [
    normalizedEmployees,
    selectedDepartment,
  ]);

  // --------------------------------------------------
  // Summary Calculations
  // --------------------------------------------------

  const totalPayroll = useMemo(() => {
    return filteredEmployees.reduce(
      (total, employee) =>
        total + Number(employee.netPay || 0),
      0
    );
  }, [filteredEmployees]);

  const totalEmployees =
    normalizedEmployees.length;

  const pendingCount =
    normalizedEmployees.filter(
      (employee) =>
        employee.status === 'pending'
    ).length;

  const approvedCount =
    normalizedEmployees.filter(
      (employee) =>
        employee.status === 'approved'
    ).length;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout
      breadcrumbs="HR / Payroll Processing"
      role="hr_admin"
      title="Payroll Processing"
    >
      <div className="payroll-page">

        {/* ----------------------------------------- */}
        {/* Messages */}
        {/* ----------------------------------------- */}

        {error && (
          <div className="payroll-alert payroll-alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="payroll-alert payroll-alert-success">
            {message}
          </div>
        )}

        {/* ----------------------------------------- */}
        {/* Summary Cards */}
        {/* ----------------------------------------- */}

        <div className="payroll-summary-grid">

          <div className="payroll-summary-card">
            <div className="payroll-summary-icon">
              <DollarSign size={20} />
            </div>

            <div>
              <span className="payroll-summary-label">
                TOTAL PAYROLL
              </span>

              <h3>
                {formatCurrency(totalPayroll)}
              </h3>

              <p>
                Current payroll
              </p>
            </div>
          </div>

          <div className="payroll-summary-card">
            <div className="payroll-summary-icon">
              <Users size={20} />
            </div>

            <div>
              <span className="payroll-summary-label">
                EMPLOYEES PAID
              </span>

              <h3>
                {approvedCount}
              </h3>

              <p>
                of {totalEmployees} employees
              </p>
            </div>
          </div>

          <div className="payroll-summary-card">
            <div className="payroll-summary-icon">
              <Clock size={20} />
            </div>

            <div>
              <span className="payroll-summary-label">
                PENDING
              </span>

              <h3>
                {pendingCount}
              </h3>

              <p>
                Requires review
              </p>
            </div>
          </div>

          <div className="payroll-summary-card">
            <div className="payroll-summary-icon">
              <CalendarDays size={20} />
            </div>

            <div>
              <span className="payroll-summary-label">
                PAYROLL MONTH
              </span>

              <h3>
                {getMonthName(selectedMonth)}
              </h3>

              <p>
                Selected period
              </p>
            </div>
          </div>

        </div>

        {/* ----------------------------------------- */}
        {/* Run Payroll */}
        {/* ----------------------------------------- */}

        <div className="payroll-processing-card">

          <div className="payroll-processing-header">

            <div>
              <h2>
                Run Payroll — {getMonthName(selectedMonth)}
              </h2>

              <p>
                Generate payslips for active employees
              </p>
            </div>

            <div className="payroll-month-select">

              <CalendarDays size={18} />

              <select
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(
                    event.target.value
                  );

                  setSelectedDepartment(
                    'All Departments'
                  );
                }}
              >
                <option value="2026-09">
                  September 2026
                </option>

                <option value="2026-08">
                  August 2026
                </option>

                <option value="2026-07">
                  July 2026
                </option>

                <option value="2026-06">
                  June 2026
                </option>

                <option value="2026-05">
                  May 2026
                </option>
              </select>

              <ChevronDown size={16} />
            </div>

          </div>

          {/* Steps */}

          <div className="payroll-steps">

            <div
              className={`payroll-step ${
                activeStep >= 1
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveStep(1)
              }
            >
              <span>1</span>
              Review
            </div>

            <div
              className={`payroll-step ${
                activeStep >= 2
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveStep(2)
              }
            >
              <span>2</span>
              Verify
            </div>

            <div
              className={`payroll-step ${
                activeStep >= 3
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveStep(3)
              }
            >
              <span>3</span>
              Approve
            </div>

            <div
              className={`payroll-step ${
                activeStep >= 4
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveStep(4)
              }
            >
              <span>4</span>
              Process
            </div>

          </div>

          {/* Generate Button */}

          <div className="payroll-processing-action">

            <div>
              <strong>
                Ready to generate payroll?
              </strong>

              <p>
                This will create pending payslips
                for employees who do not already
                have a payslip for this month.
              </p>
            </div>

            <button
              type="button"
              className="payroll-generate-btn"
              onClick={handleGeneratePayroll}
              disabled={generating}
            >
              {generating
                ? 'Generating...'
                : 'Generate Payroll'}
            </button>

          </div>

        </div>

        {/* ----------------------------------------- */}
        {/* Employee Payroll */}
        {/* ----------------------------------------- */}

        <div className="payroll-table-card">

          <div className="payroll-table-header">

            <div>
              <h2>
                Employee Payroll
              </h2>

              <p>
                {getMonthName(selectedMonth)}
              </p>
            </div>

            <div className="payroll-filter">

              <select
                value={selectedDepartment}
                onChange={(event) =>
                  setSelectedDepartment(
                    event.target.value
                  )
                }
              >
                {departments.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={16} />

            </div>

          </div>

          {loading ? (
            <div className="payroll-loading">
              Loading payroll...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="payroll-empty">
              <FileText size={32} />

              <h3>
                No payroll records found
              </h3>

              <p>
                Generate payroll for this month
                to create payslips.
              </p>
            </div>
          ) : (
            <div className="payroll-table-wrapper">

              <table className="payroll-table">

                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>DEPARTMENT</th>
                    <th>BASIC PAY</th>
                    <th>ALLOWANCES</th>
                    <th>NET PAY</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredEmployees.map(
                    (employee) => (
                      <tr key={employee.id}>

                        <td>
                          <div className="payroll-employee">

                            <div className="payroll-avatar">
                              {employee.initials}
                            </div>

                            <span>
                              {employee.name}
                            </span>

                          </div>
                        </td>

                        <td>
                          {employee.department}
                        </td>

                        <td>
                          {formatCurrency(
                            employee.basicPay
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            employee.allowances
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              employee.netPay
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`payroll-status ${
                              employee.status
                            }`}
                          >
                            {employee.status ===
                            'approved' ? (
                              <>
                                <CheckCircle2
                                  size={14}
                                />
                                Approved
                              </>
                            ) : employee.status ===
                              'sent_back' ? (
                              'Sent Back'
                            ) : (
                              'Pending'
                            )}
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

          {/* --------------------------------------- */}
          {/* Footer */}
          {/* --------------------------------------- */}

          <div className="payroll-table-footer">

            <span>
              Total Net Payroll
            </span>

            <strong>
              {formatCurrency(totalPayroll)}
            </strong>

          </div>

          {/* --------------------------------------- */}
          {/* Actions */}
          {/* --------------------------------------- */}

          <div className="payroll-actions">

            <button
              type="button"
              className="payroll-save-btn"
              onClick={() => {
                setMessage(
                  'There is currently no Save Draft API in the backend.'
                );
              }}
            >
              Save Draft
            </button>

            <button
              type="button"
              className="payroll-approve-btn"
              onClick={() => {
                setMessage(
                  'Approval is handled by Finance in the current backend API.'
                );
              }}
            >
              Approve & Process
            </button>

          </div>

        </div>

        {/* ----------------------------------------- */}
        {/* Payroll History */}
        {/* ----------------------------------------- */}

        <div className="payroll-history-card">

          <div className="payroll-history-header">
            <div>
              <h2>
                Payroll History
              </h2>

              <p>
                Previously generated payroll
              </p>
            </div>
          </div>

          <div className="payroll-history-table-wrapper">

            <table className="payroll-table">

              <thead>
                <tr>
                  <th>MONTH</th>
                  <th>EMPLOYEES</th>
                  <th>TOTAL PAYROLL</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>

                {['2026-07', '2026-06', '2026-05'].map(
                  (month) => (
                    <tr key={month}>

                      <td>
                        {getMonthName(month)}
                      </td>

                      <td>
                        —
                      </td>

                      <td>
                        —
                      </td>

                      <td>
                        <span className="payroll-status">
                          <FileText size={14} />
                          View in Payslips
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}