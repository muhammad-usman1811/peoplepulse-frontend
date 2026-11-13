import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Search,
  Filter,
  Pencil,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './EmployeeMasterList.css';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  employeeId: '',
  phoneNumber: '',
  department: '',
  designation: '',
  location: '',
  manager: '',
  salaryStructure: '',
  monthlySalary: '',
  status: 'active',
};

const getEmployeeArray = result => {
  const candidates = [
    result?.data?.employees,
    result?.data?.data?.employees,
    result?.employees,
    result?.data?.data,
    result?.data,
    result,
  ];

  return candidates.find(Array.isArray) || [];
};

const getEmployeeError = error =>
  error?.message || 'Something went wrong. Please try again.';

const displayStatus = employee => {
  if (employee.isActive === false) return 'Inactive';

  const status = String(employee.status || 'active').toLowerCase();

  if (status === 'on-leave') return 'On Leave';
  if (status === 'inactive') return 'Inactive';

  return 'Active';
};

const normalizeEmployee = (employee, index) => ({
  // Keep the backend ID for PUT and DELETE requests.
  id: employee._id || employee.id || employee.employeeId || `employee-${index}`,
  employeeId: employee.employeeId || employee._id || employee.id || '—',
  name: employee.name || employee.fullName || 'Unnamed Employee',
  department:
    typeof employee.department === 'object'
      ? employee.department?.name || '—'
      : employee.department || '—',
  designation: employee.designation || employee.jobTitle || '—',
  location:
    typeof employee.location === 'object'
      ? employee.location?.name || '—'
      : employee.location || '—',
  status: displayStatus(employee),
  apiStatus: employee.status || 'active',
  isActive: employee.isActive !== false,
  email: employee.email || '',
  phoneNumber: employee.phoneNumber || '',
  manager:
    typeof employee.manager === 'object'
      ? employee.manager?._id || employee.manager?.name || ''
      : employee.manager || '',
  salaryStructure:
    typeof employee.salaryStructure === 'object'
      ? employee.salaryStructure?._id || ''
      : employee.salaryStructure || '',
  monthlySalary: employee.monthlySalary ?? '',
});

const getApiStatus = status =>
  status === 'On Leave' || status === 'on-leave'
    ? 'on-leave'
    : 'active';

export default function EmployeeMasterList() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [location, setLocation] = useState('All Locations');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiNotice, setApiNotice] = useState('');
  const [modalError, setModalError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setApiNotice('');

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      });

      if (search.trim()) params.set('search', search.trim());

      if (department !== 'All Departments') {
        params.set('department', department);
      }

      if (location !== 'All Locations') {
        params.set('location', location);
      }

      const result = await apiRequest(`/employees?${params.toString()}`, {
        method: 'GET',
      });

      if (result?.success === false) {
        throw new Error(result.message || 'Failed to retrieve employees.');
      }

      const list = getEmployeeArray(result);
      setEmployees(list.map(normalizeEmployee));
    } catch (error) {
      setEmployees([]);
      setApiNotice(getEmployeeError(error));
    } finally {
      setLoading(false);
    }
  }, [search, department, location]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = useMemo(
    () => [
      'All Departments',
      ...new Set(
        employees
          .map(employee => employee.department)
          .filter(value => value && value !== '—')
      ),
    ],
    [employees]
  );

  const locations = useMemo(
    () => [
      'All Locations',
      ...new Set(
        employees
          .map(employee => employee.location)
          .filter(value => value && value !== '—')
      ),
    ],
    [employees]
  );

  // Keep text filtering locally too, so filtering remains responsive
  // even if the backend's search implementation differs.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter(employee => {
      const searchableText = [
        employee.name,
        employee.employeeId,
        employee.email,
        employee.department,
        employee.designation,
        employee.location,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (department === 'All Departments' ||
          employee.department === department) &&
        (location === 'All Locations' || employee.location === location)
      );
    });
  }, [employees, search, department, location]);

  const initials = name =>
    (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalError('');
    setModalOpen(true);
  };

  const openEdit = employee => {
    setEditingId(employee.id);
    setForm({
      name: employee.name === 'Unnamed Employee' ? '' : employee.name,
      email: employee.email,
      password: '',
      employeeId: employee.employeeId === '—' ? '' : employee.employeeId,
      phoneNumber: employee.phoneNumber,
      department:
        employee.department === '—' ? '' : employee.department,
      designation:
        employee.designation === '—' ? '' : employee.designation,
      location: employee.location === '—' ? '' : employee.location,
      manager: employee.manager,
      salaryStructure: employee.salaryStructure,
      monthlySalary: employee.monthlySalary,
      status: employee.apiStatus === 'on-leave' ? 'on-leave' : 'active',
    });

    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setModalError('');
  };

  const saveEmployee = async event => {
    event.preventDefault();
    setSaving(true);
    setModalError('');
    setApiNotice('');

    try {
      const payload = {
        name: form.name.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        location: form.location.trim(),
        employeeId: form.employeeId.trim(),
        status: getApiStatus(form.status),
      };

      if (!editingId) {
        payload.email = form.email.trim();
        payload.password = form.password;
      }

      if (form.phoneNumber.trim()) {
        payload.phoneNumber = form.phoneNumber.trim();
      }

      if (form.manager.trim()) {
        payload.manager = form.manager.trim();
      }

      if (form.salaryStructure.trim()) {
        payload.salaryStructure = form.salaryStructure.trim();
      }

      if (
        form.monthlySalary !== '' &&
        Number.isFinite(Number(form.monthlySalary))
      ) {
        payload.monthlySalary = Number(form.monthlySalary);
      }

      const result = await apiRequest(
        editingId
          ? `/employees/${encodeURIComponent(editingId)}`
          : '/employees',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (result?.success === false) {
        throw new Error(result.message || 'Could not save employee.');
      }

      setModalOpen(false);
      await loadEmployees();
    } catch (error) {
      setModalError(getEmployeeError(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async employee => {
    const isCurrentlyActive = employee.status !== 'Inactive';

    setApiNotice('');

    try {
      if (isCurrentlyActive) {
        const confirmed = window.confirm(
          `Are you sure you want to deactivate ${employee.name}?`
        );

        if (!confirmed) return;

        const result = await apiRequest(
          `/employees/${encodeURIComponent(employee.id)}`,
          { method: 'DELETE' }
        );

        if (result?.success === false) {
          throw new Error(result.message || 'Could not deactivate employee.');
        }
      } else {
        // The documented PUT endpoint supports isActive, so use it
        // to reactivate rather than changing the UI only.
        const payload = {
          name: employee.name,
          employeeId: employee.employeeId,
          department: employee.department === '—' ? '' : employee.department,
          designation: employee.designation === '—' ? '' : employee.designation,
          location: employee.location === '—' ? '' : employee.location,
          status: 'active',
          isActive: true,
        };

        if (employee.phoneNumber) payload.phoneNumber = employee.phoneNumber;
        if (employee.manager) payload.manager = employee.manager;
        if (employee.salaryStructure) {
          payload.salaryStructure = employee.salaryStructure;
        }

        if (
          employee.monthlySalary !== '' &&
          employee.monthlySalary !== null
        ) {
          payload.monthlySalary = Number(employee.monthlySalary);
        }

        const result = await apiRequest(
          `/employees/${encodeURIComponent(employee.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (result?.success === false) {
          throw new Error(result.message || 'Could not activate employee.');
        }
      }

      await loadEmployees();
    } catch (error) {
      setApiNotice(getEmployeeError(error));
    }
  };

  const exportCsv = () => {
    const columns = [
      ['Employee ID', 'employeeId'],
      ['Name', 'name'],
      ['Email', 'email'],
      ['Department', 'department'],
      ['Designation', 'designation'],
      ['Location', 'location'],
      ['Status', 'status'],
    ];

    const escapeCsv = value =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(','),
      ...filtered.map(employee =>
        columns
          .map(([, key]) => escapeCsv(employee[key]))
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'employee-master-list.csv';
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      role="super_admin"
      title="Employee Master List"
      breadcrumbs={`Admin / Employees · ${employees.length} total`}
    >
      <div className="eml-page">
        <div className="eml-toolbar">
          <label className="eml-search">
            <Search size={16} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search employees..."
              aria-label="Search employees"
            />
          </label>

          <label className="eml-select-wrap">
            <Filter size={14} />
            <select
              value={department}
              onChange={event => setDepartment(event.target.value)}
              aria-label="Filter by department"
            >
              {departments.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="eml-select-wrap">
            <Filter size={14} />
            <select
              value={location}
              onChange={event => setLocation(event.target.value)}
              aria-label="Filter by location"
            >
              {locations.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="eml-toolbar-spacer" />

          <button
            type="button"
            className="eml-btn eml-btn-outline"
            onClick={exportCsv}
            disabled={loading || filtered.length === 0}
          >
            <Download size={15} /> Export
          </button>

          <button
            type="button"
            className="eml-btn eml-btn-primary"
            onClick={openAdd}
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>

        {apiNotice && <div className="eml-notice">{apiNotice}</div>}

        <section className="eml-card">
          <div className="eml-card-title">
            <div>
              <h2>Employees</h2>
              <p>
                {loading
                  ? 'Loading employees…'
                  : `${filtered.length} employees shown`}
              </p>
            </div>
          </div>

          <div className="eml-table-scroll">
            <table className="eml-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="eml-empty">
                      Loading employees…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="eml-empty">
                      {apiNotice
                        ? 'Employees could not be loaded. Check the API error above.'
                        : 'No employees match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(employee => (
                    <tr key={employee.id}>
                      <td>
                        <div className="eml-person">
                          <span className="eml-avatar">
                            {initials(employee.name)}
                          </span>
                          <span>
                            <strong>{employee.name}</strong>
                            <small>{employee.employeeId}</small>
                          </span>
                        </div>
                      </td>

                      <td>{employee.department}</td>
                      <td>{employee.designation}</td>
                      <td>{employee.location}</td>

                      <td>
                        <span
                          className={`eml-status ${employee.status
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                        >
                          {employee.status}
                        </span>
                      </td>

                      <td>
                        <div className="eml-row-actions">
                          <button
                            type="button"
                            className="eml-btn eml-btn-small eml-btn-outline"
                            onClick={() => openEdit(employee)}
                          >
                            <Pencil size={13} /> Edit
                          </button>

                          <button
                            type="button"
                            className="eml-btn eml-btn-small eml-btn-danger"
                            onClick={() => toggleStatus(employee)}
                          >
                            {employee.status === 'Inactive'
                              ? 'Activate'
                              : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {modalOpen && (
          <div className="eml-modal-backdrop" onClick={closeModal}>
            <form
              className="eml-modal"
              onSubmit={saveEmployee}
              onClick={event => event.stopPropagation()}
            >
              <div className="eml-modal-heading">
                <h2>{editingId ? 'Edit Employee' : 'Add Employee'}</h2>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="eml-notice">{modalError}</div>
              )}

              {[
                {
                  key: 'name',
                  label: 'Full name',
                  required: true,
                },
                {
                  key: 'employeeId',
                  label: 'Employee ID',
                  required: true,
                },
                {
                  key: 'email',
                  label: 'Email',
                  type: 'email',
                  required: !editingId,
                  createOnly: true,
                },
                {
                  key: 'password',
                  label: 'Password',
                  type: 'password',
                  required: !editingId,
                  createOnly: true,
                },
                {
                  key: 'phoneNumber',
                  label: 'Phone number',
                },
                {
                  key: 'department',
                  label: 'Department',
                  required: true,
                },
                {
                  key: 'designation',
                  label: 'Designation',
                  required: true,
                },
                {
                  key: 'location',
                  label: 'Location',
                  required: true,
                },
                {
                  key: 'manager',
                  label: 'Manager ID (optional)',
                },
                {
                  key: 'salaryStructure',
                  label: 'Salary structure ID (optional)',
                },
                {
                  key: 'monthlySalary',
                  label: 'Monthly salary (optional)',
                  type: 'number',
                },
              ]
                .filter(field => !field.createOnly || !editingId)
                .map(field => (
                  <label className="eml-field" key={field.key}>
                    {field.label}
                    <input
                      required={field.required || false}
                      type={field.type || 'text'}
                      min={field.type === 'number' ? '0' : undefined}
                      value={form[field.key]}
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}

              <label className="eml-field">
                Status
                <select
                  value={form.status}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </label>

              <div className="eml-modal-actions">
                <button
                  type="button"
                  className="eml-btn eml-btn-outline"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="eml-btn eml-btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : editingId
                      ? 'Update Employee'
                      : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
