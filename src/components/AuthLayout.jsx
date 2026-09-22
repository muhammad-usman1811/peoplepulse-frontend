import React from 'react';
import { PeoplePulseLogo } from './Icons';
import ApiStatusBadge from './ApiStatusBadge';

export const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Left Branding Panel */}
        <div className="auth-left-panel">
          <div className="left-panel-content">
            <div className="brand-logo-badge">
              <PeoplePulseLogo />
            </div>

            <div className="brand-hero-text">
              <h1>Welcome to PeoplePulse.</h1>
              <p>
                Attendance, leave, payroll, performance and announcements — all in one corporate HRMS.
              </p>
            </div>

            <div className="left-panel-api-status">
              <ApiStatusBadge />
            </div>
          </div>
        </div>

        {/* Right Form Content Panel */}
        <div className="auth-right-panel">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
