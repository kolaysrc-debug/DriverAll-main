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

const DISCUSSION_TASKS = [
  {
    key: "job-criteria-normalize-format",
    title: "Job criteria formatını tek tipe normalize et (must/nice destekli)",
    priority: "high",
    instruction:
      "Şu an employer ekranı criteria'yı {KEY:true} map olarak, admin ekranı ise [{fieldKey, mode}] array olarak gönderiyor. Backend create/update'te normalize ederek DB'ye tek tip yaz: criteria[KEY]={mode:'must'|'nice'} (true => must varsay). Apply/matching tarafı bu normalize edilmiş format üzerinden çalışsın.",
    tags: ["discussion_gap", "criteria", "jobs"],
  },
  {
    key: "apply-block-invalid-required-docs",
    title: "Başvuruda zorunlu süreli kriterleri validity ile blokla",
    priority: "high",
    instruction:
      "POST /api/jobs/:jobId/apply içinde job.criteria (must) + driver DynamicProfile.criteriaValues.documents verisine göre computeDocumentValidity çalıştır. Expired/missing_issue_date/age_limit vb. durumlarda başvuruyu 400 ile engelle; nice-to-have ise engelleme yerine uyarı/snapshot üret.",
    tags: ["discussion_gap", "criteria", "apply", "validity"],
  },
  {
    key: "candidate-documents-editor-issue-expiry-ui",
    title: "Aday doküman editöründe issueDate/expiryDate alanlarını UI’dan yönet",
    priority: "high",
    instruction:
      "Candidate CV/criteria ekranında süreli belgeler için issueDate (zorunlu), opsiyonel expiryDate girişini ekle. FieldDefinition.requiresIssueDate/hasExpiry/expiryMode ayarlarına göre form davranışı: seçili belge varsa issueDate yoksa invalid kabul edilecek şekilde kullanıcıyı uyar.",
    tags: ["discussion_gap", "frontend", "documents", "validity"],
  },
  {
    key: "matching-filter-by-validity",
    title: "Job list/matching filtrelemede süreli kriterleri geçerliliğe göre hesapla",
    priority: "medium",
    instruction:
      "İlan listeleme/eşleştirme akışında (public jobs, öneriler vb.) sadece criteria KEY varlığına bakmak yerine candidate document validity hesapla. Zorunlu kriterlerde invalid ise eşleşmeden çıkar; nice kriterlerde skora/uyarıya yansıt.",
    tags: ["discussion_gap", "matching", "validity"],
  },
  {
    key: "birthyear-source-for-age-rule",
    title: "65 yaş kuralı için birthYear kaynağını netleştir ve standardize et",
    priority: "medium",
    instruction:
      "computeDocumentValidity için birthYear şu an DriverCvProfile'dan okunabiliyor. Apply/matching akışlarında birthYear'ı güvenilir şekilde çek (DriverCvProfile) ve ileride gerekirse DynamicProfile'a da taşımak için planla.",
    tags: ["discussion_gap", "validity", "age_rule"],
  },
];

function buildUpsert(doc) {
  return {
    key: normalizeKey(doc.key),
    title: String(doc.title || ""),
    instruction: String(doc.instruction || ""),
    description: "",
    priority: doc.priority || "medium",
    status: "pending",
    tags: Array.isArray(doc.tags) ? doc.tags : ["discussion_gap"],

    devDone: false,
    devDoneAt: null,
    adminTested: false,
    adminTestedAt: null,
    adminResult: "",
    adminResultNote: "",
    doneAt: null,
  };
}

async function main() {
  console.log("Seeding instruction tasks from discussions...");
  console.log("Mongo URI:", MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected:", mongoose.connection?.name);

  let upserted = 0;
  for (const t of DISCUSSION_TASKS) {
    const payload = buildUpsert(t);

    await InstructionTask.updateOne(
      { key: payload.key },
      {
        $setOnInsert: {
          key: payload.key,
          createdByUserId: null,
        },
        $set: {
          title: payload.title,
          description: payload.description,
          instruction: payload.instruction,
          priority: payload.priority,
          status: payload.status,
          tags: payload.tags,
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
