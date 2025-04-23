import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute() {
  const { currentUser, isAdmin, checkUserRole } = useAuth();
  const [checking, setChecking] = useState(true);
  const [adminConfirmed, setAdminConfirmed] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (currentUser) {
        try {
          const role = await checkUserRole(currentUser.uid);
          setAdminConfirmed(role === 'admin');
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setAdminConfirmed(false);
        }
      }
      setChecking(false);
    };

    verifyAdmin();
  }, [currentUser, checkUserRole]);

  if (checking) {
    return <div className="text-center p-5">Verifying admin privileges...</div>;
  }

  if (!currentUser) {
    // Not logged in, redirect to admin login page
    return <Navigate to="/super-admin-secret-login-portal" />;
  }

  if (!adminConfirmed && !isAdmin) {
    // User is not an admin, redirect to home page
    return <Navigate to="/" />;
  }

  // User is an admin, allow access to the admin route
  return <Outlet />;
}

export default AdminRoute;
