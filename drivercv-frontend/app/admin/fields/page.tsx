// DriverAll-main/drivercv-frontend/app/admin/fields/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter, useSearchParams } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

// Backend modeline yakın, bizim ekranda kullandığımız alanlar:
type FieldDefinition = {
  _id: string;
  key: string;
  label: string;

  description?: string;

  category?: "profile" | "job" | "global";
  country?: string | null;

  fieldType?: "boolean" | "string" | "number" | "date" | "select";
  uiType?: "text" | "number" | "boolean" | "date" | "select" | "multiselect";

  // Gruplama / seçenek kaynağı
  groupKey?: string | null;
  groupLabel?: string | null; // ekranda başlık/gruplama için
  groupLabelOverride?: string | null;
  optionsGroupKey?: string | null; // select/multiselect seçenekleri buradan gelsin

  // Sertifika/validity
  requiresIssueDate?: boolean;
  hasExpiry?: boolean;
  validityYears?: number | null;
  validityModel?: "simple" | "adr";

  // Notification
  notification?: {
    trackExpiry?: boolean;
    startBefore?: {
      unit?: "day" | "month" | "year";
      value?: number;
    };
    repeatEvery?: {
      unit?: "day" | "month";
      value?: number;
    };
  };

  // Görünürlük
  showInCv?: boolean;
  showInJobFilter?: boolean;
  active?: boolean;
};

type FieldGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
  country?: string | null;
};

type FormState = {
  key: string;
  label: string;
  description: string;

  category: "profile" | "job" | "global";
  country: string;

  // Grup başlığı (CV’de başlık/gruplama)
  groupKey: string; // UI’de seçiyoruz, submit’te groupLabel’e çeviriyoruz

  // select/multiselect seçenek grubu
  optionsGroupKey: string;

  fieldType: "boolean" | "string" | "number" | "date" | "select";
  uiType: "text" | "number" | "boolean" | "date" | "select" | "multiselect";

  requiresIssueDate: boolean;
  hasExpiry: boolean;
  validityYears: string;
  validityModel: "simple" | "adr";

  // Notification (uyarı) ayarları
  trackExpiry: boolean;
  startBeforeValue: string;
  startBeforeUnit: "day" | "month" | "year";
  repeatEveryValue: string;
  repeatEveryUnit: "day" | "month";

  showInCv: boolean;
  showInJobFilter: boolean;
  active: boolean;
};

const emptyForm = (): FormState => ({
  key: "",
  label: "",
  description: "",

  category: "profile",
  country: "ALL",

  groupKey: "",
  optionsGroupKey: "",

  fieldType: "boolean",
  uiType: "boolean", // ÖNEMLİ: backend enum'u "boolean"

  requiresIssueDate: false,
  hasExpiry: false,
  validityYears: "",
  validityModel: "simple",

  trackExpiry: false,
  startBeforeValue: "1",
  startBeforeUnit: "month",
  repeatEveryValue: "1",
  repeatEveryUnit: "month",

  showInCv: true,
  showInJobFilter: true,
  active: true,
});

function AdminFieldsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formPanelRef = useRef<HTMLDivElement | null>(null);

  const [lastSavedId, setLastSavedId] = useState<string>("");

  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [editing, setEditing] = useState<FieldDefinition | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [groupSearch, setGroupSearch] = useState("");
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreDraft = searchParams?.get("restoreDraft") === "1";
    const createdGroupKey = (searchParams?.get("createdGroupKey") || "").trim();

    if (!restoreDraft) {
      if (createdGroupKey) {
        setForm((prev) => ({ ...prev, groupKey: createdGroupKey }));
      }
      return;
    }

    try {
      const raw = window.sessionStorage.getItem("adminFieldsDraft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.form) {
          setForm(() => {
            const next = { ...emptyForm(), ...parsed.form };
            if (createdGroupKey) {
              (next as any).groupKey = createdGroupKey;
            }
            return next;
          });
        }
      }
    } catch {
      // ignore
    } finally {
      window.sessionStorage.removeItem("adminFieldsDraft");
    }
  }, [searchParams]);

  // ------------------------------------------------------
  // Veri çekme
  // ------------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const [fieldsRes, groupsRes] = await Promise.all([
        fetch("/api/admin/fields"),
        fetch("/api/admin/field-groups"),
      ]);

      if (!fieldsRes.ok) throw new Error("Kriter listesi alınamadı.");
      if (!groupsRes.ok) throw new Error("Grup listesi alınamadı.");

      const fieldsJson = await fieldsRes.json().catch(() => ({}));
      const groupsJson = await groupsRes.json().catch(() => ({}));

      setFields(fieldsJson.fields || []);
      setGroups(groupsJson.groups || []);
    } catch (e: any) {
      console.error("AdminFields loadData error:", e);
      setError(e?.message || "Veriler alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------
  // Yardımcılar
  // ------------------------------------------------------
  function resetForNew() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setInfo(null);
  }

  useEffect(() => {
    if (!editing) return;
    const el = formPanelRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editing?._id]);

  useEffect(() => {
    if (!lastSavedId) return;
    if (typeof window === "undefined") return;
    const el = document.getElementById(`field-row-${lastSavedId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lastSavedId, fields.length]);

  function fillFormFromField(f: FieldDefinition) {
    setEditing(f);

    // groupLabel’i tekrar UI dropdown’una bağlamak için groupKey eşlemesi:
    const matchedGroupKey =
      String(f.groupKey || "").trim() ||
      groups.find((g) => g.groupLabel === (f.groupLabel || ""))?.groupKey ||
      "";

    setForm({
      key: f.key || "",
      label: f.label || "",
      description: f.description || "",

      category: (f.category as any) || "profile",
      country: (f.country as any) || "ALL",

      groupKey: matchedGroupKey,
      optionsGroupKey: (f.optionsGroupKey as any) || "",

      fieldType: (f.fieldType as any) || "boolean",
      uiType: (f.uiType as any) || "boolean",

      requiresIssueDate: !!f.requiresIssueDate,
      hasExpiry: !!f.hasExpiry,
      validityYears:
        f.validityYears != null && !Number.isNaN(f.validityYears)
          ? String(f.validityYears)
          : "",
      validityModel: (f.validityModel as any) || "simple",

      trackExpiry: !!(f.notification?.trackExpiry),
      startBeforeValue: String(f.notification?.startBefore?.value || 1),
      startBeforeUnit: (f.notification?.startBefore?.unit as any) || "month",
      repeatEveryValue: String(f.notification?.repeatEvery?.value || 1),
      repeatEveryUnit: (f.notification?.repeatEvery?.unit as any) || "month",

      showInCv: f.showInCv !== false,
      showInJobFilter: f.showInJobFilter !== false,
      active: f.active !== false,
    });

    setError(null);
    setInfo(null);
  }

  const groupLabelFromGroupKey = (groupKey: string): string => {
    if (!groupKey) return "";
    return groups.find((g) => g.groupKey === groupKey)?.groupLabel || "";
  };

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    const list = Array.isArray(groups) ? [...groups] : [];
    list.sort((a, b) =>
      String(a.groupKey || "").localeCompare(String(b.groupKey || ""), "tr")
    );
    if (!q) return list;
    return list.filter((g) => {
      const k = String(g.groupKey || "").toLowerCase();
      const l = String(g.groupLabel || "").toLowerCase();
      return k.includes(q) || l.includes(q);
    });
  }, [groups, groupSearch]);

  const goCreateGroup = () => {
    setGroupPickerOpen(false);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          "adminFieldsDraft",
          JSON.stringify({ form })
        );
      } catch {
        // ignore
      }
    }

    const prefillLabel = groupSearch.trim();
    const qs = new URLSearchParams({
      returnTo: "/admin/fields",
      ...(prefillLabel ? { prefillLabel } : {}),
    });
    router.push(`/admin/groups?${qs.toString()}`);
  };

  function onChangeInput(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;

    if (name === "groupKey" && value === "__create__") {
      goCreateGroup();
      return;
    }

    // checkbox
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // select/text
    setForm((prev) => {
      const next: any = { ...prev, [name]: value };

      // Otomatik uyum kuralları:
      // 1) boolean fieldType => uiType mutlaka boolean
      if (name === "fieldType") {
        if (value === "boolean") {
          next.uiType = "boolean";
          next.optionsGroupKey = ""; // boolean’da seçenek grubu gereksiz
        } else if (value === "string") {
          if (prev.uiType === "boolean" || prev.uiType === "select" || prev.uiType === "multiselect") {
            next.uiType = "text";
          }
        } else if (value === "number") {
          next.uiType = "number";
        } else if (value === "date") {
          next.uiType = "date";
        } else if (value === "select") {
          // select ise uiType select/multiselect seçilebilir
          if (prev.uiType !== "select" && prev.uiType !== "multiselect") {
            next.uiType = "select";
          }
        }
      }

      // 2) uiType multiselect => fieldType select olmalı
      if (name === "uiType") {
        if (value === "multiselect" || value === "select") {
          next.fieldType = "select";
        }
        if (value === "boolean") {
          next.fieldType = "boolean";
          next.optionsGroupKey = "";
        }
      }

      return next;
    });
  }

  // ------------------------------------------------------
  // CRUD
  // ------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const key = form.key.trim();
      const label = form.label.trim();
      if (!key || !label) {
        throw new Error("Key ve Etiket alanları zorunludur.");
      }

      if (!form.groupKey) {
        throw new Error("Grup seçilmeden kriter kaydedilemez.");
      }

      const groupLabel = form.groupKey ? groupLabelFromGroupKey(form.groupKey) : "";

      // select/multiselect ise optionsGroupKey zorunlu
      const needsOptions =
        form.fieldType === "select" && (form.uiType === "select" || form.uiType === "multiselect");
      if (needsOptions && !form.optionsGroupKey) {
        throw new Error("Tekli/çoklu seçim kriterlerinde 'Seçenek Grubu' seçilmelidir.");
      }

      // Backend FieldDefinition şemasına UYGUN payload:
      const payload: Partial<FieldDefinition> = {
        key,
        label,
        description: form.description?.trim() || "",

        category: form.category, // profile | job | global
        country: form.country || "ALL",

        fieldType: form.fieldType,
        uiType: form.uiType,

        groupKey: form.groupKey,
        groupLabel: groupLabel || "",
        groupLabelOverride: groupLabel || "",
        optionsGroupKey: needsOptions ? form.optionsGroupKey : "",

        requiresIssueDate: !!form.requiresIssueDate,
        hasExpiry: !!form.hasExpiry,
        validityYears:
          form.validityYears.trim() === "" ? null : Number(form.validityYears.trim()),
        validityModel: form.validityModel || "simple",

        notification: form.trackExpiry ? {
          trackExpiry: true,
          startBefore: {
            unit: form.startBeforeUnit,
            value: Number(form.startBeforeValue) || 1,
          },
          repeatEvery: {
            unit: form.repeatEveryUnit,
            value: Number(form.repeatEveryValue) || 1,
          },
        } : undefined,

        showInCv: !!form.showInCv,
        showInJobFilter: !!form.showInJobFilter,
        active: form.active !== false,
      };

      const url = editing?._id ? `/api/admin/fields/${editing._id}` : "/api/admin/fields";
      const method = editing?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // backend message varsa onu göster
        throw new Error(
          data?.message ||
            (editing?._id
              ? "Kriter güncellenirken hata oluştu."
              : "Kriter oluşturulurken hata oluştu.")
        );
      }

      const saved: FieldDefinition = data.field;

      setFields((prev) => {
        if (editing?._id) return prev.map((f) => (f._id === saved._id ? saved : f));
        return [...prev, saved];
      });

      fillFormFromField(saved);
      setLastSavedId(saved._id);
      setInfo(editing?._id ? "Kriter güncellendi." : "Kriter oluşturuldu.");
    } catch (e: any) {
      console.error("AdminFields handleSubmit error:", e);
      setError(e?.message || "İşlem sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteField(f: FieldDefinition) {
    if (!f?._id) return;
    const ok = window.confirm(
      `"${f.label}" kriterini silmek istediğinize emin misiniz?`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/fields/${f._id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Kriter silinirken hata oluştu.");

      setFields((prev) => prev.filter((x) => x._id !== f._id));
      if (editing?._id === f._id) resetForNew();

      setInfo("Kriter silindi.");
    } catch (e: any) {
      console.error("AdminFields handleDelete error:", e);
      setError(e?.message || "Kriter silinirken hata oluştu.");
    }
  }

  // ------------------------------------------------------
  // Liste / filtre
  // ------------------------------------------------------
  const filtered = useMemo(() => {
    const list = Array.isArray(fields) ? [...fields] : [];
    if (categoryFilter) {
      return list.filter((f) => String(f.category || "") === categoryFilter);
    }
    return list;
  }, [fields, categoryFilter]);

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 text-slate-200">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Kriter Motoru (FieldDefinition)</h1>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
          >
            <option value="">Tümü</option>
            <option value="profile">Profile</option>
            <option value="job">Job</option>
            <option value="global">Global</option>
          </select>

          <button
            onClick={resetForNew}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            Yeni Kriter
          </button>

          <button
            onClick={loadData}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {info}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* SOL: Form */}
        <div
          ref={formPanelRef}
          className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">
              {editing ? `Düzenle: ${editing.label}` : "Yeni Kriter"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-300">Key</label>
                <input
                  name="key"
                  value={form.key}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                  placeholder="EHLIYET_B"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-300">Etiket</label>
                <input
                  name="label"
                  value={form.label}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                  placeholder="B Sınıfı"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-300">Açıklama</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChangeInput}
                rows={2}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Opsiyonel"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-300">Kategori</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                >
                  <option value="profile">profile</option>
                  <option value="job">job</option>
                  <option value="global">global</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-300">Ülke</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                  placeholder="TR / ALL"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-300">
                  Grup (CV başlığı / gruplama)
                </label>
                <select
                  name="groupKey"
                  value={form.groupKey}
                  onChange={onChangeInput}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                >
                  <option value="" disabled>
                    (Seçiniz)
                  </option>
                  <option
                    value="__create__"
                    className="text-emerald-300 font-semibold"
                    style={{ color: "#6EE7B7", fontWeight: 600 }}
                  >
                    + Yeni grup oluştur
                  </option>
                  {groups.map((g) => (
                    <option key={g._id} value={g.groupKey}>
                      {g.groupKey} — {g.groupLabel}
                    </option>
                  ))}
                </select>
                {!!form.groupKey && (
                  <div className="text-[11px] text-slate-400">
                    Kaydedilecek groupLabel:{" "}
                    <span className="text-slate-200">
                      {groupLabelFromGroupKey(form.groupKey)}
                    </span>
                  </div>
                )}

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setGroupPickerOpen((p) => !p)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-left text-xs text-slate-200 hover:bg-slate-900"
                  >
                    {groupPickerOpen ? "Grup listesini kapat" : "Listeden grup seç"}
                  </button>

                  {groupPickerOpen && (
                    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/40 p-2">
                      <div className="mb-2">
                        <input
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                          placeholder="Listeden grup ara (groupKey / groupLabel)"
                        />
                      </div>
                      <div className="max-h-40 overflow-auto">
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            type="button"
                            onClick={goCreateGroup}
                            className="w-full rounded-md border border-emerald-700 bg-emerald-950/30 px-2 py-2 text-left text-xs text-emerald-100 hover:bg-emerald-900/30"
                          >
                            Aradığın grup henüz oluşturulmadıysa yeni oluştur
                          </button>

                          {filteredGroups.map((g) => {
                            const selected = form.groupKey === g.groupKey;
                            return (
                              <button
                                key={g._id}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, groupKey: g.groupKey }));
                                  setGroupPickerOpen(false);
                                }}
                                className={
                                  "w-full rounded-md border px-2 py-1 text-left text-xs " +
                                  (selected
                                    ? "border-sky-500 bg-sky-900/30 text-slate-50"
                                    : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900")
                                }
                              >
                                <div className="font-medium">{g.groupKey}</div>
                                <div className="text-[11px] text-slate-400">
                                  {g.groupLabel}
                                </div>
                              </button>
                            );
                          })}

                          {filteredGroups.length === 0 && (
                            <div className="rounded-md border border-dashed border-slate-700 px-2 py-3 text-center text-xs text-slate-400">
                              Sonuç yok.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-300">
                  Seçenek Grubu (select/multiselect için)
                </label>
                <select
                  name="optionsGroupKey"
                  value={form.optionsGroupKey}
                  onChange={onChangeInput}
                  disabled={!(form.fieldType === "select" && (form.uiType === "select" || form.uiType === "multiselect"))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  <option value="">(Seçiniz)</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g.groupKey}>
                      {g.groupKey} — {g.groupLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-300">
                  Field tipi (fieldType)
                </label>
                <select
                  name="fieldType"
                  value={form.fieldType}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                >
                  <option value="boolean">boolean</option>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="select">select</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-300">UI tipi (uiType)</label>
                <select
                  name="uiType"
                  value={form.uiType}
                  onChange={onChangeInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                >
                  <option value="boolean">boolean</option>
                  <option value="text">text</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="select">select</option>
                  <option value="multiselect">multiselect</option>
                </select>
                <div className="text-[11px] text-slate-400">
                  Not: checkbox yok; backend’de karşılığı <span className="text-slate-200">boolean</span>.
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 space-y-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    name="requiresIssueDate"
                    checked={form.requiresIssueDate}
                    onChange={onChangeInput}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  Belge alım tarihi girilsin
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    name="hasExpiry"
                    checked={form.hasExpiry}
                    onChange={onChangeInput}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  Süre / geçerlilik var
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs text-slate-300">Geçerlilik (yıl)</label>
                  <input
                    name="validityYears"
                    value={form.validityYears}
                    onChange={onChangeInput}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                    placeholder="örn: 5"
                    disabled={!form.hasExpiry}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-slate-300">Validite modeli</label>
                  <select
                    name="validityModel"
                    value={form.validityModel}
                    onChange={onChangeInput}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                  >
                    <option value="simple">simple</option>
                    <option value="adr">adr</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Uyarı Ayarları</h4>
              
              <label className="flex items-center gap-2 text-xs text-slate-200 mb-3">
                <input
                  type="checkbox"
                  name="trackExpiry"
                  checked={form.trackExpiry}
                  onChange={onChangeInput}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                Belge bitişi takip edilsin
              </label>

              {form.trackExpiry && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-300">Uyarı başlasın (önce)</label>
                    <div className="flex gap-2">
                      <input
                        name="startBeforeValue"
                        type="number"
                        min="1"
                        value={form.startBeforeValue}
                        onChange={onChangeInput}
                        className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                      />
                      <select
                        name="startBeforeUnit"
                        value={form.startBeforeUnit}
                        onChange={onChangeInput}
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                      >
                        <option value="day">Gün</option>
                        <option value="month">Ay</option>
                        <option value="year">Yıl</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs text-slate-300">Tekrar sıklığı</label>
                    <div className="flex gap-2">
                      <input
                        name="repeatEveryValue"
                        type="number"
                        min="1"
                        value={form.repeatEveryValue}
                        onChange={onChangeInput}
                        className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                      />
                      <select
                        name="repeatEveryUnit"
                        value={form.repeatEveryUnit}
                        onChange={onChangeInput}
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm"
                      >
                        <option value="day">Gün</option>
                        <option value="month">Ay</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    name="showInCv"
                    checked={form.showInCv}
                    onChange={onChangeInput}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  CV'de göster
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    name="showInJobFilter"
                    checked={form.showInJobFilter}
                    onChange={onChangeInput}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  İlan filtrelerinde kullan
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={onChangeInput}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  Aktif
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editing && (
                <button
                  type="button"
                  onClick={resetForNew}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
                >
                  Vazgeç
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {editing ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </form>
        </div>

        {/* SAĞ: Liste */}
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="mb-3 text-sm font-semibold">Kriterler</div>

          {filtered.length === 0 ? (
            <div className="text-sm text-slate-400">Kayıt yok.</div>
          ) : (
            <div className="space-y-2">
              {filtered
                .slice()
                .sort((a, b) => String(a.label).localeCompare(String(b.label)))
                .map((f) => (
                  <div
                    key={f._id}
                    id={`field-row-${f._id}`}
                    className="rounded-lg border border-slate-700 bg-slate-950/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {f.label}{" "}
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            ({f.key})
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          category: {f.category || "-"} · country: {f.country || "-"} ·
                          type: {f.fieldType || "-"} / {f.uiType || "-"}
                        </div>
                        {(f.groupLabel || f.optionsGroupKey) && (
                          <div className="mt-1 text-xs text-slate-400">
                            groupLabel: {f.groupLabel || "-"} · optionsGroupKey:{" "}
                            {f.optionsGroupKey || "-"}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => fillFormFromField(f)}
                          className="rounded-md border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteField(f)}
                          className="rounded-md border border-red-700 px-3 py-1 text-xs text-red-200 hover:bg-red-950/40"
                        >
                          Sil
                        </button>
                      </div>
                    </div>

                    {f.description && (
                      <div className="mt-2 text-xs text-slate-300">{f.description}</div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminFieldsPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<div className="p-6 text-slate-200">Yükleniyor...</div>}>
        <AdminFieldsInner />
      </Suspense>
    </AdminOnly>
  );
}
