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
  Megaphone,
  Bell,
  User,
  LogOut
} from 'lucide-react';
import { logoutUser } from '../services/api';

const mainNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Attendance', path: '/attendance', icon: Clock },
  { name: 'My Leave', path: '/leave', icon: Calendar },
  { name: 'My WFH', path: '/wfh', icon: Compass },
  { name: 'My Payslips', path: '/payslips', icon: DollarSign },
  { name: 'My Performance', path: '/performance', icon: TrendingUp },
  { name: 'My Documents', path: '/documents', icon: FileText },
  { name: 'Onboarding', path: '/onboarding', icon: CheckSquare },
];

const bottomNavItems = [
  { name: 'Announcements', path: '/announcements', icon: Megaphone },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <span>P</span>
          </div>
          <span className="brand-title">PeoplePulse</span>
          <span className="badge-employee">Employee</span>
        </div>

        {/* Main Navigation List */}
        <nav className="sidebar-nav main-nav">
          <ul>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onCloseMobile}
                  >
                    <Icon className="nav-icon" size={18} strokeWidth={1.8} />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation List */}
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
                        `sidebar-link ${isActive ? 'active' : ''}`
                      }
                      onClick={onCloseMobile}
                    >
                      <Icon className="nav-icon" size={18} strokeWidth={1.8} />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
