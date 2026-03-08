const express = require("express");
const router = express.Router();

const Branch = require("../models/Branch");
const { requireAuth, requireRoles } = require("../middleware/auth");

function normStr(v) {
  return String(v || "").trim();
}

function buildBranchCode(name) {
  const base = normStr(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const suffix = Date.now().toString().slice(-6);
  return `${base || "BR"}${suffix}`;
}

async function ensureUniqueCode(code) {
  let c = normStr(code).toUpperCase();
  if (!c) c = `BR${Date.now().toString().slice(-8)}`;

  for (let i = 0; i < 10; i++) {
    const exists = await Branch.findOne({ code: c }).select("_id").lean();
    if (!exists) return c;
    c = `${c}${Math.floor(Math.random() * 9)}`;
  }
  return `${c}${Math.floor(Math.random() * 1000)}`;
}

function pickLocation(bodyLoc) {
  const loc = bodyLoc || {};
  return {
    countryCode: normStr(loc.countryCode) || "TR",
    stateCode: normStr(loc.stateCode),
    stateName: normStr(loc.stateName),
    districtCode: normStr(loc.districtCode),
    districtName: normStr(loc.districtName),
    fullAddress: normStr(loc.fullAddress),
    coordinates: loc.coordinates || undefined,
    postalCode: normStr(loc.postalCode) || undefined,
  };
}

function pickContact(bodyContact) {
  const c = bodyContact || {};
  return {
    phone: normStr(c.phone),
    mobilePhone: normStr(c.mobilePhone) || undefined,
    fax: normStr(c.fax) || undefined,
    email: normStr(c.email) ? normStr(c.email).toLowerCase() : undefined,
    website: normStr(c.website) || undefined,
  };
}

function isOwnerOrAdmin(req, branch) {
  if (String(req.user?.role) === "admin") return true;
  return String(branch.parentUser) === String(req.user?._id);
}

router.get("/mine", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const q = String(req.user?.role) === "admin" ? {} : { parentUser: req.user._id };
    const items = await Branch.find(q).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, branches: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list branches failed", error: err.message });
  }
});

router.post("/", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const b = req.body || {};

    const name = normStr(b.name);
    const displayName = normStr(b.displayName) || name;
    if (!name) return res.status(400).json({ success: false, message: "name required" });
    if (!displayName) return res.status(400).json({ success: false, message: "displayName required" });

    const location = pickLocation(b.location);
    if (!location.stateCode || !location.stateName) {
      return res.status(400).json({ success: false, message: "stateCode/stateName required" });
    }
    if (!location.districtCode || !location.districtName) {
      return res.status(400).json({ success: false, message: "districtCode/districtName required" });
    }
    if (!location.fullAddress) {
      return res.status(400).json({ success: false, message: "fullAddress required" });
    }

    const contact = pickContact(b.contact);
    if (!contact.phone) {
      return res.status(400).json({ success: false, message: "contact.phone required" });
    }

    let code = normStr(b.code);
    if (!code) code = buildBranchCode(name);
    code = await ensureUniqueCode(code);

    const doc = await Branch.create({
      parentUser: b.parentUser && String(req.user?.role) === "admin" ? b.parentUser : req.user._id,
      name,
      code,
      displayName,
      description: normStr(b.description) || "",
      location,
      contact,
      manager: b.manager || {},
      workingHours: b.workingHours || undefined,
      services: Array.isArray(b.services) ? b.services : [],
      status: {
        isActive: true,
        isApproved: true,
        isMainBranch: Boolean(b?.status?.isMainBranch),
      },
      metadata: {
        createdBy: req.user._id,
        updatedBy: req.user._id,
        source: "business",
      },
    });

    return res.status(201).json({ success: true, branch: doc.toObject() });
  } catch (err) {
    const dup = String(err?.message || "").includes("duplicate key");
    return res
      .status(dup ? 409 : 500)
      .json({ success: false, message: dup ? "code must be unique" : "create branch failed", error: err.message });
  }
});

router.put("/:id", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ success: false, message: "not found" });
    if (!isOwnerOrAdmin(req, branch)) return res.status(403).json({ success: false, message: "forbidden" });

    if (b.name != null) branch.name = normStr(b.name);
    if (b.displayName != null) branch.displayName = normStr(b.displayName);
    if (b.description != null) branch.description = normStr(b.description);

    if (b.location != null) branch.location = pickLocation(b.location);
    if (b.contact != null) branch.contact = pickContact(b.contact);

    if (b.manager != null) branch.manager = b.manager || {};
    if (b.workingHours != null) branch.workingHours = b.workingHours;
    if (b.services != null) branch.services = Array.isArray(b.services) ? b.services : [];

    if (b.status && typeof b.status === "object") {
      if (b.status.isMainBranch != null) branch.status.isMainBranch = Boolean(b.status.isMainBranch);
    }

    branch.metadata = { ...(branch.metadata || {}), updatedBy: req.user._id };

    await branch.save();
    return res.json({ success: true, branch: branch.toObject() });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update branch failed", error: err.message });
  }
});

router.delete("/:id", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ success: false, message: "not found" });
    if (!isOwnerOrAdmin(req, branch)) return res.status(403).json({ success: false, message: "forbidden" });

    if (branch.status?.isMainBranch) {
      return res.status(400).json({ success: false, message: "main branch cannot be deleted" });
    }

    await Branch.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "delete branch failed", error: err.message });
  }
});

module.exports = router;
