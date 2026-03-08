const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const InstructionTask = require("../models/InstructionTask");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function safeStr(v) {
  return String(v == null ? "" : v);
}

function mdEscape(s) {
  return safeStr(s).replace(/\r\n/g, "\n");
}

function fmtBool(v) {
  return v ? "x" : " ";
}

function buildMd(tasks) {
  const now = new Date();
  const open = tasks.filter((t) => !["done", "canceled"].includes(String(t.status || "")));
  const needsAdminTest = open.filter((t) => !!t.devDone && !t.adminTested);
  const notOk = open.filter((t) => !!t.adminTested && String(t.adminResult || "") === "not_ok");

  const lines = [];
  lines.push(`# Dev Handoff Snapshot`);
  lines.push("");
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push("");
  lines.push(`- Total: ${tasks.length}`);
  lines.push(`- Open: ${open.length}`);
  lines.push(`- Needs Admin Test: ${needsAdminTest.length}`);
  lines.push(`- Not OK: ${notOk.length}`);
  lines.push("");

  const byPriority = { high: 0, medium: 1, low: 2 };
  const sortedOpen = open
    .slice()
    .sort((a, b) => {
      const pa = byPriority[String(a.priority || "medium")] ?? 9;
      const pb = byPriority[String(b.priority || "medium")] ?? 9;
      if (pa !== pb) return pa - pb;
      const ua = new Date(a.updatedAt || 0).getTime();
      const ub = new Date(b.updatedAt || 0).getTime();
      return ub - ua;
    });

  lines.push(`## Open Tasks`);
  lines.push("");
  if (sortedOpen.length === 0) {
    lines.push("(none)");
  } else {
    for (const t of sortedOpen) {
      lines.push(`### ${mdEscape(t.key)} — ${mdEscape(t.title)}`);
      lines.push("");
      lines.push(`- Priority: ${mdEscape(t.priority)}`);
      lines.push(`- Status: ${mdEscape(t.status)}`);
      lines.push(`- Checklist:`);
      lines.push(`  - [${fmtBool(!!t.devDone)}] Dev done`);
      lines.push(`  - [${fmtBool(!!t.adminTested)}] Admin tested`);
      lines.push(`  - Result: ${mdEscape(t.adminResult || "") || "(empty)"}`);
      if (t.adminResultNote) lines.push(`  - Note: ${mdEscape(t.adminResultNote)}`);
      if (t.instruction) {
        lines.push("");
        lines.push(`**Instruction**`);
        lines.push("");
        lines.push(mdEscape(t.instruction));
      }
      lines.push("");
    }
  }

  lines.push(`## Needs Admin Test`);
  lines.push("");
  if (needsAdminTest.length === 0) lines.push("(none)");
  else for (const t of needsAdminTest) lines.push(`- ${mdEscape(t.key)} — ${mdEscape(t.title)}`);

  lines.push("");
  lines.push(`## Not OK`);
  lines.push("");
  if (notOk.length === 0) lines.push("(none)");
  else for (const t of notOk) lines.push(`- ${mdEscape(t.key)} — ${mdEscape(t.title)} (${mdEscape(t.adminResultNote || "")})`);

  lines.push("");
  return lines.join("\n");
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const outDir = path.join(repoRoot, "handoff");
  const outMd = path.join(outDir, "latest.md");
  const outJson = path.join(outDir, "latest.json");

  await mongoose.connect(MONGO_URI);

  const tasks = await InstructionTask.find({})
    .sort({ priority: -1, updatedAt: -1 })
    .limit(2000)
    .lean();

  const payload = {
    generatedAt: new Date().toISOString(),
    mongoUri: MONGO_URI,
    tasks,
  };

  const md = buildMd(tasks);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outMd, md, "utf8");
  fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), "utf8");

  await mongoose.disconnect();

  // stdout is useful for hooks
  console.log(`handoff written: ${outMd}`);
  console.log(`handoff written: ${outJson}`);
}

main().catch(async (err) => {
  console.error("handoff export failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
