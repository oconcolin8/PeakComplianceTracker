import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import toast from 'react-hot-toast';

function DocTypeForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', warning_days: 30, is_required: true,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked
             : e.target.type === 'number' ? Number(e.target.value)
             : e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
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
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Name *</label>
        <input className="form-input" value={form.name} onChange={set('name')} required />
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={2} value={form.description || ''} onChange={set('description')} />
      </div>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Warning Days (before expiry)</label>
          <input type="number" className="form-input" min={1} max={365} value={form.warning_days} onChange={set('warning_days')} />
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input type="checkbox" id="is_req" checked={!!form.is_required} onChange={set('is_required')} />
            <label htmlFor="is_req" className="form-label" style={{ marginBottom: 0 }}>Required</label>
          </div>
        </div>
      </div>
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function DocumentTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTypes = useCallback(() => {
    setLoading(true);
    api.get('/document-types')
      .then((r) => setTypes(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  async function handleAdd(form) {
    const { data } = await api.post('/document-types', form);
    toast.success(`"${data.name}" created`);
    fetchTypes();
  }

  async function handleEdit(form) {
    const { data } = await api.put(`/document-types/${editTarget.id}`, form);
    toast.success(`"${data.name}" updated`);
    fetchTypes();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/document-types/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Document Types</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Type</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Warning Days</th>
                <th>Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No document types yet.</td></tr>
              ) : types.map((dt) => (
                <tr key={dt.id}>
                  <td style={{ fontWeight: 600 }}>{dt.name}</td>
                  <td className="text-secondary">{dt.description || '—'}</td>
                  <td>{dt.warning_days} days</td>
                  <td>{dt.is_required ? 'Yes' : 'No'}</td>
                  <td style={{ display: 'flex', gap: '0.375rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditTarget(dt)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(dt)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Document Type" onClose={() => setShowAdd(false)}>
          <DocTypeForm onSave={handleAdd} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit: ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <DocTypeForm initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Document Type"
          message={`Delete "${deleteTarget.name}"? This will fail if any person records reference this type.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
