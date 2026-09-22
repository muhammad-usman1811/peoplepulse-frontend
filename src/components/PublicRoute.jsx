import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

export const PublicRoute = ({ children }) => {
  const auth = isAuthenticated();

  if (auth) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicRoute;
