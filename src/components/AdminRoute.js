import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute() {
  const { currentUser, userRole } = useAuth();
  
  return currentUser && userRole === 'admin' ? 
    <Outlet /> : 
    <Navigate to="/super-admin-secret-login-portal" />;
}

export default AdminRoute;
