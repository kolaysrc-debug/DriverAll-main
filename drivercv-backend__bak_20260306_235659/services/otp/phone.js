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

  if (raw.startsWith("+")) return raw;

  if (c === "TR") {
    if (/^0\d{10}$/.test(raw)) return `+90${raw.slice(1)}`;
    if (/^\d{10}$/.test(raw)) return `+90${raw}`;
    if (/^90\d{10}$/.test(raw)) return `+${raw}`;
  }

  return "";
}

module.exports = {
  normalizeCountry,
  normalizePhoneE164,
};
