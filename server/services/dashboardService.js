const supabase = require('../config/supabase');
const { EXPIRING_SOON_DAYS, getPersonOverallStatus } = require('./expirationService');
const { getChecklists } = require('./checklistService');

async function getSummary() {
  const { data: people, error: peopleErr } = await supabase
    .from('people')
    .select('id')
    .eq('is_active', true);
  if (peopleErr) throw peopleErr;

  const checklists = await getChecklists(people.map((p) => p.id));

  let expired = 0, expiring_soon = 0, missing = 0;

  for (const person of people) {
    const overall = getPersonOverallStatus(checklists[person.id]);
    if (overall === 'expired') expired++;
    else if (overall === 'expiring_soon') expiring_soon++;
    else if (overall === 'missing') missing++;
  }

  return { total_people: people.length, expired, expiring_soon, missing, expiring_soon_days: EXPIRING_SOON_DAYS };
}

module.exports = { getSummary };
