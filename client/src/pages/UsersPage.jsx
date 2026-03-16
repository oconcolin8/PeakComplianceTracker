import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import toast from 'react-hot-toast';

function UserForm({ onSave, onClose }) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'viewer' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Full Name *</label>
        <input className="form-input" value={form.full_name} onChange={set('full_name')} />
        {errors.full_name && <span className="form-error">{errors.full_name}</span>}
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Email *</label>
        <input type="email" className="form-input" value={form.email} onChange={set('email')} />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Password *</label>
        <input type="password" className="form-input" value={form.password} onChange={set('password')} />
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Role</label>
        <select className="form-select" value={form.role} onChange={set('role')}>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(form) {
    const { data } = await api.post('/users', form);
    toast.success(`${data.full_name} created`);
    fetchUsers();
  }

  async function handleRoleChange(userId, role) {
    await api.put(`/users/${userId}`, { role });
    toast.success('Role updated');
    fetchUsers();
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      await api.delete(`/users/${deactivateTarget.id}`);
      toast.success(`${deactivateTarget.full_name} deactivated`);
      setDeactivateTarget(null);
      fetchUsers();
    } catch {
      toast.error('Deactivation failed');
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.full_name}
                    {u.id === currentUser?.id && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>(you)</span>
                    )}
                  </td>
                  <td className="text-secondary">{u.email || '—'}</td>
                  <td>
                    {u.id === currentUser?.id ? (
                      <span className="badge badge-current">{u.role}</span>
                    ) : (
                      <select
                        className="form-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td>{u.is_active ? 'Yes' : <span className="text-muted">No</span>}</td>
                  <td>
                    {u.id !== currentUser?.id && u.is_active && (
                      <button className="btn btn-danger btn-sm" onClick={() => setDeactivateTarget(u)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Add User" onClose={() => setShowAdd(false)}>
          <UserForm onSave={handleCreate} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate User"
          message={`Deactivate ${deactivateTarget.full_name}? They will no longer be able to log in.`}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
          loading={deactivating}
        />
      )}
    </div>
  );
}
