function asDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function addYears(date, years) {
  const d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + Number(years || 0));
  return d;
}

function computeAgeYears(birthYear, now = new Date()) {
  const by = birthYear == null ? null : Number(birthYear);
  if (!Number.isFinite(by)) return null;
  return now.getFullYear() - by;
}

/**
 * Returns normalized validity status for a document-like item.
 *
 * fieldDef: FieldDefinition-like object
 * doc: { issueDate?, expiryDate? }
 * person: { birthYear? }
 */
function computeDocumentValidity(fieldDef, doc, person = {}, now = new Date()) {
  const hasExpiry = !!fieldDef?.hasExpiry;
  const requiresIssueDate = !!fieldDef?.requiresIssueDate;

  const expiryMode = String(fieldDef?.expiryMode || "none");
  const durationYearsFromIssue =
    fieldDef?.durationYearsFromIssue != null ? Number(fieldDef.durationYearsFromIssue) : null;
  const validityYears = fieldDef?.validityYears != null ? Number(fieldDef.validityYears) : null;

  const docValidityYears = doc?.validityYears != null ? Number(doc.validityYears) : null;

  const issueDate = asDate(doc?.issueDate);
  const explicitExpiry = asDate(doc?.expiryDate);

  const birthYear = person?.birthYear;
  const age = computeAgeYears(birthYear, now);

  // Hard business rule: 65+ => not eligible as driver
  if (age != null && age >= 65) {
    return {
      status: "expired",
      reason: "age_limit",
      expiryDate: null,
      computedExpiryDate: null,
      daysLeft: 0,
    };
  }

  // If field expects issueDate and document selected but missing issueDate => invalid (treat as absent)
  if (requiresIssueDate && !issueDate) {
    return {
      status: "missing_issue_date",
      reason: "missing_issue_date",
      expiryDate: explicitExpiry,
      computedExpiryDate: null,
      daysLeft: null,
    };
  }

  let computedExpiryDate = null;
  if (explicitExpiry) {
    computedExpiryDate = explicitExpiry;
  } else if (hasExpiry && expiryMode === "durationFromIssue" && issueDate) {
    const years = Number.isFinite(durationYearsFromIssue)
      ? durationYearsFromIssue
      : Number.isFinite(validityYears)
        ? validityYears
        : docValidityYears;
    if (Number.isFinite(years) && years > 0) {
      computedExpiryDate = addYears(issueDate, years);
    }
  }

  // If this field has expiry but we cannot compute it -> unknown
  if (hasExpiry && !computedExpiryDate) {
    return {
      status: "unknown",
      reason: "no_expiry_info",
      expiryDate: explicitExpiry,
      computedExpiryDate: null,
      daysLeft: null,
    };
  }

  if (computedExpiryDate) {
    const msLeft = computedExpiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (msLeft < 0) {
      return {
        status: "expired",
        reason: "expired",
        expiryDate: explicitExpiry,
        computedExpiryDate,
        daysLeft,
      };
    }
    return {
      status: "valid",
      reason: "valid",
      expiryDate: explicitExpiry,
      computedExpiryDate,
      daysLeft,
    };
  }

  // Not an expiry-tracked field => valid if present
  return {
    status: "valid",
    reason: "no_expiry",
    expiryDate: explicitExpiry,
    computedExpiryDate: null,
    daysLeft: null,
  };
}

module.exports = {
  computeDocumentValidity,
};
