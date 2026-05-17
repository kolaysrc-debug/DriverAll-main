"use client";

// PATH: DriverAll-main/drivercv-frontend/components/HomePageClient.tsx
// ----------------------------------------------------------
// Homepage client component — server component'ten initial data alır
// ----------------------------------------------------------

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { loginMinimalUser, loginUser, registerMinimalUser, registerUser } from "@/lib/api/auth";
import { fetchPublicJobs } from "@/lib/api/publicJobs";
import { fetchLocationsList } from "@/lib/api/publicJobs";
import FloatingActionButton from "@/components/FloatingActionButton";
import { getToken, getUser } from "@/lib/session";
import { useLang } from "@/lib/LanguageContext";

// Lazy load heavy below-fold components
const JobSlider = dynamic(() => import("@/components/JobSlider"), { ssr: false });
const AdSlot = dynamic(() => import("@/components/AdSlot"), { ssr: false });

type UserRole = "driver" | "employer" | "advertiser" | "admin";

type CandidateSubRoleItem = {
  key: string;
  label: string;
  description?: string;
};

type StoredUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type CandidateSubRoleOption = {
  key: string;
  label: string;
  description?: string;
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getStoredSession(): { token: string | null; user: StoredUser | null } {
  const token = getToken() || null;
  const user = getUser() as StoredUser | null;
  return { token, user };
}

function normalizeRole(r: any): UserRole {
  const v = String(r || "").toLowerCase();
  if (v === "admin") return "admin";
  if (v === "employer") return "employer";
  if (v === "advertiser") return "advertiser";
  return "driver";
}

export type HomePageClientProps = {
  initialJobs?: any[];
  initialCities?: any[];
  initialSubRoles?: { key: string; label: string; description?: string }[];
  initialStats?: { topJobs: any[]; topCities: any[] };
  initialPackages?: any[];
};

function HomePageContent(props: HomePageClientProps) {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = useMemo<"login" | "register">(() => {
    const m = String(searchParams?.get("auth") || "").toLowerCase();
    return m === "register" ? "register" : "login";
  }, [searchParams]);

  const nextUrl = useMemo(() => {
    const n = searchParams?.get("next");
    return n && n.startsWith("/") ? n : null;
  }, [searchParams]);

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<StoredUser | null>(null);
  const [checked, setChecked] = useState(false);

  // Auth form state
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");

  const [loginMethod, setLoginMethod] = useState<"password" | "phone">("password");

  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [cities, setCities] = useState<any[]>(props.initialCities || []);
  const [districts, setDistricts] = useState<any[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  const [candidateSubRoles, setCandidateSubRoles] = useState<CandidateSubRoleItem[]>(props.initialSubRoles || []);
  const [subRoleLoading, setSubRoleLoading] = useState(false);
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>(["driver"]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Home search
  const [homeQ, setHomeQ] = useState("");

  const [homeCityCode, setHomeCityCode] = useState("");

  const [homeCityQuery, setHomeCityQuery] = useState("");
  const [homeCityOpen, setHomeCityOpen] = useState(false);

  const [homeSubRoleKey, setHomeSubRoleKey] = useState("");

  const [smartSuggestEnabled, setSmartSuggestEnabled] = useState(true);
  const [smartSuggestCityCode, setSmartSuggestCityCode] = useState<string>("");
  const [smartSuggestDistrictCode, setSmartSuggestDistrictCode] = useState<string>("");
  const [smartSuggestSubRoles, setSmartSuggestSubRoles] = useState<string[]>([]);

  // Featured jobs preview
  const [featuredJobs, setFeaturedJobs] = useState<any[]>(props.initialJobs || []);
  const [tierOneJobs, setTierOneJobs] = useState<any[]>([]);
  const [tierTwoJobs, setTierTwoJobs] = useState<any[]>([]);
  const [tierThreeJobs, setTierThreeJobs] = useState<any[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [featuredErr, setFeaturedErr] = useState<string | null>(null);

  const [publicPackages, setPublicPackages] = useState<any[]>(props.initialPackages || []);
  const [packagesErr, setPackagesErr] = useState<string | null>(null);

  const [statsTopJobs, setStatsTopJobs] = useState<any[]>(props.initialStats?.topJobs || []);
  const [statsTopCities, setStatsTopCities] = useState<any[]>(props.initialStats?.topCities || []);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  // İlk açılışta session oku + auth-changed dinle
  useEffect(() => {
    const read = () => {
      const { token, user } = getStoredSession();
      setSessionToken(token);
      setSessionUser(user);
    };

    read();
    setChecked(true);
    if (typeof window !== "undefined") {
      window.addEventListener("driverall-auth-changed", read);
      return () => window.removeEventListener("driverall-auth-changed", read);
    }
  }, []);

  const homeCityLabelByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cities || []) {
      const code = String(c?.code || c?.cityCode || "").trim();
      const label = String(c?.name || c?.label || c?.code || "").trim();
      if (code) m.set(code, label || code);
    }
    return m;
  }, [cities]);

  useEffect(() => {
    if (!homeCityCode) return;
    if (homeCityQuery.trim()) return;
    const label = homeCityLabelByCode.get(String(homeCityCode).trim());
    if (label) setHomeCityQuery(label);
  }, [homeCityCode, homeCityLabelByCode, homeCityQuery]);

  const homeCityFiltered = useMemo(() => {
    const norm = (s: string) =>
      String(s || "")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i");

    const q = norm(homeCityQuery);
    if (!q) return [];
    const list = (cities || []).filter((c: any) => {
      const label = norm(String(c?.name || c?.label || ""));
      const code = norm(String(c?.code || c?.cityCode || ""));
      return (label && label.includes(q)) || (code && code.includes(q));
    });
    return list.slice(0, 12);
  }, [cities, homeCityQuery]);

  // Smart suggest defaults from profile/me + users/me (driver only)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const token = getToken();
        const user = getUser();
        const role = String(user?.role || "");
        if (!token || String(role).toLowerCase() !== "driver") return;

        const headers = { Authorization: `Bearer ${token}` };
        const [pRes, uRes] = await Promise.all([
          fetch("/api/profile/me", { headers, cache: "no-store" }),
          fetch("/api/users/me", { headers, cache: "no-store" }),
        ]);
        const pJson = await pRes.json().catch(() => ({}));
        const uJson = await uRes.json().catch(() => ({}));
        if (!alive) return;
        if (pRes.ok) {
          const loc = pJson?.profile?.location || {};
          setSmartSuggestCityCode(String(loc?.cityCode || pJson?.profile?.cityCode || ""));
          setSmartSuggestDistrictCode(String(loc?.districtCode || pJson?.profile?.districtCode || ""));
        }
        if (uRes.ok) {
          const subs = Array.isArray(uJson?.user?.subRoles) ? uJson.user.subRoles : [];
          setSmartSuggestSubRoles(subs.map((x: any) => String(x || "").trim()).filter(Boolean));
        }
      } catch {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Homepage stats (popular jobs + top cities)
  useEffect(() => {
    if ((props.initialStats?.topJobs || []).length > 0) return; // server-fetched
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/jobs/stats?country=TR&limit=5", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        setStatsTopJobs(Array.isArray(data?.topJobs) ? data.topJobs : []);
        setStatsTopCities(Array.isArray(data?.topCities) ? data.topCities : []);
        setStatsErr(null);
      } catch (e: any) {
        if (!alive) return;
        setStatsTopJobs([]);
        setStatsTopCities([]);
        setStatsErr(e?.message || "");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if ((props.initialPackages || []).length > 0) return; // server-fetched
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/packages?type=JOB&country=TR", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setPublicPackages(Array.isArray(data?.packages) ? data.packages : []);
        setPackagesErr(null);
      } catch (e: any) {
        if (!alive) return;
        setPublicPackages([]);
        setPackagesErr(e?.message || "");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Role change: candidate olmayan rolde subRole seçimini temizle
  useEffect(() => {
    if (mode !== "register") return;
    if (String(role) !== "driver") {
      setSelectedSubRoles([]);
    } else {
      setSelectedSubRoles((prev) => {
        const cleaned = (prev || []).map((s) => String(s || "").trim()).filter(Boolean);
        if (cleaned.length > 0) return cleaned;
        return ["driver"];
      });
    }
  }, [mode, role]);

  // Candidate sub-roles (from role engine)
  useEffect(() => {
    if ((props.initialSubRoles || []).length > 0) return; // server-fetched
    let alive = true;
    (async () => {
      try {
        setSubRoleLoading(true);
        const res = await fetch("/api/public/roles/candidate-subroles", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        const list = Array.isArray(data?.subRoles) ? data.subRoles : [];
        const mapped: CandidateSubRoleItem[] = list
          .map((x: any) => ({
            key: String(x?.key || "").trim(),
            label: String(x?.label || x?.key || "").trim(),
            description: String(x?.description || "").trim() || undefined,
          }))
          .filter((x: CandidateSubRoleItem) => !!x.key);

        setCandidateSubRoles(mapped);

        // Eğer seçili roller listesi boşsa veya driver yoksa, ilk aktif rolü seç
        if (mapped.length > 0) {
          setSelectedSubRoles((prev) => {
            const cleaned = (prev || []).map((s) => String(s || "").trim()).filter(Boolean);
            if (cleaned.length > 0) return cleaned;
            return [mapped[0].key];
          });
        }
      } catch {
        if (!alive) return;
        setCandidateSubRoles([]);
      } finally {
        if (!alive) return;
        setSubRoleLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Locations (TR cities + districts)
  useEffect(() => {
    if ((props.initialCities || []).length > 0) return; // server-fetched
    let alive = true;
    (async () => {
      try {
        setLocLoading(true);
        const res = await fetchLocationsList("TR", "city");
        if (!alive) return;
        const list =
          Array.isArray((res as any)?.list)
            ? (res as any).list
            : Array.isArray((res as any)?.locations)
            ? (res as any).locations
            : [];
        setCities(list);
      } catch {
        if (!alive) return;
        setCities([]);
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setDistricts([]);
      setDistrictCode("");
      if (!cityCode) return;
      try {
        setLocLoading(true);
        const res = await fetchLocationsList("TR", "district", cityCode);
        if (!alive) return;
        const list =
          Array.isArray((res as any)?.list)
            ? (res as any).list
            : Array.isArray((res as any)?.locations)
            ? (res as any).locations
            : [];
        setDistricts(list);
      } catch {
        if (!alive) return;
        setDistricts([]);
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cityCode]);

  // /login ve /register redirect ile gelindiyse tab güncelle
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "login") return;
    setLoginMethod("password");
  }, [mode]);

  // Ana sayfa artık tüm kullanıcılar için aynı landing page'i gösterir

  // Tier computation — useMemo so it recalculates when featuredJobs changes
  const computedTiers = useMemo(() => {
    const all = featuredJobs || [];
    const tier1 = all.filter((j: any) => {
      const pk = String(j?.packageTier || j?.placementKey || "").toUpperCase();
      return pk.includes("PREMIUM") || pk.includes("SPOTLIGHT") || pk.includes("TIER_1");
    });
    const tier2 = all.filter((j: any) => {
      const pk = String(j?.packageTier || j?.placementKey || "").toUpperCase();
      return !tier1.includes(j) && (pk.includes("FEATURED") || pk.includes("TIER_2"));
    });
    const tier3 = all.filter((j: any) => !tier1.includes(j) && !tier2.includes(j));
    return { tier1: tier1.slice(0, 8), tier2: tier2.slice(0, 12), tier3: tier3.slice(0, 15) };
  }, [featuredJobs]);

  // Sync tier state from memo (keeps rest of JSX unchanged)
  useEffect(() => {
    setTierOneJobs(computedTiers.tier1);
    setTierTwoJobs(computedTiers.tier2);
    setTierThreeJobs(computedTiers.tier3);
  }, [computedTiers]);

  // Featured jobs (logged-out landing) - Tier bazlı
  useEffect(() => {
    if ((props.initialJobs || []).length > 0) return; // server-fetched
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicJobs({ country: "TR", page: "1", limit: "50" });
        if (!alive) return;
        const allJobs = Array.isArray((res as any)?.jobs) ? (res as any).jobs : [];
        setFeaturedJobs(allJobs);
        setFeaturedErr(null);
      } catch (e: any) {
        if (!alive) return;
        setFeaturedJobs([]);
        setFeaturedErr(e?.message || "");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Yakındaki ilanlar (mobil kullanıcılar için)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!smartSuggestCityCode) return;
        const res = await fetchPublicJobs({ 
          country: "TR", 
          cityCode: smartSuggestCityCode,
          page: "1", 
          limit: "10" 
        });
        if (!alive) return;
        setNearbyJobs(Array.isArray((res as any)?.jobs) ? (res as any).jobs : []);
      } catch {
        if (!alive) return;
        setNearbyJobs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [smartSuggestCityCode]);

  function goSearch(q: string, opts?: { cityCode?: string; subRoleKey?: string }) {
    const s = String(q || "").trim();
    const cc = String(opts?.cityCode || "").trim();
    const sr = String(opts?.subRoleKey || "").trim();

    const sp = new URLSearchParams();
    if (s) sp.set("q", s);
    if (cc) sp.set("cityCode", cc);
    if (sr) sp.set("subRole", sr);

    const qs = sp.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      if (!email.trim()) {
        setError("Lütfen e-postayı girin.");
        return;
      }

      if (loginMethod === "password" && !password.trim()) {
        setError("Lütfen şifreyi girin.");
        return;
      }

      if (loginMethod === "phone" && !phone.trim()) {
        setError("Lütfen telefonu girin.");
        return;
      }
    } else {
      if (!name.trim() || !email.trim()) {
        setError("Lütfen ad ve e-postayı girin.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const regName = (name || "").trim() || email.split("@")[0] || "Yeni Kullanıcı";
        const pickedSubRoles = (selectedSubRoles || [])
          .map((s) => String(s || "").trim())
          .filter((s) => !!s);

        const res = await registerMinimalUser({
          name: regName,
          email: email.trim(),
          phone: phone.trim(),
          cityCode: cityCode || undefined,
          districtCode: districtCode || undefined,
          role,
          subRoles: pickedSubRoles,
        });

        if (res?.token) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("token", res.token);
            if (res.user) window.localStorage.setItem("user", JSON.stringify(res.user));
            window.dispatchEvent(new Event("driverall-auth-changed"));
          }
        }

        setSuccess("Kayıt başarılı. Yönlendiriliyorsunuz...");
        router.replace("/dashboard");
        return;
      }

      // login
      console.debug("[auth] login submit", {
        method: loginMethod,
        email: email.trim(),
        passwordLen: password.trim().length,
        phone: phone.trim(),
      });
      const data =
        loginMethod === "phone"
          ? await loginMinimalUser({ email: email.trim(), phone: phone.trim() })
          : await loginUser({ email: email.trim(), password: password.trim() });

      if (typeof window !== "undefined" && data?.token) {
        window.localStorage.setItem("token", data.token);
        window.localStorage.setItem("user", JSON.stringify(data.user || {}));
        window.dispatchEvent(new Event("driverall-auth-changed"));
      }

      setSuccess("Giriş başarılı. Yönlendiriliyorsunuz...");

      if (nextUrl) router.replace(nextUrl);
      else router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  // ----------------------------------------------------------
  // Ana Sayfa — hem logged-in hem logged-out aynı landing page
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen text-zinc-50">

      {/* ── HERO (Kompakt, Görsel) ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(59,130,246,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 [background:linear-gradient(180deg,transparent_60%,var(--da-bg)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-3 pb-12 pt-12 sm:px-6 sm:pt-20 sm:pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="da-badge mb-5">{t("hero.badge")}</p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-emerald-300 bg-clip-text text-transparent">
                {t("hero.title1")}
              </span>
              <span className="mt-2 block text-slate-50">{t("hero.title2")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-300 sm:text-base">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Arama kutusu */}
          <div className="v3-panel mx-auto mt-10 max-w-4xl rounded-2xl p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-400">{t("search.keyword")}</label>
                <input
                  className="da-input w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  placeholder={t("search.keyword.placeholder")}
                  value={homeQ}
                  onChange={(e) => setHomeQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goSearch(homeQ, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey }); }}
                />
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1 block text-[11px] font-medium text-zinc-400">{t("search.city")}</label>
                <div className="relative">
                  <input
                    className="da-input w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                    placeholder={locLoading ? "Yükleniyor..." : "İl seç"}
                    value={homeCityQuery}
                    onChange={(e) => { setHomeCityQuery(e.target.value); setHomeCityOpen(true); if (!e.target.value.trim()) setHomeCityCode(""); }}
                    onFocus={() => setHomeCityOpen(true)}
                    onBlur={() => {
                      const typed = homeCityQuery.trim();
                      const selectedLabel = homeCityLabelByCode.get(String(homeCityCode).trim()) || "";
                      if (typed) {
                        const typedNorm = typed.toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
                        const exact = (cities || []).some((c: any) => {
                          const lb = String(c?.name || c?.label || "").trim().toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
                          const cd = String(c?.code || c?.cityCode || "").trim().toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
                          return lb === typedNorm || cd === typedNorm;
                        });
                        if (!exact) setHomeCityQuery(selectedLabel || "");
                      } else {
                        if (homeCityCode && selectedLabel) setHomeCityQuery(selectedLabel);
                      }
                      window.setTimeout(() => setHomeCityOpen(false), 120);
                    }}
                    disabled={locLoading}
                  />
                  {homeCityOpen && homeCityQuery.trim() && (homeCityFiltered || []).length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-600 bg-zinc-950 shadow-xl">
                      <button type="button" className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-blue-500/10" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHomeCityCode(""); setHomeCityQuery(""); setHomeCityOpen(false); }}>
                        Tümü
                      </button>
                      {(homeCityFiltered || []).map((c: any) => {
                        const code = String(c?.code || c?.cityCode || "").trim();
                        const label = String(c?.name || c?.label || c?.code || "-").trim();
                        return (
                          <button key={code || label} type="button" className="block w-full px-4 py-2 text-left text-sm text-zinc-100 hover:bg-blue-500/10" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHomeCityCode(code); setHomeCityQuery(label || code); setHomeCityOpen(false); }}>
                            {label || code}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-[140px]">
                <label className="mb-1 block text-[11px] font-medium text-zinc-400">{t("search.type")}</label>
                <select
                  value={homeSubRoleKey}
                  onChange={(e) => setHomeSubRoleKey(e.target.value)}
                  className="da-input w-full rounded-xl px-3 py-3 text-sm outline-none transition"
                  disabled={subRoleLoading}
                >
                  <option value="">{t("search.all")}</option>
                  {(candidateSubRoles || []).map((r: any) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => goSearch(homeQ, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                  className="da-btn-green w-full rounded-xl px-6 py-3 text-sm sm:w-auto"
                >
                  {t("search.btn")}
                </button>
              </div>
            </div>

            {/* Hızlı etiketler */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500">{t("search.popular")}</span>
              {["SRC", "ADR", "TIR", "Kamyon", "Forklift"].map((tag) => (
                <button key={tag} type="button" onClick={() => goSearch(tag, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })} className="rounded-full border border-slate-700 bg-slate-700/30 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── YAKIN İLANLAR (Mobil için) ── */}
      {nearbyJobs.length > 0 && (
        <section className="border-t border-slate-800 bg-emerald-500/5">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-lg font-bold text-emerald-400">Yakınındaki İlanlar</h2>
            </div>
            <JobSlider jobs={nearbyJobs} size="large" autoPlaySpeed={4000} />
          </div>
        </section>
      )}

      {/* ── TIER 1: PREMIUM İLANLAR (En Büyük Slayt) ── */}
      {tierOneJobs.length > 0 && (
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <h2 className="text-lg font-bold text-amber-400">Premium İlanlar</h2>
            </div>
            <JobSlider jobs={tierOneJobs} size="large" autoPlaySpeed={5000} />
          </div>
        </section>
      )}

      {/* ── TIER 2: ÖNE ÇIKAN İLANLAR (Orta Slayt) ── */}
      {tierTwoJobs.length > 0 && (
        <section className="border-t border-slate-800 bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔥</span>
              <h2 className="text-base font-bold text-sky-400">Öne Çıkan İlanlar</h2>
            </div>
            <JobSlider jobs={tierTwoJobs} size="medium" autoPlaySpeed={4000} />
          </div>
        </section>
      )}

      {/* ── TIER 3: STANDART İLANLAR (Küçük Slayt) ── */}
      {tierThreeJobs.length > 0 && (
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-300">Diğer İlanlar</h2>
              <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300">Tümünü gör →</Link>
            </div>
            <JobSlider jobs={tierThreeJobs} size="small" autoPlaySpeed={3000} />
          </div>
        </section>
      )}

      {/* ── İLAN VİTRİNİ (Yedek - eski sistem) ── */}
      <section className="border-t border-slate-800 hidden">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-50">İş İlanları</h2>
            <Link href="/jobs" className="text-sm text-emerald-400 hover:text-emerald-300">Tümünü gör &rarr;</Link>
          </div>

          {featuredErr && <div className="mt-4 text-sm text-zinc-500">İlanlar yüklenemedi.</div>}

          {(() => {
            const all = featuredJobs || [];
            const spotlight = all.filter((j: any) => {
              const pk = String(j?.placementKey || "").toUpperCase();
              return pk.includes("SPOTLIGHT") || pk.includes("HOME_JOB_TOP");
            });
            const featured = all.filter((j: any) => {
              const pk = String(j?.placementKey || "").toUpperCase();
              return !pk.includes("SPOTLIGHT") && !pk.includes("HOME_JOB_TOP") && pk.length > 0;
            });
            const standard = all.filter((j: any) => !String(j?.placementKey || "").trim());

            return (
              <>
                {/* Tier 1: Spotlight — büyük alan, tam genişlik */}
                {spotlight.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {spotlight.slice(0, 2).map((j: any) => (
                      <Link
                        key={String(j?._id)}
                        href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`}
                        className="group block rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-black/50 to-black/35 p-6 sm:p-8 hover:border-amber-400/50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-3">
                              Sponsorlu
                            </div>
                            <div className="text-lg font-bold text-zinc-50 group-hover:text-amber-400 line-clamp-2 transition">{String(j?.title || "İlan")}</div>
                            <div className="mt-2 text-sm text-zinc-300 line-clamp-2">{String(j?.description || "").slice(0, 160)}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                              <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                              {j?.employerUserId?.companyName && <span className="text-zinc-500">·</span>}
                              {j?.employerUserId?.companyName && <span className="font-medium text-zinc-300">{String(j.employerUserId.companyName)}</span>}
                              {j?.packageName && <span className="text-zinc-500">·</span>}
                              {j?.packageName && <span className="text-amber-400/70">{String(j.packageName)}</span>}
                            </div>
                          </div>
                          <div className="hidden sm:flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xl font-bold">
                            {String(j?.employerUserId?.companyName || j?.title || "?").charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tier 2: Featured — orta büyük, 2 sütun */}
                {featured.length > 0 && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {featured.slice(0, 4).map((j: any) => (
                      <Link
                        key={String(j?._id)}
                        href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`}
                        className="group rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-black/35 p-5 sm:p-6 hover:border-sky-400/40 transition"
                      >
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-2">
                          Öne Çıkan
                        </div>
                        <div className="text-sm font-bold text-zinc-100 group-hover:text-sky-400 line-clamp-2 transition">{String(j?.title || "İlan")}</div>
                        <div className="mt-1.5 text-xs text-slate-300 line-clamp-1">{String(j?.description || "").slice(0, 100)}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                          {j?.employerUserId?.companyName && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-300">{String(j.employerUserId.companyName)}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tier 3: Standart — küçük, 3 sütun */}
                {standard.length > 0 && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {standard.slice(0, 12).map((j: any) => (
                      <Link
                        key={String(j?._id)}
                        href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`}
                        className="group rounded-xl border border-slate-700 bg-slate-800/40 p-4 hover:border-emerald-500/30 hover:bg-slate-800/60 transition"
                      >
                        <div className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 line-clamp-1 transition">{String(j?.title || "İlan")}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                          {j?.employerUserId?.companyName && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span>{String(j.employerUserId.companyName)}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Hiç ilan yoksa */}
                {all.length === 0 && !featuredErr && (
                  <div className="mt-6 text-center text-sm text-zinc-500">Henüz ilan yok.</div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* ── İ�? KATEGORİLERİ (Görsel Kartlar) ── */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12">
          <h2 className="text-base font-bold text-zinc-50 mb-1 sm:text-lg">{t("cat.title")}</h2>
          <p className="text-xs text-slate-300 sm:text-sm">{t("cat.subtitle")}</p>

          <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3 sm:mt-6">
            {[
              { labelKey: "cat.truck" as const, q: "TIR Kamyon", icon: "🚛" },
              { labelKey: "cat.src" as const, q: "SRC", icon: "📋" },
              { labelKey: "cat.adr" as const, q: "ADR", icon: "⚠️" },
              { labelKey: "cat.forklift" as const, q: "Forklift", icon: "🏗️" },
              { labelKey: "cat.courier" as const, q: "Kurye Dağıtım", icon: "📦" },
              { labelKey: "cat.service" as const, q: "Servis", icon: "🚌" },
              { labelKey: "cat.logistics" as const, q: "Lojistik", icon: "🏭" },
              { labelKey: "cat.international" as const, q: "Uluslararası", icon: "🌍" },
            ].map((cat) => (
              <button
                key={cat.q}
                type="button"
                onClick={() => goSearch(cat.q, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-center hover:border-emerald-500/30 hover:bg-slate-800/60 transition sm:flex-row sm:gap-3 sm:p-4 sm:text-left"
              >
                <span className="text-2xl sm:text-xl">{cat.icon}</span>
                <span className="text-xs font-semibold transition group-hover:text-blue-300 sm:text-sm" style={{ color: "var(--da-text)" }}>{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Çalışma tipi filtreleri */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Çalışma Tipi:</span>
            {[
              { label: "Tam Zamanlı", q: "Tam Zamanlı" },
              { label: "Part-Time", q: "Part Time" },
              { label: "Uzaktan", q: "Remote Uzaktan" },
              { label: "Yeni Mezun", q: "Yeni Mezun Stajyer" },
            ].map((wt) => (
              <button
                key={wt.q}
                type="button"
                onClick={() => goSearch(wt.q, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                className="rounded-full border border-slate-700 bg-slate-700/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition"
              >
                {wt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOKASYONA GÖRE İLANLAR ── */}
      {(statsTopCities || []).length > 0 && (
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-zinc-50">Lokasyona Göre İlanlar</h2>
            <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {(statsTopCities || []).slice(0, 5).map((c: any) => {
                const code = String(c?.cityCode || "").trim();
                const label = String(c?.label || code || "-");
                const count = Number(c?.count || 0);
                if (!code) return null;
                return (
                  <Link
                    key={code}
                    href={`/jobs?cityCode=${encodeURIComponent(code)}`}
                    className="group rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-center hover:border-emerald-500/30 hover:bg-slate-800/60 transition"
                  >
                    <div className="text-sm font-semibold transition group-hover:text-blue-300" style={{ color: "var(--da-text)" }}>{label}</div>
                    <div className="mt-1 text-xs text-zinc-500">{count} ilan</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── NASIL ÇALI�?IR ── */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-lg font-bold text-zinc-50">{t("how.title")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-zinc-400">{t("how.subtitle")}</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-2xl font-bold text-emerald-400">1</div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{t("how.step1.title")}</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("how.step1.desc")}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-2xl font-bold text-sky-400">2</div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{t("how.step2.title")}</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("how.step2.desc")}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-2xl font-bold text-violet-400">3</div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{t("how.step3.title")}</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("how.step3.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── İ�?VERENLER / ADAYLAR CTA ── */}
      <section className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* İşverenler */}
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(12,24,41,0.9))", border: "1px solid rgba(16,185,129,0.25)" }}>
              <h3 className="text-base font-bold text-emerald-400">{t("cta.employer.title")}</h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{t("cta.employer.desc")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/employer/jobs/new" className="da-btn-green rounded-xl px-5 py-2.5 text-sm">{t("cta.employer.post")}</Link>
                <Link href="/employer/job-requests/new" className="da-btn-ghost rounded-xl px-5 py-2.5 text-sm">{t("cta.employer.pkg")}</Link>
                <Link href="/packages" className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm text-zinc-300 hover:bg-blue-500/15 transition">{t("cta.employer.see")}</Link>
              </div>
            </div>

            {/* Adaylar */}
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(12,24,41,0.9))", border: "1px solid rgba(59,130,246,0.25)" }}>
              <h3 className="text-base font-bold text-sky-400">{t("cta.driver.title")}</h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{t("cta.driver.desc")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/cv" className="da-btn-primary rounded-xl px-5 py-2.5 text-sm">{t("cta.driver.profile")}</Link>
                <Link href="/jobs" className="da-btn-ghost rounded-xl px-5 py-2.5 text-sm">{t("cta.driver.jobs")}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEDEN DRIVERALL ── */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-lg font-bold text-zinc-50">{t("why.title")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="da-card p-5">
              <div className="text-sm font-semibold text-emerald-400">{t("why.criteria.title")}</div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("why.criteria.desc")}</p>
            </div>
            <div className="da-card p-5">
              <div className="text-sm font-semibold text-sky-400">{t("why.mobile.title")}</div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("why.mobile.desc")}</p>
            </div>
            <div className="da-card p-5">
              <div className="text-sm font-semibold text-violet-400">{t("why.docs.title")}</div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t("why.docs.desc")}</p>
            </div>
            <div className="da-card p-5">
              <div className="text-sm font-semibold text-amber-400">İlan Paketleri</div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">Esnek paket sistemi: ilan sayısı, süre ve öne çıkarma seçenekleri.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── İLAN PAKETLERİ ── */}
      {(publicPackages || []).length > 0 && (
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-50">İlan Paketleri</h2>
              <Link href="/packages" className="text-sm text-emerald-400 hover:text-emerald-300">Tümünü gör &rarr;</Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(publicPackages || []).slice(0, 6).map((p: any) => (
                <div key={String(p?._id)} className="da-card p-5">
                  <div className="text-sm font-semibold text-zinc-100 line-clamp-1">{String(p?.name || "Paket")}</div>
                  <div className="mt-2 text-xs text-zinc-400">
                    {String(p?.currency || "TRY")} {String(p?.price ?? "0")}
                    {p?.credits?.jobPostCount ? ` · ${String(p.credits.jobPostCount)} ilan` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── İSTATİSTİKLER ── */}
      {((statsTopJobs || []).length > 0 || (statsTopCities || []).length > 0) && (
        <section className="border-t border-slate-800 bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-zinc-50">Platform İstatistikleri</h2>
            {statsErr && <div className="mt-2 text-sm text-zinc-500">İstatistikler yüklenemedi.</div>}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="da-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">En Popüler İlanlar</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(statsTopJobs || []).slice(0, 5).map((j: any) => (
                    <Link key={String(j?._id || "")} href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-400 transition" title={String(j?.title || "")}>
                      <span className="truncate max-w-[180px]">{String(j?.title || "İlan")}</span>
                      <span className="text-zinc-500">{Number(j?.applyCount || 0)}</span>
                    </Link>
                  ))}
                  {(statsTopJobs || []).length === 0 && !statsErr && <span className="text-xs text-zinc-500">Henüz veri yok.</span>}
                </div>
              </div>

              <div className="da-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">En Çok İlan Yayınlanan İller</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(statsTopCities || []).slice(0, 5).map((c: any) => {
                    const cc = String(c?.cityCode || "");
                    const lb = String(c?.label || cc || "-");
                    return (
                      <Link key={cc || lb} href={`/jobs?cityCode=${encodeURIComponent(cc)}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-400 transition" title={lb}>
                        <span className="truncate max-w-[180px]">{lb}</span>
                        <span className="text-zinc-500">{Number(c?.count || 0)}</span>
                      </Link>
                    );
                  })}
                  {(statsTopCities || []).length === 0 && !statsErr && <span className="text-xs text-zinc-500">Henüz veri yok.</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SANA UYGUN İLANLAR (smart suggest) ── */}
      {smartSuggestEnabled && (smartSuggestCityCode || (smartSuggestSubRoles || []).length > 0) && (
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-100">Sana Uygun İlanlar</h2>
                <p className="text-xs text-zinc-400">Profilindeki il ve aday tipine göre öneriler</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={smartSuggestEnabled} onChange={(e) => setSmartSuggestEnabled(e.target.checked)} className="rounded" />
                Aktif
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {smartSuggestCityCode && (
                <Link href={`/jobs?cityCode=${encodeURIComponent(smartSuggestCityCode)}`} className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">
                  �?ehrimdeki ilanlar
                </Link>
              )}
              {(smartSuggestSubRoles || []).slice(0, 4).map((sr) => (
                <Link key={sr} href={`/jobs?subRole=${encodeURIComponent(sr)}${smartSuggestCityCode ? `&cityCode=${encodeURIComponent(smartSuggestCityCode)}` : ""}`} className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition">
                  {sr}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── REKLAM ── */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <AdSlot placement="HOME_BOTTOM" country="TR" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} DriverAll. Tüm hakları saklıdır.</div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <Link href="/jobs" className="hover:text-zinc-200 transition">İlanlar</Link>
              <Link href="/packages" className="hover:text-zinc-200 transition">Paketler</Link>
              {sessionToken
                ? <Link href="/dashboard" className="hover:text-zinc-200 transition">Dashboard</Link>
                : <Link href="/register/auth" className="hover:text-zinc-200 transition">Giriş / Kayıt</Link>
              }
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button - Tek Elle Kullanım */}
      <FloatingActionButton
        actions={[
          {
            icon: "🔍",
            label: "İş Ara",
            href: "/jobs",
            color: "emerald"
          },
          {
            icon: "📄",
            label: "CV Oluştur",
            href: "/cv",
            color: "sky"
          },
          {
            icon: "📢",
            label: "İlanlar",
            href: "/jobs",
            color: "violet"
          },
          {
            icon: "👤",
            label: "Profil",
            href: "/profile",
            color: "amber"
          }
        ]}
        mainIcon="✚"
        mainLabel="Hızlı Erişim"
      />
    </div>
  );
}

export default function HomePageClient(props: HomePageClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">Yükleniyor...</div>}>
      <HomePageContent {...props} />
    </Suspense>
  );
}
