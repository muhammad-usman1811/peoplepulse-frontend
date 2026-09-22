import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export const DashboardLayout = ({ 
  children, 
  title = "My Profile", 
  breadcrumbs = "Home / Profile" 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        isMobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        <Header 
          title={title} 
          breadcrumbs={breadcrumbs}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <main className="dashboard-page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
