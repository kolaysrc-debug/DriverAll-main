"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createJob } from "@/lib/api/jobs";
import { isAutoAdded, resolveGroupSelection } from "@/lib/groupCriteriaEngine";

// ------------------------------------------------------
// Tipler
// ------------------------------------------------------

type CriteriaItem = {
  groupKey: string;
  fieldKey: string;
  label: string;
  description?: string;
  coverage?: string[];
  requiredWith?: string[];
};

type CriteriaGroup = {
  key: string;
  label: string;
  country?: string | null;
  items: CriteriaItem[];
};

function cleanKey(v: any) {
  return String(v || "").trim();
}

function toKeyArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(cleanKey).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(cleanKey).filter(Boolean);
  return [];
}

function recomputeGroupCriteria(params: {
  group: CriteriaGroup;
  prevAll: SelectedCriteria[];
  nextManualKeys: string[];
}): SelectedCriteria[] {
  const { group, prevAll, nextManualKeys } = params;
  const prevInGroup = prevAll.filter((c) => c.groupKey === group.key);
  const prevManualMap = new Map<string, SelectedCriteria>();
  for (const c of prevInGroup) {
    if (c.auto) continue;
    prevManualMap.set(String(c.fieldKey), c);
  }

  const nodes = (group.items || []).map((it) => ({
    key: String(it.fieldKey),
    label: it.label,
    coverage: it.coverage,
    requiredWith: it.requiredWith,
  }));
  const resolved = resolveGroupSelection(nextManualKeys, nodes as any);
  const itemByKey = new Map<string, CriteriaItem>();
  for (const it of group.items || []) itemByKey.set(String(it.fieldKey), it);

  const nextInGroup: SelectedCriteria[] = [];
  for (const key of resolved.effectiveKeys || []) {
    const it = itemByKey.get(String(key));
    if (!it) continue;

    const auto = isAutoAdded(resolved.reasons || ({} as any), String(key));
    const prevManual = prevManualMap.get(String(key));

    nextInGroup.push({
      ...it,
      mode: prevManual?.mode || "must",
      auto,
    });
  }

  return [...prevAll.filter((c) => c.groupKey !== group.key), ...nextInGroup];
}

type SelectedCriteria = CriteriaItem & {
  mode: "must" | "nice"; // zorunlu / tercihen
  auto?: boolean;
};

type JobCriteriaInput = {
  groupKey: string;
  fieldKey: string;
  label: string;
  mode: "must" | "nice";
};

type JobDraft = {
  title: string;
  country: string; // ülke kodu (TR, DE vb.)
  city: string;
  employmentType: string; // listeden seçilecek
  description: string;
  criteria: SelectedCriteria[];
};

// ------------------------------------------------------
// Ülke ve çalışma tipi listeleri
// ------------------------------------------------------

const COUNTRIES = [
  { code: "ALL", name: "Tüm Ülkeler / Belirtmek İstemiyorum" },
  { code: "TR", name: "Türkiye" },
  { code: "DE", name: "Almanya" },
  { code: "NL", name: "Hollanda" },
  { code: "BE", name: "Belçika" },
  { code: "FR", name: "Fransa" },
  { code: "ES", name: "İspanya" },
  { code: "IT", name: "İtalya" },
  { code: "FI", name: "Finlandiya" },
  { code: "NO", name: "Norveç" },
  { code: "DK", name: "Danimarka" },
  { code: "SE", name: "İsveç" },
  { code: "PL", name: "Polonya" },
  { code: "CZ", name: "Çekya" },
  { code: "HU", name: "Macaristan" },
];

const EMPLOYMENT_TYPES = [
  "Belirtilmedi",
  "Tam zamanlı",
  "Yarı zamanlı",
  "Sezonluk",
  "Proje bazlı",
  "2+1 sistem",
  "3+1 sistem",
];

export default function JobCreatePage() {
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const [draft, setDraft] = useState<JobDraft>({
    title: "",
    country: "TR",
    city: "",
    employmentType: "Belirtilmedi",
    description: "",
    criteria: [],
  });

  const [groups, setGroups] = useState<CriteriaGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // --------------------------------------------------
  // FieldGroup'ları backend'den çek
  // --------------------------------------------------
  useEffect(() => {
    async function loadGroups() {
      try {
        setGroupsLoading(true);
        setGroupsError(null);

        const res = await fetch("/api/admin/field-groups");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const apiGroups = Array.isArray(data.groups) ? data.groups : [];

        const mapped: CriteriaGroup[] = apiGroups
          .map((g: any) => {
            const rawNodes = Array.isArray(g.nodes) ? g.nodes : [];
            const items: CriteriaItem[] = rawNodes
              .filter((n: any) => n && (n.active === undefined || n.active))
              .map((n: any) => ({
                groupKey: g.groupKey || g.key,
                fieldKey: n.key,
                label: n.label,
                description:
                  n.coverage && n.coverage.length
                    ? `Kapsar: ${n.coverage.join(", ")}`
                    : undefined,
                coverage: toKeyArr(n.coverage),
                requiredWith: toKeyArr(n.requiredWith),
              }));

            return {
              key: g.groupKey || g.key,
              label: g.groupLabel || g.label,
              country: g.country || "ALL",
              items,
            };
          })
          .filter((g: CriteriaGroup) => g.items.length > 0);

        setGroups(mapped);

        if (mapped.length > 0) {
          setActiveGroupKey(mapped[0].key);
        }
      } catch (err: any) {
        console.error("Field groups load error:", err);
        setGroupsError(
          `Kriter grupları alınırken hata oluştu: ${
            err?.message || "bilinmeyen hata"
          }`
        );
      } finally {
        setGroupsLoading(false);
      }
    }

    loadGroups();
  }, []);

  // --------------------------------------------------
  // Seçilen ülkeye göre grup filtreleme
  // --------------------------------------------------

  const filteredGroups = useMemo(() => {
    if (!draft.country || draft.country === "ALL") {
      return groups;
    }
    return groups.filter(
      (g) => !g.country || g.country === "ALL" || g.country === draft.country
    );
  }, [groups, draft.country]);

  useEffect(() => {
    if (filteredGroups.length === 0) {
      setActiveGroupKey(null);
      return;
    }
    if (!activeGroupKey) {
      setActiveGroupKey(filteredGroups[0].key);
      return;
    }
    const exists = filteredGroups.some((g) => g.key === activeGroupKey);
    if (!exists) {
      setActiveGroupKey(filteredGroups[0].key);
    }
  }, [filteredGroups, activeGroupKey]);

  const activeGroup: CriteriaGroup | null = useMemo(() => {
    if (!filteredGroups.length) return null;
    if (!activeGroupKey) return filteredGroups[0];
    return (
      filteredGroups.find((g) => g.key === activeGroupKey) ||
      filteredGroups[0]
    );
  }, [filteredGroups, activeGroupKey]);

  // ------------------------------------------------------
  // Kriter ekleme / çıkarma / mod değiştirme
  // ------------------------------------------------------

  function toggleCriteria(item: CriteriaItem) {
    setDraft((prev) => {
      const group = groups.find((g) => g.key === item.groupKey) || null;
      if (!group) return prev;

      const existing = prev.criteria.find(
        (c) => c.groupKey === item.groupKey && c.fieldKey === item.fieldKey
      );

      if (existing?.auto) {
        return prev;
      }

      if (existing) {
        const nextManualKeys = prev.criteria
          .filter((c) => c.groupKey === item.groupKey && !c.auto)
          .filter((c) => c.fieldKey !== item.fieldKey)
          .map((c) => String(c.fieldKey));

        const nextAll = recomputeGroupCriteria({
          group,
          prevAll: prev.criteria,
          nextManualKeys,
        });

        return { ...prev, criteria: nextAll };
      }

      const nextManualKeys = [
        ...prev.criteria
          .filter((c) => c.groupKey === item.groupKey && !c.auto)
          .map((c) => String(c.fieldKey)),
        String(item.fieldKey),
      ];

      const nextAll = recomputeGroupCriteria({
        group,
        prevAll: [...prev.criteria, { ...item, mode: "must" as const, auto: false }],
        nextManualKeys,
      });

      return { ...prev, criteria: nextAll };
    });
  }

  function toggleMode(item: SelectedCriteria) {
    if (item.auto) return;
    setDraft((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => {
        if (c.groupKey === item.groupKey && c.fieldKey === item.fieldKey) {
          return { ...c, mode: c.mode === "must" ? "nice" : "must" };
        }
        return c;
      }),
    }));
  }

  function removeCriteria(item: SelectedCriteria) {
    if (item.auto) return;
    setDraft((prev) => {
      const group = groups.find((g) => g.key === item.groupKey) || null;
      if (!group) {
        return {
          ...prev,
          criteria: prev.criteria.filter(
            (c) => !(c.groupKey === item.groupKey && c.fieldKey === item.fieldKey)
          ),
        };
      }

      const nextManualKeys = prev.criteria
        .filter((c) => c.groupKey === item.groupKey && !c.auto)
        .filter((c) => c.fieldKey !== item.fieldKey)
        .map((c) => String(c.fieldKey));

      const nextAll = recomputeGroupCriteria({
        group,
        prevAll: prev.criteria,
        nextManualKeys,
      });

      return { ...prev, criteria: nextAll };
    });
  }

  function handleDraftChange(field: keyof JobDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  // ------------------------------------------------------
  // Kaydet (gerçek API çağrısı)
  // ------------------------------------------------------
  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (!draft.title.trim()) {
      setSaveError("İlan başlığını yazmanız gerekiyor.");
      return;
    }

    if (!draft.criteria.length) {
      setSaveError(
        "En az bir kriter seçmeniz önerilir. (Örn. ehliyet veya SRC grubu)"
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        country: draft.country,
        city: draft.city.trim(),
        employmentType: draft.employmentType,
        description: draft.description.trim(),
        criteria: draft.criteria.map<JobCriteriaInput>((c) => ({
          groupKey: c.groupKey,
          fieldKey: c.fieldKey,
          label: c.label,
          mode: c.mode,
        })),
      };

      const job = await createJob(payload);

      setSaveSuccess(
        `İlan taslağı kaydedildi (ID: ${job._id}). İstersen daha sonra durumunu 'yayında' yapabiliriz.`
      );
    } catch (err: any) {
      console.error("createJob error:", err);
      setSaveError(
        err?.message ||
          "İlan kaydedilirken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setSaving(false);
    }
  }

  const mustCriteria = draft.criteria.filter((c) => c.mode === "must");
  const niceCriteria = draft.criteria.filter((c) => c.mode === "nice");

  const selectedCountryName =
    COUNTRIES.find((c) => c.code === draft.country)?.name || "Tüm Ülkeler";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Başlık */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Yeni İlan Oluştur (İşveren / Firma)
            </h1>
            <p className="text-slate-400 text-sm">
              Bu ekran, herhangi bir şirkete özel değil; DriverAll platformunda
              sürücü arayan tüm işverenler için tasarlanmış genel ilan
              motorudur. İlan, aslında bir <strong>filtre seti</strong>dir:
              sürücüler kendilerini kriterlerle ifade eder, sen de aynı
              kriterleri işaretleyerek aradığın profili tarif edersin.
            </p>
          </div>
        </header>

        {saveError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}

        {saveSuccess && (
          <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-700/60 rounded-lg px-3 py-2">
            {saveSuccess}
          </p>
        )}

        {/* 3 kolonlu layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol: İlan temel bilgileri */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              1. İlan Başlığı ve Temel Bilgiler
            </h2>
            <p className="text-xs text-slate-400">
              Burada ülke ve çalışma tipi mutlaka listeden seçilir; böylece daha
              sonra filtreleme ve istatistikler hatasız çalışır. İstersen şehir
              ve açıklama alanını boş bırakabilirsin.
            </p>

            <div className="space-y-2 mt-2">
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleDraftChange("title", e.target.value)}
                placeholder="Pozisyon adı (örn. Tır Şoförü – ADR'li, Uzun Yol vb.)"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
              />

              {/* Ülke seçimi */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Ülke (listeden seç)
                </label>
                <select
                  value={draft.country}
                  onChange={(e) =>
                    handleDraftChange("country", e.target.value)
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Şehir / bölge (şimdilik serbest metin) */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Şehir / Bölge (opsiyonel)
                </label>
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => handleDraftChange("city", e.target.value)}
                  placeholder="Örn. Köln, NRW / İstanbul Avrupa"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                />
              </div>

              {/* Çalışma tipi select */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Çalışma tipi
                </label>
                <select
                  value={draft.employmentType}
                  onChange={(e) =>
                    handleDraftChange("employmentType", e.target.value)
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={4}
                value={draft.description}
                onChange={(e) =>
                  handleDraftChange("description", e.target.value)
                }
                placeholder="İsteğe bağlı açıklama: firma, araçlar, rota, sunulan imkanlar..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
              />
            </div>
          </section>

          {/* Orta: Kriter kataloğu */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              2. Aradığınız Sürücü Profili (Kriter Kataloğu)
            </h2>
            <p className="text-xs text-slate-400">
              Kriterler, admin panelinde tanımladığınız{" "}
              <strong>FieldGroup</strong> ve <strong>nodes</strong> üzerinden
              gelir. Ülke seçimine göre filtrelenir. Örneğin TR için SRC,
              psikoteknik; DE için o ülkeye özel ehliyet/vize grupları
              çıkabilir.
            </p>

            {groupsLoading && (
              <p className="text-xs text-slate-400 mt-2">
                Kriter grupları yükleniyor...
              </p>
            )}

            {groupsError && (
              <p className="text-xs text-red-400 mt-2">{groupsError}</p>
            )}

            {!groupsLoading && !groupsError && filteredGroups.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Bu ülke için tanımlı kriter grubu bulunamadı. Admin panelinden
                &ldquo;Field Groups&rdquo; oluşturarak başlayabilirsiniz.
              </p>
            )}

            {!groupsLoading && !groupsError && filteredGroups.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filteredGroups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setActiveGroupKey(g.key)}
                      className={`px-3 py-1.5 text-xs rounded-full border ${
                        activeGroupKey === g.key
                          ? "bg-sky-700/60 border-sky-400 text-sky-50"
                          : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-400">
                    Seçili ülke:{" "}
                    <span className="font-semibold text-slate-100">
                      {selectedCountryName}
                    </span>
                    {" · "}
                    Seçili grup:{" "}
                    <span className="font-semibold text-slate-100">
                      {activeGroup?.label || "-"}
                    </span>
                  </p>

                  {activeGroup ? (
                    <div className="flex flex-wrap gap-2">
                      {activeGroup.items.map((item) => {
                        const isSelected = draft.criteria.some(
                          (c) =>
                            c.groupKey === item.groupKey &&
                            c.fieldKey === item.fieldKey
                        );
                        const selected = draft.criteria.find(
                          (c) => c.groupKey === item.groupKey && c.fieldKey === item.fieldKey
                        );
                        const isAuto = !!selected?.auto;
                        return (
                          <button
                            key={item.fieldKey}
                            type="button"
                            onClick={() => toggleCriteria(item)}
                            className={`px-3 py-1.5 text-xs rounded-full border inline-flex items-center gap-1 ${
                              isSelected
                                ? isAuto
                                  ? "bg-amber-600/20 border-amber-400 text-amber-100"
                                  : "bg-emerald-600/25 border-emerald-400 text-emerald-100"
                                : "bg-slate-950 border-slate-700 text-slate-100 hover:bg-slate-800"
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.description && (
                              <span className="text-[10px] text-slate-400">
                                • {item.description}
                              </span>
                            )}
                            {isSelected && isAuto ? (
                              <span className="text-[10px] text-amber-300">• oto</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Lütfen bir kriter grubu seçin.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Sağ: Seçilen kriterler / zorunlu-tercihen */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              3. İlan Filtreleri (Zorunlu / Tercihen)
            </h2>
            <p className="text-xs text-slate-400">
              Burada seçtiğiniz kriterler, ilan için kullanılacak filtre setini
              oluşturur. Sürücünün CV&apos;sinde bu kriterler varsa ilanla
              eşleşir. İsterseniz hepsini zorunlu bırakabilir veya bazılarını
              &quot;tercihen&quot; olarak işaretleyebilirsiniz.
            </p>

            <div className="space-y-2 mt-2">
              <div className="text-xs text-slate-300 font-semibold">
                Zorunlu kriterler
              </div>
              {mustCriteria.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Henüz zorunlu kriter seçmediniz. En az 1–2 tane seçmeniz
                  önerilir (örn. Ehliyet, temel SRC, ADR vb.).
                </p>
              ) : (
                <ul className="space-y-1">
                  {mustCriteria.map((c) => (
                    <li
                      key={`${c.groupKey}-${c.fieldKey}`}
                      className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-semibold">{c.label}</span>
                        <span className="text-slate-500">
                          {" "}
                          ({c.groupKey})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleMode(c)}
                          className="px-2 py-0.5 rounded border border-amber-500 text-amber-300 hover:bg-amber-900/40"
                        >
                          Tercihen yap
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCriteria(c)}
                          className="px-2 py-0.5 rounded border border-rose-500 text-rose-300 hover:bg-rose-900/40"
                        >
                          Sil
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-xs text-slate-300 font-semibold mt-3">
                Tercihen kriterler
              </div>
              {niceCriteria.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Tercihen kriter seçmediniz. Örn. yabancı dil veya ekstra
                  belgeleri burada tutabilirsiniz.
                </p>
              ) : (
                <ul className="space-y-1">
                  {niceCriteria.map((c) => (
                    <li
                      key={`${c.groupKey}-${c.fieldKey}`}
                      className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-semibold">{c.label}</span>
                        <span className="text-slate-500">
                          {" "}
                          ({c.groupKey})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleMode(c)}
                          className="px-2 py-0.5 rounded border border-emerald-500 text-emerald-300 hover:bg-emerald-900/40"
                        >
                          Zorunlu yap
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCriteria(c)}
                          className="px-2 py-0.5 rounded border border-rose-500 text-rose-300 hover:bg-rose-900/40"
                        >
                          Sil
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleSaveDraft} className="mt-3 space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 text-xs rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Kaydediliyor..." : "İlan taslağını kaydet"}
              </button>

              <p className="text-[11px] text-slate-500">
                İlan şu anda <strong>taslak</strong> olarak kaydedilir. Daha
                sonra ilanı yayınlama / kapatma ve ilan listesi ekranında
                görüntüleme adımlarını ekleyeceğiz.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
