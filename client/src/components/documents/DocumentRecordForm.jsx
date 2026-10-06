import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';

/**
 * Add or edit a person's record for one checklist item.
 */
export default function DocumentRecordForm({ item, personId, onSaved, onClose }) {
  const { document_type, record } = item;
  const hasExpiration = document_type.tracking_type !== 'present_absent';
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
        {!hasExpiration && ' Saving a record marks this document as on file.'}
      </p>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Date Received</label>
          <input type="date" className="form-input" value={form.issue_date} onChange={set('issue_date')} />
        </div>
        {hasExpiration && (
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
