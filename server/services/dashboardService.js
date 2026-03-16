const supabase = require('../config/supabase');
const { getDocStatus, getPersonOverallStatus } = require('./expirationService');

async function getSummary() {
  // Fetch all people
  const { data: people, error: peopleErr } = await supabase
    .from('people')
    .select('id, is_active');
  if (peopleErr) throw peopleErr;

  const activePeople = people.filter((p) => p.is_active);
  const total_people = activePeople.length;

  // Fetch all required document types
  const { data: docTypes, error: dtErr } = await supabase
    .from('document_types')
    .select('id, warning_days, is_required');
  if (dtErr) throw dtErr;

  const requiredTypeIds = docTypes.filter((d) => d.is_required).map((d) => d.id);
  const warningDaysMap = Object.fromEntries(docTypes.map((d) => [d.id, d.warning_days]));

  // Fetch all person_documents for active people
  const activePeopleIds = activePeople.map((p) => p.id);
  const { data: docs, error: docsErr } = await supabase
    .from('person_documents')
    .select('person_id, document_type_id, expiry_date')
    .in('person_id', activePeopleIds.length > 0 ? activePeopleIds : ['00000000-0000-0000-0000-000000000000']);
  if (docsErr) throw docsErr;

  // Group docs by person
  const docsByPerson = {};
  for (const doc of docs) {
    if (!docsByPerson[doc.person_id]) docsByPerson[doc.person_id] = [];
    const status = getDocStatus(doc.expiry_date, warningDaysMap[doc.document_type_id] ?? 30);
    docsByPerson[doc.person_id].push({ ...doc, computed_status: status });
  }

  let expired = 0, expiring_soon = 0, missing = 0;

  for (const person of activePeople) {
    const personDocs = docsByPerson[person.id] || [];
    const overall = getPersonOverallStatus(personDocs, requiredTypeIds);
    if (overall === 'expired') expired++;
    else if (overall === 'expiring_soon') expiring_soon++;
    else if (overall === 'missing') missing++;
  }

  return { total_people, expired, expiring_soon, missing };
}

module.exports = { getSummary };
