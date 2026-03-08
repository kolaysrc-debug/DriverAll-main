const mongoose = require("mongoose");

const InstructionTask = require("../models/InstructionTask");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function normalizeKey(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

const TODOS = [
  {
    id: "criteria-validity-use",
    content:
      "Kriterlerde 'alınış tarihi' + 'geçerlilik süresi' alanlarını gerçek kaynak (DynamicProfile.criteriaValues.documents) üzerinden hesaplayıp (65 yaş kuralı dahil) ilan eşleştirme/filtreleme/başvuru bloklama/uyarı akışında kullan.",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "product-task-tracker",
    content:
      "Ürüne kalıcı 'Talimat / Yapılacaklar Takip' sistemi ekle: DB’ye yazılan checklist + admin paneli + gerekli akışlarda (matching/validity gibi) görev/karar takibi.",
    priority: "high",
    status: "done",
  },
  {
    id: "db-unavailable-verify-fix",
    content:
      "MongoDB OOM fix kalıcılaştır: mongod.cfg içinde wiredTiger.engineConfig.cacheSizeGB ve setParameter.diagnosticDataCollectionEnabled doğrula; yoksa admin ile patch+restart ve tekrar doğrula.",
    priority: "medium",
    status: "pending",
  },
  {
    id: "homepage-ux-benchmark-impl",
    content:
      "Homepage benchmark/UX iyileştirmeleri: hero sonrası bileşen seti ve görsel hiyerarşi/perf düzeni.",
    priority: "medium",
    status: "pending",
  },
  {
    id: "prod-hardening-impl",
    content:
      "Prod-hardening önerileri (env/proxy, JWT_SECRET fail-fast, helmet+CORS, errorHandler, route/role audit).",
    priority: "low",
    status: "pending",
  },
];

function mapTodoToTask(todo) {
  const now = new Date();
  const key = normalizeKey(todo.id || todo.content);

  let status = "pending";
  if (todo.status === "in_progress") status = "in_progress";
  if (todo.status === "completed" || todo.status === "done") status = "done";

  const isDone = status === "done";

  return {
    key,
    title: String(todo.id || key),
    description: "",
    instruction: String(todo.content || ""),
    priority: todo.priority || "medium",
    tags: ["todo_import"],

    devDone: isDone,
    devDoneAt: isDone ? now : null,

    adminTested: isDone,
    adminTestedAt: isDone ? now : null,

    adminResult: isDone ? "ok" : "",
    adminResultNote: "",

    status,
    doneAt: isDone ? now : null,
  };
}

async function main() {
  console.log("Seeding instruction tasks from internal TODO list...");
  console.log("Mongo URI:", MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected:", mongoose.connection?.name);

  let upserted = 0;
  for (const todo of TODOS) {
    const payload = mapTodoToTask(todo);

    await InstructionTask.updateOne(
      { key: payload.key },
      {
        $setOnInsert: {
          createdByUserId: null,
        },
        $set: {
          title: payload.title,
          description: payload.description,
          instruction: payload.instruction,
          priority: payload.priority,
          tags: payload.tags,
          status: payload.status,
          devDone: payload.devDone,
          devDoneAt: payload.devDoneAt,
          adminTested: payload.adminTested,
          adminTestedAt: payload.adminTestedAt,
          adminResult: payload.adminResult,
          adminResultNote: payload.adminResultNote,
          doneAt: payload.doneAt,
          updatedByUserId: null,
        },
      },
      { upsert: true }
    );

    upserted += 1;
    console.log("Upserted:", payload.key);
  }

  console.log(`Done. Upserted ${upserted} tasks.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
