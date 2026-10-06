import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const TRACKING_LABELS = { expiration: 'Expires', present_absent: 'On file only' };

export default function DocTypeForm({ initial, onSave, onClose, submitLabel = 'Save' }) {
  const [form, setForm] = useState({
    name: '', description: '', tracking_type: 'expiration', is_required: true,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
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
        <input className="form-input" value={form.name} onChange={set('name')} required autoFocus />
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={2} value={form.description || ''} onChange={set('description')} />
      </div>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Tracking</label>
          <select className="form-select" value={form.tracking_type} onChange={set('tracking_type')}>
            <option value="expiration">Expires (has an expiration date)</option>
            <option value="present_absent">On file only (yes / no)</option>
          </select>
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
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
