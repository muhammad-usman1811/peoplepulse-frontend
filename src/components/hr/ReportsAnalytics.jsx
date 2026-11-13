import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { apiRequest } from "../../services/api";
import "./ReportsAnalytics.css";

const tabs = [
    "Attendance",
    "Leave",
    "Payroll",
    "Headcount",
];

export default function ReportsAnalytics() {
    const [activeTab, setActiveTab] = useState("Attendance");

    const [attendanceReport, setAttendanceReport] = useState(null);
    const [leaveReport, setLeaveReport] = useState(null);
    const [payrollReport, setPayrollReport] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const date = new Date();

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;
    });

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const getLast30Days = () => {
        const to = new Date();
        const from = new Date();

        from.setDate(from.getDate() - 29);

        return {
            from: formatDate(from),
            to: formatDate(to),
        };
    };

    const fetchReports = async () => {
        setLoading(true);
        setError("");

        const { from, to } = getLast30Days();

        const [attendanceResult, leaveResult, payrollResult] =
            await Promise.all([
                apiRequest(
                    `/reports/attendance-summary?from=${from}&to=${to}`,
                    {
                        method: "GET",
                    }
                ),

                apiRequest(
                    `/reports/leave-summary?from=${from}&to=${to}`,
                    {
                        method: "GET",
                    }
                ),

                apiRequest(
                    `/reports/payroll-summary?month=${selectedMonth}`,
                    {
                        method: "GET",
                    }
                ),
            ]);

        let hasError = false;

        if (attendanceResult.success) {
            setAttendanceReport(
                attendanceResult.data?.data ||
                attendanceResult.data ||
                null
            );
        } else {
            setAttendanceReport(null);
            hasError = true;
        }

        if (leaveResult.success) {
            setLeaveReport(
                leaveResult.data?.data ||
                leaveResult.data ||
                null
            );
        } else {
            setLeaveReport(null);
            hasError = true;
        }

        if (payrollResult.success) {
            setPayrollReport(
                payrollResult.data?.data ||
                payrollResult.data ||
                null
            );
        } else {
            setPayrollReport(null);
            hasError = true;
        }

        if (hasError) {
            setError(
                "Some reports could not be loaded. Please try again."
            );
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, [selectedMonth]);

    const calculateAttendanceRate = () => {
        if (!attendanceReport) return null;

        const total = Number(attendanceReport.total || 0);

        const byStatus = attendanceReport.byStatus || {};

        const present =
            Number(byStatus.present || 0) +
            Number(byStatus.late || 0);

        if (!total) return null;

        return Math.round((present / total) * 1000) / 10;
    };

    const getLeaveUtilization = () => {
        if (!leaveReport) return null;

        const total = Number(leaveReport.total || 0);

        if (!total) return null;

        return total;
    };

    const formatCurrency = (amount) => {
        const value = Number(amount || 0);

        return new Intl.NumberFormat("en-PK", {
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getPayrollCost = () => {
        if (!payrollReport) return null;

        return payrollReport.totalNetPay ?? null;
    };

    const renderAttendanceData = () => {
        if (!attendanceReport) {
            return null;
        }

        const byStatus = attendanceReport.byStatus || {};

        return (
            <section className="attendance-trend-card">
                <h2>
                    Attendance Summary
                </h2>

                <div className="attendance-week-grid">

                    {Object.entries(byStatus).map(
                        ([status, count]) => (
                            <div
                                className="attendance-week"
                                key={status}
                            >
                                <div className="week-name">
                                    {status
                                        .replace("-", " ")
                                        .replace(/\b\w/g, (letter) =>
                                            letter.toUpperCase()
                                        )}
                                </div>

                                <div className="week-bar-track">
                                    <div
                                        className="week-bar"
                                        style={{
                                            width: `${
                                                attendanceReport.total
                                                    ? Math.min(
                                                        100,
                                                        (Number(count) /
                                                            Number(
                                                                attendanceReport.total
                                                            )) *
                                                            100
                                                    )
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>

                                <div className="week-value">
                                    {count}
                                </div>
                            </div>
                        )
                    )}

                </div>
            </section>
        );
    };

    const renderLeaveData = () => {
        if (!leaveReport) {
            return null;
        }

        const byType = leaveReport.byType || {};

        return (
            <section className="attendance-trend-card">
                <h2>
                    Leave Summary
                </h2>

                <div className="attendance-week-grid">

                    {Object.entries(byType).map(
                        ([type, count]) => (
                            <div
                                className="attendance-week"
                                key={type}
                            >
                                <div className="week-name">
                                    {type
                                        .replace("-", " ")
                                        .replace(/\b\w/g, (letter) =>
                                            letter.toUpperCase()
                                        )}
                                </div>

                                <div className="week-bar-track">
                                    <div
                                        className="week-bar"
                                        style={{
                                            width: `${
                                                leaveReport.total
                                                    ? Math.min(
                                                        100,
                                                        (Number(count) /
                                                            Number(
                                                                leaveReport.total
                                                            )) *
                                                            100
                                                    )
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>

                                <div className="week-value">
                                    {count}
                                </div>
                            </div>
                        )
                    )}

                </div>
            </section>
        );
    };

    const renderPayrollData = () => {
        if (!payrollReport) {
            return null;
        }

        const byStatus = payrollReport.byStatus || {};

        return (
            <section className="attendance-trend-card">
                <h2>
                    Payroll Summary — {payrollReport.month || selectedMonth}
                </h2>

                <div className="attendance-week-grid">

                    <div className="attendance-week">
                        <div className="week-name">
                            Pending
                        </div>

                        <div className="week-value">
                            {byStatus.pending || 0}
                        </div>
                    </div>

                    <div className="attendance-week">
                        <div className="week-name">
                            Approved
                        </div>

                        <div className="week-value">
                            {byStatus.approved || 0}
                        </div>
                    </div>

                    <div className="attendance-week">
                        <div className="week-name">
                            Sent Back
                        </div>

                        <div className="week-value">
                            {byStatus.sent_back || 0}
                        </div>
                    </div>

                    <div className="attendance-week">
                        <div className="week-name">
                            Gross Pay
                        </div>

                        <div className="week-value">
                            PKR{" "}
                            {formatCurrency(
                                payrollReport.totalGrossPay
                            )}
                        </div>
                    </div>

                </div>
            </section>
        );
    };

    return (
        <DashboardLayout
            title="Reports & Analytics"
            breadcrumbs="HR / Reports & Analytics"
            role="hr_admin"
        >
            <div className="reports-analytics-page">

                {/* =========================================
                    TABS + FILTERS + EXPORTS
                ========================================= */}

                <div className="reports-toolbar">

                    <div className="reports-tabs">

                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={`reports-tab ${
                                    activeTab === tab
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}

                    </div>

                    <div className="reports-actions">

                        <button className="report-filter">
                            <span>▣</span>
                            Last 30 days
                        </button>

                        <button className="report-filter">
                            <span>▽</span>
                            All Departments
                        </button>

                        <div className="export-buttons">

                            <button className="export-button">
                                <span>⇩</span>
                                Export Excel
                            </button>

                            <button className="export-button">
                                <span>⇩</span>
                                Export PDF
                            </button>

                        </div>

                    </div>
                </div>

                {/* =========================================
                    ERROR
                ========================================= */}

                {error && (
                    <div className="performance-alert">
                        {error}
                    </div>
                )}

                {/* =========================================
                    PAYROLL MONTH
                ========================================= */}

                {activeTab === "Payroll" && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: "16px",
                        }}
                    >
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(e.target.value)
                            }
                            className="report-filter"
                        />
                    </div>
                )}

                {/* =========================================
                    STAT CARDS
                ========================================= */}

                <div className="report-stat-grid">

                    {/* HEADCOUNT */}

                    <div className="report-stat-card">

                        <div className="stat-label">
                            <span>♙</span>
                            HEADCOUNT
                        </div>

                        <div className="stat-value">
                            —
                        </div>

                        <div className="stat-sub">
                            No headcount report API
                        </div>

                    </div>

                    {/* ATTENDANCE */}

                    <div className="report-stat-card">

                        <div className="stat-label">
                            <span>◷</span>
                            AVG. ATTENDANCE
                        </div>

                        <div className="stat-value">
                            {loading
                                ? "..."
                                : calculateAttendanceRate() !==
                                  null
                                ? `${calculateAttendanceRate()}%`
                                : "—"}
                        </div>

                        <div className="stat-sub">
                            Last 30 days
                        </div>

                    </div>

                    {/* LEAVE */}

                    <div className="report-stat-card">

                        <div className="stat-label">
                            <span>□</span>
                            LEAVE REQUESTS
                        </div>

                        <div className="stat-value">
                            {loading
                                ? "..."
                                : getLeaveUtilization() !==
                                  null
                                ? getLeaveUtilization()
                                : "—"}
                        </div>

                        <div className="stat-sub">
                            Last 30 days
                        </div>

                    </div>

                    {/* PAYROLL */}

                    <div className="report-stat-card">

                        <div className="stat-label">
                            <span>$</span>
                            PAYROLL COST
                        </div>

                        <div className="stat-value payroll-value">
                            {loading
                                ? "..."
                                : getPayrollCost() !== null
                                ? `PKR ${formatCurrency(
                                    getPayrollCost()
                                )}`
                                : "—"}
                        </div>

                        <div className="stat-sub">
                            {selectedMonth}
                        </div>

                    </div>

                </div>

                {/* =========================================
                    ACTIVE REPORT
                ========================================= */}

                {loading ? (
                    <section className="attendance-trend-card">
                        <h2>Loading report...</h2>
                    </section>
                ) : (
                    <>
                        {activeTab === "Attendance" &&
                            renderAttendanceData()}

                        {activeTab === "Leave" &&
                            renderLeaveData()}

                        {activeTab === "Payroll" &&
                            renderPayrollData()}

                        {activeTab === "Headcount" && (
                            <section className="attendance-trend-card">
                                <h2>
                                    Headcount Report
                                </h2>

                                <div className="performance-empty-state">
                                    The backend currently does not
                                    provide a headcount report
                                    endpoint.
                                </div>
                            </section>
                        )}
                    </>
                )}

            </div>
        </DashboardLayout>
    );
}