const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { annotateDocuments } = require('../services/expirationService');
const { addToChecklist } = require('../services/checklistService');

const DOC_TYPE_FIELDS = 'document_types(id, name, tracking_type, is_required, description)';

// "On file only" documents never carry an expiry date
async function normalizeExpiry(documentTypeId, expiryDate) {
  const { data: dt, error } = await supabase
    .from('document_types')
    .select('tracking_type')
    .eq('id', documentTypeId)
    .single();
  if (error || !dt) {
    const err = new Error('Document type not found');
    err.status = 400;
    throw err;
  }
  return dt.tracking_type === 'present_absent' ? null : expiryDate || null;
}

const list = asyncHandler(async (req, res) => {
  const { personId } = req.params;

  const { data, error } = await supabase
    .from('person_documents')
    .select(`*, ${DOC_TYPE_FIELDS}`)
    .eq('person_id', personId)
    .order('created_at');

  if (error) throw error;
  res.json(annotateDocuments(data || []));
});

const upsert = asyncHandler(async (req, res) => {
  const { personId } = req.params;
  const { document_type_id, issue_date, expiry_date, notes } = req.body;

  const { data, error } = await supabase
    .from('person_documents')
    .upsert(
      {
        person_id: personId,
        document_type_id,
        issue_date: issue_date || null,
        expiry_date: await normalizeExpiry(document_type_id, expiry_date),
        notes: notes || null,
        uploaded_by: req.user.id,
        uploaded_by_name: req.user.full_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'person_id,document_type_id' }
    )
    .select(`*, ${DOC_TYPE_FIELDS}`)
    .single();

  if (error) throw error;

  // A record always belongs on the person's checklist
  await addToChecklist(personId, [document_type_id]);

  const [annotated] = annotateDocuments([data]);
  res.status(201).json(annotated);
});

const update = asyncHandler(async (req, res) => {
  const { personId, docId } = req.params;
  const { document_type_id, issue_date, expiry_date, notes } = req.body;

  const { data, error } = await supabase
    .from('person_documents')
    .update({
      issue_date: issue_date || null,
      expiry_date: await normalizeExpiry(document_type_id, expiry_date),
      notes: notes || null,
      uploaded_by: req.user.id,
      uploaded_by_name: req.user.full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId)
    .eq('person_id', personId)
    .select(`*, ${DOC_TYPE_FIELDS}`)
    .single();

  if (error) throw error;

  const [annotated] = annotateDocuments([data]);
  res.json(annotated);
});

const remove = asyncHandler(async (req, res) => {
  const { personId, docId } = req.params;
  const { error } = await supabase
    .from('person_documents')
    .delete()
    .eq('id', docId)
    .eq('person_id', personId);
  if (error) throw error;
  res.json({ message: 'Document record deleted' });
});

module.exports = { list, upsert, update, remove };
