import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Icon = ({ path }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <nav className="app-sidebar">
      <div className="sidebar-section">Navigation</div>
      <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
        Dashboard
      </NavLink>

      <div className="sidebar-section">People</div>
      <NavLink to="/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        Clients
      </NavLink>
      <NavLink to="/employees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        Employees
      </NavLink>
      <NavLink to="/contractors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
        Contractors
      </NavLink>

      {isAdmin && (
        <>
          <div className="sidebar-section">Admin</div>
          <NavLink to="/document-types" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon path="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            Document Types
          </NavLink>
          <NavLink to="/document-templates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon path="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            Default Documents
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            Users
          </NavLink>
        </>
      )}
    </nav>
  );
}
