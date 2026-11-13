
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './OrganizationSetup.css';

const API_PATHS = {
  departments: '/org/departments',
  designations: '/org/designations',
  locations: '/org/locations',
};

const getList = (result, key) => {
  const candidates = [
    result?.data?.[key],
    result?.data?.data?.[key],
    result?.[key],
    result?.data?.data,
    result?.data,
  ];

  const list = candidates.find(Array.isArray);
  if (list) return list;

  // Some APIs return an object containing the list under another key.
  if (result?.data && typeof result.data === 'object') {
    const nested = Object.values(result.data).find(Array.isArray);
    if (nested) return nested;
  }

  return [];
};

const getErrorMessage = error =>
  error?.message || 'Request failed. Please try again.';

const normalizeDepartment = (item, index) => ({
  id: String(item._id || item.id || `department-${index}`),
  name: item.name || item.departmentName || '—',
  // The documented department API does not expose a department-head field.
  head: item.head?.name || item.headName || '—',
  employees: item.employeeCount ?? item.employees ?? '—',
  location:
    typeof item.location === 'object'
      ? item.location?.name || '—'
      : item.location || '—',
});

const normalizeDesignation = (item, index) => ({
  id: String(
    typeof item === 'object'
      ? item._id || item.id || `designation-${index}`
      : `designation-${index}`
  ),
  name: typeof item === 'string' ? item : item?.name || '—',
});

const normalizeLocation = (item, index) => ({
  id: String(item._id || item.id || `location-${index}`),
  name: item.name || '—',
  // Type and employee totals aren't part of the documented location schema.
  type: item.type || '—',
  employees: item.employeeCount ?? item.employees ?? '—',
});

export default function OrganizationSetup() {
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');

  const [form, setForm] = useState({
    name: '',
    location: '',
  });

  const loadOrganization = useCallback(async () => {
    setLoading(true);
    setError('');

    const requests = [
      {
        key: 'departments',
        path: API_PATHS.departments,
        normalize: normalizeDepartment,
        setter: setDepartments,
      },
      {
        key: 'designations',
        path: API_PATHS.designations,
        normalize: normalizeDesignation,
        setter: setDesignations,
      },
      {
        key: 'locations',
        path: API_PATHS.locations,
        normalize: normalizeLocation,
        setter: setLocations,
      },
    ];

    const results = await Promise.allSettled(
      requests.map(request =>
        apiRequest(request.path, { method: 'GET' })
      )
    );

    const errors = [];

    results.forEach((settled, index) => {
      const request = requests[index];

      if (settled.status === 'rejected') {
        request.setter([]);
        errors.push(
          `${request.key}: ${getErrorMessage(settled.reason)}`
        );
        return;
      }

      const result = settled.value;

      if (result?.success === false) {
        request.setter([]);
        errors.push(
          `${request.key}: ${result.message || result.error || 'Could not load data.'}`
        );
        return;
      }

      const list = getList(result, request.key);
      request.setter(list.map(request.normalize));
    });

    if (errors.length) {
      setError(`Some organization data could not be loaded. ${errors.join(' | ')}`);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      await loadOrganization();
    };

    if (mounted) run();

    return () => {
      mounted = false;
    };
  }, [loadOrganization]);

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return departments;

    return departments.filter(department =>
      [
        department.name,
        department.head,
        department.location,
      ].some(value =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [departments, searchTerm]);

  const closeModal = () => {
    if (saving) return;

    setModal('');
    setForm({ name: '', location: '' });
    setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError('Please enter a name.');
      return;
    }

    setSaving(true);
    setError('');

    let path;
    let payload;

    if (modal === 'department') {
      path = API_PATHS.departments;
      payload = {
        name,
        location: form.location.trim(),
      };
    } else if (modal === 'designation') {
      path = API_PATHS.designations;
      payload = { name };
    } else if (modal === 'location') {
      path = API_PATHS.locations;
      payload = { name };
    } else {
      setSaving(false);
      return;
    }

    try {
      const result = await apiRequest(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (result?.success === false) {
        throw new Error(
          result.message || result.error || 'Unable to create record.'
        );
      }

      // Reload all lists from the backend rather than inserting
      // a locally fabricated record.
      setModal('');
      setForm({ name: '', location: '' });
      await loadOrganization();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs="Admin / Organization Setup"
      role="super_admin"
      title="Organization Setup"
    >
      <div className="org-page">
        <div className="org-toolbar">
          <button
            type="button"
            className="org-primary-btn"
            onClick={() => {
              setError('');
              setForm({ name: '', location: '' });
              setModal('department');
            }}
          >
            <Plus size={16} />
            Add Department
          </button>
        </div>

        {error && <div className="org-message">{error}</div>}

        {loading && (
          <div className="org-loading">
            Loading organization data…
          </div>
        )}

        <section className="org-card">
          <div className="org-card-heading">
            <div>
              <h2>Departments</h2>
              <p>
                {departments.length} departments across {locations.length} locations
              </p>
            </div>

            <button
              type="button"
              className="org-primary-btn org-small-btn"
              onClick={() => {
                setError('');
                setForm({ name: '', location: '' });
                setModal('department');
              }}
            >
              <Plus size={14} /> Add Department
            </button>
          </div>

          <label className="org-search">
            <Search size={15} />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search departments..."
              aria-label="Search departments"
            />
          </label>

          <div className="org-table-wrap">
            <table className="org-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Head</th>
                  <th>Employees</th>
                  <th>Locations</th>
                </tr>
              </thead>

              <tbody>
                {loading && departments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="org-empty">
                      Loading departments…
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="org-empty">
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map(department => (
                    <tr key={department.id}>
                      <td>{department.name}</td>
                      <td>{department.head}</td>
                      <td>{department.employees}</td>
                      <td>
                        <span className="org-location-badge">
                          {department.location}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="org-bottom-grid">
          <section className="org-card org-designations-card">
            <div className="org-card-heading">
              <div>
                <h2>Designations</h2>
                <p>Job titles used across the org</p>
              </div>
            </div>

            <div className="org-designation-list">
              {designations.map(designation => (
                <span
                  className="org-designation-chip"
                  key={designation.id}
                >
                  {designation.name}
                </span>
              ))}

              <button
                type="button"
                className="org-designation-chip org-add-chip"
                onClick={() => {
                  setError('');
                  setForm({ name: '', location: '' });
                  setModal('designation');
                }}
              >
                <Plus size={12} /> Add designation
              </button>

              {!loading && designations.length === 0 && (
                <span>No designations available.</span>
              )}
            </div>
          </section>

          <section className="org-card">
            <div className="org-card-heading">
              <div>
                <h2>Company Locations</h2>
              </div>

              <button
                type="button"
                className="org-text-btn"
                onClick={() => {
                  setError('');
                  setForm({ name: '', location: '' });
                  setModal('location');
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="org-table-wrap">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Employees</th>
                  </tr>
                </thead>

                <tbody>
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="org-empty">
                        {loading
                          ? 'Loading locations…'
                          : 'No locations available.'}
                      </td>
                    </tr>
                  ) : (
                    locations.map(location => (
                      <tr key={location.id}>
                        <td>{location.name}</td>
                        <td>{location.type}</td>
                        <td>{location.employees}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {modal && (
          <div
            className="org-modal-backdrop"
            onMouseDown={event => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <section
              className="org-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="org-modal-title"
            >
              <div className="org-modal-heading">
                <h2 id="org-modal-title">
                  {modal === 'department'
                    ? 'Add Department'
                    : modal === 'location'
                      ? 'Add Company Location'
                      : 'Add Designation'}
                </h2>

                <button
                  type="button"
                  className="org-close-btn"
                  onClick={closeModal}
                  aria-label="Close"
                  disabled={saving}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <label className="org-field">
                  {modal === 'department'
                    ? 'Department Name'
                    : modal === 'location'
                      ? 'Location Name'
                      : 'Designation Name'}

                  <input
                    required
                    value={form.name}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter name"
                  />
                </label>

                {modal === 'department' && (
                  <label className="org-field">
                    Location
                    <input
                      value={form.location}
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      placeholder="Enter location (optional)"
                    />
                  </label>
                )}

                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-cancel-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="org-primary-btn"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}