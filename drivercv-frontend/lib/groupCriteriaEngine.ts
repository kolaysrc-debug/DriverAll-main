// drivercv-frontend/lib/groupCriteriaEngine.ts
"use client";

export type GroupNode = {
  key: string;
  label?: string;
  parentKey?: string | null;
  level?: number;
  sortOrder?: number;
  coverage?: string[]; // covers
  requiredWith?: string[]; // requires
  active?: boolean;
};

export type Reason =
  | { source: "manual" }
  | { source: "requires"; from: string }
  | { source: "covers"; from: string };

export type ResolveResult = {
  manualKeys: string[];
  effectiveKeys: string[];
  reasons: Record<string, Reason>;
  missingRefs: string[];
  cyclesDetected: boolean;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}
function cleanKey(k: string) {
  return String(k || "").trim();
}
function toArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(cleanKey).filter(Boolean);
  if (typeof v === "string") {
    return v.split(",").map(cleanKey).filter(Boolean);
  }
  return [];
}

export function resolveGroupSelection(
  manualKeys: string[],
  nodes: GroupNode[]
): ResolveResult {
  const nodeMap = new Map<string, GroupNode>();
  for (const n of nodes || []) {
    const k = cleanKey(n?.key || "");
    if (!k) continue;
    nodeMap.set(k, n);
  }

  const manual = uniq((manualKeys || []).map(cleanKey).filter(Boolean));

  const reasons: Record<string, Reason> = {};
  const effectiveSet = new Set<string>();
  const missingRefsSet = new Set<string>();

  const stack: string[] = [];

  for (const k of manual) {
    if (!nodeMap.has(k)) {
      missingRefsSet.add(k);
      continue;
    }
    effectiveSet.add(k);
    reasons[k] = { source: "manual" };
    stack.push(k);
  }

  let steps = 0;
  const STEP_LIMIT = 20000;
  let cyclesDetected = false;

  while (stack.length) {
    const cur = stack.pop()!;
    steps++;
    if (steps > STEP_LIMIT) {
      cyclesDetected = true;
      break;
    }

    const curNode = nodeMap.get(cur);
    if (!curNode) continue;

    const requires = toArr(curNode.requiredWith);
    for (const req of requires) {
      if (!nodeMap.has(req)) {
        missingRefsSet.add(req);
        continue;
      }
      if (!effectiveSet.has(req)) {
        effectiveSet.add(req);
        reasons[req] = { source: "requires", from: cur };
        stack.push(req);
      }
    }

    const covers = toArr(curNode.coverage);
    for (const cov of covers) {
      if (!nodeMap.has(cov)) {
        missingRefsSet.add(cov);
        continue;
      }
      if (!effectiveSet.has(cov)) {
        effectiveSet.add(cov);
        reasons[cov] = { source: "covers", from: cur };
        stack.push(cov);
      }
    }
  }

  return {
    manualKeys: manual,
    effectiveKeys: Array.from(effectiveSet),
    reasons,
    missingRefs: Array.from(missingRefsSet),
    cyclesDetected,
  };
}

export function isAutoAdded(reasons: Record<string, Reason>, key: string) {
  const r = reasons[key];
  return !!r && r.source !== "manual";
}
