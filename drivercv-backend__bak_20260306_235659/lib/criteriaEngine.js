// drivercv-backend/lib/criteriaEngine.js
// Kriter Motoru: coverage (kapsama) + requiredWith (bağımlılık) kurallarını işletir.

function normalizeKeyList(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x).trim())
      .filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * FieldDefinition listesinden (veya node senkronundan gelen coversKeys/requiresKeys alanlarından)
 * hızlı bir indeks üretir.
 */
function buildRuleIndex(fieldDefinitions = []) {
  const requires = new Map(); // key -> [requiredKeys]
  const covers = new Map(); // key -> [coveredKeys]

  for (const f of fieldDefinitions || []) {
    const key = String(f?.key || "").trim();
    if (!key) continue;

    const req = normalizeKeyList(f.requiresKeys || f.requiredWith || f.requires);
    const cov = normalizeKeyList(f.coversKeys || f.coverage || f.covers);

    requires.set(key, req);
    covers.set(key, cov);
  }

  return { requires, covers };
}

/**
 * Seçilen key'leri, kurallara göre genişletir:
 * - required (bağımlılık) ekler
 * - coverage (kapsama) ekler
 * Transitive closure uygular.
 */
function expandKeys(inputKeys, ruleIndex, opts = {}) {
  const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 50;

  const set = new Set(normalizeKeyList(inputKeys));
  const { requires, covers } = ruleIndex || { requires: new Map(), covers: new Map() };

  for (let i = 0; i < maxDepth; i++) {
    const before = set.size;

    for (const k of Array.from(set)) {
      const req = requires.get(k) || [];
      for (const r of req) set.add(r);

      const cov = covers.get(k) || [];
      for (const c of cov) set.add(c);
    }

    if (set.size === before) break;
  }

  return Array.from(set);
}

/**
 * Seçim tutarlı mı? (örn: ADR_CLASS_1 var ama ADR_BASIC yok)
 */
function validateKeys(inputKeys, ruleIndex) {
  const set = new Set(normalizeKeyList(inputKeys));
  const missing = new Set();

  const { requires } = ruleIndex || { requires: new Map() };

  for (const k of set) {
    const req = requires.get(k) || [];
    for (const r of req) {
      if (!set.has(r)) missing.add(r);
    }
  }

  return { ok: missing.size === 0, missing: Array.from(missing) };
}

module.exports = {
  normalizeKeyList,
  buildRuleIndex,
  expandKeys,
  validateKeys,
};
