import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import DocTypeForm, { TRACKING_LABELS } from './DocTypeForm.jsx';

/**
 * Checkbox list of document types, with an inline "new document type" form.
 * @param docTypes   document types to choose from
 * @param selected   array of selected document type IDs
 * @param onChange   (ids) => void
 * @param onTypeCreated  (docType) => void — new type is created and auto-selected
 */
export default function DocumentPicker({ docTypes, selected, onChange, onTypeCreated, emptyMessage = 'No document types yet.' }) {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const selectedSet = new Set(selected);

  function toggle(id) {
    onChange(selectedSet.has(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  async function handleCreate(form) {
    const { data } = await api.post('/document-types', form);
    toast.success(`"${data.name}" created`);
    onTypeCreated(data);
    onChange([...selected, data.id]);
  }

  const visible = search
    ? docTypes.filter((dt) => dt.name.toLowerCase().includes(search.toLowerCase()))
    : docTypes;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
        <span className="text-secondary text-sm">{selected.length} selected</span>
        {docTypes.length > 8 && (
          <input
            className="form-input"
            placeholder="Filter documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 200, padding: '0.3rem 0.6rem' }}
          />
        )}
      </div>

      <div className="doc-picker">
        {visible.length === 0 ? (
          <div className="doc-picker__empty">{search ? 'No matches.' : emptyMessage}</div>
        ) : visible.map((dt) => (
          <label key={dt.id} className={`doc-picker__row ${selectedSet.has(dt.id) ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={selectedSet.has(dt.id)} onChange={() => toggle(dt.id)} />
            <span className="doc-picker__name">
              {dt.name}
              {dt.is_required && <span className="required-mark">*</span>}
            </span>
            <span className="doc-picker__meta">{TRACKING_LABELS[dt.tracking_type] || 'Expires'}</span>
          </label>
        ))}
      </div>

      {creating ? (
        <div className="doc-picker__new">
          <div className="doc-picker__new-title">New document type</div>
          <DocTypeForm onSave={handleCreate} onClose={() => setCreating(false)} submitLabel="Create & add" />
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => setCreating(true)}>
          + New document type
        </button>
      )}
    </div>
  );
}
