"use client";

// PATH: DriverAll-main/drivercv-frontend/app/jobs/page.tsx
// ----------------------------------------------------------
// Jobs Page
// - Sol: filtreler (lokasyon + kriter grupları)
// - NEW: Kriter GRUPLARINI (sadece grupları) kullanıcı sürükle-bırak ile sıralayabilir
// - Grup sırası localStorage'da saklanır (default sıra backend’den gelir)
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchJobFilters, fetchPublicJobs, fetchLocationsList } from "@/lib/api/publicJobs";

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

export default function JobsPage() {
  const [country, setCountry] = useState("TR");

  // Search (debounced)
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  // Date + sort
  const [postedWithinDays, setPostedWithinDays] = useState<DateFilter>("");
  const [sort, setSort] = useState<SortFilter>("newest");

  // City search (dropdown'u daraltmak için)
  const [citySearch, setCitySearch] = useState("");

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
      setCitySearch("");
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

          const ctList: LocationItem[] = (ct.locations || []).map((x: any) => ({
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

        const stList: LocationItem[] = (st.locations || []).map((x: any) => ({
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
          const ctList: LocationItem[] = (ct.locations || []).map((x: any) => ({
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

        const ctList: LocationItem[] = (ct.locations || []).map((x: any) => ({
          code: x.code,
          name: x.name,
          parentCode: x.parentCode,
        }));

        setCities(ctList);
        setCityCode("");
        setCitySearch("");
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

        const dtList: LocationItem[] = (dt.locations || []).map((x: any) => ({
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

  const filteredCities = useMemo(() => {
    const term = citySearch.trim().toLowerCase();
    const list = term ? cities.filter((c) => String(c.name).toLowerCase().includes(term)) : cities;
    return list.slice(0, 200);
  }, [cities, citySearch]);

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
    setCitySearch("");
    setCriteriaSearch("");
    // NOT: grup sırasını silmeyelim (kullanıcının tercihi kalsın)
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
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">İlanlar</h1>
            <p className="text-sm text-slate-400">Filtrele, ara ve ilan detaylarını görüntüle.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Filtreleri sıfırla
            </button>
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

        {/* FLEX: solda filtre, sağda sonuçlar */}
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Filters */}
          <aside
            className="
              order-1
              rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-5
              sm:w-[340px] sm:flex-none
              sm:sticky sm:top-4 sm:z-20
              sm:max-h-[calc(100vh-120px)] sm:overflow-auto
            "
          >
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

              <div className="mt-3">
                <input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Şehir ara..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-3">
                <select
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Şehir</option>
                  {filteredCities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>

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

            <div className="grid gap-3">
              {jobs.map((j) => {
                const empObj = typeof j.employerUserId === "object" ? (j.employerUserId as Employer) : undefined;
                const employerText = empObj
                  ? `${empObj.name || "(isim yok)"}${empObj.email ? ` · ${empObj.email}` : ""}`
                  : "-";

                const locLabel =
                  j.location?.label ||
                  [j.location?.cityCode, j.location?.districtCode].filter(Boolean).join(" / ") ||
                  "-";

                return (
                  <Link
                    key={j._id}
                    href={`/jobs/${j._id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-50">{j.title || "(Başlık yok)"}</h3>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {formatDate(j.publishedAt || j.createdAt)}
                        </span>
                      </div>

                      <div className="text-sm text-slate-300">{locLabel}</div>

                      <div className="text-[11px] text-slate-400">
                        İlan veren: <span className="text-slate-200">{employerText}</span>
                      </div>

                      {/* NEW: description preview (clampText) */}
                      {j.description ? (
                        <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                          {clampText(j.description || "", 360)}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>

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
      </div>
    </div>
  );
}
