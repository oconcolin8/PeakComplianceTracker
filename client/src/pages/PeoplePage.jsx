import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import toast from 'react-hot-toast';

const TYPE_LABELS = { client: 'Client', employee: 'Employee', contractor: 'Contractor', all: 'All People' };

function PersonForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', person_type: 'client', is_active: true, notes: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={form.full_name} onChange={set('full_name')} />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select className="form-select" value={form.person_type} onChange={set('person_type')}>
            <option value="client">Client</option>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email || ''} onChange={set('email')} />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone || ''} onChange={set('phone')} />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={3} value={form.notes || ''} onChange={set('notes')} />
      </div>
      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <input type="checkbox" id="is_active" checked={!!form.is_active} onChange={set('is_active')} />
        <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0 }}>Active</label>
      </div>
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

const ROW_CLASS = { expired: 'row-expired', expiring_soon: 'row-expiring', missing: 'row-missing', current: 'row-current' };

export default function PeoplePage({ type }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || '');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPeople = useCallback(() => {
    setLoading(true);
    const params = {};
    if (type !== 'all') params.type = type;
    if (search) params.search = search;
    api.get('/people', { params })
      .then((r) => setPeople(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, search]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const filtered = statusFilter
    ? people.filter((p) => p.overall_status === statusFilter)
    : people;

  async function handleAdd(form) {
    const { data } = await api.post('/people', form);
    toast.success(`${data.full_name} added`);
    fetchPeople();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/people/${deleteTarget.id}`);
      toast.success(`${deleteTarget.full_name} deactivated`);
      setDeleteTarget(null);
      fetchPeople();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const title = TYPE_LABELS[type] || 'People';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Person</button>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="expired">Expired</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="missing">Missing Docs</option>
          <option value="current">Current</option>
        </select>
        {statusFilter && (
          <button className="btn btn-ghost btn-sm" onClick={() => setStatusFilter('')}>✕ Clear</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Email</th>
                <th>Active</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="empty-state">No people found.</td>
                </tr>
              ) : filtered.map((person) => (
                <tr
                  key={person.id}
                  className={ROW_CLASS[person.overall_status] || ''}
                  onClick={() => navigate(`/people/${person.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{person.full_name}</td>
                  <td>
                    <span className="person-type-badge">{person.person_type}</span>
                  </td>
                  <td><StatusBadge status={person.overall_status} /></td>
                  <td className="text-secondary">{person.email || '—'}</td>
                  <td>{person.is_active ? 'Yes' : <span className="text-muted">No</span>}</td>
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(person)}
                      >
                        Deactivate
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Person" onClose={() => setShowAdd(false)}>
          <PersonForm onSave={handleAdd} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deactivate Person"
          message={`Are you sure you want to deactivate ${deleteTarget.full_name}? They will no longer appear in active lists.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
