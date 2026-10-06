import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PeoplePage from './pages/PeoplePage.jsx';
import PersonDetailPage from './pages/PersonDetailPage.jsx';
import DocumentTypesPage from './pages/DocumentTypesPage.jsx';
import DocumentTemplatesPage from './pages/DocumentTemplatesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/people" element={<PeoplePage type="all" />} />
        <Route path="/clients" element={<PeoplePage type="client" />} />
        <Route path="/employees" element={<PeoplePage type="employee" />} />
        <Route path="/contractors" element={<PeoplePage type="contractor" />} />
        <Route path="/people/:id" element={<PersonDetailPage />} />
        <Route path="/document-types" element={
          <ProtectedRoute adminOnly><DocumentTypesPage /></ProtectedRoute>
        } />
        <Route path="/document-templates" element={
          <ProtectedRoute adminOnly><DocumentTemplatesPage /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
