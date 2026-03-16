const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { annotateDocuments } = require('../services/expirationService');

const list = asyncHandler(async (req, res) => {
  const { personId } = req.params;

  const { data, error } = await supabase
    .from('person_documents')
    .select('*, document_types(id, name, warning_days, is_required, description)')
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
        expiry_date: expiry_date || null,
        notes: notes || null,
        uploaded_by: req.user.id,
        uploaded_by_name: req.user.full_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'person_id,document_type_id' }
    )
    .select('*, document_types(id, name, warning_days, is_required)')
    .single();

  if (error) throw error;

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
      expiry_date: expiry_date || null,
      notes: notes || null,
      uploaded_by: req.user.id,
      uploaded_by_name: req.user.full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId)
    .eq('person_id', personId)
    .select('*, document_types(id, name, warning_days, is_required)')
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
