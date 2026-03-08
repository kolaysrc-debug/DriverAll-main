// PATH: DriverAll-main/drivercv-backend/services/otp/phone.js

function safeStr(v) {
  return String(v ?? "").trim();
}

function normalizeCountry(v, fallback = "TR") {
  const c = safeStr(v).toUpperCase();
  return c || fallback;
}

function normalizePhoneE164(input, country = "TR") {
  const raw = safeStr(input).replace(/\s+/g, "");
  const c = normalizeCountry(country, "TR");
  if (!raw) return "";

  // Already E.164
  if (raw.startsWith("+")) return raw;

  // TR convenience
  if (c === "TR") {
    // 0XXXXXXXXXX -> +90XXXXXXXXXX
    if (/^0\d{10}$/.test(raw)) return `+90${raw.slice(1)}`;

    // 5XXXXXXXXX or 10 digits -> +90XXXXXXXXXX
    if (/^\d{10}$/.test(raw)) return `+90${raw}`;

    // 90XXXXXXXXXX -> +90XXXXXXXXXX
    if (/^90\d{10}$/.test(raw)) return `+${raw}`;
  }

  // If not TR, require leading + for now
  return "";
}

module.exports = {
  normalizeCountry,
  normalizePhoneE164,
};
