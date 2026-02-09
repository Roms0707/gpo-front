import React from 'react';
import ProtectedRoute from './ProtectedRoute';

interface AdminRouteProps {
  children?: React.ReactNode;
}

/**
 * AdminRoute is a convenience wrapper around ProtectedRoute
 * that specifically requires admin role access.
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute;
