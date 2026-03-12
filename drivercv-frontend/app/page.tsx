"use client";

// PATH: DriverAll-main/drivercv-frontend/app/page.tsx
// ----------------------------------------------------------
// Home (Landing + Auth Consolidation)
// - Giriş/Kayıt tek ekranda (sekme ile)
// - /login ve /register sayfaları buraya redirect eder
// - Kayıtta rol seçimi: driver | employer | advertiser (admin)
// - Auth ok -> token/user localStorage + driverall-auth-changed
// - Başarılı işlem -> /dashboard (rol yönlendirme tek merkez)
// ----------------------------------------------------------

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginMinimalUser, loginUser, registerMinimalUser, registerUser } from "@/lib/api/auth";
import { fetchPublicJobs } from "@/lib/api/publicJobs";
import { fetchLocationsList } from "@/lib/api/publicJobs";
import AdSlot from "@/components/AdSlot";
import JobSlider from "@/components/JobSlider";
import FloatingActionButton from "@/components/FloatingActionButton";

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
  if (typeof window === "undefined") return { token: null, user: null };
  const token = window.localStorage.getItem("token");
  const user = safeParseJson<StoredUser>(window.localStorage.getItem("user"));
  return { token, user };
}

function normalizeRole(r: any): UserRole {
  const v = String(r || "").toLowerCase();
  if (v === "admin") return "admin";
  if (v === "employer") return "employer";
  if (v === "advertiser") return "advertiser";
  return "driver";
}

function HomePageContent() {
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
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  const [candidateSubRoles, setCandidateSubRoles] = useState<CandidateSubRoleItem[]>([]);
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
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [tierOneJobs, setTierOneJobs] = useState<any[]>([]);
  const [tierTwoJobs, setTierTwoJobs] = useState<any[]>([]);
  const [tierThreeJobs, setTierThreeJobs] = useState<any[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [featuredErr, setFeaturedErr] = useState<string | null>(null);

  const [publicPackages, setPublicPackages] = useState<any[]>([]);
  const [packagesErr, setPackagesErr] = useState<string | null>(null);

  const [statsTopJobs, setStatsTopJobs] = useState<any[]>([]);
  const [statsTopCities, setStatsTopCities] = useState<any[]>([]);
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
        const token = window.localStorage.getItem("token");
        const userRaw = window.localStorage.getItem("user");
        const role = userRaw ? String(safeParseJson<any>(userRaw)?.role || "") : "";
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

  // Featured jobs (logged-out landing) - Tier bazlı
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicJobs({ country: "TR", page: "1", limit: "50" });
        if (!alive) return;
        const allJobs = Array.isArray((res as any)?.jobs) ? (res as any).jobs : [];
        setFeaturedJobs(allJobs);
        
        // Tier 1: Premium/Spotlight ilanlar (en büyük)
        const tier1 = allJobs.filter((j: any) => {
          const pk = String(j?.packageTier || j?.placementKey || "").toUpperCase();
          return pk.includes("PREMIUM") || pk.includes("SPOTLIGHT") || pk.includes("TIER_1");
        });
        setTierOneJobs(tier1.slice(0, 8));
        
        // Tier 2: Featured ilanlar (orta)
        const tier2 = allJobs.filter((j: any) => {
          const pk = String(j?.packageTier || j?.placementKey || "").toUpperCase();
          return !tier1.includes(j) && (pk.includes("FEATURED") || pk.includes("TIER_2"));
        });
        setTierTwoJobs(tier2.slice(0, 12));
        
        // Tier 3: Standart ilanlar (küçük)
        const tier3 = allJobs.filter((j: any) => !tier1.includes(j) && !tier2.includes(j));
        setTierThreeJobs(tier3.slice(0, 15));
        
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50">

      {/* ── NAVBAR (Kompakt) — sadece logged-out'ta göster, logged-in'de TopBar zaten var ── */}
      {!sessionToken && (
        <nav className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs">D</div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight">DriverAll</div>
                <div className="text-[9px] text-slate-500 leading-tight">Sürücü İş Platformu</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/jobs" className="text-xs sm:text-sm text-slate-300 hover:text-white transition">İlanlar</Link>
              <Link href="/register/auth" className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition">Giriş</Link>
              <Link href="/register/auth" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition">Kayıt</Link>
            </div>
          </div>
        </nav>
      )}

      {/* ── HERO (Kompakt, Görsel) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-3 pb-8 pt-8 sm:px-6 sm:pt-12 sm:pb-12">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Sürücü İşi Bul</span>
              <span className="block text-slate-100 mt-1">veya Sürücü İşe Al</span>
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400 sm:text-base">
              🚛 SRC · ADR · TIR · Kamyon · Forklift
            </p>
          </div>

          {/* Arama kutusu */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 backdrop-blur-sm sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Anahtar kelime</label>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  placeholder="SRC, ADR, TIR, Kamyon..."
                  value={homeQ}
                  onChange={(e) => setHomeQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goSearch(homeQ, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey }); }}
                />
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">İl</label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
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
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
                      <button type="button" className="block w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-900" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHomeCityCode(""); setHomeCityQuery(""); setHomeCityOpen(false); }}>
                        Tümü
                      </button>
                      {(homeCityFiltered || []).map((c: any) => {
                        const code = String(c?.code || c?.cityCode || "").trim();
                        const label = String(c?.name || c?.label || c?.code || "-").trim();
                        return (
                          <button key={code || label} type="button" className="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-900" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHomeCityCode(code); setHomeCityQuery(label || code); setHomeCityOpen(false); }}>
                            {label || code}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-[140px]">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Aday tipi</label>
                <select
                  value={homeSubRoleKey}
                  onChange={(e) => setHomeSubRoleKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  disabled={subRoleLoading}
                >
                  <option value="">Tümü</option>
                  {(candidateSubRoles || []).map((r: any) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => goSearch(homeQ, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                  className="w-full rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition sm:w-auto"
                >
                  Ara
                </button>
              </div>
            </div>

            {/* Hızlı etiketler */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500">Popüler:</span>
              {["SRC", "ADR", "TIR", "Kamyon", "Forklift"].map((tag) => (
                <button key={tag} type="button" onClick={() => goSearch(tag, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })} className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── YAKIN İLANLAR (Mobil için) ── */}
      {nearbyJobs.length > 0 && (
        <section className="border-t border-slate-800/40 bg-emerald-500/5">
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
        <section className="border-t border-slate-800/40">
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
        <section className="border-t border-slate-800/40 bg-slate-900/20">
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
        <section className="border-t border-slate-800/40">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-300">Diğer İlanlar</h2>
              <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300">Tümünü gör →</Link>
            </div>
            <JobSlider jobs={tierThreeJobs} size="small" autoPlaySpeed={3000} />
          </div>
        </section>
      )}

      {/* ── İLAN VİTRİNİ (Yedek - eski sistem) ── */}
      <section className="border-t border-slate-800/40 hidden">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50">İş İlanları</h2>
            <Link href="/jobs" className="text-sm text-emerald-400 hover:text-emerald-300">Tümünü gör &rarr;</Link>
          </div>

          {featuredErr && <div className="mt-4 text-sm text-slate-500">İlanlar yüklenemedi.</div>}

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
                        className="group block rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-slate-900/60 to-slate-900/40 p-6 sm:p-8 hover:border-amber-400/50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-3">
                              Sponsorlu
                            </div>
                            <div className="text-lg font-bold text-slate-50 group-hover:text-amber-400 line-clamp-2 transition">{String(j?.title || "İlan")}</div>
                            <div className="mt-2 text-sm text-slate-300 line-clamp-2">{String(j?.description || "").slice(0, 160)}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                              {j?.employerUserId?.companyName && <span className="text-slate-500">·</span>}
                              {j?.employerUserId?.companyName && <span className="font-medium text-slate-300">{String(j.employerUserId.companyName)}</span>}
                              {j?.packageName && <span className="text-slate-500">·</span>}
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
                        className="group rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-slate-900/40 p-5 sm:p-6 hover:border-sky-400/40 transition"
                      >
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-2">
                          Öne Çıkan
                        </div>
                        <div className="text-sm font-bold text-slate-100 group-hover:text-sky-400 line-clamp-2 transition">{String(j?.title || "İlan")}</div>
                        <div className="mt-1.5 text-xs text-slate-400 line-clamp-1">{String(j?.description || "").slice(0, 100)}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                          {j?.employerUserId?.companyName && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-300">{String(j.employerUserId.companyName)}</span>
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
                        className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 hover:border-emerald-500/30 hover:bg-slate-900/60 transition"
                      >
                        <div className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 line-clamp-1 transition">{String(j?.title || "İlan")}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>{String(j?.location?.label || j?.location?.cityCode || "Türkiye")}</span>
                          {j?.employerUserId?.companyName && (
                            <>
                              <span className="text-slate-600">·</span>
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
                  <div className="mt-6 text-center text-sm text-slate-500">Henüz ilan yok.</div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* ── İŞ KATEGORİLERİ (Görsel Kartlar) ── */}
      <section className="border-t border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12">
          <h2 className="text-base font-bold text-slate-50 mb-1 sm:text-lg">Kategorilere Göre Ara</h2>
          <p className="text-xs text-slate-400 sm:text-sm">İş tipine göre filtrele</p>

          <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3 sm:mt-6">
            {[
              { label: "TIR / Kamyon", q: "TIR Kamyon", icon: "🚛" },
              { label: "SRC Belgeli", q: "SRC", icon: "📋" },
              { label: "ADR Belgeli", q: "ADR", icon: "⚠️" },
              { label: "Forklift", q: "Forklift", icon: "🏗️" },
              { label: "Kurye", q: "Kurye Dağıtım", icon: "📦" },
              { label: "Servis", q: "Servis", icon: "🚌" },
              { label: "Lojistik", q: "Lojistik", icon: "🏭" },
              { label: "Uluslararası", q: "Uluslararası", icon: "🌍" },
            ].map((cat) => (
              <button
                key={cat.q}
                type="button"
                onClick={() => goSearch(cat.q, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 text-center hover:border-emerald-500/30 hover:bg-slate-900/60 transition sm:flex-row sm:gap-3 sm:p-4 sm:text-left"
              >
                <span className="text-2xl sm:text-xl">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-400 transition sm:text-sm">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Çalışma tipi filtreleri */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Çalışma Tipi:</span>
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
                className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition"
              >
                {wt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOKASYONA GÖRE İLANLAR ── */}
      {(statsTopCities || []).length > 0 && (
        <section className="border-t border-slate-800/40">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-slate-50">Lokasyona Göre İlanlar</h2>
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
                    className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center hover:border-emerald-500/30 hover:bg-slate-900/60 transition"
                  >
                    <div className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition">{label}</div>
                    <div className="mt-1 text-xs text-slate-500">{count} ilan</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── NASIL ÇALIŞIR ── */}
      <section className="border-t border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-lg font-bold text-slate-50">Nasıl Çalışır?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">Üç adımda doğru işe veya doğru adaya ulaş.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-2xl font-bold text-emerald-400">1</div>
              <h3 className="mt-4 text-sm font-semibold text-slate-100">Profil Oluştur</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Konum, ehliyet, SRC, ADR gibi kriterlerini doldur ve CV&apos;ni oluştur.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-2xl font-bold text-sky-400">2</div>
              <h3 className="mt-4 text-sm font-semibold text-slate-100">Filtrele & Keşfet</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">İl, kriter ve aday tipi filtrelerini kullanarak sana uygun ilanları bul.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-2xl font-bold text-violet-400">3</div>
              <h3 className="mt-4 text-sm font-semibold text-slate-100">Başvur & Takip Et</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Tek tıkla başvur, süreci panelden canlı takip et.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── İŞVERENLER / ADAYLAR CTA ── */}
      <section className="border-t border-slate-800/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* İşverenler */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 sm:p-8">
              <h3 className="text-base font-bold text-emerald-400">İşverenler İçin</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Kriter motoruyla aday eşleşmesi, tek panelden başvuru yönetimi, ilan paketleri ve görüşme takibi.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/employer/jobs/new" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition">İlan Oluştur</Link>
                <Link href="/employer/job-requests/new" className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition">Paket ile Yayınla</Link>
                <Link href="/packages" className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition">Paketleri Gör</Link>
              </div>
            </div>

            {/* Adaylar */}
            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent p-6 sm:p-8">
              <h3 className="text-base font-bold text-sky-400">Adaylar İçin</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Mobil-first başvuru deneyimi, CV yönetimi, belge süreleri hatırlatma ve kriter bazlı akıllı eşleşme.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/cv" className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition">Profilimi Oluştur</Link>
                <Link href="/jobs" className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition">İlanları Keşfet</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEDEN DRIVERALL ── */}
      <section className="border-t border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-lg font-bold text-slate-50">Neden DriverAll?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-emerald-400">Kriter Motoru</div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">SRC, ADR, ehliyet sınıfları, deneyim ve lokasyona göre akıllı eşleşme.</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-sky-400">Mobil Başvuru</div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Adaylar için hızlı tek-tık başvuru ve canlı süreç takibi.</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-violet-400">Belge Takibi</div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Belge bitiş tarihi hatırlatmaları, otomatik durum güncellemesi.</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-amber-400">İlan Paketleri</div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Esnek paket sistemi: ilan sayısı, süre ve öne çıkarma seçenekleri.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── İLAN PAKETLERİ ── */}
      {(publicPackages || []).length > 0 && (
        <section className="border-t border-slate-800/40">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-50">İlan Paketleri</h2>
              <Link href="/packages" className="text-sm text-emerald-400 hover:text-emerald-300">Tümünü gör &rarr;</Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(publicPackages || []).slice(0, 6).map((p: any) => (
                <div key={String(p?._id)} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
                  <div className="text-sm font-semibold text-slate-100 line-clamp-1">{String(p?.name || "Paket")}</div>
                  <div className="mt-2 text-xs text-slate-400">
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
        <section className="border-t border-slate-800/40 bg-slate-900/20">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-slate-50">Platform İstatistikleri</h2>
            {statsErr && <div className="mt-2 text-sm text-slate-500">İstatistikler yüklenemedi.</div>}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">En Popüler İlanlar</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(statsTopJobs || []).slice(0, 5).map((j: any) => (
                    <Link key={String(j?._id || "")} href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500/40 hover:text-emerald-400 transition" title={String(j?.title || "")}>
                      <span className="truncate max-w-[180px]">{String(j?.title || "İlan")}</span>
                      <span className="text-slate-500">{Number(j?.applyCount || 0)}</span>
                    </Link>
                  ))}
                  {(statsTopJobs || []).length === 0 && !statsErr && <span className="text-xs text-slate-500">Henüz veri yok.</span>}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">En Çok İlan Yayınlanan İller</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(statsTopCities || []).slice(0, 5).map((c: any) => {
                    const cc = String(c?.cityCode || "");
                    const lb = String(c?.label || cc || "-");
                    return (
                      <Link key={cc || lb} href={`/jobs?cityCode=${encodeURIComponent(cc)}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500/40 hover:text-emerald-400 transition" title={lb}>
                        <span className="truncate max-w-[180px]">{lb}</span>
                        <span className="text-slate-500">{Number(c?.count || 0)}</span>
                      </Link>
                    );
                  })}
                  {(statsTopCities || []).length === 0 && !statsErr && <span className="text-xs text-slate-500">Henüz veri yok.</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SANA UYGUN İLANLAR (smart suggest) ── */}
      {smartSuggestEnabled && (smartSuggestCityCode || (smartSuggestSubRoles || []).length > 0) && (
        <section className="border-t border-slate-800/40">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Sana Uygun İlanlar</h2>
                <p className="text-xs text-slate-400">Profilindeki il ve aday tipine göre öneriler</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={smartSuggestEnabled} onChange={(e) => setSmartSuggestEnabled(e.target.checked)} className="rounded" />
                Aktif
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {smartSuggestCityCode && (
                <Link href={`/jobs?cityCode=${encodeURIComponent(smartSuggestCityCode)}`} className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">
                  Şehrimdeki ilanlar
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
      <section className="border-t border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <AdSlot placement="HOME_BOTTOM" country="TR" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-xs text-slate-500">&copy; {new Date().getFullYear()} DriverAll. Tüm hakları saklıdır.</div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/jobs" className="hover:text-slate-200 transition">İlanlar</Link>
              <Link href="/packages" className="hover:text-slate-200 transition">Paketler</Link>
              {sessionToken
                ? <Link href="/dashboard" className="hover:text-slate-200 transition">Dashboard</Link>
                : <Link href="/register/auth" className="hover:text-slate-200 transition">Giriş / Kayıt</Link>
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
            icon: "📋",
            label: "CV Oluştur",
            href: "/cv",
            color: "sky"
          },
          {
            icon: "💼",
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">Yükleniyor...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
