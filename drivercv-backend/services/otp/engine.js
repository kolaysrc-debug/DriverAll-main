const OtpConfig = require("../../models/OtpConfig");

const twilioVerify = require("./providers/twilioVerify");
const devMock = require("./providers/devMock");

function safeStr(v) {
  return String(v ?? "").trim();
}

function isDevMockEnabled() {
  const v = safeStr(process.env.OTP_DEV_MOCK_ENABLED).toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function getForcedProviderKey() {
  const k = safeStr(process.env.OTP_FORCE_PROVIDER);
  if (!k) return "";
  if (k === "devMock" || k === "twilioVerify") return k;
  return "";
}

function applyForcedProvider(cfg) {
  const forced = getForcedProviderKey();
  if (!forced) return cfg;

  return {
    ...(cfg || {}),
    providers: {
      whatsapp: [{ providerKey: forced, credentialRef: "default", isActive: true }],
      sms: [{ providerKey: forced, credentialRef: "default", isActive: true }],
    },
  };
}

async function getConfigForCountry(country) {
  const c = safeStr(country).toUpperCase() || "TR";
  const cfg = await OtpConfig.findOne({ country: c, isActive: { $ne: false } }).lean();
  if (cfg) return applyForcedProvider(cfg);

  const defaultProviderKey =
    getForcedProviderKey() || (isDevMockEnabled() ? "devMock" : "twilioVerify");

  return {
    country: c,
    isActive: true,
    channelPriority: ["whatsapp", "sms"],
    providers: {
      whatsapp: [{ providerKey: defaultProviderKey, credentialRef: "default", isActive: true }],
      sms: [{ providerKey: defaultProviderKey, credentialRef: "default", isActive: true }],
    },
    brandName: "DriverAll",
    locale: "tr",
    otpLength: 6,
    ttlSeconds: 300,
    resendCooldownSeconds: 60,
    maxRequestsPerPhonePerDay: 10,
  };
}

function listProvidersForChannel(cfg, channel) {
  const ch = safeStr(channel).toLowerCase();
  const list = cfg?.providers?.[ch];
  return (Array.isArray(list) ? list : []).filter((x) => x && x.isActive !== false && x.providerKey);
}

async function sendOtp({ country, phoneE164 }) {
  const cfg = await getConfigForCountry(country);
  const priority = Array.isArray(cfg.channelPriority) ? cfg.channelPriority : ["whatsapp", "sms"];

  const errors = [];

  for (const channel of priority) {
    const providers = listProvidersForChannel(cfg, channel);
    for (const p of providers) {
      try {
        const providerKey = safeStr(p.providerKey);
        const credentialRef = safeStr(p.credentialRef);

        if (providerKey === "devMock") {
          const res = await devMock.sendOtp({ to: phoneE164, channel, credentialRef });
          return {
            channel,
            providerKey,
            credentialRef,
            providerRequestId: res.providerRequestId,
            config: cfg,
          };
        }

        if (providerKey === "twilioVerify") {
          const res = await twilioVerify.sendOtp({ to: phoneE164, channel, credentialRef });
          return {
            channel,
            providerKey,
            credentialRef,
            providerRequestId: res.providerRequestId,
            config: cfg,
          };
        }

        throw new Error(`Unknown provider: ${providerKey}`);
      } catch (e) {
        errors.push({ channel, providerKey: p?.providerKey, error: e?.message || String(e) });
      }
    }
  }

  const err = new Error("OTP send failed");
  err.details = errors;
  throw err;
}

async function checkOtp({ country, phoneE164, code }) {
  const cfg = await getConfigForCountry(country);

  const tried = [];

  const channels = Array.isArray(cfg.channelPriority) ? cfg.channelPriority : ["whatsapp", "sms"];
  for (const channel of channels) {
    const providers = listProvidersForChannel(cfg, channel);
    for (const p of providers) {
      const providerKey = safeStr(p.providerKey);

      try {
        const credentialRef = safeStr(p.credentialRef);

        if (providerKey === "devMock") {
          const res = await devMock.checkOtp({ to: phoneE164, code, credentialRef });
          return { providerKey, credentialRef, status: res.status, raw: res.raw, config: cfg };
        }

        if (providerKey === "twilioVerify") {
          const res = await twilioVerify.checkOtp({ to: phoneE164, code, credentialRef });
          return { providerKey, credentialRef, status: res.status, raw: res.raw, config: cfg };
        }

        throw new Error(`Unknown provider: ${providerKey}`);
      } catch (e) {
        tried.push({ channel, providerKey, error: e?.message || String(e) });
      }
    }
  }

  const err = new Error("OTP verify failed");
  err.details = tried;
  throw err;
}

module.exports = {
  getConfigForCountry,
  sendOtp,
  checkOtp,
};
