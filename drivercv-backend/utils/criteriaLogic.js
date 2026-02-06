/**
 * =========================
 * FILE: drivercv-backend/utils/criteriaLogic.js
 * =========================
 *
 * Kriter Motoru (Coverage + Required)
 * - coversKeys: Seçilen key, listedeki key'leri de "true" yapar (kapsar).
 * - requiresKeys: Seçilen key, listedeki key'leri zorunlu kılar (bağımlılık).
 */

function normalizeStringArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function isTruthy(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "object") return true;
  return Boolean(value);
}

function compileGraph(fields) {
  const coverMap = new Map();
  const reqMap = new Map();
  const byKey = new Map();

  for (const f of fields || []) {
    const key = String(f.key || "").trim();
    if (!key) continue;

    byKey.set(key, f);

    const covers = normalizeStringArray(f.coversKeys);
    const reqs = normalizeStringArray(f.requiresKeys);

    coverMap.set(key, new Set(covers));
    reqMap.set(key, new Set(reqs));
  }

  return { coverMap, reqMap, byKey };
}

function applyCriteriaRulesToKeys(selectedKeys, fields) {
  const { coverMap, reqMap } = compileGraph(fields);

  const base = new Set(normalizeStringArray(selectedKeys));
  const expanded = new Set(base);

  const queue = [...expanded];
  while (queue.length) {
    const k = queue.shift();

    const covers = coverMap.get(k);
    if (covers) {
      for (const c of covers) {
        if (!expanded.has(c)) {
          expanded.add(c);
          queue.push(c);
        }
      }
    }

    const reqs = reqMap.get(k);
    if (reqs) {
      for (const r of reqs) {
        if (!expanded.has(r)) {
          expanded.add(r);
          queue.push(r);
        }
      }
    }
  }

  const addedKeys = [...expanded].filter((k) => !base.has(k));

  return {
    expandedKeys: [...expanded],
    addedKeys,
  };
}

function applyCriteriaRulesToValues(values, fields) {
  const safeValues = values && typeof values === "object" ? { ...values } : {};
  const { byKey } = compileGraph(fields);

  const selectedKeys = Object.keys(safeValues).filter((k) => isTruthy(safeValues[k]));
  const { expandedKeys, addedKeys } = applyCriteriaRulesToKeys(selectedKeys, fields);

  for (const k of expandedKeys) {
    const f = byKey.get(k);
    const valueType = f?.valueType ? String(f.valueType) : "boolean";
    if (valueType !== "boolean") continue;

    if (safeValues[k] !== true) {
      safeValues[k] = true;
    }
  }

  return { values: safeValues, addedKeys };
}

module.exports = {
  normalizeStringArray,
  isTruthy,
  applyCriteriaRulesToKeys,
  applyCriteriaRulesToValues,
};

/**
 * =========================
 * END FILE: drivercv-backend/utils/criteriaLogic.js
 * =========================
 */
