import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './EmployeeDirectory.css';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const limit = 10;

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    const result = await apiRequest(`/employees?${params.toString()}`, {
      method: 'GET',
    });

    if (result.success) {
      const responseData = result.data;

      // Handle common backend response structures
      const employeeList =
        responseData?.employees ||
        responseData?.data?.employees ||
        responseData?.data ||
        [];

      setEmployees(Array.isArray(employeeList) ? employeeList : []);

      const total =
        responseData?.pagination?.total ||
        responseData?.data?.pagination?.total ||
        responseData?.total ||
        0;

      setTotalEmployees(total);
    } else {
      setEmployees([]);
      setError(result.error || 'Unable to load employees.');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, searchTerm]);

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

  return (
    <DashboardLayout
      breadcrumbs={`HR / Employee Directory · ${totalEmployees || 0} employees`}
      role="hr_admin"
      title="Employee Directory"
    >
      <div className="directory-container">

        {/* Top Controls Bar */}
        <div className="directory-actions-bar">
          <div className="directory-search-filters">

            {/* Search Box */}
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />

              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="directory-search-input"
              />
            </div>

            {/* Department Filter */}
            <button
              type="button"
              className="department-filter-btn"
            >
              <Filter size={16} />
              <span>All Departments</span>
            </button>

          </div>

          {/* Add Employee Button */}
          <button
            type="button"
            className="add-employee-btn"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="directory-error">
            {error}
          </div>
        )}

        {/* Directory Data Table */}
        <div className="directory-table-card">
          <div className="table-responsive">
            <table className="directory-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="6" className="directory-empty-state">
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="directory-empty-state">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {

                    const name =
                      emp.name ||
                      emp.fullName ||
                      'Unknown Employee';

                    const status =
                      emp.status ||
                      (emp.isActive ? 'Active' : 'Inactive');

                    return (
                      <tr key={emp._id || emp.id || emp.employeeId}>

                        {/* Employee Profile */}
                        <td>
                          <div className="employee-profile-cell">
                            <div className="employee-avatar">
                              {getInitials(name)}
                            </div>

                            <div className="employee-info">
                              <span className="employee-name">
                                {name}
                              </span>

                              <span className="employee-designation">
                                {emp.designation || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="text-muted">
                          {emp.department || '—'}
                        </td>

                        {/* Email */}
                        <td className="text-muted">
                          {emp.email || '—'}
                        </td>

                        {/* Phone */}
                        <td className="text-muted">
                          {emp.phoneNumber || emp.phone || '—'}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`status-badge ${
                              status.toLowerCase() === 'active'
                                ? 'status-active'
                                : 'status-inactive'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="text-right">
                          <button
                            type="button"
                            className="view-action-btn"
                          >
                            <span>View</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalEmployees > limit && (
          <div className="directory-pagination">

            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {Math.ceil(totalEmployees / limit)}
            </span>

            <button
              type="button"
              disabled={page >= Math.ceil(totalEmployees / limit)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
