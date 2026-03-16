const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { annotateDocuments, getPersonOverallStatus } = require('../services/expirationService');

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

  // Fetch required doc type IDs
  const { data: docTypes } = await supabase
    .from('document_types')
    .select('id, warning_days, is_required');
  const requiredTypeIds = (docTypes || []).filter((d) => d.is_required).map((d) => d.id);
  const warningDaysMap = Object.fromEntries((docTypes || []).map((d) => [d.id, d.warning_days]));

  // Fetch all docs for these people
  const peopleIds = people.map((p) => p.id);
  let docs = [];
  if (peopleIds.length > 0) {
    const { data: docsData } = await supabase
      .from('person_documents')
      .select('person_id, document_type_id, expiry_date')
      .in('person_id', peopleIds);
    docs = docsData || [];
  }

  // Compute overall status per person
  const docsByPerson = {};
  for (const doc of docs) {
    if (!docsByPerson[doc.person_id]) docsByPerson[doc.person_id] = [];
    docsByPerson[doc.person_id].push({
      ...doc,
      computed_status: require('../services/expirationService').getDocStatus(
        doc.expiry_date,
        warningDaysMap[doc.document_type_id] ?? 30
      ),
    });
  }

  const result = people.map((p) => ({
    ...p,
    overall_status: getPersonOverallStatus(docsByPerson[p.id] || [], requiredTypeIds),
  }));

  res.json(result);
});

const create = asyncHandler(async (req, res) => {
  const { full_name, email, phone, person_type, is_active, notes } = req.body;
  const { data, error } = await supabase
    .from('people')
    .insert({ full_name, email: email || null, phone: phone || null, person_type, is_active: is_active ?? true, notes: notes || null })
    .select()
    .single();
  if (error) throw error;
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

  // Fetch all document types
  const { data: allDocTypes } = await supabase
    .from('document_types')
    .select('*')
    .order('name');

  // Fetch this person's documents
  const { data: personDocs } = await supabase
    .from('person_documents')
    .select('*, document_types(name, warning_days, is_required), uploaded_by_name')
    .eq('person_id', id);

  const annotated = annotateDocuments(personDocs || []);

  // Build a full checklist: one row per doc type
  const docMap = Object.fromEntries(annotated.map((d) => [d.document_type_id, d]));
  const checklist = (allDocTypes || []).map((dt) => ({
    document_type: dt,
    record: docMap[dt.id] || null,
    computed_status: docMap[dt.id]
      ? docMap[dt.id].computed_status
      : 'missing',
  }));

  res.json({ ...person, checklist });
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

module.exports = { list, create, get, update, remove };
