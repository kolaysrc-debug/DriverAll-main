const express = require("express");
const router = express.Router();

const { requireAuth, requireRoles } = require("../middleware/auth");
const { evaluate } = require("../lib/astCriteriaEngine");

router.post("/evaluate", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const expression = body.expression;
    const context = body.context || {};
    const options = body.options || {};

    if (!expression || typeof expression !== "object") {
      return res.status(400).json({
        success: false,
        message: "expression zorunludur (JSON AST nesnesi)",
      });
    }

    const result = evaluate(expression, context, {
      explain: options.explain !== false,
      shortCircuit: options.shortCircuit !== false,
      maxNodes: Number.isFinite(options.maxNodes) ? options.maxNodes : undefined,
    });

    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "evaluate failed", error: err.message });
  }
});

module.exports = router;
