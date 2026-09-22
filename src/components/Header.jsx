import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, User, ShieldCheck } from 'lucide-react';
import { logoutUser, getStoredUser } from '../services/api';

export const Header = ({ 
  title = "My Profile", 
  breadcrumbs = "Home / Profile",
  userInitials = "AK",
  onToggleMobileMenu
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getStoredUser();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        {/* Search Bar */}
        <div className="header-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="header-search-input"
          />
        </div>

        {/* Notifications Icon Button */}
        <button 
          type="button" 
          className="header-icon-btn notification-btn"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        {/* User Initials Avatar with Dropdown */}
        <div className="header-user-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            className="header-avatar-badge" 
            title="Click to view profile options"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{userInitials}</span>
          </div>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <div className="dropdown-user-name">
                  {user?.name || 'Ayesha Khan'}
                </div>
                <div className="dropdown-user-email">
                  {user?.email || 'ayesha.khan@company.com'}
                </div>
              </div>
              <div className="dropdown-divider" />
              <button 
                type="button" 
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
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
