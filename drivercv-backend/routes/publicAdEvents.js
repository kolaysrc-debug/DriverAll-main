const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const AdEvent = require("../models/AdEvent");

function safeStr(v) {
  return String(v || "").trim();
}

function safeUpper(v) {
  return safeStr(v).toUpperCase();
}

function getIp(req) {
  const xf = safeStr(req.headers["x-forwarded-for"]);
  if (xf) return xf.split(",")[0].trim();
  return (
    safeStr(req.ip) ||
    safeStr(req.connection?.remoteAddress) ||
    safeStr(req.socket?.remoteAddress) ||
    ""
  );
}

router.post("/event", async (req, res) => {
  try {
    const b = req.body || {};

    const type = safeStr(b.type);
    if (type !== "impression" && type !== "click") {
      return res.status(400).json({ success: false, message: "type must be impression|click" });
    }

    const campaignId = safeStr(b.campaignId);
    if (!campaignId || !mongoose.isValidObjectId(campaignId)) {
      return res.status(400).json({ success: false, message: "campaignId invalid" });
    }

    const placement = safeStr(b.placement);
    const country = safeUpper(b.country);

    const viewerGeo = {
      provinceCode: safeStr(b.viewerGeo?.provinceCode || b.provinceCode),
      districtCode: safeStr(b.viewerGeo?.districtCode || b.districtCode),
    };

    const doc = await AdEvent.create({
      type,
      campaignId,
      placement,
      country,
      viewerGeo,
      meta: {
        userAgent: safeStr(req.headers["user-agent"]),
        referer: safeStr(req.headers["referer"]),
        ip: getIp(req),
      },
    });

    return res.json({ success: true, id: doc._id });
  } catch (err) {
    return res.status(500).json({ success: false, message: "event failed", error: err.message });
  }
});

module.exports = router;
