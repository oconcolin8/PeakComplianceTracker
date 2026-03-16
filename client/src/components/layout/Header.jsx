import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
  }

  return (
    <header className="app-header">
      <span className="app-header__brand">Peak Compliance Tracker</span>
      <div className="app-header__spacer" />
      <div className="app-header__user">
        <span>Signed in as <strong>{user?.full_name || user?.email}</strong></span>
        {user?.role === 'admin' && (
          <span className="badge badge-current" style={{ fontSize: 11 }}>Admin</span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
