import React, { useEffect, useState } from 'react';
import { Download, Clock3, MapPin, X, Check } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './AttendanceManagement.css';

export default function AttendanceManagement() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const today = new Date();

   const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return year + '-' + month + '-' + day;
};

    const formatDisplayDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateValue) => {
        if (!dateValue) {
            return '—';
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return '—';
        }

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const calculateHours = (clockIn, clockOut) => {
        if (!clockIn || !clockOut) {
            return '—';
        }

        const start = new Date(clockIn);
        const end = new Date(clockOut);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return '—';
        }

        const totalMinutes = Math.floor((end - start) / (1000 * 60));

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'present':
                return 'On Time';

            case 'late':
                return 'Late';

            case 'half-day':
                return 'Half Day';

            case 'absent':
                return 'Absent';

            default:
                return status || '—';
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        setError('');

        const date = formatDateForApi(today);

        const result = await apiRequest(
            `/attendance?from=${date}&to=${date}&limit=100`,
            {
                method: 'GET',
            }
        );

        if (result.success) {
            const responseData = result.data;

            const records =
                responseData?.attendance ||
                responseData?.data?.attendance ||
                [];

            setAttendanceData(Array.isArray(records) ? records : []);
        } else {
            setAttendanceData([]);
            setError(
                result.error ||
                'Unable to load attendance records.'
            );
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const filteredAttendance = attendanceData.filter((record) => {
        const employeeName =
            record.employee?.name ||
            'Unknown Employee';

        return employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
    });

    const presentCount = attendanceData.filter(
        (record) =>
            record.status === 'present' ||
            record.status === 'late' ||
            record.status === 'half-day'
    ).length;

    const lateCount = attendanceData.filter(
        (record) => record.isLate || record.status === 'late'
    ).length;

    const absentCount = attendanceData.filter(
        (record) => record.status === 'absent'
    ).length;

    const handleExport = () => {
        const headers = [
            'Employee',
            'Clock In',
            'Clock Out',
            'Hours',
            'Status',
        ];

        const rows = attendanceData.map((record) => {
            const name =
                record.employee?.name ||
                'Unknown Employee';

            const clockIn = formatTime(record.clockIn);
            const clockOut = formatTime(record.clockOut);
            const hours = calculateHours(
                record.clockIn,
                record.clockOut
            );
            const status = formatStatus(record.status);

            return [
                name,
                clockIn,
                clockOut,
                hours,
                status,
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row
                    .map((value) =>
                        `"${String(value).replace(/"/g, '""')}"`
                    )
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'attendance-report.csv';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout
            breadcrumbs="HR / Attendance Management"
            role="hr_admin"
            title="Attendance Management"
        >
            <div className="attendance-container">

                {/* Summary Cards */}
                <div className="attendance-summary-grid">

                    {/* Present Today */}
                    <div className="attendance-summary-card">
                        <div className="summary-card-title">
                            <Check size={15} />
                            <span>PRESENT TODAY</span>
                        </div>

                        <div className="summary-card-number">
                            {loading ? '—' : presentCount}
                        </div>

                        <div className="summary-card-description present-text">
                            {loading
                                ? 'loading...'
                                : 'attendance records'}
                        </div>
                    </div>

                    {/* Late Arrivals */}
                    <div className="attendance-summary-card">
                        <div className="summary-card-title">
                            <Clock3 size={15} />
                            <span>LATE ARRIVALS</span>
                        </div>

                        <div className="summary-card-number">
                            {loading ? '—' : lateCount}
                        </div>

                        <div className="summary-card-description late-text">
                            clocked in after 9:00 AM
                        </div>
                    </div>

                    {/* WFH */}
                    <div className="attendance-summary-card">
                        <div className="summary-card-title">
                            <MapPin size={15} />
                            <span>WFH TODAY</span>
                        </div>

                        <div className="summary-card-number">
                            —
                        </div>

                        <div className="summary-card-description">
                            not provided by attendance API
                        </div>
                    </div>

                    {/* Absent */}
                    <div className="attendance-summary-card">
                        <div className="summary-card-title">
                            <X size={15} />
                            <span>ABSENT</span>
                        </div>

                        <div className="summary-card-number">
                            {loading ? '—' : absentCount}
                        </div>

                        <div className="summary-card-description">
                            marked absent
                        </div>
                    </div>

                </div>

                {/* Attendance Table Card */}
                <div className="attendance-table-card">

                    {/* Table Header */}
                    <div className="attendance-table-header">

                        <div>
                            <h2>Today's Attendance</h2>
                            <p>{formatDisplayDate(today)}</p>
                        </div>

                        <button
                            type="button"
                            className="attendance-export-btn"
                            onClick={handleExport}
                            disabled={loading || attendanceData.length === 0}
                        >
                            <Download size={15} />
                            <span>Export</span>
                        </button>

                    </div>

                    {/* Search */}
                    <div className="attendance-search-row">
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />
                    </div>

                    {error && (
                        <div className="attendance-no-results">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    <div className="attendance-table-wrapper">
                        <table className="attendance-table">

                            <thead>
                                <tr>
                                    <th>EMPLOYEE</th>
                                    <th>CLOCK IN</th>
                                    <th>CLOCK OUT</th>
                                    <th>HOURS</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="attendance-no-results"
                                        >
                                            Loading attendance...
                                        </td>
                                    </tr>
                                ) : filteredAttendance.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="attendance-no-results"
                                        >
                                            {searchTerm
                                                ? 'No employees found.'
                                                : 'No attendance records found for today.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttendance.map((record) => {

                                        const employeeName =
                                            record.employee?.name ||
                                            'Unknown Employee';

                                        const status =
                                            formatStatus(record.status);

                                        return (
                                            <tr
                                                key={
                                                    record._id ||
                                                    `${record.employee?._id}-${record.date}`
                                                }
                                            >

                                                <td>
                                                    <span className="attendance-employee-name">
                                                        {employeeName}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatTime(
                                                        record.clockIn
                                                    )}
                                                </td>

                                                <td>
                                                    {formatTime(
                                                        record.clockOut
                                                    )}
                                                </td>

                                                <td>
                                                    {calculateHours(
                                                        record.clockIn,
                                                        record.clockOut
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`attendance-status ${status
                                                            .toLowerCase()
                                                            .replace(/\s+/g, '-')
                                                        }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>

                        </table>
                    </div>

                </div>

            </div>
        </DashboardLayout>
    );
}
