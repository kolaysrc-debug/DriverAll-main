const express = require("express");
const router = express.Router();

const DynamicField = require("../models/DynamicField");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { evaluate } = require("../lib/astCriteriaEngine");

function toConditionExpression(dep, values) {
  const fieldKey = String(dep?.field || "").trim();
  if (!fieldKey) return null;

  const condition = String(dep?.condition || "").trim();
  const value = dep?.value;

  const path = `values.${fieldKey}`;

  switch (condition) {
    case "equals":
      return { op: "eq", path, value };
    case "not_equals":
      return { op: "ne", path, value };
    case "contains":
      return { op: "contains", path, value };
    case "in":
      return { op: "in", path, value };
    case "exists":
      return { op: "exists", path };
    case "truthy":
      return { op: "truthy", path };
    case "gt":
      return { op: "gt", path, value };
    case "gte":
      return { op: "gte", path, value };
    case "lt":
      return { op: "lt", path, value };
    case "lte":
      return { op: "lte", path, value };
    default:
      return { op: "eq", path, value };
  }
}

function applyAction(state, action) {
  switch (action) {
    case "show":
      state.visible = true;
      break;
    case "hide":
      state.visible = false;
      break;
    case "enable":
      state.editable = true;
      break;
    case "disable":
      state.editable = false;
      break;
    case "require":
      state.required = true;
      break;
    default:
      break;
  }
}

function getRoleState(field, roleId) {
  if (!roleId) {
    return { visible: true, required: !!field?.globalValidation?.required, editable: true };
  }

  const rv = (field.roleVisibility || []).find((x) => String(x.role?._id || x.role) === String(roleId));
  if (!rv) {
    return { visible: true, required: !!field?.globalValidation?.required, editable: true };
  }

  return {
    visible: rv.isVisible !== false,
    required: !!rv.isRequired,
    editable: rv.isEditable !== false,
  };
}

router.post("/fields", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const context = body.context && typeof body.context === "object" ? body.context : {};
    const roleId = body.roleId || context?.role?._id || context?.roleId;

    const profileValues = body.profileValues && typeof body.profileValues === "object" ? body.profileValues : {};

    const evalContext = {
      ...context,
      values: profileValues,
    };

    const fields = await DynamicField.find({ isActive: { $ne: false } })
      .populate("roleVisibility.role")
      .sort({ category: 1, section: 1, order: 1 })
      .lean();

    const result = [];

    for (const f of fields) {
      const state = getRoleState(f, roleId);
      const explain = [];

      const deps = Array.isArray(f.dependencies) ? f.dependencies : [];

      for (const dep of deps) {
        const expr = toConditionExpression(dep, profileValues);
        if (!expr) continue;

        const evalRes = evaluate(expr, evalContext, { explain: true, shortCircuit: true, maxNodes: 1000 });
        const matched = !!evalRes.value;

        const action = String(dep?.action || "").trim();
        if (matched) {
          applyAction(state, action);
        }

        explain.push({
          dependency: dep,
          expression: expr,
          matched,
          applied: matched ? action : null,
          eval: evalRes.explain,
        });
      }

      result.push({
        fieldId: String(f._id),
        key: f.key,
        label: f.label,
        type: f.type,
        category: f.category,
        section: f.section,
        order: f.order,
        isSystem: !!f.isSystem,
        state,
        explain,
      });
    }

    return res.json({ success: true, count: result.length, result });
  } catch (err) {
    console.error("preview/fields failed:", err);
    return res.status(500).json({ success: false, message: "preview failed", error: err.message });
  }
});

module.exports = router;
