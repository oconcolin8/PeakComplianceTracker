const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('document_types')
    .select('*')
    .order('name');
  if (error) throw error;
  res.json(data);
});

const create = asyncHandler(async (req, res) => {
  const { name, description, tracking_type, is_required } = req.body;
  const { data, error } = await supabase
    .from('document_types')
    .insert({ name, description: description || null, tracking_type: tracking_type || 'expiration', is_required: is_required ?? true })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A document type with that name already exists' });
    throw error;
  }
  res.status(201).json(data);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, tracking_type, is_required } = req.body;
  const { data, error } = await supabase
    .from('document_types')
    .update({ name, description: description || null, tracking_type: tracking_type || 'expiration', is_required: is_required ?? true })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A document type with that name already exists' });
    throw error;
  }
  res.json(data);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if any person_documents reference this type
  const { count } = await supabase
    .from('person_documents')
    .select('id', { count: 'exact', head: true })
    .eq('document_type_id', id);

  if (count > 0) {
    return res.status(409).json({
      error: `Cannot delete: ${count} document record(s) reference this type. Remove those records first.`,
    });
  }

  const { error } = await supabase.from('document_types').delete().eq('id', id);
  if (error) throw error;
  res.json({ message: 'Document type deleted' });
});

module.exports = { list, create, update, remove };
