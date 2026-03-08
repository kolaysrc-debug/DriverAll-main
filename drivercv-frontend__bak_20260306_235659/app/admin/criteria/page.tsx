"use client";

import React, { useEffect, useState } from "react";

type ExpiryMode = "none" | "age" | "durationFromIssue";

type NotificationSettings = {
  trackExpiry: boolean;
  startBefore?: { unit: "day" | "month" | "year"; value: number };
  repeatEvery?: { unit: "day" | "month"; value: number };
};

type Field = {
  _id: string;
  key: string;
  label: string;
  uiType: string;
  required: boolean;
  category: string;
  countries: string[];
  validityYears: number | null;
  expiryRequired: boolean;
  qualityScore?: number | null;
  expiryMode?: ExpiryMode;
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  coversKeys?: string[];
  requiresKeys?: string[];
  notification?: NotificationSettings;

  // Grup motoru ile ilgili alanlar
  groupKey?: string | null;
  groupLabel?: string | null;
  optionsGroupKey?: string | null;

  active: boolean;
};

type SimpleGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
};

// Aynı origin üzerinden Next.js API route'larına gideceğiz
const API_BASE_URL = "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const hasBody = !!options.body;

  const fetchOptions: RequestInit = {
    ...options,
    method,
  };

  if (hasBody && method !== "GET" && method !== "HEAD") {
    fetchOptions.headers = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data && (data as any).message) ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(String(message));
  }

  return data;
}

function formatDuration(field: Field): string {
  const mode = field.expiryMode || "none";

  if (mode === "age" && field.maxAge) {
    return `${field.maxAge} yaşına kadar`;
  }

  if (mode === "durationFromIssue" && field.validityYears) {
    return `${field.validityYears} yıl`;
  }

  if (field.validityYears) {
    return `${field.validityYears} yıl`;
  }

  return "-";
}

function formatNotification(field: Field): string {
  const notif = field.notification;
  if (!notif || !notif.trackExpiry) return "-";

  const start = notif.startBefore;
  const repeat = notif.repeatEvery;

  const startText = start
    ? start.unit === "year"
      ? `Bitişten ${start.value} yıl önce`
      : start.unit === "month"
      ? `Bitişten ${start.value} ay önce`
      : `Bitişten ${start.value} gün önce`
    : "Başlangıç tanımsız";

  const repeatText = repeat
    ? repeat.unit === "month"
      ? `${repeat.value} ayda bir`
      : `${repeat.value} günde bir`
    : "periyot tanımsız";

  return `${startText}, ${repeatText}`;
}

export default function CriteriaPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [groups, setGroups] = useState<SimpleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"profile" | "job" | "global">(
    "profile"
  );

  const [search, setSearch] = useState("");

  // 🔹 Kapsama / zorunlu ilişkileri test paneli için state
  const [testKeysInput, setTestKeysInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Yeni ekleme formu state
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newQualityScore, setNewQualityScore] = useState("");
  const [newValidityYears, setNewValidityYears] = useState("");
  const [newExpiryMode, setNewExpiryMode] = useState<ExpiryMode>("none");
  const [newMaxAge, setNewMaxAge] = useState("");
  const [newTrackExpiry, setNewTrackExpiry] = useState(false);
  const [newWarnStart, setNewWarnStart] = useState("year:1");
  const [newWarnInterval, setNewWarnInterval] = useState("month:1");
  const [newCoversKeys, setNewCoversKeys] = useState("");
  const [newOptionsGroupKey, setNewOptionsGroupKey] = useState("");

  // Düzenleme formu state
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editType, setEditType] = useState("text");
  const [editRequired, setEditRequired] = useState(false);
  const [editQualityScore, setEditQualityScore] = useState("");
  const [editValidityYears, setEditValidityYears] = useState("");
  const [editExpiryMode, setEditExpiryMode] = useState<ExpiryMode>("none");
  const [editMaxAge, setEditMaxAge] = useState("");
  const [editTrackExpiry, setEditTrackExpiry] = useState(false);
  const [editWarnStart, setEditWarnStart] = useState("year:1");
  const [editWarnInterval, setEditWarnInterval] = useState("month:1");
  const [editCoversKeys, setEditCoversKeys] = useState("");
  const [editOptionsGroupKey, setEditOptionsGroupKey] = useState("");

  async function loadFields() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch(
        `/api/admin/fields?category=${encodeURIComponent(category)}`
      );

      setFields((data as any).fields || []);
    } catch (err: any) {
      setError(err.message || "Kriterler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    try {
      setGroupsLoading(true);
      const data = await apiFetch("/api/admin/field-groups");
      const list = (data as any).groups || [];
      const simple: SimpleGroup[] = list.map((g: any) => ({
        _id: g._id,
        groupKey: g.groupKey,
        groupLabel: g.groupLabel,
      }));
      setGroups(simple);
    } catch (err) {
      console.error("Grup listesi alınamadı:", err);
    } finally {
      setGroupsLoading(false);
    }
  }

  useEffect(() => {
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    loadGroups();
  }, []);

  // ---------------------------------------------------------------------------
  // YENİ KRİTER EKLE
  // ---------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);

      const [startUnit, startVal] = newWarnStart.split(":");
      const [repeatUnit, repeatVal] = newWarnInterval.split(":");

      const body: any = {
        key: newKey.trim(),
        label: newLabel.trim(),
        uiType: newType,
        required: newRequired,
        category,
        roles: ["driver"], // şimdilik
        engines: {
          profile: category === "profile",
          jobs: category === "job",
          searchFilter: false,
          matching: false,
        },
        qualityScore: newQualityScore ? Number(newQualityScore) : null,
        validityYears: newValidityYears ? Number(newValidityYears) : null,
        expiryMode: newExpiryMode,
        maxAge: newMaxAge ? Number(newMaxAge) : null,
        notification: {
          trackExpiry: newTrackExpiry,
          startBefore: newTrackExpiry
            ? {
                unit: startUnit as "day" | "month" | "year",
                value: Number(startVal),
              }
            : undefined,
          repeatEvery: newTrackExpiry
            ? {
                unit: repeatUnit as "day" | "month",
                value: Number(repeatVal),
              }
            : undefined,
        },
        coversKeys: newCoversKeys
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        optionsGroupKey: newOptionsGroupKey || null,
      };

      if (body.expiryMode === "durationFromIssue" && body.validityYears) {
        body.durationYearsFromIssue = body.validityYears;
      }

      await apiFetch("/api/admin/fields", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // formu sıfırla
      setNewLabel("");
      setNewKey("");
      setNewType("text");
      setNewRequired(false);
      setNewQualityScore("");
      setNewValidityYears("");
      setNewExpiryMode("none");
      setNewMaxAge("");
      setNewTrackExpiry(false);
      setNewWarnStart("year:1");
      setNewWarnInterval("month:1");
      setNewCoversKeys("");
      setNewOptionsGroupKey("");

      await loadFields();
    } catch (err: any) {
      setError(err.message || "Kriter eklenirken hata oluştu.");
    }
  }

  // ---------------------------------------------------------------------------
  // DÜZENLEME
  // ---------------------------------------------------------------------------

  function startEdit(field: Field) {
    setEditingField(field);
    setEditLabel(field.label);
    setEditKey(field.key);
    setEditType(field.uiType);
    setEditRequired(field.required);
    setEditQualityScore(
      field.qualityScore !== undefined && field.qualityScore !== null
        ? String(field.qualityScore)
        : ""
    );
    setEditValidityYears(
      field.validityYears !== undefined && field.validityYears !== null
        ? String(field.validityYears)
        : ""
    );
    setEditExpiryMode(field.expiryMode || "none");
    setEditMaxAge(
      field.maxAge !== undefined && field.maxAge !== null
        ? String(field.maxAge)
        : ""
    );

    const notif = field.notification;
    setEditTrackExpiry(!!notif?.trackExpiry);

    if (notif?.startBefore) {
      setEditWarnStart(`${notif.startBefore.unit}:${notif.startBefore.value}`);
    } else {
      setEditWarnStart("year:1");
    }

    if (notif?.repeatEvery) {
      setEditWarnInterval(
        `${notif.repeatEvery.unit}:${notif.repeatEvery.value}`
      );
    } else {
      setEditWarnInterval("month:1");
    }

    setEditCoversKeys((field.coversKeys || []).join(", "));
    setEditOptionsGroupKey(field.optionsGroupKey || "");
  }

  function cancelEdit() {
    setEditingField(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingField) return;

    try {
      setError(null);

      const [startUnit, startVal] = editWarnStart.split(":");
      const [repeatUnit, repeatVal] = editWarnInterval.split(":");

      const body: any = {
        label: editLabel.trim(),
        key: editKey.trim(),
        uiType: editType,
        required: editRequired,
        qualityScore: editQualityScore ? Number(editQualityScore) : null,
        validityYears: editValidityYears ? Number(editValidityYears) : null,
        expiryMode: editExpiryMode,
        maxAge: editMaxAge ? Number(editMaxAge) : null,
        notification: {
          trackExpiry: editTrackExpiry,
          startBefore: editTrackExpiry
            ? {
                unit: startUnit as "day" | "month" | "year",
                value: Number(startVal),
              }
            : undefined,
          repeatEvery: editTrackExpiry
            ? {
                unit: repeatUnit as "day" | "month",
                value: Number(repeatVal),
              }
            : undefined,
        },
        coversKeys: editCoversKeys
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        optionsGroupKey: editOptionsGroupKey || null,
      };

      if (body.expiryMode === "durationFromIssue" && body.validityYears) {
        body.durationYearsFromIssue = body.validityYears;
      }

      await apiFetch(`/api/admin/fields/${editingField._id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setEditingField(null);
      await loadFields();
    } catch (err: any) {
      setError(err.message || "Kriter güncellenirken hata oluştu.");
    }
  }

  // ---------------------------------------------------------------------------
  // AKTİF/PASİF & SİL
  // ---------------------------------------------------------------------------

  async function handleToggleActive(field: Field) {
    try {
      const body = { active: !field.active };
      await apiFetch(`/api/admin/fields/${field._id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      await loadFields();
    } catch (err: any) {
      setError(err.message || "Durum değiştirilirken hata oluştu.");
    }
  }

  async function handleDelete(field: Field) {
    if (
      !window.confirm(
        `"${field.label}" kriterini pasif hale getirmek istiyor musun?`
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/api/admin/fields/${field._id}`, {
        method: "DELETE",
      });
      await loadFields();
    } catch (err: any) {
      setError(err.message || "Kriter silinirken hata oluştu.");
    }
  }

  // ---------------------------------------------------------------------------
  // KAPSAMA / ZORUNLULUK TESTİ
  // ---------------------------------------------------------------------------

  async function handleTestRelations(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      setTestResult(null);
      setTestLoading(true);

      let keys: string[] = [];

      if (testKeysInput.trim()) {
        keys = testKeysInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        // input boşsa ekrandaki kriterlerin hepsiyle test yap
        keys = fields.map((f) => f.key);
      }

      if (keys.length === 0) {
        setError(
          "Test için en az bir kriter key'i gir veya listede kriter olduğundan emin ol."
        );
        setTestLoading(false);
        return;
      }

      const expandRes = await apiFetch("/api/admin/fields/expand-keys", {
        method: "POST",
        body: JSON.stringify({ keys }),
      });

      const validateRes = await apiFetch("/api/admin/fields/validate-keys", {
        method: "POST",
        body: JSON.stringify({ keys }),
      });

      const payload = {
        girilenKeys: keys,
        genisletilmisKeys: (expandRes as any).expandedKeys,
        eksikZorunlular: (validateRes as any).issues,
      };

      setTestResult(JSON.stringify(payload, null, 2));
    } catch (err: any) {
      setError(err.message || "Kapsama testi sırasında hata oluştu.");
    } finally {
      setTestLoading(false);
    }
  }

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Kriterler Yönetimi
            </h1>
            <p className="text-slate-400 text-sm">
              Profil ve ilanlarda kullanılacak dinamik kriterleri buradan
              yönetebilirsin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as "profile" | "job" | "global")
              }
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm outline-none"
            >
              <option value="profile">Profil Kriterleri</option>
              <option value="job">İlan Kriterleri</option>
              <option value="global">Genel</option>
            </select>

            <input
              type="text"
              placeholder="Kriter ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm outline-none"
            />
          </div>
        </header>

        <section className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-200">Bu ekran artık sadece görüntüleme + test içindir.</div>
          <div className="text-[12px] text-slate-200/80 mt-1">
            Kriterleri eklemek ve hiyerarşi/kapsama ilişkilerini tanımlamak için
            <span className="font-semibold"> Grup Hiyerarşisi</span> sayfasını kullan.
            Alan tipi, expiry/uyarı gibi ayarlar için <span className="font-semibold">Fields Motoru</span> kullanılmalı.
          </div>
        </section>

        {/* 🔹 Kapsama / zorunlu ilişkileri test paneli */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            SRC / Ehliyet kapsama mantığını test et
          </h2>
          <p className="text-[11px] text-slate-400">
            Örn:{" "}
            <code className="px-1 py-0.5 bg-slate-800 rounded">SRC1,SRC3</code>{" "}
            yazıp çalıştırdığında, kapsama kuralına göre hangi kriterlerin
            eklenmiş sayıldığını ve eksik zorunlu kriterleri görebilirsin. Boş
            bırakırsan listedeki tüm kriter key&apos;leri ile test yapılır.
          </p>

          <form
            className="grid md:grid-cols-[2fr_1fr] gap-3 items-center"
            onSubmit={handleTestRelations}
          >
            <input
              type="text"
              placeholder="Test edilecek key listesi (örn: SRC1,SRC3)"
              value={testKeysInput}
              onChange={(e) => setTestKeysInput(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={testLoading}
              className="rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-semibold text-xs px-4 py-1.5"
            >
              {testLoading ? "Test ediliyor..." : "Kapsama Testini Çalıştır"}
            </button>
          </form>

          {testResult && (
            <pre className="text-[11px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </section>

        {/* Hata */}
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Liste */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left w-12">#</th>
                <th className="px-3 py-2 text-left">Kriter Adı</th>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">Zorunlu</th>
                <th className="px-3 py-2 text-left">Kalite</th>
                <th className="px-3 py-2 text-left">Süre / Tarih</th>
                <th className="px-3 py-2 text-left">Uyarı</th>
                <th className="px-3 py-2 text-left">Grup</th>
                <th className="px-3 py-2 text-left">Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-slate-400"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && filteredFields.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-slate-400"
                  >
                    Kriter bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredFields.map((field, idx) => {
                  const groupLabel =
                    field.groupLabel || field.optionsGroupKey || "-";

                  return (
                    <tr
                      key={field._id}
                      className="border-t border-slate-800 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-2 text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-50">
                          {field.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {field.key}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200">
                          {field.uiType === "date" && "Tarih"}
                          {field.uiType === "boolean" && "Evet/Hayır"}
                          {field.uiType === "number" && "Sayı"}
                          {field.uiType === "text" && "Metin"}
                          {["select", "multiselect"].includes(field.uiType) &&
                            "Seçim"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {field.required ? (
                          <span className="inline-flex rounded-full bg-rose-500/20 text-rose-300 text-[11px] px-2 py-0.5">
                            Evet
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-700/30 text-slate-300 text-[11px] px-2 py-0.5">
                            Hayır
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {field.qualityScore != null
                          ? `${field.qualityScore}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {formatDuration(field)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {formatNotification(field)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {groupLabel}
                      </td>
                      <td className="px-3 py-2">
                        {field.active ? (
                          <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-700/30 text-slate-300 text-[11px] px-2 py-0.5">
                            Pasif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
