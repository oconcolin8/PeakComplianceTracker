import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Modal from '../components/ui/Modal.jsx';
import toast from 'react-hot-toast';

const ROW_CLASS = {
  expired: 'row-expired', expiring_soon: 'row-expiring',
  missing: 'row-missing', current: 'row-current',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

function DocumentRowEditor({ item, personId, onSaved, onClose }) {
  const { document_type, record } = item;
  const [form, setForm] = useState({
    document_type_id: document_type.id,
    issue_date: record?.issue_date ? record.issue_date.slice(0, 10) : '',
    expiry_date: record?.expiry_date ? record.expiry_date.slice(0, 10) : '',
    notes: record?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (record) {
        await api.put(`/people/${personId}/documents/${record.id}`, form);
      } else {
        await api.post(`/people/${personId}/documents`, form);
      }
      toast.success('Document record saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        {document_type.description || `Update the record for "${document_type.name}".`}
      </p>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Date Received</label>
          <input type="date" className="form-input" value={form.issue_date} onChange={set('issue_date')} />
        </div>
        {document_type.has_expiration !== false && (
          <div className="form-group">
            <label className="form-label">Expiration Date</label>
            <input type="date" className="form-input" value={form.expiry_date} onChange={set('expiry_date')} />
          </div>
        )}
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

function PersonEditForm({ person, onSave, onClose }) {
  const [form, setForm] = useState({ ...person });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
          <input className="form-input" value={form.full_name} onChange={set('full_name')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" value={form.person_type} onChange={set('person_type')}>
            <option value="client">Client</option>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email || ''} onChange={set('email')} />
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
        <input type="checkbox" id="edit_active" checked={!!form.is_active} onChange={set('is_active')} />
        <label htmlFor="edit_active" className="form-label" style={{ marginBottom: 0 }}>Active</label>
      </div>
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function PersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDoc, setEditDoc] = useState(null);
  const [editPerson, setEditPerson] = useState(false);

  const fetchPerson = useCallback(() => {
    setLoading(true);
    api.get(`/people/${id}`)
      .then((r) => setPerson(r.data))
      .catch(() => toast.error('Failed to load person'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPerson(); }, [fetchPerson]);

  async function handleSavePerson(form) {
    const { data } = await api.put(`/people/${id}`, form);
    setPerson((prev) => ({ ...prev, ...data }));
    toast.success('Person updated');
  }

  if (loading) return <Spinner />;
  if (!person) return <div className="empty-state"><h2>Person not found</h2></div>;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{person.full_name}</h1>
              <span className="person-type-badge">{person.person_type}</span>
              {!person.is_active && <span className="badge badge-missing">Inactive</span>}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-secondary)', fontSize: 13, flexWrap: 'wrap' }}>
              {person.email && <span>✉ {person.email}</span>}
              {person.phone && <span>📞 {person.phone}</span>}
            </div>
            {person.notes && (
              <p style={{ marginTop: '0.5rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>{person.notes}</p>
            )}
          </div>
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditPerson(true)}>Edit Info</button>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: '0.75rem' }}>Document Checklist</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Date Received</th>
              <th>Expiration Date</th>
              <th>Notes</th>
              <th>Last Updated By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(person.checklist || []).map((item) => (
              <tr key={item.document_type.id} className={ROW_CLASS[item.computed_status] || ''}>
                <td style={{ fontWeight: 600 }}>
                  {item.document_type.name}
                  {item.document_type.is_required && (
                    <span style={{ color: 'var(--status-expired)', marginLeft: 4, fontSize: 10 }}>*</span>
                  )}
                </td>
                <td><StatusBadge status={item.computed_status} /></td>
                <td className="text-secondary">{fmt(item.record?.issue_date)}</td>
                <td className="text-secondary">{fmt(item.record?.expiry_date)}</td>
                <td className="text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.record?.notes || '—'}
                </td>
                <td className="text-muted text-sm">{item.record?.uploaded_by_name || '—'}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditDoc(item)}
                  >
                    {item.record ? 'Edit' : 'Add'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editDoc && (
        <Modal title={`${editDoc.record ? 'Edit' : 'Add'}: ${editDoc.document_type.name}`} onClose={() => setEditDoc(null)}>
          <DocumentRowEditor
            item={editDoc}
            personId={id}
            onSaved={fetchPerson}
            onClose={() => setEditDoc(null)}
          />
        </Modal>
      )}

      {editPerson && (
        <Modal title="Edit Person" onClose={() => setEditPerson(false)}>
          <PersonEditForm person={person} onSave={handleSavePerson} onClose={() => setEditPerson(false)} />
        </Modal>
      )}
    </div>
  );
}
