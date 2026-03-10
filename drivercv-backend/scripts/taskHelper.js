/**
 * Task Helper - Admin Tasks API ile etkileşim.
 * Kullanım:
 *   node scripts/taskHelper.js list          -- tüm task'ları listele
 *   node scripts/taskHelper.js pending       -- done olmayan task'ları listele
 *   node scripts/taskHelper.js create <json> -- yeni task oluştur
 *   node scripts/taskHelper.js update <id> <json> -- task güncelle
 */
const fs = require("fs");
const path = require("path");

const TOKEN_FILE = path.join(__dirname, "..", "admin_token.local.txt");
const BASE_URL = "http://127.0.0.1:3001/api/admin/tasks";

function getToken() {
  return fs.readFileSync(TOKEN_FILE, "utf8").trim();
}

async function apiCall(method, urlSuffix, body) {
  const token = getToken();
  const url = urlSuffix ? `${BASE_URL}/${urlSuffix}` : BASE_URL;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  return data;
}

(async () => {
  const [, , cmd, ...rest] = process.argv;

  if (cmd === "list") {
    const data = await apiCall("GET");
    console.log(JSON.stringify(data.tasks || data, null, 2));
  } else if (cmd === "pending") {
    const data = await apiCall("GET");
    const pending = (data.tasks || []).filter((t) => t.status !== "done");
    console.log(JSON.stringify(pending, null, 2));
  } else if (cmd === "create") {
    const body = JSON.parse(rest.join(" "));
    const data = await apiCall("POST", "", body);
    console.log(JSON.stringify(data, null, 2));
  } else if (cmd === "update") {
    const id = rest[0];
    const body = JSON.parse(rest.slice(1).join(" "));
    const data = await apiCall("PUT", id, body);
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("Kullanım: node scripts/taskHelper.js [list|pending|create|update]");
  }
})();
