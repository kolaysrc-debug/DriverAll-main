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

type SafeUser = { role?: string };

type FilterNode = { key: string; label: string; parentKey?: string | null; level?: number; sortOrder?: number };
type FilterGroup = { groupKey: string; groupLabel: string; nodes: FilterNode[] };

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
  const [locationLabel, setLocationLabel] = useState("");

  // opsiyonel açıklama
  const [showDesc, setShowDesc] = useState(false);
  const [description, setDescription] = useState("");

  // kriter UI
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
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

  function toggleKey(key: string) {
    setSelectedKeys((p) => ({ ...p, [key]: !p[key] }));
  }

  function clearCriteria() {
    setSelectedKeys({});
    setCriteriaSearch("");
  }

  const selectedCount = useMemo(() => Object.values(selectedKeys).filter(Boolean).length, [selectedKeys]);

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

    // criteria objesi
    const criteria: Record<string, any> = {};
    for (const [k, v] of Object.entries(selectedKeys)) if (v) criteria[k] = true;

    setSaving(true);
    try {
      const payload = {
        title: t,
        country,
        location: {
          countryCode: country,
          cityCode: cityCode.trim(),
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {nodes.slice(0, 200).map((n) => (
                              <label
                                key={n.key}
                                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!selectedKeys[n.key]}
                                  onChange={() => toggleKey(n.key)}
                                />
                                <span className="text-xs text-slate-200">{n.label}</span>
                              </label>
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
