const { differenceInCalendarDays, parseISO, isValid } = require('date-fns');

/**
 * Compute the status of a single document record.
 * @param {string|null} expiryDate  ISO date string or null
 * @param {number} warningDays      Days before expiry to flag as expiring_soon
 * @returns {'current'|'expiring_soon'|'expired'|'missing'}
 */
function getDocStatus(expiryDate, warningDays = 30) {
  if (!expiryDate) return 'missing';

  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  if (!isValid(expiry)) return 'missing';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilExpiry = differenceInCalendarDays(expiry, today);

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= warningDays) return 'expiring_soon';
  return 'current';
}

/**
 * Annotate an array of document records with computed status.
 */
function annotateDocuments(docs) {
  return docs.map((doc) => ({
    ...doc,
    computed_status: getDocStatus(doc.expiry_date, doc.document_types?.warning_days ?? 30),
  }));
}

/**
 * Compute the overall status for a person based on their documents.
 * Severity order: expired > missing > expiring_soon > current
 */
function getPersonOverallStatus(annotatedDocs, requiredTypeIds = []) {
  if (annotatedDocs.length === 0 && requiredTypeIds.length > 0) return 'missing';

  const statuses = annotatedDocs.map((d) => d.computed_status);

  // Check for required docs that have no record at all
  const presentTypeIds = new Set(annotatedDocs.map((d) => d.document_type_id));
  const hasMissingRequired = requiredTypeIds.some((id) => !presentTypeIds.has(id));

  if (statuses.includes('expired')) return 'expired';
  if (hasMissingRequired || statuses.includes('missing')) return 'missing';
  if (statuses.includes('expiring_soon')) return 'expiring_soon';
  return 'current';
}

module.exports = { getDocStatus, annotateDocuments, getPersonOverallStatus };
