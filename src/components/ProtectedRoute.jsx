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
  const rawRole = user?.role?.toLowerCase()?.trim();
  
  // Normalize superadmin variations ('superadmin' -> 'super_admin')
  const role = rawRole === 'superadmin' ? 'super_admin' : rawRole;

  // Check if role is allowed
  const isAllowed = !allowedRoles || allowedRoles.some(allowed => {
    const normAllowed = allowed.toLowerCase().trim();
    const fixedAllowed = normAllowed === 'superadmin' ? 'super_admin' : normAllowed;

    if (fixedAllowed === role) return true;
    
    // If route allows either HR role, permit both 'hr' and 'hr_admin'
    const isUserHr = role === 'hr' || role === 'hr_admin';
    const isAllowedHr = fixedAllowed === 'hr' || fixedAllowed === 'hr_admin';
    return isUserHr && isAllowedHr;
  });

  if (!isAllowed) {
    const homeByRole = {
      employee: '/dashboard',
      hr: '/hr/directory',
      hr_admin: '/hr/directory',
      super_admin: '/superadmin/organization-setup',
    };

    // Safe redirect fallback to login or respective home
    return (
      <Navigate
        to={homeByRole[role] || '/login'}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;