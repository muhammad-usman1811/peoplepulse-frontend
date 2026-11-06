import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import './LeaveManagement.css';

const initialLeaveRequests = [
    {
        id: 1,
        initials: 'AK',
        name: 'Ayesha Khan',
        type: 'Annual Leave',
        dates: 'Sep 22 – Sep 24, 2026',
        duration: '3 days',
        stage: 'HR Review',
        status: 'Pending',
    },
    {
        id: 2,
        initials: 'BA',
        name: 'Bilal Ahmed',
        type: 'Sick Leave',
        dates: 'Sep 19, 2026',
        duration: '1 day',
        stage: 'HR Review',
        status: 'Pending',
    },
    {
        id: 3,
        initials: 'SM',
        name: 'Sara Malik',
        type: 'Casual Leave',
        dates: 'Sep 25 – Sep 26, 2026',
        duration: '2 days',
        stage: 'HR Review',
        status: 'Pending',
    },
    {
        id: 4,
        initials: 'HR',
        name: 'Hamza Raza',
        type: 'Annual Leave',
        dates: 'Sep 29 – Oct 01, 2026',
        duration: '3 days',
        stage: 'Completed',
        status: 'Approved',
    },
    {
        id: 5,
        initials: 'ZI',
        name: 'Zainab Iqbal',
        type: 'Sick Leave',
        dates: 'Sep 17 – Sep 18, 2026',
        duration: '2 days',
        stage: 'Completed',
        status: 'Rejected',
    },
    {
        id: 6,
        initials: 'OF',
        name: 'Omar Farooq',
        type: 'Casual Leave',
        dates: 'Oct 05, 2026',
        duration: '1 day',
        stage: 'HR Review',
        status: 'Pending',
    },
];

const leavePolicies = [
    {
        title: 'Annual Leave',
        days: '20 days / year',
        description:
            'Employees can use annual leave for vacations and planned time off.',
    },
    {
        title: 'Sick Leave',
        days: '12 days / year',
        description:
            'Sick leave can be used when an employee is unwell or needs medical attention.',
    },
    {
        title: 'Casual Leave',
        days: '10 days / year',
        description:
            'Casual leave is intended for short-term personal matters.',
    },
];

export default function LeaveManagement() {
    const [activeTab, setActiveTab] = useState('Pending Approvals');

    const [leaveRequests, setLeaveRequests] =
        useState(initialLeaveRequests);

    const [selectedType, setSelectedType] =
        useState('All Leave Types');

    const pendingCount = leaveRequests.filter(
        (request) => request.status === 'Pending'
    ).length;

    let displayedRequests =
        activeTab === 'Pending Approvals'
            ? leaveRequests.filter(
                (request) => request.status === 'Pending'
            )
            : leaveRequests;

    if (selectedType !== 'All Leave Types') {
        displayedRequests = displayedRequests.filter(
            (request) => request.type === selectedType
        );
    }

    return (
        <DashboardLayout
            title="Leave Management"
            breadcrumbs="HR / Leave Management"
            role="hr_admin"
        >
            <div className="leave-management-container">

                {/* =========================
            TABS
        ========================= */}

                <div className="leave-page-tabs">

                    <button
                        type="button"
                        className={`leave-page-tab ${activeTab === 'Pending Approvals'
                                ? 'active'
                                : ''
                            }`}
                        onClick={() =>
                            setActiveTab('Pending Approvals')
                        }
                    >
                        Pending Approvals

                        <span className="pending-tab-count">
                            {pendingCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`leave-page-tab ${activeTab === 'All Requests'
                                ? 'active'
                                : ''
                            }`}
                        onClick={() =>
                            setActiveTab('All Requests')
                        }
                    >
                        All Requests
                    </button>

                    <button
                        type="button"
                        className={`leave-page-tab ${activeTab === 'Leave Policy'
                                ? 'active'
                                : ''
                            }`}
                        onClick={() =>
                            setActiveTab('Leave Policy')
                        }
                    >
                        Leave Policy
                    </button>

                </div>


                {/* =========================
            LEAVE POLICY
        ========================= */}

                {activeTab === 'Leave Policy' ? (

                    <div className="leave-policy-card">

                        <div className="leave-section-header">

                            <div>
                                <h2>Leave Policy</h2>

                                <p>
                                    View leave types and employee
                                    entitlements.
                                </p>
                            </div>

                            <div className="policy-icon">
                                <CalendarDays size={19} />
                            </div>

                        </div>


                        <div className="leave-policy-grid">

                            {leavePolicies.map((policy) => (
                                <div
                                    className="leave-policy-item"
                                    key={policy.title}
                                >
                                    <div className="policy-item-top">

                                        <h3>{policy.title}</h3>

                                        <span>
                                            {policy.days}
                                        </span>

                                    </div>

                                    <p>
                                        {policy.description}
                                    </p>
                                </div>
                            ))}

                        </div>

                    </div>

                ) : (

                    /* =========================
                       REQUESTS
                    ========================= */

                    <div className="leave-requests-card">

                        <div className="leave-requests-header">

                            <div>
                                <h2>Leave Requests</h2>

                                <p>
                                    Review and manage employee leave
                                    requests.
                                </p>
                            </div>


                            <div className="leave-type-filter">

                                <select
                                    value={selectedType}
                                    onChange={(event) =>
                                        setSelectedType(event.target.value)
                                    }
                                >
                                    <option>
                                        All Leave Types
                                    </option>

                                    <option>
                                        Annual Leave
                                    </option>

                                    <option>
                                        Sick Leave
                                    </option>

                                    <option>
                                        Casual Leave
                                    </option>
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="leave-filter-icon"
                                />

                            </div>

                        </div>


                        {/* =========================
                TABLE
            ========================= */}

                        <div className="leave-table-wrapper">

                            <table className="leave-management-table">

                                <thead>
                                    <tr>
                                        <th>EMPLOYEE</th>
                                        <th>TYPE</th>
                                        <th>DATES</th>
                                        <th>DURATION</th>
                                        <th>STAGE</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {displayedRequests.map((request) => (

                                        <tr key={request.id}>

                                            {/* Employee */}

                                            <td>
                                                <div className="leave-employee-cell">

                                                    <div className="leave-employee-avatar">
                                                        {request.initials}
                                                    </div>

                                                    <span className="leave-employee-name">
                                                        {request.name}
                                                    </span>

                                                </div>
                                            </td>


                                            {/* Type */}

                                            <td>
                                                <span className="leave-type-text">
                                                    {request.type}
                                                </span>
                                            </td>


                                            {/* Dates */}

                                            <td>
                                                {request.dates}
                                            </td>


                                            {/* Duration */}

                                            <td>
                                                {request.duration}
                                            </td>


                                            {/* Stage */}

                                            <td>
                                                <span
                                                    className={`leave-stage ${request.stage
                                                            .toLowerCase()
                                                            .replace(/\s+/g, '-')
                                                        }`}
                                                >
                                                    {request.stage}
                                                </span>
                                            </td>


                                            {/* Status */}

                                            <td>
                                                <span
                                                    className={`leave-status-badge ${request.status.toLowerCase()
                                                        }`}
                                                >
                                                    {request.status}
                                                </span>
                                            </td>

                                        </tr>

                                    ))}


                                    {displayedRequests.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="leave-empty-row"
                                            >
                                                No leave requests found.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                )}

            </div>
        </DashboardLayout>
    );
}