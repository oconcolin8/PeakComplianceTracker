const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { getPersonOverallStatus } = require('../services/expirationService');
const { getChecklists, addToChecklist, getTemplateIds } = require('../services/checklistService');

const list = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;

  let query = supabase
    .from('people')
    .select('id, full_name, email, phone, person_type, is_active, notes, created_at')
    .order('full_name');

  if (type) query = query.eq('person_type', type);
  if (status !== undefined) query = query.eq('is_active', status === 'active');
  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data: people, error } = await query;
  if (error) throw error;

  const checklists = await getChecklists(people.map((p) => p.id));

  const result = people.map((p) => ({
    ...p,
    overall_status: getPersonOverallStatus(checklists[p.id]),
  }));

  res.json(result);
});

const create = asyncHandler(async (req, res) => {
  const { full_name, email, phone, person_type, is_active, notes, document_type_ids } = req.body;
  const { data, error } = await supabase
    .from('people')
    .insert({ full_name, email: email || null, phone: phone || null, person_type, is_active: is_active ?? true, notes: notes || null })
    .select()
    .single();
  if (error) throw error;

  // Seed the checklist: the list chosen on the form, or the person type's template
  try {
    const ids = Array.isArray(document_type_ids) ? document_type_ids : await getTemplateIds(person_type);
    await addToChecklist(data.id, ids);
  } catch (err) {
    await supabase.from('people').delete().eq('id', data.id);
    throw err;
  }

  res.status(201).json(data);
});

const get = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !person) return res.status(404).json({ error: 'Person not found' });

  const checklists = await getChecklists([id]);
  res.json({ ...person, checklist: checklists[id] });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, person_type, is_active, notes } = req.body;
  const { data, error } = await supabase
    .from('people')
    .update({ full_name, email: email || null, phone: phone || null, person_type, is_active, notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('people')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  res.json({ message: 'Person deactivated' });
});

const addChecklistItems = asyncHandler(async (req, res) => {
  await addToChecklist(req.params.id, req.body.document_type_ids);
  res.status(201).json({ message: 'Added to checklist' });
});

// Removing a document from a person's list also deletes their record for it.
const removeChecklistItem = asyncHandler(async (req, res) => {
  const { id, documentTypeId } = req.params;
  const { error: docErr } = await supabase
    .from('person_documents')
    .delete()
    .eq('person_id', id)
    .eq('document_type_id', documentTypeId);
  if (docErr) throw docErr;

  const { error } = await supabase
    .from('person_checklist')
    .delete()
    .eq('person_id', id)
    .eq('document_type_id', documentTypeId);
  if (error) throw error;
  res.json({ message: 'Removed from checklist' });
});

module.exports = { list, create, get, update, remove, addChecklistItems, removeChecklistItem };
