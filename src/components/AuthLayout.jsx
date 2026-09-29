import React from 'react';
import peoplePulseLogo from '../assets/peoplepulse-logo.png';
import ApiStatusBadge from './ApiStatusBadge';

export const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Left Branding Panel */}
        <div className="auth-left-panel">
          <div className="left-panel-content">
            <div className="brand-logo-badge">
              <img src={peoplePulseLogo} alt="PeoplePulse - HR Management System" className="brand-logo-image" />
            </div>

            <div className="brand-hero-text">
              <h1>Welcome to<br />PeoplePulse.</h1>
              <p>
                Attendance, leave, payroll, performance and<br />
                announcements — all in one corporate HRMS.
              </p>
            </div>

            <div className="left-panel-api-status">
              <ApiStatusBadge />
            </div>
          </div>
        </div>

        {/* Right Form Content Panel */}
        <div className="auth-right-panel">
          <div className="auth-right-panel-inner">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
