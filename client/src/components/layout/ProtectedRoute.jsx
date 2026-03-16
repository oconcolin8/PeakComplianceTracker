import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="app-main">
        <div className="empty-state">
          <h2>Access Denied</h2>
          <p>This page is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  return children;
}
