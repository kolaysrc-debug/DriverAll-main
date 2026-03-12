// PATH: DriverAll-main/drivercv-frontend/app/employer/jobs/new/page.tsx
// ====================================================================
// İlan oluşturma (MVP)
// - Kriterler: FieldDefinition üzerinden (ülkeye göre)
// - Seçim mantığı: boolean kriterleri seç + (opsiyonel) zorunlu işaretle
// - Kaydet (draft) ve gönder (submitted)
// Not: Ekran düzenini sade tuttuk, mevcut admin ekranlarının stilini izliyor.
// ====================================================================

"use client";

import React, { useEffect, useMemo, useState } from "react";
import EmployerOnly from "@/components/EmployerOnly";
import { createJob } from "@/lib/api/jobs";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";
import { getToken } from "@/lib/session";

type FieldDefinition = {
  _id: string;
  key: string;
  label: string;
  category?: "profile" | "job" | "global";
  country?: string | null;
  fieldType?: string;
  uiType?: string;
  groupLabel?: string | null;
  optionsGroupKey?: string | null;
  showInCv?: boolean;
  showInJobFilter?: boolean;
  active?: boolean;
};

type FieldGroupNode = { key: string; label: string; active?: boolean; sortOrder?: number; level?: number };
type FieldGroup = { groupKey: string; groupLabel: string; nodes: FieldGroupNode[]; country?: string };

export default function EmployerNewJobPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [country, setCountry] = useState("TR");
  const [city, setCity] = useState("");

  // Opsiyonel serbest alanlar (istersen tamamen kaldırırız)
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");

  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [groups, setGroups] = useState<FieldGroup[]>([]);

  // values: dinamik kriter değerleri (boolean/select/multiselect)
  const [values, setValues] = useState<Record<string, any>>({});

  // requiredMap: sadece boolean kriterlerde “zorunlu” işaretlemek için
  const [requiredMap, setRequiredMap] = useState<Record<string, boolean>>({});

  // ------------------------------------------------------
  // Master data yükle: fields + field-groups
  // ------------------------------------------------------
  useEffect(() => {
    async function loadMaster() {
      try {
        setLoading(true);
        setError(null);

        const headers = { ...authHeaders() };

        const [fieldsRes, groupsRes] = await Promise.all([
          fetch("/api/admin/fields", { headers }),
          fetch("/api/admin/field-groups", { headers }),
        ]);

        if (!fieldsRes.ok) throw new Error("Kriter listesi alınamadı.");
        if (!groupsRes.ok) throw new Error("Grup listesi alınamadı.");

        const fieldsJson = await fieldsRes.json().catch(() => ({}));
        const groupsJson = await groupsRes.json().catch(() => ({}));

        setFields(fieldsJson.fields || []);
        setGroups(groupsJson.groups || []);
      } catch (e: any) {
        setError(e?.message || "Veriler alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadMaster();
  }, []);

  // Ülkeye göre alanları filtrele
  const visibleFields = useMemo(() => {
    const c = country.toUpperCase();
    return (fields || [])
      .filter((f) => f.active !== false)
      .filter((f) => {
        const fc = String(f.country || "ALL").toUpperCase();
        return fc === "ALL" || fc === c;
      })
      // İlan tarafında esasen “profile” kriterleri işin aradığı sürücü nitelikleridir.
      // İstersen category=job kriterlerini de ayrıca ekleriz.
      .filter((f) => f.category === "profile" || f.category === "job")
      .sort((a, b) => String(a.groupLabel || "").localeCompare(String(b.groupLabel || ""), "tr"));
  }, [fields, country]);

  // groupLabel bazlı gruplama (MVP)
  const grouped = useMemo(() => {
    const map = new Map<string, FieldDefinition[]>();
    for (const f of visibleFields) {
      const gl = (f.groupLabel || "Diğer").trim() || "Diğer";
      if (!map.has(gl)) map.set(gl, []);
      map.get(gl)!.push(f);
    }
    return Array.from(map.entries()).map(([groupLabel, items]) => ({
      groupLabel,
      items: items.sort((a, b) => String(a.label).localeCompare(String(b.label), "tr")),
    }));
  }, [visibleFields]);

  function setValue(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function toggleBool(key: string) {
    const next = !(values?.[key] === true);
    setValue(key, next);
    // off olursa zorunlu da kapansın
    if (!next) {
      setRequiredMap((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  }

  function toggleRequired(key: string) {
    setRequiredMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function optionsForField(f: FieldDefinition): FieldGroupNode[] {
    if (!f.optionsGroupKey) return [];
    const g = (groups || []).find((x) => x.groupKey === f.optionsGroupKey);
    if (!g) return [];
    return (g.nodes || []).filter((n) => n.active !== false);
  }

  function computeRequiredOptionalKeys() {
    const selectedBoolKeys = Object.entries(values || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    const requiredKeys = selectedBoolKeys.filter((k) => requiredMap[k] === true);
    const optionalKeys = selectedBoolKeys.filter((k) => !requiredMap[k]);

    return { requiredKeys, optionalKeys };
  }

  async function onSaveDraft() {
    try {
      setSaving(true);
      setError(null);
      setInfo(null);

      const { requiredKeys, optionalKeys } = computeRequiredOptionalKeys();

      const res = await createJob({
        country,
        city,
        title,
        about,
        values,
        requiredKeys,
        optionalKeys,
      });

      setInfo("İlan taslak olarak kaydedildi.");
      // İstersen direkt “ilanlarım” sayfasına gidelim:
      router.push("/employer/jobs");
      return res;
    } catch (e: any) {
      setError(e?.message || "Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EmployerOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 text-slate-200">
        <h1 className="text-xl font-semibold">Yeni İlan</h1>

        {loading && <div className="mt-4 text-slate-400">Yükleniyor...</div>}

        {error && (
          <div className="mt-4 p-3 rounded border border-red-700 bg-red-950/30 text-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="mt-4 p-3 rounded border border-green-700 bg-green-950/30 text-green-200">
            {info}
          </div>
        )}

        {!loading && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded border border-slate-700 bg-slate-900/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-sm text-slate-300 mb-1">Ülke</div>
                  <select
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  >
                    <option value="TR">TR</option>
                    <option value="DE">DE</option>
                    <option value="NL">NL</option>
                    <option value="FR">FR</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm text-slate-300 mb-1">Şehir (opsiyonel)</div>
                  <input
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Örn: İstanbul"
                  />
                </div>

                <div>
                  <div className="text-sm text-slate-300 mb-1">Başlık (opsiyonel)</div>
                  <input
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: TIR Şoförü"
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm text-slate-300 mb-1">Açıklama (opsiyonel)</div>
                <textarea
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="İstersen boş bırak."
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={onSaveDraft}
                  disabled={saving}
                  className="px-3 py-2 rounded bg-slate-200 text-slate-900 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Taslak Kaydet"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {grouped.map((g) => (
                <div
                  key={g.groupLabel}
                  className="p-4 rounded border border-slate-700 bg-slate-900/30"
                >
                  <div className="font-semibold mb-3">{g.groupLabel}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {g.items.map((f) => {
                      const ui = f.uiType || f.fieldType;

                      // boolean: checkbox + zorunlu toggle
                      if (ui === "boolean") {
                        const checked = values?.[f.key] === true;
                        const req = requiredMap[f.key] === true;

                        return (
                          <div key={f.key} className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleBool(f.key)}
                              />
                              <span>{f.label}</span>
                            </label>

                            {checked && (
                              <label className="flex items-center gap-2 text-xs text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={req}
                                  onChange={() => toggleRequired(f.key)}
                                />
                                Zorunlu
                              </label>
                            )}
                          </div>
                        );
                      }

                      // select
                      if (ui === "select") {
                        const opts = optionsForField(f);
                        const v = String(values?.[f.key] || "");

                        return (
                          <div key={f.key}>
                            <div className="text-sm text-slate-300 mb-1">{f.label}</div>
                            <select
                              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                              value={v}
                              onChange={(e) => setValue(f.key, e.target.value)}
                            >
                              <option value="">Seçiniz</option>
                              {opts.map((o) => (
                                <option key={o.key} value={o.key}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      // multiselect
                      if (ui === "multiselect") {
                        const opts = optionsForField(f);
                        const arr = Array.isArray(values?.[f.key]) ? values[f.key] : [];
                        const set = new Set(arr.map(String));

                        function toggleMulti(k: string) {
                          const next = new Set(set);
                          if (next.has(k)) next.delete(k);
                          else next.add(k);
                          setValue(f.key, Array.from(next));
                        }

                        return (
                          <div key={f.key}>
                            <div className="text-sm text-slate-300 mb-1">{f.label}</div>
                            <div className="space-y-1">
                              {opts.map((o) => (
                                <label key={o.key} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={set.has(String(o.key))}
                                    onChange={() => toggleMulti(String(o.key))}
                                  />
                                  <span>{o.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // fallback: text
                      return (
                        <div key={f.key}>
                          <div className="text-sm text-slate-300 mb-1">{f.label}</div>
                          <input
                            className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700"
                            value={String(values?.[f.key] || "")}
                            onChange={(e) => setValue(f.key, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </EmployerOnly>
  );
}
