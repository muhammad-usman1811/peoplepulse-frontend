
import React, { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiRequest } from '../../services/api';
import './RolesPermissions.css';

const initialRoles = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full access — all modules & settings',
    assigned: 1,
  },
  {
    id: 'hr_admin',
    name: 'HR Admin',
    description: 'Employees, attendance, leave, payroll, recruitment, reports',
    assigned: 3,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Team attendance, leave/WFH approvals, performance reviews',
    assigned: 14,
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Self-service: attendance, leave, payslips, profile',
    assigned: 96,
  },
  {
    id: 'finance_payroll_officer',
    name: 'Finance / Payroll Officer',
    description: 'Payroll module, salary structures, financial reports',
    assigned: 2,
  },
];

const modules = [
  'Employee Management',
  'Attendance',
  'Leave & WFH',
  'Payroll',
  'Recruitment',
  'Performance',
  'Reports',
];

const permissionTypes = ['view', 'edit', 'approve', 'delete'];

const initialPermissions = Object.fromEntries(
  modules.map((module) => [
    module,
    { view: true, edit: true, approve: true, delete: false },
  ])
);

export default function RolesPermissions() {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState('hr_admin');
  const [permissions, setPermissions] = useState(initialPermissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  useEffect(() => {
    let active = true;

    const loadRoles = async () => {
      setLoading(true);
      setError('');

      const result = await apiRequest('/roles', {
        method: 'GET',
      });

      if (!active) return;

      if (result.success) {
        const data = result.data;
        const list = Array.isArray(data)
          ? data
          : data?.roles || data?.data?.roles || data?.data;

        if (Array.isArray(list)) {
          const normalized = list.map((role, index) => ({
            id: role._id || role.id || role.name || String(index),
            name: role.name || role.roleName || 'Unnamed Role',
            description: role.description || '—',
            assigned: role.assignedUsers ?? role.userCount ?? role.assigned ?? 0,
          }));

          setRoles(normalized);

          if (normalized.length) {
            setSelectedRole((current) =>
              normalized.some((role) => role.id === current)
                ? current
                : normalized[0].id
            );
          }
        }
      } else {
        setError(result.error || 'Could not refresh roles. Showing sample data.');
      }

      setLoading(false);
    };

    loadRoles();

    return () => {
      active = false;
    };
  }, []);

  const filteredRoles = roles.filter((role) =>
    `${role.name} ${role.description}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

  const selectedRoleData = roles.find((role) => role.id === selectedRole);

  const togglePermission = (module, permission) => {
    setPermissions((current) => ({
      ...current,
      [module]: {
        ...current[module],
        [permission]: !current[module][permission],
      },
    }));

    setMessage('');
  };

  const handleSave = async () => {
    if (!selectedRoleData) return;

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      roleId: selectedRoleData.id,
      permissions: Object.entries(permissions).map(([module, values]) => ({
        module,
        ...values,
      })),
    };

    const result = await apiRequest(
      `/roles/${encodeURIComponent(selectedRoleData.id)}/permissions`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (!result.success) {
      setError(
        result.error ||
        'Unable to save permissions. Verify the permissions API endpoint and payload.'
      );
      return;
    }

    setMessage('Permissions saved successfully.');
  };

  const handleAddRole = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const result = await apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
      }),
    });

    if (!result.success) {
      setError(result.error || 'Unable to create role. Check the backend endpoint and required fields.');
      return;
    }

    const created = result.data?.role || result.data?.data || result.data;

    const role = {
      id: created?._id || created?.id || String(Date.now()),
      name: created?.name || newRole.name.trim(),
      description: created?.description || newRole.description.trim() || '—',
      assigned: created?.assignedUsers ?? 0,
    };

    setRoles((current) => [...current, role]);
    setSelectedRole(role.id);
    setNewRole({ name: '', description: '' });
    setShowAddRole(false);
    setMessage('Role created successfully.');
  };

  return (
    <DashboardLayout
      breadcrumbs="Admin / Roles & Permissions"
      role="super_admin"
      title="Roles & Permissions"
    >
      <div className="rp-page">
        
        {error && <div className="rp-message rp-error">{error}</div>}
        {message && <div className="rp-message rp-success">{message}</div>}
        {loading && <div className="rp-message">Refreshing roles...</div>}

        <section className="rp-card">
          <div className="rp-card-heading">
            <div>
              <h2>Roles</h2>
              <p>{roles.length} system roles</p>
            </div>
            <button
              className="rp-primary-btn"
              onClick={() => setShowAddRole(true)}
            >
              <Plus size={15} /> Add Role
            </button>
          </div>

          <div className="rp-table-wrap">
            <table className="rp-table rp-roles-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="rp-empty">No roles found.</td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className={selectedRole === role.id ? 'rp-selected-row' : ''}
                      onClick={() => {
                        setSelectedRole(role.id);
                        setMessage('');
                      }}
                    >
                      <td>
                        <button
                          type="button"
                          className="rp-role-select"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRole(role.id);
                            setMessage('');
                          }}
                        >
                          {role.name}
                        </button>
                      </td>
                      <td>{role.description}</td>
                      <td>
                        {role.assigned} {role.assigned === 1 ? 'user' : 'users'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="rp-hint">Select a role to manage its module permissions.</p>
        </section>

        <section className="rp-card">
          <div className="rp-card-heading">
            <div>
              <h2>
                Module Permissions
                {selectedRoleData ? ` — ${selectedRoleData.name}` : ''}
              </h2>
              <p>Toggle module-level access for this role</p>
            </div>
            <button
              className="rp-primary-btn"
              onClick={handleSave}
              disabled={saving || !selectedRoleData}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="rp-table-wrap">
            <table className="rp-table rp-permissions-table">
              <thead>
                <tr>
                  <th>Module</th>
                  {permissionTypes.map((permission) => (
                    <th key={permission} className="rp-permission-heading">
                      {permission}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module}>
                    <td>{module}</td>
                    {permissionTypes.map((permission) => (
                      <td className="rp-checkbox-cell" key={permission}>
                        <input
                          type="checkbox"
                          aria-label={`${module} ${permission}`}
                          checked={Boolean(permissions[module]?.[permission])}
                          onChange={() => togglePermission(module, permission)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {showAddRole && (
          <div
            className="rp-modal-backdrop"
            onMouseDown={() => setShowAddRole(false)}
          >
            <section
              className="rp-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rp-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="rp-modal-heading">
                <h2 id="rp-modal-title">Add Role</h2>
                <button
                  type="button"
                  className="rp-close-btn"
                  aria-label="Close"
                  onClick={() => setShowAddRole(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddRole}>
                <label>
                  Role Name
                  <input
                    required
                    value={newRole.name}
                    onChange={(event) =>
                      setNewRole({ ...newRole, name: event.target.value })
                    }
                    placeholder="e.g. Team Lead"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    rows="3"
                    value={newRole.description}
                    onChange={(event) =>
                      setNewRole({ ...newRole, description: event.target.value })
                    }
                    placeholder="Describe this role's responsibilities"
                  />
                </label>

                <div className="rp-modal-actions">
                  <button
                    type="button"
                    className="rp-cancel-btn"
                    onClick={() => setShowAddRole(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rp-primary-btn">
                    Create Role
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