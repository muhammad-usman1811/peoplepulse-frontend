
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, User } from 'lucide-react';
import { logoutUser, getStoredUser } from '../services/api';

export const Header = ({
  title = "My Profile",
  breadcrumbs = "Home / Profile",
  onToggleMobileMenu
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getStoredUser();

  // Generate initials from logged-in user's name
  const userInitials = user?.name
    ?.trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="header-title-block">
          <h1 className="header-title">{title}</h1>
          <p className="header-breadcrumb">{breadcrumbs}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="header-search-input"
          />
        </div>

        <button
          type="button"
          className="header-icon-btn notification-btn"
          aria-label="View notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        <div
          className="header-user-menu-container"
          ref={dropdownRef}
          style={{ position: 'relative' }}
        >
          <button
            type="button"
            className="header-avatar-badge"
            title="Click to view profile options"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{userInitials}</span>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <div className="dropdown-user-name">
                  {user?.name || 'User'}
                </div>

                <div className="dropdown-user-email">
                  {user?.email || ''}
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  const role = user?.role?.toLowerCase()?.trim();

                  navigate(
                    role === 'hr' || role === 'hr_admin'
                      ? '/hr/profile'
                      : '/profile'
                  );
                }}
              >
                <User size={15} />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
