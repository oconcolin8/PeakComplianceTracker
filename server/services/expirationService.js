const { differenceInCalendarDays, parseISO, isValid } = require('date-fns');

// App-wide threshold for flagging a document as "expiring soon" (badges, row colors, dashboard).
// Finer-grained windows (30/60/90…) are done by filtering on days_until_expiry.
const EXPIRING_SOON_DAYS = Number(process.env.EXPIRING_SOON_DAYS) || 30;

/**
 * Days from today until the expiry date (negative = already expired), or null if no valid date.
 */
function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  if (!isValid(expiry)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(expiry, today);
}

/**
 * Compute the status of a single document record that exists.
 * @param {string|null} expiryDate    ISO date string or null
 * @param {'expiration'|'present_absent'} trackingType
 * @returns {'current'|'expiring_soon'|'expired'|'missing'}
 */
function getDocStatus(expiryDate, trackingType = 'expiration') {
  if (trackingType === 'present_absent') return 'current';

  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) return 'missing';
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'current';
}

/**
 * Annotate an array of document records (joined with document_types) with computed status.
 */
function annotateDocuments(docs) {
  return docs.map((doc) => {
    const trackingType = doc.document_types?.tracking_type ?? 'expiration';
    return {
      ...doc,
      computed_status: getDocStatus(doc.expiry_date, trackingType),
      days_until_expiry: trackingType === 'present_absent' ? null : getDaysUntilExpiry(doc.expiry_date),
    };
  });
}

/**
 * Compute the overall status for a person from their checklist items.
 * Optional documents that are missing don't count against the person.
 * Severity order: expired > missing > expiring_soon > current
 */
function getPersonOverallStatus(checklist) {
  const statuses = checklist
    .filter((item) => item.computed_status !== 'missing' || item.document_type.is_required)
    .map((item) => item.computed_status);

  if (statuses.includes('expired')) return 'expired';
  if (statuses.includes('missing')) return 'missing';
  if (statuses.includes('expiring_soon')) return 'expiring_soon';
  return 'current';
}

module.exports = { EXPIRING_SOON_DAYS, getDaysUntilExpiry, getDocStatus, annotateDocuments, getPersonOverallStatus };
