import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  isAuthenticated,
  getStoredUser,
} from '../services/api';

const PublicRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return children;
  }

  const user = getStoredUser();

  const role = user?.role?.toLowerCase()?.trim();

const homeByRole = {
    employee: '/dashboard',
    hr: '/hr/directory',
    hr_admin: '/hr/directory',
    super_admin: '/superadmin/organization-setup',
    superadmin: '/superadmin/organization-setup',
};

  const homePath = homeByRole[role] || '/login';

  if (homePath === '/login') {
    return children;
  }

  return <Navigate to={homePath} replace />;
};

export default PublicRoute;