const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { getTemplateIds } = require('../services/checklistService');

const PERSON_TYPES = ['client', 'employee', 'contractor'];

// Returns { client: [docTypeId…], employee: […], contractor: […] }
const list = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('document_type_defaults')
    .select('person_type, document_type_id');
  if (error) throw error;

  const result = Object.fromEntries(PERSON_TYPES.map((t) => [t, []]));
  for (const row of data || []) result[row.person_type].push(row.document_type_id);
  res.json(result);
});

// Replace the template for one person type. Existing people are not affected.
const replace = asyncHandler(async (req, res) => {
  const { personType } = req.params;
  const ids = [...new Set(req.body.document_type_ids)];

  const current = await getTemplateIds(personType);
  const toRemove = current.filter((id) => !ids.includes(id));
  const toAdd = ids.filter((id) => !current.includes(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from('document_type_defaults')
      .delete()
      .eq('person_type', personType)
      .in('document_type_id', toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from('document_type_defaults')
      .insert(toAdd.map((document_type_id) => ({ person_type: personType, document_type_id })));
    if (error) throw error;
  }

  res.json({ person_type: personType, document_type_ids: ids });
});

module.exports = { PERSON_TYPES, list, replace };
