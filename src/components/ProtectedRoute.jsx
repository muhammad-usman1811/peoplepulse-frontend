import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  isAuthenticated,
  getStoredUser,
} from '../services/api';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const user = getStoredUser();
  const role = user?.role?.toLowerCase()?.trim();

  // Normalize HR roles so 'hr' and 'hr_admin' work interchangeably
  const isAllowed = !allowedRoles || allowedRoles.some(allowed => {
    const normAllowed = allowed.toLowerCase().trim();
    if (normAllowed === role) return true;
    
    // If route allows either HR role, permit both 'hr' and 'hr_admin'
    const isUserHr = role === 'hr' || role === 'hr_admin';
    const isAllowedHr = normAllowed === 'hr' || normAllowed === 'hr_admin';
    return isUserHr && isAllowedHr;
  });

  if (!isAllowed) {
    const homeByRole = {
      employee: '/dashboard',
      hr: '/hr/dashboard',
      hr_admin: '/hr/dashboard',
      super_admin: '/superadmin/organization-setup',
    };

    return (
      <Navigate
        to={homeByRole[role] || '/hr/dashboard'}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;