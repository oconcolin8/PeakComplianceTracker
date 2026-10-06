const supabase = require('../config/supabase');
const { annotateDocuments } = require('./expirationService');

/**
 * Build each person's document checklist: one item per document type on their
 * person_checklist, joined with their record for it (if any).
 * @returns {Promise<Object<string, Array>>} personId -> checklist items, sorted by document name
 */
async function getChecklists(personIds) {
  const result = Object.fromEntries(personIds.map((id) => [id, []]));
  if (personIds.length === 0) return result;

  const [{ data: entries, error: entriesErr }, { data: docs, error: docsErr }] = await Promise.all([
    supabase
      .from('person_checklist')
      .select('person_id, document_types(*)')
      .in('person_id', personIds),
    supabase
      .from('person_documents')
      .select('*, document_types(tracking_type)')
      .in('person_id', personIds),
  ]);
  if (entriesErr) throw entriesErr;
  if (docsErr) throw docsErr;

  const recordMap = {};
  for (const doc of annotateDocuments(docs || [])) {
    recordMap[`${doc.person_id}:${doc.document_type_id}`] = doc;
  }

  for (const entry of entries || []) {
    const dt = entry.document_types;
    if (!dt) continue;
    const record = recordMap[`${entry.person_id}:${dt.id}`] || null;
    result[entry.person_id].push({
      document_type: dt,
      record,
      computed_status: record ? record.computed_status : 'missing',
      days_until_expiry: record ? record.days_until_expiry : null,
    });
  }

  for (const id of personIds) {
    result[id].sort((a, b) => a.document_type.name.localeCompare(b.document_type.name));
  }
  return result;
}

/**
 * Add document types to a person's checklist (ignores ones already there).
 */
async function addToChecklist(personId, documentTypeIds) {
  if (!documentTypeIds.length) return;
  const { error } = await supabase
    .from('person_checklist')
    .upsert(
      documentTypeIds.map((document_type_id) => ({ person_id: personId, document_type_id })),
      { onConflict: 'person_id,document_type_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

/**
 * Document type IDs in the template for a person type.
 */
async function getTemplateIds(personType) {
  const { data, error } = await supabase
    .from('document_type_defaults')
    .select('document_type_id')
    .eq('person_type', personType);
  if (error) throw error;
  return (data || []).map((d) => d.document_type_id);
}

module.exports = { getChecklists, addToChecklist, getTemplateIds };
