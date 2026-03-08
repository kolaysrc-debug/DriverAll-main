"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/jobs/new/page.tsx
// ----------------------------------------------------------
// Employer New Job (draft)
// - Minimal yazı + grup bazlı kriter seçimi
// - Kriterler: GET /api/jobs/filters?country=TR
// - Create:    POST /api/jobs
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/jobs";
import { fetchMyBranches } from "@/lib/api/branches";
import { isAutoAdded, resolveGroupSelection } from "@/lib/groupCriteriaEngine";

type SafeUser = { role?: string };

type FilterNode = {
  key: string;
  label: string;
  description?: string;
  parentKey?: string | null;
  level?: number;
  sortOrder?: number;
  coverage?: string[];
  requiredWith?: string[];
};
type FilterGroup = {
  groupKey: string;
  groupLabel: string;
  selectionMode?: "multi" | "single";
  nodes: FilterNode[];
};

function readUserFromStorage(): SafeUser | null {
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getFilters(country: string) {
  const cc = String(country || "TR").toUpperCase();
  const res = await fetch(`/api/jobs/filters?country=${encodeURIComponent(cc)}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data; // {success:true, groups:[...]}
}

export default function EmployerNewJobPage() {
  const router = useRouter();

  // minimal alanlar
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("TR");
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [locationLabel, setLocationLabel] = useState("");

  // branch
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  // opsiyonel açıklama
  const [showDesc, setShowDesc] = useState(false);
  const [description, setDescription] = useState("");

  // kriter UI
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [manualKeys, setManualKeys] = useState<Record<string, boolean>>({});
  const [criteriaSearch, setCriteriaSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = readUserFromStorage();
    if (!u?.role) {
      router.replace("/login");
      return;
    }
    if (u.role !== "employer" && u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  // Branches yükle
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingBranches(true);
      try {
        const data = await fetchMyBranches();
        if (!alive) return;
        const list = Array.isArray(data?.branches) ? data.branches : [];
        setBranches(list);
      } catch {
        if (!alive) return;
        setBranches([]);
      } finally {
        if (!alive) return;
        setLoadingBranches(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Branch seçilince lokasyonu otomatik doldur
  useEffect(() => {
    if (!branchId) return;
    const b = branches.find((x: any) => String(x?._id) === String(branchId));
    if (!b) return;

    const st = String(b?.location?.stateCode || "").trim();
    const dist = String(b?.location?.districtCode || "").trim();
    const lbl = String(b?.location?.stateName || "").trim();
    const dname = String(b?.location?.districtName || "").trim();

    if (st) setCityCode(st);
    if (dist) setDistrictCode(dist);
    if (dist) {
      // Job modelinde districtCode alanı var; UI'da field yoktu
      // Bu sayfada kullanıcı düzeltmese bile label'a yazarak görünür kılıyoruz
      setLocationLabel(dname ? `${lbl} / ${dname}` : lbl);
    } else {
      setLocationLabel(lbl);
    }
  }, [branchId, branches]);

  // Filters yükle
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingFilters(true);
      setErr(null);
      try {
        const data = await getFilters(country);
        if (!alive) return;
        const gs = Array.isArray(data?.groups) ? data.groups : [];
        setGroups(gs);

        // ilk yüklemede grupları kapalı tut; kullanıcı tıklasın
        const initialOpen: Record<string, boolean> = {};
        gs.forEach((g: any, idx: number) => {
          initialOpen[String(g.groupKey)] = idx < 2; // ilk 2 grup açık gelsin (istersen 0 yap)
        });
        setOpenGroups(initialOpen);
      } catch (e: any) {
        if (!alive) return;
        setGroups([]);
        setErr(e?.message || "Kriter grupları alınamadı.");
      } finally {
        if (!alive) return;
        setLoadingFilters(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [country]);

  function toggleGroup(key: string) {
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }));
  }

  function toggleKey(key: string, opts?: { auto?: boolean }) {
    if (opts?.auto) return;
    const targetKey = String(key || "").trim();
    if (!targetKey) return;

    const group = (groups || []).find((g) =>
      Array.isArray((g as any)?.nodes)
        ? (g as any).nodes.some((n: any) => String(n?.key || "").trim() === targetKey)
        : false
    );
    const mode = String((group as any)?.selectionMode || "multi").trim().toLowerCase();

    setManualKeys((p) => {
      const nextVal = !p[targetKey];
      if (mode !== "single" || !group || !nextVal) return { ...p, [targetKey]: nextVal };

      const groupKeys = new Set(
        (group.nodes || []).map((n) => String(n?.key || "").trim()).filter(Boolean)
      );
      const out: Record<string, boolean> = { ...p };
      for (const k of Object.keys(out)) {
        if (groupKeys.has(String(k || "").trim())) out[k] = false;
      }
      out[targetKey] = true;
      return out;
    });
  }

  function clearCriteria() {
    setManualKeys({});
    setCriteriaSearch("");
  }

  function shortText(input: any, limit = 20) {
    const s = String(input || "").trim();
    if (!s) return "";
    if (s.length <= limit) return s;
    return `${s.slice(0, limit).trim()}…`;
  }

  const { selectedKeys, autoKeys } = useMemo(() => {
    const effective: Record<string, boolean> = {};
    const auto: Record<string, boolean> = {};

    for (const g of groups || []) {
      const nodes = Array.isArray(g.nodes) ? g.nodes : [];
      const groupNodeKeys = new Set(nodes.map((n) => String(n.key || "").trim()).filter(Boolean));
      const manualInGroup = Object.entries(manualKeys)
        .filter(([k, v]) => v && groupNodeKeys.has(String(k)))
        .map(([k]) => String(k));

      const resolved = resolveGroupSelection(manualInGroup, nodes as any);
      for (const k of resolved.effectiveKeys || []) {
        effective[String(k)] = true;
      }
      for (const [k, r] of Object.entries(resolved.reasons || {})) {
        if (r && (r as any).source && (r as any).source !== "manual") {
          auto[String(k)] = true;
        }
      }
    }

    return { selectedKeys: effective, autoKeys: auto };
  }, [groups, manualKeys]);

  const selectedCount = useMemo(
    () => Object.values(selectedKeys).filter(Boolean).length,
    [selectedKeys]
  );

  const filteredGroups = useMemo(() => {
    const s = criteriaSearch.trim().toLowerCase();
    if (!s) return groups;

    return groups.map((g) => {
      const nodes = (g.nodes || []).filter((n) => {
        const lbl = String(n.label || "").toLowerCase();
        const key = String(n.key || "").toLowerCase();
        return lbl.includes(s) || key.includes(s);
      });
      return { ...g, nodes };
    });
  }, [groups, criteriaSearch]);

  async function onCreate() {
    setErr(null);
    const t = title.trim();
    if (!t) {
      setErr("Başlık zorunlu.");
      return;
    }

    if (branches.length > 0 && !branchId) {
      setErr("Şube seçimi zorunlu.");
      return;
    }

    // criteria objesi
    const criteria: Record<string, any> = {};
    for (const [k, v] of Object.entries(selectedKeys)) if (v) criteria[k] = true;

    setSaving(true);
    try {
      const payload = {
        title: t,
        country,
        branchId: branchId || undefined,
        location: {
          countryCode: country,
          cityCode: cityCode.trim(),
          districtCode: districtCode.trim(),
          label: locationLabel.trim(),
        },
        description: showDesc ? description : "",
        criteria,
      };

      const data = await createJob(payload);
      const id = data?.job?._id;
      if (id) router.replace("/employer/dashboard?created=1");
      else router.replace("/employer/jobs");
    } catch (e: any) {
      setErr(e?.message || "İlan oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Yeni İlan</h1>
            <p className="text-sm text-slate-400">
              Minimum giriş: Başlık + (isteğe bağlı) lokasyon + kriter seçimi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.replace("/employer/jobs")}
              className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={onCreate}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Taslak Oluştur"}
            </button>
          </div>
        </header>

        {err && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {/* Minimal form */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="text-xs text-slate-400">Başlık (zorunlu)</label>
              <input
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="örn: Uluslararası TIR Şoförü"
              />
            </div>

            <div className="md:col-span-6">
              <label className="text-xs text-slate-400">Şube</label>
              <select
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loadingBranches}
              >
                <option value="">{loadingBranches ? "Yükleniyor..." : branches.length ? "Şube seçiniz" : "Şube yok"}</option>
                {branches.map((b: any) => (
                  <option key={b._id} value={String(b._id)}>
                    {String(b?.displayName || b?.name || "Şube")} {b?.location?.stateName ? `- ${String(b.location.stateName)}` : ""}
                    {b?.location?.districtName ? ` / ${String(b.location.districtName)}` : ""}
                  </option>
                ))}
              </select>

              {branches.length === 0 && !loadingBranches ? (
                <div className="mt-2 text-xs text-slate-400">
                  Önce şube ekleyin: <a className="underline" href="/employer/branches">/employer/branches</a>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Ülke</label>
              <select
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="TR">TR</option>
                <option value="DE">DE</option>
                <option value="NL">NL</option>
                <option value="NO">NO</option>
                <option value="FI">FI</option>
                <option value="ES">ES</option>
                <option value="IT">IT</option>
                <option value="HU">HU</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Şehir Kodu</label>
              <input
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value)}
                placeholder="örn: IST"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Etiket</label>
              <input
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="örn: İstanbul"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDesc((v) => !v)}
              className="text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              {showDesc ? "Açıklamayı Gizle" : "Açıklama Ekle (opsiyonel)"}
            </button>

            {showDesc && (
              <textarea
                className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="İstersen yaz. Gerekmiyorsa boş bırak."
              />
            )}
          </div>
        </div>

        {/* Criteria */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Kriterler</h2>
              <p className="text-xs text-slate-400">
                Seçilen: <span className="text-slate-200 font-semibold">{selectedCount}</span>
                {loadingFilters ? " • yükleniyor..." : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={criteriaSearch}
                onChange={(e) => setCriteriaSearch(e.target.value)}
                placeholder="Kriter ara"
                className="w-full md:w-64 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={clearCriteria}
                className="shrink-0 text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Seçimleri Temizle
              </button>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <p className="text-sm text-slate-500">Kriter grubu yok.</p>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((g) => {
                const gKey = String(g.groupKey);
                const open = !!openGroups[gKey];
                const nodes = Array.isArray(g.nodes) ? g.nodes : [];
                const groupSelected = nodes.filter((n) => selectedKeys[n.key]).length;

                return (
                  <div key={gKey} className="border border-slate-800 rounded-xl bg-slate-950/40">
                    <button
                      type="button"
                      onClick={() => toggleGroup(gKey)}
                      className="w-full flex items-center justify-between px-3 py-3"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{g.groupLabel}</div>
                        <div className="text-[11px] text-slate-500">
                          {groupSelected ? `Seçilen: ${groupSelected}` : " "}
                        </div>
                      </div>
                      <span className="text-xs text-slate-300">{open ? "Kapat" : "Aç"}</span>
                    </button>

                    {open && (
                      <div className="px-3 pb-3">
                        {nodes.length === 0 ? (
                          <p className="text-xs text-slate-500">Bu grupta kriter yok.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {nodes.slice(0, 200).map((n) => (
                              (() => {
                                const isSelected = !!selectedKeys[n.key];
                                const isAuto = !!autoKeys[n.key] && isSelected;
                                const fullDesc = String((n as any)?.description || "").trim();
                                const shortDesc = shortText(fullDesc);
                                return (
                              <label
                                key={n.key}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                                  isSelected
                                    ? isAuto
                                      ? "border-amber-500/50 bg-amber-950/20"
                                      : "border-emerald-500/40 bg-emerald-950/20"
                                    : "border-slate-800 bg-slate-950"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isAuto}
                                  onChange={() => toggleKey(n.key, { auto: isAuto })}
                                />
                                <span className="text-xs text-slate-200">
                                  {n.label}
                                  {isSelected && isAuto ? (
                                    <span className="text-[10px] text-amber-300">{" "}• oto</span>
                                  ) : null}
                                </span>
                                {shortDesc ? (
                                  <span
                                    className="text-[10px] text-slate-500 leading-4"
                                    title={fullDesc}
                                  >
                                    {shortDesc}
                                  </span>
                                ) : null}
                              </label>
                                );
                              })()
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
