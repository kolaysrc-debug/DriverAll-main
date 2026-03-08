function isObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function getPath(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isTruthy(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "object") return true;
  return Boolean(v);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isObject(a) && isObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function evalLeaf(op, node, ctx) {
  const path = node.path;
  const actual = getPath(ctx, path);
  const expected = node.value;

  switch (op) {
    case "exists":
      return { ok: actual !== undefined && actual !== null, actual };
    case "truthy":
      return { ok: isTruthy(actual), actual };
    case "eq":
      return { ok: deepEqual(actual, expected), actual, expected };
    case "ne":
      return { ok: !deepEqual(actual, expected), actual, expected };
    case "gt":
      return { ok: Number(actual) > Number(expected), actual, expected };
    case "gte":
      return { ok: Number(actual) >= Number(expected), actual, expected };
    case "lt":
      return { ok: Number(actual) < Number(expected), actual, expected };
    case "lte":
      return { ok: Number(actual) <= Number(expected), actual, expected };
    case "in": {
      const arr = toArray(expected);
      if (Array.isArray(actual)) {
        const inter = actual.some((a) => arr.some((x) => deepEqual(x, a)));
        return { ok: inter, actual, expected: arr };
      }
      return { ok: arr.some((x) => deepEqual(x, actual)), actual, expected: arr };
    }
    case "nin": {
      const arr = toArray(expected);
      if (Array.isArray(actual)) {
        const inter = actual.some((a) => arr.some((x) => deepEqual(x, a)));
        return { ok: !inter, actual, expected: arr };
      }
      return { ok: !arr.some((x) => deepEqual(x, actual)), actual, expected: arr };
    }
    case "contains": {
      if (typeof actual === "string") {
        return { ok: String(actual).includes(String(expected)), actual, expected };
      }
      if (Array.isArray(actual)) {
        const arr = actual;
        return { ok: arr.some((x) => deepEqual(x, expected)), actual, expected };
      }
      return { ok: false, actual, expected };
    }
    default:
      return { ok: false, actual, expected };
  }
}

function evaluateNode(node, ctx, opts, state) {
  const maxNodes = Number.isFinite(opts?.maxNodes) ? opts.maxNodes : 10000;
  state.visited++;
  if (state.visited > maxNodes) {
    return {
      ok: false,
      value: false,
      explain: opts?.explain
        ? { type: "error", message: "maxNodes exceeded", visited: state.visited }
        : undefined,
    };
  }

  if (!node) {
    return {
      ok: false,
      value: false,
      explain: opts?.explain ? { type: "error", message: "empty expression" } : undefined,
    };
  }

  const op = String(node.op || "").trim();

  if (op === "and" || op === "or") {
    const items = Array.isArray(node.items) ? node.items : [];
    const children = [];

    if (items.length === 0) {
      const v = op === "and";
      return { ok: true, value: v, explain: opts?.explain ? { op, value: v, items: [] } : undefined };
    }

    let value = op === "and";

    for (const it of items) {
      const r = evaluateNode(it, ctx, opts, state);
      if (opts?.explain) children.push(r.explain);

      if (op === "and") {
        if (!r.value) {
          value = false;
          if (opts?.shortCircuit !== false) break;
        }
      } else {
        if (r.value) {
          value = true;
          if (opts?.shortCircuit !== false) break;
        }
      }
    }

    return {
      ok: true,
      value,
      explain: opts?.explain ? { op, value, items: children } : undefined,
    };
  }

  if (op === "not") {
    const r = evaluateNode(node.item, ctx, opts, state);
    return {
      ok: r.ok,
      value: !r.value,
      explain: opts?.explain ? { op, value: !r.value, item: r.explain } : undefined,
    };
  }

  const leaf = evalLeaf(op, node, ctx);
  return {
    ok: true,
    value: !!leaf.ok,
    explain: opts?.explain
      ? {
          op,
          value: !!leaf.ok,
          path: node.path,
          actual: leaf.actual,
          expected: leaf.expected,
        }
      : undefined,
  };
}

function evaluate(expression, context, options = {}) {
  const state = { visited: 0 };
  const result = evaluateNode(expression, context || {}, options, state);

  return {
    ok: result.ok,
    value: !!result.value,
    visited: state.visited,
    explain: options?.explain ? result.explain : undefined,
  };
}

module.exports = {
  evaluate,
  getPath,
  isTruthy,
};
