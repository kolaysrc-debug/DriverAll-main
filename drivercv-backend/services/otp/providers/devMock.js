const crypto = require("crypto");

const codesByPhone = new Map();

function safeStr(v) {
  return String(v ?? "").trim();
}

function normalizeChannel(v) {
  const ch = safeStr(v).toLowerCase();
  if (!ch || !["sms", "whatsapp"].includes(ch)) {
    throw new Error("Invalid channel for devMock");
  }
  return ch;
}

function genFixedOrRandomCode() {
  const fixed = safeStr(process.env.OTP_DEV_FIXED_CODE);
  if (fixed) return fixed;

  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

async function sendOtp({ to, channel }) {
  normalizeChannel(channel);
  const phone = safeStr(to);
  if (!phone) throw new Error("Missing destination phone");

  const code = genFixedOrRandomCode();
  const providerRequestId = `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  codesByPhone.set(phone, { code, providerRequestId, createdAt: Date.now() });

  try {
    console.log(`[otp:devMock] sendOtp to=${phone} channel=${channel} code=${code}`);
  } catch {
    // ignore
  }

  return {
    providerRequestId,
    raw: { devMock: true },
  };
}

async function checkOtp({ to, code }) {
  const phone = safeStr(to);
  const input = safeStr(code);
  if (!phone) throw new Error("Missing destination phone");
  if (!input) throw new Error("Missing code");

  const fixed = safeStr(process.env.OTP_DEV_FIXED_CODE);
  if (fixed) {
    return {
      status: fixed === input ? "approved" : "denied",
      raw: { devMock: true, fixed: true },
    };
  }

  const row = codesByPhone.get(phone);
  const ok = !!row && safeStr(row.code) === input;
  return {
    status: ok ? "approved" : "denied",
    raw: { devMock: true },
  };
}

module.exports = {
  sendOtp,
  checkOtp,
};
