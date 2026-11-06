import React, { useEffect, useState } from 'react';
import { Download, Clock3, MapPin, X, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './AttendanceManagement.css'; // You can keep sharing the CSS or create a new one

export default function HrAttendanceList() {
    const [records, setRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [resolvedDate, setResolvedDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get today's date in YYYY-MM-DD for the date picker max attribute
    const todayString = new Date().toISOString().split('T')[0];

    const fetchAttendance = async (dateParam, pageParam) => {
        setLoading(true);
        setError('');

        let query = `/attendance?page=${pageParam}&limit=${limit}`;
        if (dateParam) {
            query += `&date=${dateParam}`;
        }

        const result = await apiRequest(query, { method: 'GET' });

        if (result.success) {
            const data = result.data?.data || result.data;
            setRecords(data?.records || []);
            setResolvedDate(data?.date || '');
            if (!selectedDate && data?.date) {
                setSelectedDate(data?.date);
            }
            if (data?.pagination) {
                setTotalPages(data.pagination.totalPages || 1);
                setTotalRecords(data.pagination.totalRecords || 0);
            }
        } else {
            setRecords([]);
            setError(result.error || 'Unable to load attendance records.');
        }

        setLoading(false);
    };

    // Fetch on initial load or when page/selectedDate changes
    useEffect(() => {
        fetchAttendance(selectedDate, page);
    }, [selectedDate, page]);

    // Handler when user picks a new date -> Resets page to 1
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        setPage(1);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '—';
        return timeStr;
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'present': return 'On Time';
            case 'late': return 'Late';
            case 'half-day': return 'Half Day';
            case 'absent': return 'Absent';
            default: return status || '—';
        }
    };

    return (
        <DashboardLayout
            breadcrumbs="HR / Attendance List"
            role="hr_admin"
            title="HR Attendance List"
        >
            <div className="attendance-container">

                {/* Table Card */}
                <div className="attendance-table-card">

                    {/* Table Header & Controls */}
                    <div className="attendance-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2>Daily Attendance</h2>
                            <p>Showing records for: <strong>{resolvedDate || selectedDate || 'Latest'}</strong></p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Date Picker (Disabled future dates) */}
                            <div className="attendance-date-picker-wrapper">
                                <label htmlFor="attendance-date" style={{ marginRight: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Date:</label>
                                <input
                                    id="attendance-date"
                                    type="date"
                                    max={todayString}
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="attendance-error-state" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                            <p>{error}</p>
                            <button
                                onClick={() => fetchAttendance(selectedDate, page)}
                                style={{ marginTop: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <RotateCcw size={14} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="attendance-table-wrapper">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>EMPLOYEE</th>
                                    <th>DEPARTMENT</th>
                                    <th>CLOCK IN</th>
                                    <th>CLOCK OUT</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="attendance-no-results">
                                            Loading attendance records...
                                        </td>
                                    </tr>
                                ) : records.length === 0 && !error ? (
                                    <tr>
                                        <td colSpan="5" className="attendance-no-results">
                                            No attendance records for this date
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => {
                                        const employeeName = record.name || record.employee?.name || 'Unknown Employee';
                                        const department = record.department || record.employee?.department || '—';
                                        const status = formatStatus(record.status);

                                        return (
                                            <tr key={record._id || record.employeeId}>
                                                <td>
                                                    <span className="attendance-employee-name">{employeeName}</span>
                                                </td>
                                                <td>{department}</td>
                                                <td>{formatTime(record.checkIn)}</td>
                                                <td>{formatTime(record.checkOut)}</td>
                                                <td>
                                                    <span className={`attendance-status ${record.status ? record.status.toLowerCase() : ''}`}>
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

                    {/* Server-Side Pagination Footer */}
                    {!loading && totalPages > 1 && (
                        <div className="attendance-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                Page {page} of {totalPages} ({totalRecords} total records)
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </DashboardLayout>
    );
}