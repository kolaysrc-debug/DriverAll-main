const crypto = require("crypto");

const OtpCredential = require("../../models/OtpCredential");

function safeStr(v) {
  return String(v ?? "").trim();
}

function maskSecret(v) {
  const s = safeStr(v);
  if (!s) return "";
  const last4 = s.length >= 4 ? s.slice(-4) : s;
  return `****${last4}`;
}

function getMasterKey() {
  const raw = safeStr(process.env.OTP_SECRETS_MASTER_KEY);
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

function encryptSecret(plain) {
  const p = safeStr(plain);
  if (!p) return null;

  const key = getMasterKey();
  if (!key) {
    const err = new Error("OTP master key missing (OTP_SECRETS_MASTER_KEY)");
    err.code = "OTP_MASTER_KEY_MISSING";
    throw err;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(p, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
}

function decryptSecret(box) {
  if (!box) return "";

  const key = getMasterKey();
  if (!key) {
    const err = new Error("OTP master key missing (OTP_SECRETS_MASTER_KEY)");
    err.code = "OTP_MASTER_KEY_MISSING";
    throw err;
  }

  const iv = Buffer.from(safeStr(box.iv), "base64");
  const tag = Buffer.from(safeStr(box.tag), "base64");
  const ct = Buffer.from(safeStr(box.ct), "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

async function getCredential(providerKey, ref) {
  const pk = safeStr(providerKey);
  const r = safeStr(ref) || "default";

  const doc = await OtpCredential.findOne({ providerKey: pk, ref: r, isActive: { $ne: false } }).lean();
  if (!doc) return null;

  const authToken = doc.authTokenEnc ? decryptSecret(doc.authTokenEnc) : "";

  return {
    providerKey: pk,
    ref: r,
    accountSid: safeStr(doc.accountSid),
    authToken,
    verifyServiceSid: safeStr(doc.verifyServiceSid),
  };
}

async function upsertCredential({ providerKey, ref, accountSid, authToken, verifyServiceSid, isActive, updatedBy }) {
  const pk = safeStr(providerKey);
  const r = safeStr(ref) || "default";

  const patch = {
    providerKey: pk,
    ref: r,
    isActive: isActive !== false,
    updatedBy: updatedBy || null,
  };

  if (accountSid !== undefined) {
    patch.accountSid = safeStr(accountSid);
  }
  if (verifyServiceSid !== undefined) {
    patch.verifyServiceSid = safeStr(verifyServiceSid);
  }

  if (authToken !== undefined) {
    const tok = safeStr(authToken);
    patch.authTokenEnc = tok ? encryptSecret(tok) : null;
  }

  const doc = await OtpCredential.findOneAndUpdate({ providerKey: pk, ref: r }, patch, {
    new: true,
    upsert: true,
  }).lean();

  return {
    providerKey: pk,
    ref: r,
    isActive: doc.isActive !== false,
    accountSid: safeStr(doc.accountSid),
    verifyServiceSid: safeStr(doc.verifyServiceSid),
    hasAuthToken: !!doc.authTokenEnc,
  };
}

async function listCredentials(providerKey) {
  const pk = safeStr(providerKey);
  const docs = await OtpCredential.find({ providerKey: pk }).sort({ updatedAt: -1 }).lean();
  return (docs || []).map((d) => ({
    providerKey: pk,
    ref: safeStr(d.ref),
    isActive: d.isActive !== false,
    accountSid: safeStr(d.accountSid),
    verifyServiceSid: safeStr(d.verifyServiceSid),
    hasAuthToken: !!d.authTokenEnc,
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
  }));
}

module.exports = {
  getCredential,
  upsertCredential,
  listCredentials,
  maskSecret,
};
