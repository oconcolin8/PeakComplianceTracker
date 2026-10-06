import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import DocTypeForm, { TRACKING_LABELS } from '../components/documents/DocTypeForm.jsx';
import toast from 'react-hot-toast';

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
                <th>Tracking</th>
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
                  <td>{TRACKING_LABELS[dt.tracking_type] || 'Expires'}</td>
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
          message={`Delete "${deleteTarget.name}"? It will be removed from all default lists and person checklists. This will fail if any person has a saved record for it.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
