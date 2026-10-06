import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import DocumentRecordForm from '../components/documents/DocumentRecordForm.jsx';
import DocumentPicker from '../components/documents/DocumentPicker.jsx';
import toast from 'react-hot-toast';

const ROW_CLASS = {
  expired: 'row-expired', expiring_soon: 'row-expiring',
  missing: 'row-missing', current: 'row-current',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

function daysLabel(days) {
  if (days === null || days === undefined) return null;
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} ago`;
  if (days === 0) return 'today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function AddDocumentsForm({ personId, checklist, onSaved, onClose }) {
  const [docTypes, setDocTypes] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onList = new Set(checklist.map((c) => c.document_type.id));
    api.get('/document-types')
      .then((r) => setDocTypes(r.data.filter((dt) => !onList.has(dt.id))))
      .catch(() => toast.error('Failed to load document types'));
  }, [checklist]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post(`/people/${personId}/checklist`, { document_type_ids: selected });
      toast.success(`${selected.length} document${selected.length === 1 ? '' : 's'} added`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!docTypes) return <Spinner />;

  return (
    <div>
      <DocumentPicker
        docTypes={docTypes}
        selected={selected}
        onChange={setSelected}
        onTypeCreated={(dt) => setDocTypes((list) => [...list, dt])}
        emptyMessage="Every document type is already on this person's list."
      />
      <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '1.25rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || selected.length === 0}>
          {saving ? 'Adding…' : 'Add to List'}
        </button>
      </div>
    </div>
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
  const [showAddDocs, setShowAddDocs] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Initial load shows the spinner; refreshes after edits keep the page in place
  const fetchPerson = useCallback((initial = false) => {
    if (initial) setLoading(true);
    api.get(`/people/${id}`)
      .then((r) => setPerson(r.data))
      .catch(() => toast.error('Failed to load person'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPerson(true); }, [fetchPerson]);

  async function handleSavePerson(form) {
    const { data } = await api.put(`/people/${id}`, form);
    setPerson((prev) => ({ ...prev, ...data }));
    toast.success('Person updated');
  }

  async function handleRemoveDoc() {
    setRemoving(true);
    try {
      await api.delete(`/people/${id}/checklist/${removeTarget.document_type.id}`);
      toast.success(`"${removeTarget.document_type.name}" removed`);
      setRemoveTarget(null);
      fetchPerson();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Remove failed');
    } finally {
      setRemoving(false);
    }
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Document Checklist</h2>
        {isAdmin && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddDocs(true)}>+ Add Documents</button>
        )}
      </div>

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
            {(person.checklist || []).length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No documents are tracked for this person yet.{isAdmin && ' Use "+ Add Documents" to build their list.'}
                </td>
              </tr>
            )}
            {(person.checklist || []).map((item) => (
              <tr key={item.document_type.id} className={ROW_CLASS[item.computed_status] || ''}>
                <td style={{ fontWeight: 600 }}>
                  {item.document_type.name}
                  {item.document_type.is_required && <span className="required-mark">*</span>}
                </td>
                <td><StatusBadge status={item.computed_status} /></td>
                <td className="text-secondary">{fmt(item.record?.issue_date)}</td>
                <td className="text-secondary">
                  {item.document_type.tracking_type === 'present_absent' ? (
                    <span className="text-muted text-sm">On file only</span>
                  ) : (
                    <>
                      {fmt(item.record?.expiry_date)}
                      {daysLabel(item.days_until_expiry) && (
                        <div className="text-muted text-sm">{daysLabel(item.days_until_expiry)}</div>
                      )}
                    </>
                  )}
                </td>
                <td className="text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.record?.notes || '—'}
                </td>
                <td className="text-muted text-sm">{item.record?.uploaded_by_name || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditDoc(item)}
                    >
                      {item.record ? 'Edit' : 'Add'}
                    </button>
                    {isAdmin && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setRemoveTarget(item)} title="Remove from this person's list">
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editDoc && (
        <Modal title={`${editDoc.record ? 'Edit' : 'Add'}: ${editDoc.document_type.name}`} onClose={() => setEditDoc(null)}>
          <DocumentRecordForm
            item={editDoc}
            personId={id}
            onSaved={() => fetchPerson()}
            onClose={() => setEditDoc(null)}
          />
        </Modal>
      )}

      {showAddDocs && (
        <Modal title={`Add Documents — ${person.full_name}`} onClose={() => setShowAddDocs(false)} wide>
          <AddDocumentsForm
            personId={id}
            checklist={person.checklist || []}
            onSaved={() => fetchPerson()}
            onClose={() => setShowAddDocs(false)}
          />
        </Modal>
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove Document"
          message={
            removeTarget.record
              ? `Remove "${removeTarget.document_type.name}" from ${person.full_name}'s list? Their saved record for it will be deleted.`
              : `Remove "${removeTarget.document_type.name}" from ${person.full_name}'s list?`
          }
          onConfirm={handleRemoveDoc}
          onCancel={() => setRemoveTarget(null)}
          loading={removing}
        />
      )}

      {editPerson && (
        <Modal title="Edit Person" onClose={() => setEditPerson(false)}>
          <PersonEditForm person={person} onSave={handleSavePerson} onClose={() => setEditPerson(false)} />
        </Modal>
      )}
    </div>
  );
}
