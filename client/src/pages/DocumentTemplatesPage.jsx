import React, { useEffect, useState } from 'react';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import DocumentPicker from '../components/documents/DocumentPicker.jsx';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'client', label: 'Clients' },
  { key: 'employee', label: 'Employees' },
  { key: 'contractor', label: 'Contractors' },
];

const sameSet = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

export default function DocumentTemplatesPage() {
  const [docTypes, setDocTypes] = useState([]);
  const [saved, setSaved] = useState(null);   // last-saved templates from the server
  const [drafts, setDrafts] = useState(null); // edits in progress, per person type
  const [tab, setTab] = useState('client');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/document-types'), api.get('/document-templates')])
      .then(([dt, tpl]) => {
        setDocTypes(dt.data);
        setSaved(tpl.data);
        setDrafts(tpl.data);
      })
      .catch(() => toast.error('Failed to load default documents'));
  }, []);

  if (!drafts) return <Spinner />;

  const isDirty = (key) => !sameSet(drafts[key], saved[key]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.put(`/document-templates/${tab}`, { document_type_ids: drafts[tab] });
      setSaved((s) => ({ ...s, [tab]: data.document_type_ids }));
      toast.success(`${TABS.find((t) => t.key === tab).label} defaults saved`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const label = TABS.find((t) => t.key === tab).label;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Default Documents</h1>
      </div>

      <p className="text-secondary" style={{ fontSize: 13, marginBottom: '1rem', maxWidth: 640 }}>
        These documents are pre-selected when you add a new person of each type. Changes apply to people
        added from now on. Existing people keep their own lists, which you can edit on their page.
      </p>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {isDirty(t.key) && <span className="tab__dirty" title="Unsaved changes">●</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <DocumentPicker
            key={tab}
            docTypes={docTypes}
            selected={drafts[tab]}
            onChange={(ids) => setDrafts((d) => ({ ...d, [tab]: ids }))}
            onTypeCreated={(dt) => setDocTypes((list) => [...list, dt].sort((a, b) => a.name.localeCompare(b.name)))}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '1.25rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setDrafts((d) => ({ ...d, [tab]: saved[tab] }))}
              disabled={saving || !isDirty(tab)}
            >
              Discard Changes
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !isDirty(tab)}>
              {saving ? 'Saving…' : `Save ${label} Defaults`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
