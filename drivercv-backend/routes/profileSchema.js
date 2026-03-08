const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/auth");
const { PROFILE_SCHEMA } = require("../config/profileSchema");

router.get("/schema", requireAuth, async (req, res) => {
  return res.json({ success: true, schema: PROFILE_SCHEMA || [] });
});

module.exports = router;
