import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
LayoutDashboard,
Clock,
Calendar,
Compass,
DollarSign,
TrendingUp,
FileText,
CheckSquare,
CheckCircle,
Megaphone,
Bell,
User,
Users,
Briefcase,
UserPlus,
BarChart2,
LogOut,
Settings,
Shield,
Building2
} from 'lucide-react';

import { logoutUser } from '../services/api';
import "./Sidebar.css";

const ROLE_CONFIG = {
/* =========================
EMPLOYEE
========================= */
employee: {
badgeText: "Employee",
badgeClass: "badge-employee",


mainNavItems: [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'My Attendance',
    path: '/attendance',
    icon: Clock
  },
  {
    name: 'My Leave',
    path: '/leave',
    icon: Calendar
  },
  {
    name: 'My WFH',
    path: '/wfh',
    icon: Compass
  },
  {
    name: 'My Payslips',
    path: '/payslips',
    icon: DollarSign
  },
  {
    name: 'My Performance',
    path: '/performance',
    icon: TrendingUp
  },
  {
    name: 'My Documents',
    path: '/documents',
    icon: FileText
  },
  {
    name: 'Onboarding',
    path: '/onboarding',
    icon: CheckSquare
  },
],

bottomNavItems: [
  {
    name: 'Announcements',
    path: '/announcements',
    icon: Megaphone
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: Bell
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: User
  },
]


},

/* =========================
HR ADMIN
========================= */
hr_admin: {
badgeText: "HR Admin",
badgeClass: "badge-hr-admin",


mainNavItems: [
  {
    name: 'Employee Directory',
    path: '/hr/directory',
    icon: Users
  },
  {
    name: 'Attendance Management',
    path: '/hr/attendance',
    icon: Clock
  },
  {
    name: 'Leave Management',
    path: '/hr/leaves',
    icon: Calendar
  },
  {
    name: 'Payroll Processing',
    path: '/hr/payroll',
    icon: DollarSign
  },
  {
    name: 'Recruitment',
    path: '/hr/recruitment',
    icon: Briefcase
  },
  {
    name: 'Onboarding',
    path: '/hr/onboarding',
    icon: UserPlus
  },
  {
    name: 'Performance Cycles',
    path: '/hr/performance',
    icon: BarChart2
  },
  {
    name: 'Announcements',
    path: '/hr/announcements',
    icon: Megaphone
  },
  {
    name: 'Reports & Analytics',
    path: '/hr/reports',
    icon: BarChart2
  },
],

bottomNavItems: [
  // {
  //   name: 'My Profile',
  //   path: '/hr/profile',
  //   icon: User
  // }
]

},

/* =========================
SUPER ADMIN
========================= */
super_admin: {
badgeText: "Super Admin",
badgeClass: "badge-super-admin",


mainNavItems: [
  {
    name: 'Organization Setup',
    path: '/superadmin/organization-setup',
    icon: Building2
  },
  {
    name: 'Roles & Permissions',
    path: '/superadmin/roles-permissions',
    icon: Shield
  },
  {
    name: 'Employee Master List',
    path: '/superadmin/employees',
    icon: Users
  },
  {
    name: 'System Configuration',
    path: '/superadmin/system-configuration',
    icon: Settings
  },
  {
    name: 'Audit Log',
    path: '/superadmin/audit-log',
    icon: FileText
  },
],

bottomNavItems: []


},

/* =========================
MANAGER
========================= */
manager: {
badgeText: "Manager",
badgeClass: "badge-manager",


mainNavItems: [
  {
    name: 'Team Dashboard',
    path: '/manager/team-dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Approve Requests',
    path: '/manager/approve-requests',
    icon: CheckCircle
  },
  {
    name: 'Team Attendance',
    path: '/manager/team-attendance',
    icon: Clock
  },
  {
    name: 'Performance Reviews',
    path: '/manager/performance-reviews',
    icon: TrendingUp
  },
],

bottomNavItems: []


}
};

export const Sidebar = ({
role = "employee",
isMobileOpen,
onCloseMobile
}) => {
const navigate = useNavigate();

const handleLogout = async () => {
try {
await logoutUser();
} catch (error) {
console.error('Logout error:', error);
} finally {
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('userInfo');
navigate('/login', { replace: true });
}
};

/* =========================
ROLE CONFIG
========================= */
const currentConfig =
ROLE_CONFIG[role] || ROLE_CONFIG.employee;

const mainNavItems =
currentConfig.mainNavItems || [];

const bottomNavItems =
currentConfig.bottomNavItems || [];

return (
<>
{/* Mobile Backdrop */}
{isMobileOpen && ( <div
       className="sidebar-backdrop"
       onClick={onCloseMobile}
       aria-hidden="true"
     />
)}


  <aside
    className={`app-sidebar ${
      isMobileOpen ? 'mobile-open' : ''
    }`}
  >
    {/* BRAND */}
    <div className="sidebar-brand">
      <div className="brand-logo-icon">
        <span>P</span>
      </div>

      <span className="brand-title">
        PeoplePulse
      </span>

      <span
        className={
          currentConfig.badgeClass ||
          "badge-employee"
        }
      >
        {currentConfig.badgeText || "Employee"}
      </span>
    </div>

    {/* MAIN NAVIGATION */}
    <nav className="sidebar-nav main-nav">
      <ul>
        {mainNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? 'active' : ''
                  }`
                }
                onClick={onCloseMobile}
              >
                {Icon && (
                  <Icon
                    className="nav-icon"
                    size={18}
                    strokeWidth={1.8}
                  />
                )}

                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>

    {/* BOTTOM NAVIGATION */}
    {bottomNavItems.length > 0 && (
      <div className="sidebar-bottom-section">
        <div className="sidebar-divider" />

        <nav className="sidebar-nav bottom-nav">
          <ul>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive ? 'active' : ''
                      }`
                    }
                    onClick={onCloseMobile}
                  >
                    {Icon && (
                      <Icon
                        className="nav-icon"
                        size={18}
                        strokeWidth={1.8}
                      />
                    )}

                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    )}

    {/* LOGOUT */}
    <div className="sidebar-footer">
      {(role === 'hr_admin' ||
        role === 'super_admin' ||
        role === 'manager') && (
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
          />

          <span>Log out</span>
        </button>
      )}
    </div>
  </aside>
</>


);
};

export default Sidebar;
