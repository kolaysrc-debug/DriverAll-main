"use client";

// PATH: DriverAll-main/drivercv-frontend/app/jobs/page.tsx
// ----------------------------------------------------------
// Jobs Page
// - Sol: filtreler (lokasyon + kriter grupları)
// - NEW: Kriter GRUPLARINI (sadece grupları) kullanıcı sürükle-bırak ile sıralayabilir
// - Grup sırası localStorage'da saklanır (default sıra backend’den gelir)
// ----------------------------------------------------------

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchJobFilters, fetchPublicJobs, fetchLocationsList } from "@/lib/api/publicJobs";
import { listMyApplications } from "@/lib/api/applications";
import FilterDrawer from "@/components/FilterDrawer";
import FloatingActionButton from "@/components/FloatingActionButton";

type FilterNode = { key: string; label: string };
type FilterGroup = { groupKey: string; groupLabel: string; nodes: FilterNode[] };

type LocationItem = { code: string; name: string; parentCode?: string };

type Employer = { _id?: string; name?: string; email?: string };
type PublicJob = {
  _id: string;
  title?: string;
  description?: string;
  country?: string;
  location?: {
    countryCode?: string;
    cityCode?: string;
    districtCode?: string;
    label?: string;
  };
  employerUserId?: Employer | string;
  createdAt?: string;
  publishedAt?: string;
};

type JobsMeta = { total: number; page: number; limit: number };

type DateFilter = "" | "1" | "3" | "7" | "30";
type SortFilter = "newest" | "oldest";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">Yükleniyor...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}

function buildParams(obj: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    out[k] = s;
  }
  return out;
}

// NEW: açıklamayı kontrollü kısaltma (clampText is not defined hatasını bitirir)
function clampText(text: string, max = 360) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s.length <= max) return s;

  const cut = s.slice(0, max);
  const safe = cut.replace(/\s+\S*$/, "").trimEnd();
  return (safe || cut).trimEnd() + "…";
}

const LS_SELECTED_KEYS = "jobs_filters_selectedKeys_v1";
// NEW: sadece GRUP sırası
const LS_GROUP_ORDER = "jobs_filters_groupOrder_v1";

function JobsPageContent() {
  const searchParams = useSearchParams();
  const [country, setCountry] = useState("TR");

  const [appliedJobIds, setAppliedJobIds] = useState<Record<string, boolean>>({});

  // Search (debounced)
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  // Home / deep-link support: /jobs?q=...
  useEffect(() => {
    const qp = String(searchParams?.get("q") || "").trim();
    const subRole = String(searchParams?.get("subRole") || "").trim();
    const merged = qp ? (subRole ? `${qp} ${subRole}`.trim() : qp) : subRole;
    if (merged) setQInput(merged);
  }, [searchParams]);

  // Deep-link: location filters (/jobs?cityCode=TR-34&districtCode=...)
  useEffect(() => {
    const cc = String(searchParams?.get("cityCode") || "").trim();
    const dc = String(searchParams?.get("districtCode") || "").trim();
    if (cc) setCityCode(cc);
    if (dc) setDistrictCode(dc);
  }, [searchParams]);

  // Deep-link support: /jobs?jobId=...
  useEffect(() => {
    const jobId = String(searchParams?.get("jobId") || "").trim();
    if (!jobId) return;

    // jobs list route already exists; open detail
    if (typeof window !== "undefined") {
      window.location.href = `/jobs/${encodeURIComponent(jobId)}`;
    }
  }, [searchParams]);

  // Driver: load my applications to mark applied jobs
  useEffect(() => {
    let alive = true;

    (async () => {
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem("token");
      const userRaw = window.localStorage.getItem("user");
      let role = "";
      try {
        role = String(userRaw ? JSON.parse(userRaw)?.role : "");
      } catch {
        role = "";
      }

      if (!token || role !== "driver") {
        setAppliedJobIds({});
        return;
      }

      try {
        const apps = await listMyApplications();
        if (!alive) return;

        const next: Record<string, boolean> = {};
        for (const a of apps || []) {
          const jid = String((a as any)?.job?._id || "");
          if (jid) next[jid] = true;
        }
        setAppliedJobIds(next);
      } catch {
        if (!alive) return;
        setAppliedJobIds({});
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Date + sort
  const [postedWithinDays, setPostedWithinDays] = useState<DateFilter>("");
  const [sort, setSort] = useState<SortFilter>("newest");

  // City autocomplete (ghost list)
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  // Location dropdowns
  const [hasStates, setHasStates] = useState(false);
  const [states, setStates] = useState<LocationItem[]>([]);
  const [stateCode, setStateCode] = useState("");
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [cityCode, setCityCode] = useState("");
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [districtCode, setDistrictCode] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [criteriaSearch, setCriteriaSearch] = useState("");

  // NEW: grup sırası + drag state
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [dragGroupKey, setDragGroupKey] = useState<string | null>(null);

  // NEW: Mobil filtre drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // NEW: Görünüm modu (liste/harita)
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // NEW: Hızlı filtre chip'leri
  const quickFilters = [
    { key: "SRC", label: "🚛 SRC", emoji: "🚛" },
    { key: "ADR", label: "⚠️ ADR", emoji: "⚠️" },
    { key: "TIR", label: "🚚 TIR", emoji: "🚚" },
    { key: "Kamyon", label: "🚛 Kamyon", emoji: "🚛" },
    { key: "Forklift", label: "🏗️ Forklift", emoji: "🏗️" },
    { key: "Kurye", label: "📦 Kurye", emoji: "📦" },
  ];

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [meta, setMeta] = useState<JobsMeta>({ total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---------------------------
  // Debounce search
  // ---------------------------
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // ---------------------------
  // LocalStorage load (seçimler + grup sırası)
  // ---------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawSel = window.localStorage.getItem(LS_SELECTED_KEYS);
      const rawOrder = window.localStorage.getItem(LS_GROUP_ORDER);

      const sel = rawSel ? (JSON.parse(rawSel) as Record<string, boolean>) : {};
      const ord = rawOrder ? (JSON.parse(rawOrder) as string[]) : [];

      if (sel && typeof sel === "object") setSelectedKeys(sel);
      if (Array.isArray(ord)) setGroupOrder(ord.filter(Boolean));
    } catch {
      // sessiz
    }
  }, []);

  // seçimleri kaydet
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_SELECTED_KEYS, JSON.stringify(selectedKeys || {}));
    } catch {
      // sessiz
    }
  }, [selectedKeys]);

  // grup sırasını kaydet
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_GROUP_ORDER, JSON.stringify(groupOrder || []));
    } catch {
      // sessiz
    }
  }, [groupOrder]);

  // ---------------------------
  // Criteria csv (order sonuçları değiştirmez ama saklıyoruz)
  // ---------------------------
  const selectedKeysList = useMemo(() => {
    return Object.entries(selectedKeys)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selectedKeys]);

  const criteriaCsv = useMemo(() => selectedKeysList.join(","), [selectedKeysList]);

  // ---------------------------
  // Filter groups
  // ---------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchJobFilters(country);
        if (!alive) return;

        const gr: FilterGroup[] = data.groups || [];
        setGroups(gr);

        // İlk yüklemede: varsayılan açık gruplar
        setOpenGroups((prev) => {
          const next = { ...prev };
          for (const g of gr.slice(0, 3)) {
            if (next[g.groupKey] == null) next[g.groupKey] = true;
          }
          return next;
        });

        // NEW: grup sırasını reconcile et
        setGroupOrder((prev) => {
          const defaultOrder = gr.map((g) => g.groupKey);
          if (!prev || prev.length === 0) return defaultOrder;

          const set = new Set(defaultOrder);
          const kept = prev.filter((k) => set.has(k));
          const missing = defaultOrder.filter((k) => !kept.includes(k));
          return [...kept, ...missing];
        });
      } catch {
        if (!alive) return;
        setGroups([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [country]);

  // ---------------------------
  // Locations (country)
  // ---------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      setLocLoading(true);

      // reset
      setStates([]);
      setStateCode("");
      setCities([]);
      setCityQuery("");
      setCityOpen(false);
      setCityCode("");
      setDistricts([]);
      setDistrictCode("");
      setHasStates(false);

      try {
        const cc = String(country).toUpperCase();

        // TR: state göstermiyoruz, direkt city çekiyoruz
        if (cc === "TR") {
          const ct = await fetchLocationsList(cc, "city");
          if (!alive) return;

          const ctList: LocationItem[] = ((ct as any).list || []).map((x: any) => ({
            code: x.code,
            name: x.name,
            parentCode: x.parentCode,
          }));

          setHasStates(false);
          setCities(ctList);
          return;
        }

        // Diğer ülkeler: önce state dene
        const st = await fetchLocationsList(cc, "state");
        if (!alive) return;

        const stList: LocationItem[] = ((st as any).list || []).map((x: any) => ({
          code: x.code,
          name: x.name,
          parentCode: x.parentCode,
        }));

        if (stList.length > 0) {
          setHasStates(true);
          setStates(stList);
        } else {
          // state yoksa direkt city dene
          setHasStates(false);
          const ct = await fetchLocationsList(cc, "city");
          if (!alive) return;
          const ctList: LocationItem[] = ((ct as any).list || []).map((x: any) => ({
            code: x.code,
            name: x.name,
            parentCode: x.parentCode,
          }));
          setCities(ctList);
        }
      } catch {
        // sessiz
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [country]);

  // Non-TR: state -> cities
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasStates) return;
      if (!stateCode) {
        setCities([]);
        setCityCode("");
        setDistricts([]);
        setDistrictCode("");
        return;
      }

      try {
        setLocLoading(true);
        const cc = String(country).toUpperCase();
        const ct = await fetchLocationsList(cc, "city", stateCode);
        if (!alive) return;

        const ctList: LocationItem[] = ((ct as any).list || []).map((x: any) => ({
          code: x.code,
          name: x.name,
          parentCode: x.parentCode,
        }));

        setCities(ctList);
        setCityCode("");
        setCityQuery("");
        setCityOpen(false);
        setDistricts([]);
        setDistrictCode("");
      } catch {
        // sessiz
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hasStates, stateCode, country]);

  // City -> districts
  useEffect(() => {
    let alive = true;
    (async () => {
      setDistricts([]);
      setDistrictCode("");
      if (!cityCode) return;

      try {
        setLocLoading(true);
        const cc = String(country).toUpperCase();
        const dt = await fetchLocationsList(cc, "district", cityCode);
        if (!alive) return;

        const dtList: LocationItem[] = ((dt as any).list || []).map((x: any) => ({
          code: x.code,
          name: x.name,
          parentCode: x.parentCode,
        }));

        setDistricts(dtList);
      } catch {
        // sessiz
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [country, cityCode]);

  const cityLabelByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cities || []) {
      const code = String(c?.code || "").trim();
      const name = String(c?.name || c?.code || "").trim();
      if (code) m.set(code, name || code);
    }
    return m;
  }, [cities]);

  useEffect(() => {
    if (!cityCode) return;
    if (cityQuery.trim()) return;
    const label = cityLabelByCode.get(String(cityCode).trim());
    if (label) setCityQuery(label);
  }, [cityCode, cityLabelByCode, cityQuery]);

  const filteredCities = useMemo(() => {
    const norm = (s: string) =>
      String(s || "")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i");

    const term = norm(cityQuery);
    if (!term) return [];

    const list = cities.filter((c) => {
      const n = norm(String(c.name));
      const code = norm(String(c.code));
      return (n && n.includes(term)) || (code && code.includes(term));
    });
    return list.slice(0, 12);
  }, [cities, cityQuery]);

  // ---------------------------
  // NEW: ordered groups (kullanıcı sırasına göre)
  // + arama varsa: grup sırası bozulmaz, sadece node’lar filtrelenir
  // ---------------------------
  const orderedGroups = useMemo(() => {
    const byKey = new Map<string, FilterGroup>();
    for (const g of groups) byKey.set(g.groupKey, g);

    const keysFromOrder = groupOrder.length ? groupOrder : groups.map((g) => g.groupKey);

    const list: FilterGroup[] = [];
    for (const k of keysFromOrder) {
      const g = byKey.get(k);
      if (g) list.push(g);
    }
    // order’da olmayan yeni grup gelirse sona ekle
    for (const g of groups) {
      if (!keysFromOrder.includes(g.groupKey)) list.push(g);
    }

    const s = criteriaSearch.trim().toLowerCase();
    if (!s) return list;

    // Arama: grup label eşleşirse tüm node’ları göster,
    // yoksa node label içinde filtrele.
    return list
      .map((g) => {
        const groupMatch = String(g.groupLabel).toLowerCase().includes(s);
        if (groupMatch) return g;
        const nodes = (g.nodes || []).filter((n) => String(n.label).toLowerCase().includes(s));
        return { ...g, nodes };
      })
      .filter((g) => (g.nodes || []).length > 0 || String(g.groupLabel).toLowerCase().includes(s));
  }, [groups, groupOrder, criteriaSearch]);

  function groupSelectedCount(g: FilterGroup) {
    const keys = (g.nodes || []).map((n) => n.key);
    let c = 0;
    for (const k of keys) if (selectedKeys[k]) c += 1;
    return c;
  }

  // ---------------------------
  // Jobs load
  // ---------------------------
  async function loadJobs(nextPage: number, append: boolean) {
    try {
      setLoading(true);
      setErr(null);

      const params = buildParams({
        country,
        q,
        cityCode,
        districtCode,
        criteria: criteriaCsv,
        postedWithinDays,
        sort,
        page: String(nextPage),
        limit: "50",
      });

      const data = await fetchPublicJobs(params);
      const list: PublicJob[] = data.jobs || [];
      const m: JobsMeta = data.meta || { total: list.length, page: nextPage, limit: 50 };

      setMeta(m);
      setJobs((prev) => (append ? [...prev, ...list] : list));
    } catch (e: any) {
      setErr(e?.message || "İlanlar yüklenemedi.");
      setJobs([]);
      setMeta({ total: 0, page: 1, limit: 50 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, q, cityCode, districtCode, criteriaCsv, postedWithinDays, sort]);

  const canLoadMore = useMemo(() => jobs.length < (meta.total || 0), [jobs.length, meta.total]);

  // ---------------------------
  // UI actions
  // ---------------------------
  function toggleKey(k: string) {
    setSelectedKeys((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      return next;
    });
  }

  function toggleGroupOpen(gk: string) {
    setOpenGroups((prev) => ({ ...prev, [gk]: !prev[gk] }));
  }

  function clearAll() {
    setSelectedKeys({});
    setCountry("TR");
    setQInput("");
    setPostedWithinDays("");
    setSort("newest");
    setStateCode("");
    setCityCode("");
    setDistrictCode("");
    setCityQuery("");
    setCityOpen(false);
    setCriteriaSearch("");
    // NOT: grup sırasını silmeyelim (kullanıcının tercihi kalsın)
  }

  // NEW: Hızlı filtre toggle
  function toggleQuickFilter(filterKey: string) {
    // İlgili kriteri bul ve toggle et
    const allNodes = groups.flatMap(g => g.nodes || []);
    const node = allNodes.find(n => 
      n.key.toLowerCase().includes(filterKey.toLowerCase()) ||
      n.label.toLowerCase().includes(filterKey.toLowerCase())
    );
    
    if (node) {
      toggleKey(node.key);
    } else {
      // Bulunamazsa arama yap
      setQInput(filterKey);
    }
  }

  // ---------------------------
  // NEW: Grup sırası yönetimi (drag/drop + ↑↓)
  // ---------------------------
  function moveGroup(fromIndex: number, toIndex: number) {
    setGroupOrder((prev) => {
      const base = (prev && prev.length ? prev : groups.map((g) => g.groupKey)).filter(Boolean);
      if (fromIndex < 0 || fromIndex >= base.length) return base;
      if (toIndex < 0 || toIndex >= base.length) return base;

      const item = base[fromIndex];
      const next = [...base];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  function onGroupDragStart(gk: string) {
    setDragGroupKey(gk);
  }

  function onGroupDrop(overKey: string) {
    if (!dragGroupKey || dragGroupKey === overKey) return;

    const base = (groupOrder && groupOrder.length ? groupOrder : groups.map((g) => g.groupKey)).filter(Boolean);
    const from = base.indexOf(dragGroupKey);
    const to = base.indexOf(overKey);
    if (from === -1 || to === -1) return;

    moveGroup(from, to);
    setDragGroupKey(null);
  }

  const selectedChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (q) chips.push({ key: "q", label: `Arama: ${q}`, onClear: () => setQInput("") });

    if (postedWithinDays) {
      const map: Record<string, string> = {
        "1": "Son 24 saat",
        "3": "Son 3 gün",
        "7": "Son 1 hafta",
        "30": "Son 1 ay",
      };
      chips.push({
        key: "date",
        label: map[postedWithinDays] || `Son ${postedWithinDays} gün`,
        onClear: () => setPostedWithinDays(""),
      });
    }

    if (sort && sort !== "newest") {
      chips.push({ key: "sort", label: "Sırala: En eski", onClear: () => setSort("newest") });
    }

    if (hasStates && stateCode) {
      const st = states.find((s) => s.code === stateCode);
      chips.push({ key: "state", label: `Bölge: ${st?.name || stateCode}`, onClear: () => setStateCode("") });
    }

    if (cityCode) {
      const ct = cities.find((c) => c.code === cityCode);
      chips.push({ key: "city", label: `Şehir: ${ct?.name || cityCode}`, onClear: () => setCityCode("") });
    }

    if (districtCode) {
      const dt = districts.find((d) => d.code === districtCode);
      chips.push({ key: "district", label: `İlçe: ${dt?.name || districtCode}`, onClear: () => setDistrictCode("") });
    }

    if (selectedKeysList.length > 0) {
      chips.push({
        key: "criteria",
        label: `Kriter: ${selectedKeysList.length} seçili`,
        onClear: () => setSelectedKeys({}),
      });
    }

    return chips;
  }, [
    q,
    postedWithinDays,
    sort,
    hasStates,
    stateCode,
    states,
    cityCode,
    cities,
    districtCode,
    districts,
    selectedKeysList.length,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-8 md:py-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold">İş İlanları</h1>
              <p className="text-xs md:text-sm text-slate-400">Filtrele ve başvur</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Görünüm toggle (liste/harita) */}
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded px-3 py-1.5 text-xs transition ${
                    viewMode === "list" ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`rounded px-3 py-1.5 text-xs transition ${
                    viewMode === "map" ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Harita
                </button>
              </div>

              {/* Mobil: Filtre butonu */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="sm:hidden rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtreler
                {selectedKeysList.length > 0 && (
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                    {selectedKeysList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="hidden sm:block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* Hızlı Filtre Chip'leri */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs text-slate-500 whitespace-nowrap">Hızlı:</span>
            {quickFilters.map((qf) => {
              const isActive = selectedKeysList.some(k => 
                k.toLowerCase().includes(qf.key.toLowerCase())
              ) || q.toLowerCase().includes(qf.key.toLowerCase());
              
              return (
                <button
                  key={qf.key}
                  onClick={() => toggleQuickFilter(qf.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400"
                  }`}
                >
                  <span>{qf.emoji}</span>
                  <span>{qf.key}</span>
                </button>
              );
            })}
          </div>
        </header>

        {selectedChips.length > 0 && (
          <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex flex-wrap gap-2">
              {selectedChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.onClear}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
                  title="Kaldır"
                >
                  <span>{c.label}</span>
                  <span className="text-slate-400">✕</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Mobil Filtre Drawer */}
        <FilterDrawer 
          isOpen={filterDrawerOpen} 
          onClose={() => setFilterDrawerOpen(false)}
          title="Filtreler"
        >
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Arama</div>
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="İlan başlığında ara..."
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Tarih</div>
                <select
                  value={postedWithinDays}
                  onChange={(e) => setPostedWithinDays(e.target.value as DateFilter)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Tümü</option>
                  <option value="1">Son 24 saat</option>
                  <option value="3">Son 3 gün</option>
                  <option value="7">Son 1 hafta</option>
                  <option value="30">Son 1 ay</option>
                </select>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Sırala</div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortFilter)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                >
                  <option value="newest">En yeni</option>
                  <option value="oldest">En eski</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Lokasyon</div>

              <div className="mt-2 grid grid-cols-2 gap-3">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                >
                  <option value="TR">TR</option>
                  <option value="DE">DE</option>
                  <option value="NL">NL</option>
                  <option value="FR">FR</option>
                  <option value="IT">IT</option>
                  <option value="ES">ES</option>
                  <option value="PL">PL</option>
                  <option value="RO">RO</option>
                  <option value="BG">BG</option>
                </select>

                {hasStates ? (
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Bölge</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-400 flex items-center justify-end">
                    {locLoading ? "Yükleniyor..." : ""}
                  </div>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    value={cityQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCityQuery(v);
                      setCityOpen(true);
                      if (!v.trim()) setCityCode("");
                    }}
                    onFocus={() => setCityOpen(true)}
                    onBlur={() => {
                      const typed = cityQuery.trim();
                      const selectedLabel = cityLabelByCode.get(String(cityCode).trim()) || "";

                      // Serbest yazı kalmasın:
                      // - Seçili şehir varsa: seçili label'a geri dön.
                      // - Seçili şehir yoksa: temizle.
                      if (typed) {
                        const norm = (s: string) =>
                          String(s || "")
                            .trim()
                            .toLocaleLowerCase("tr-TR")
                            .replace(/ı/g, "i");

                        const typedNorm = norm(typed);
                        const exact = (cities || []).some((c) => {
                          const label = norm(String(c?.name || ""));
                          const code = norm(String(c?.code || ""));
                          return label === typedNorm || code === typedNorm;
                        });

                        if (!exact) {
                          setCityQuery(selectedLabel || "");
                        }
                      } else {
                        if (cityCode && selectedLabel) setCityQuery(selectedLabel);
                      }

                      window.setTimeout(() => setCityOpen(false), 120);
                    }}
                    placeholder={locLoading ? "Yükleniyor..." : "Şehir seç (yaz ve seç)"}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                  />

                  {cityOpen && cityQuery.trim() && (filteredCities || []).length > 0 && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-900/60"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCityCode("");
                          setCityQuery("");
                          setCityOpen(false);
                        }}
                      >
                        Şehir: Tümü
                      </button>

                      {(filteredCities || []).map((c) => (
                        <button
                          key={String(c.code)}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-900/60"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCityCode(String(c.code));
                            setCityQuery(String(c.name || c.code));
                            setCityOpen(false);
                          }}
                        >
                          {String(c.name || c.code)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={districtCode}
                  onChange={(e) => setDistrictCode(e.target.value)}
                  disabled={!districts.length}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none disabled:opacity-50"
                >
                  <option value="">İlçe</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kriterler */}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Kriter Grupları</div>

              <div className="mt-2 text-[11px] text-slate-400">
                Grupları sürükleyip bırakarak sıralayabilirsin. Mobilde ↑/↓ ile de çalışır.
              </div>

              <input
                value={criteriaSearch}
                onChange={(e) => setCriteriaSearch(e.target.value)}
                placeholder="Grup veya kriter içinde ara..."
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
              />

              <div className="mt-3 space-y-2">
                {orderedGroups.map((g, idx) => {
                  const isOpen = openGroups[g.groupKey] ?? false;
                  const selCount = groupSelectedCount(g);

                  return (
                    <div key={g.groupKey} className="rounded-lg border border-slate-800 bg-slate-950/40">
                      {/* Group header (draggable) */}
                      <div
                        draggable
                        onDragStart={() => onGroupDragStart(g.groupKey)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onGroupDrop(g.groupKey)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2"
                        title="Grubu sürükle-bırak ile sırasını değiştir"
                      >
                        <button type="button" onClick={() => toggleGroupOpen(g.groupKey)} className="flex-1 text-left">
                          <div className="text-sm font-medium text-slate-100 flex items-center gap-2">
                            <span className="text-slate-400 text-xs w-5">{idx + 1}.</span>
                            <span className="select-none cursor-grab text-slate-400" aria-hidden>
                              ⋮⋮
                            </span>
                            <span>{g.groupLabel}</span>
                            {selCount > 0 && <span className="text-[11px] text-sky-300">({selCount})</span>}
                          </div>
                        </button>

                        {/* Mobile / touch safe reorder */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveGroup(idx, idx - 1)}
                            disabled={idx === 0}
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs disabled:opacity-40"
                            title="Yukarı"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGroup(idx, idx + 1)}
                            disabled={idx === orderedGroups.length - 1}
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs disabled:opacity-40"
                            title="Aşağı"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleGroupOpen(g.groupKey)}
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                            title={isOpen ? "Kapat" : "Aç"}
                          >
                            {isOpen ? "▲" : "▼"}
                          </button>
                        </div>
                      </div>

                      {/* Group body */}
                      {isOpen && (
                        <div className="border-t border-slate-800 px-3 py-2 max-h-64 overflow-auto">
                          <div className="grid gap-2">
                            {(g.nodes || []).slice(0, 180).map((n) => (
                              <label key={n.key} className="flex items-center gap-2 text-sm text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={!!selectedKeys[n.key]}
                                  onChange={() => toggleKey(n.key)}
                                  className="accent-sky-500"
                                />
                                <span>{n.label}</span>
                              </label>
                            ))}
                          </div>

                          {(g.nodes || []).length > 180 && (
                            <div className="mt-2 text-[11px] text-slate-400">
                              Çok fazla seçenek var; arama kullanarak daraltabilirsin.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!orderedGroups.length && <div className="text-sm text-slate-400">Kriter grubu bulunamadı.</div>}
              </div>
            </div>
          </div>
        </FilterDrawer>

        {/* FLEX: solda filtre (desktop), sağda sonuçlar */}
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Filters (Desktop Only) - Mobil drawer ile aynı içerik */}
          <aside className="hidden sm:block order-1 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-5 sm:w-[340px] sm:flex-none sm:sticky sm:top-4 sm:z-20 sm:max-h-[calc(100vh-120px)] sm:overflow-auto">
            <div className="text-sm text-slate-300">
              💡 <strong>İpucu:</strong> Mobilde filtreleri açmak için üstteki "Filtreler" butonunu kullanın.
            </div>
          </aside>

          {/* Results */}
          <section className="order-2 space-y-4 min-w-0 flex-1">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-300">
                {loading ? (
                  <span>Yükleniyor...</span>
                ) : (
                  <span>
                    {meta.total > 0 ? (
                      <>
                        {jobs.length} ilan gösteriliyor (toplam {meta.total})
                      </>
                    ) : (
                      <>İlan bulunamadı</>
                    )}
                  </span>
                )}
              </div>

              {err && (
                <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}
            </div>

            {/* Liste Görünümü */}
            {viewMode === "list" && (
              <div className="grid gap-3">
                {jobs.map((j) => {
                  const empObj = typeof j.employerUserId === "object" ? (j.employerUserId as Employer) : undefined;
                  const employerText = empObj?.name || "Firma";

                  const locLabel =
                    j.location?.label ||
                    [j.location?.cityCode, j.location?.districtCode].filter(Boolean).join(" / ") ||
                    "-";

                  return (
                    <Link
                      key={j._id}
                      href={`/jobs/${j._id}`}
                      className="group block rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950/40 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition p-5"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Başlık ve Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base md:text-lg font-bold text-slate-50 group-hover:text-emerald-400 transition line-clamp-2">
                            {j.title || "İlan Başlığı"}
                          </h3>
                          {appliedJobIds[j._id] && (
                            <span className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-emerald-700/60 bg-emerald-950/40 text-emerald-200 whitespace-nowrap">
                              ✓ Başvurdunuz
                            </span>
                          )}
                        </div>

                        {/* Lokasyon ve Firma */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{locLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{employerText}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(j.publishedAt || j.createdAt)}</span>
                          </div>
                        </div>

                        {/* Açıklama */}
                        {j.description && (
                          <div className="text-sm text-slate-400 line-clamp-2">
                            {clampText(j.description || "", 200)}
                          </div>
                        )}

                        {/* Detayları Gör */}
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 group-hover:gap-3 transition-all">
                          <span>Detayları Gör</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Harita Görünümü */}
            {viewMode === "map" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <div className="mx-auto max-w-md">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Harita Görünümü</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Harita entegrasyonu yakında eklenecek. İlanları harita üzerinde görebilecek ve yakınındaki fırsatları keşfedebileceksiniz.
                  </p>
                  <button
                    onClick={() => setViewMode("list")}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Liste Görünümüne Dön
                  </button>
                </div>
              </div>
            )}

            {canLoadMore && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => loadJobs((meta.page || 1) + 1, true)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  Daha fazla yükle
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Floating Action Button - Tek Elle Kullanım */}
        <FloatingActionButton
          actions={[
            {
              icon: "🔍",
              label: "Filtreler",
              onClick: () => setFilterDrawerOpen(true),
              color: "emerald"
            },
            {
              icon: "🎯",
              label: "Aramayı Sıfırla",
              onClick: clearAll,
              color: "sky"
            },
            {
              icon: viewMode === "list" ? "🗺️" : "📋",
              label: viewMode === "list" ? "Harita Gör" : "Liste Gör",
              onClick: () => setViewMode(viewMode === "list" ? "map" : "list"),
              color: "violet"
            },
            {
              icon: "🏠",
              label: "Ana Sayfa",
              href: "/",
              color: "amber"
            }
          ]}
          mainIcon="☰"
          mainLabel="Menü"
        />
      </div>
    </div>
  );
}
