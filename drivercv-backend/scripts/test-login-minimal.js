const axios = require("axios");

async function main() {
  const base = process.env.BASE_URL || "http://127.0.0.1:3002";
  const email = process.env.EMAIL || "hgd@gmail.com";
  const phone = process.env.PHONE || "0000000000";

  const url = `${base}/api/auth/login-minimal`;

  try {
    const res = await axios.post(url, { email, phone }, { validateStatus: () => true });
    console.log("URL:", url);
    console.log("STATUS:", res.status);
    console.log("DATA:", JSON.stringify(res.data, null, 2));

    if (res.status === 404) {
      console.log("\nNOT FOUND (404). Server eski kodla çalışıyor olabilir. Backend'i restart edin.");
    }
  } catch (err) {
    console.error("REQUEST FAILED:", err?.message || err);
    if (err?.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    }
    process.exitCode = 1;
  }
}

main();
