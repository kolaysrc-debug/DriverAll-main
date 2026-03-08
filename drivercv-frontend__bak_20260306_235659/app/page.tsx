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

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginMinimalUser, loginUser, registerMinimalUser, registerUser } from "@/lib/api/auth";
import { fetchPublicJobs } from "@/lib/api/publicJobs";
import { fetchLocationsList } from "@/lib/api/publicJobs";
import AdSlot from "@/components/AdSlot";

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

export default function HomePage() {
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
  const [homeCityOptions, setHomeCityOptions] = useState<any[]>([]);
  const [homeCityLoading, setHomeCityLoading] = useState(false);

  const [homeCityQuery, setHomeCityQuery] = useState("");
  const [homeCityOpen, setHomeCityOpen] = useState(false);

  const [homeSubRoleKey, setHomeSubRoleKey] = useState("");
  const [homeSubRoleOptions, setHomeSubRoleOptions] = useState<CandidateSubRoleOption[]>([]);
  const [homeSubRoleLoading, setHomeSubRoleLoading] = useState(false);

  const [smartSuggestEnabled, setSmartSuggestEnabled] = useState(true);
  const [smartSuggestCityCode, setSmartSuggestCityCode] = useState<string>("");
  const [smartSuggestDistrictCode, setSmartSuggestDistrictCode] = useState<string>("");
  const [smartSuggestSubRoles, setSmartSuggestSubRoles] = useState<string[]>([]);

  // Featured jobs preview
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
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
    if (typeof window !== "undefined") {
      window.addEventListener("driverall-auth-changed", read);
      return () => window.removeEventListener("driverall-auth-changed", read);
    }
  }, []);

  // Homepage: dropdown-only city list (no free text)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setHomeCityLoading(true);
        const res = await fetchLocationsList("TR", "city");
        if (!alive) return;
        const list =
          Array.isArray((res as any)?.list)
            ? (res as any).list
            : Array.isArray((res as any)?.locations)
            ? (res as any).locations
            : [];
        setHomeCityOptions(list);
      } catch {
        if (!alive) return;
        setHomeCityOptions([]);
      } finally {
        if (!alive) return;
        setHomeCityLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const homeCityLabelByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of homeCityOptions || []) {
      const code = String(c?.code || c?.cityCode || "").trim();
      const label = String(c?.name || c?.label || c?.code || "").trim();
      if (code) m.set(code, label || code);
    }
    return m;
  }, [homeCityOptions]);

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
    const list = (homeCityOptions || []).filter((c: any) => {
      const label = norm(String(c?.name || c?.label || ""));
      const code = norm(String(c?.code || c?.cityCode || ""));
      return (label && label.includes(q)) || (code && code.includes(q));
    });
    return list.slice(0, 12);
  }, [homeCityOptions, homeCityQuery]);

  // Homepage: candidate subroles list
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setHomeSubRoleLoading(true);
        const res = await fetch("/api/public/roles/candidate-subroles", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        const list = Array.isArray(data?.subRoles) ? data.subRoles : [];
        const mapped = list
          .map((x: any) => ({
            key: String(x?.key || "").trim(),
            label: String(x?.label || x?.key || "").trim(),
            description: String(x?.description || "").trim() || undefined,
          }))
          .filter((x: CandidateSubRoleOption) => !!x.key);
        setHomeSubRoleOptions(mapped);
      } catch {
        if (!alive) return;
        setHomeSubRoleOptions([]);
      } finally {
        if (!alive) return;
        setHomeSubRoleLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const loggedInRole = useMemo<UserRole>(() => normalizeRole(sessionUser?.role), [sessionUser]);

  // Login sonrası ortak giriş noktası: /profile (shell)
  useEffect(() => {
    if (!sessionToken) return;
    router.replace("/profile");
  }, [router, sessionToken]);

  // Featured jobs (logged-out landing)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicJobs({ country: "TR", page: "1", limit: "6" });
        if (!alive) return;
        setFeaturedJobs(Array.isArray((res as any)?.jobs) ? (res as any).jobs : []);
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
        router.replace("/profile");
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
      else router.replace("/profile");
    } catch (err: any) {
      setError(err?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  // ----------------------------------------------------------
  // Logged-in Home (role-based quick actions)
  // ----------------------------------------------------------
  if (sessionToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <div className="text-xs text-slate-300">Ana Sayfa</div>
            <h1 className="text-2xl font-bold">
              Hoş geldiniz{sessionUser?.name ? `, ${sessionUser.name}` : ""}
            </h1>
            <div className="mt-1 text-sm text-slate-300">
              Rol: <span className="font-semibold text-slate-100">{loggedInRole}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="mb-3 text-sm font-semibold text-slate-100">Hızlı İşlemler</div>

                {loggedInRole === "driver" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/jobs"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">İlanları Gör</div>
                      <div className="mt-1 text-xs text-slate-400">Filtrele, incele, başvur</div>
                    </Link>

                    <Link
                      href="/driver/applications"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Başvurularım</div>
                      <div className="mt-1 text-xs text-slate-400">Durum, notlar, görüşme linki</div>
                    </Link>

                    <Link
                      href="/cv"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Profilim</div>
                      <div className="mt-1 text-xs text-slate-400">CV / kriter / lokasyon</div>
                    </Link>

                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Dashboard</div>
                      <div className="mt-1 text-xs text-slate-400">Rol ekranına git</div>
                    </Link>
                  </div>
                )}

                {loggedInRole === "employer" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/employer/dashboard"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">İşveren Dashboard</div>
                      <div className="mt-1 text-xs text-slate-400">İlanlar, talepler, başvurular</div>
                    </Link>

                    <Link
                      href="/jobs/new"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Yeni İlan Taslağı</div>
                      <div className="mt-1 text-xs text-slate-400">Taslak oluştur</div>
                    </Link>

                    <Link
                      href="/employer/job-requests/new"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">İlan Talebi (Paket)</div>
                      <div className="mt-1 text-xs text-slate-400">Paket seç → admin onayı</div>
                    </Link>

                    <Link
                      href="/employer/applications"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Başvurular</div>
                      <div className="mt-1 text-xs text-slate-400">Görüş/puan/renk/meeting</div>
                    </Link>

                    <Link
                      href="/employer/profile"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40 sm:col-span-2"
                    >
                      <div className="text-sm font-semibold">Firma Profili</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Firma adı, bilgiler, ilanlarda gösterim
                      </div>
                    </Link>
                  </div>
                )}

                {loggedInRole === "advertiser" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/advertiser/dashboard"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Reklamveren Dashboard</div>
                      <div className="mt-1 text-xs text-slate-400">Reklam kampanyaları</div>
                    </Link>

                    <Link
                      href="/advertiser/campaigns/new"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Yeni Reklam Kampanyası</div>
                      <div className="mt-1 text-xs text-slate-400">Kampanya oluştur</div>
                    </Link>

                    <Link
                      href="/advertiser/stats"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Reklam İstatistikleri</div>
                      <div className="mt-1 text-xs text-slate-400">Görünüm, tıklama, dönüşüm</div>
                    </Link>
                  </div>
                )}

                {loggedInRole === "admin" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/admin/dashboard"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Admin Dashboard</div>
                      <div className="mt-1 text-xs text-slate-400">Onaylar / yönetim</div>
                    </Link>

                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
                    >
                      <div className="text-sm font-semibold">Dashboard</div>
                      <div className="mt-1 text-xs text-slate-400">Rol ekranına git</div>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="text-sm font-semibold text-slate-100">Reklam</div>
                <div className="mt-3">
                  <AdSlot placement="HOME_RIGHT" country="TR" />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="text-sm font-semibold text-slate-100">Kısayollar</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <Link className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40" href="/jobs">
                    İlanlar
                  </Link>
                  <Link className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40" href="/cv">
                    Profil
                  </Link>
                  <Link className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40" href="/dashboard">
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-400">
            Not: Sosyal giriş (Google/Apple/Huawei) şu an sadece arayüzde. İsterseniz sıradaki adımda
            gerçek OAuth akışını ekleriz.
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Logged-out Landing + Auth
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 px-4">
      <div className="mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30" />
            <div>
              <div className="text-sm font-semibold leading-tight">DriverAll</div>
              <div className="text-[11px] text-slate-400 leading-tight">Sürücü işe alım platformu</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <Link className="rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 hover:bg-slate-900/40" href="/jobs">
              İlanlar
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-4 py-1 border border-slate-700/70 text-xs tracking-wide uppercase text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Sürücüler • İşverenler • Eğitim / Belge Çözümleri
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Sürücüler için doğru işi,
              <span className="block text-emerald-400">işverenler için doğru adayı</span>
              tek yerde bulun.
            </h1>

            <p className="mt-4 text-slate-300 text-sm md:text-base leading-relaxed">
              İlanları ara, kriterlere göre filtrele, başvuruları takip et. İşverenler için: kriter motoru ile hızlı eşleşme,
              adaylar için: mobil-first başvuru deneyimi.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
              <div className="text-xs font-semibold text-slate-100">İlan Ara</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <div className="text-[11px] text-slate-400">Anahtar kelime</div>
                  <input
                    className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                    placeholder="Örn: SRC, ADR, TIR"
                    value={homeQ}
                    onChange={(e) => setHomeQ(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-3">
                  <div className="text-[11px] text-slate-400">İl</div>
                  <div className="relative">
                    <input
                      className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder={homeCityLoading ? "Yükleniyor..." : "İl seç (yaz ve seç)"}
                      value={homeCityQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHomeCityQuery(v);
                        setHomeCityOpen(true);
                        if (!v.trim()) setHomeCityCode("");
                      }}
                      onFocus={() => setHomeCityOpen(true)}
                      onBlur={() => {
                        const typed = homeCityQuery.trim();
                        const selectedLabel = homeCityLabelByCode.get(String(homeCityCode).trim()) || "";

                        // Eğer kullanıcı listeden seçim yapmadıysa, serbest yazıyı bırakmayalım.
                        // - Seçili il varsa: seçili il etiketine geri dön.
                        // - Seçili il yoksa: input'u temizle.
                        if (typed) {
                          const typedNorm = typed.toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
                          const exact = (homeCityOptions || []).some((c: any) => {
                            const label = String(c?.name || c?.label || "")
                              .trim()
                              .toLocaleLowerCase("tr-TR")
                              .replace(/ı/g, "i");
                            const code = String(c?.code || c?.cityCode || "")
                              .trim()
                              .toLocaleLowerCase("tr-TR")
                              .replace(/ı/g, "i");
                            return label === typedNorm || code === typedNorm;
                          });

                          if (!exact) {
                            setHomeCityQuery(selectedLabel || "");
                          }
                        } else {
                          if (homeCityCode && selectedLabel) setHomeCityQuery(selectedLabel);
                        }

                        window.setTimeout(() => setHomeCityOpen(false), 120);
                      }}
                      disabled={homeCityLoading}
                    />

                    {homeCityOpen && homeCityQuery.trim() && (homeCityFiltered || []).length > 0 && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-lg">
                        <button
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-900/60"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setHomeCityCode("");
                            setHomeCityQuery("");
                            setHomeCityOpen(false);
                          }}
                        >
                          Tümü
                        </button>
                        {(homeCityFiltered || []).map((c: any) => {
                          const code = String(c?.code || c?.cityCode || "").trim();
                          const label = String(c?.name || c?.label || c?.code || "-").trim();
                          return (
                            <button
                              key={code || label}
                              type="button"
                              className="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-900/60"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setHomeCityCode(code);
                                setHomeCityQuery(label || code);
                                setHomeCityOpen(false);
                              }}
                            >
                              {label || code}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <div className="text-[11px] text-slate-400">Aday tipi</div>
                  <select
                    value={homeSubRoleKey}
                    onChange={(e) => setHomeSubRoleKey(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-3 text-sm text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                    disabled={homeSubRoleLoading}
                  >
                    <option value="">Tümü</option>
                    {(homeSubRoleOptions || []).map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => goSearch(homeQ, { cityCode: homeCityCode, subRoleKey: homeSubRoleKey })}
                    className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Ara
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => goSearch("SRC", { cityCode: homeCityCode, subRoleKey: homeSubRoleKey }) } className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-900/40">SRC</button>
                <button type="button" onClick={() => goSearch("ADR", { cityCode: homeCityCode, subRoleKey: homeSubRoleKey }) } className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-900/40">ADR</button>
                <button type="button" onClick={() => goSearch("TIR", { cityCode: homeCityCode, subRoleKey: homeSubRoleKey }) } className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-900/40">TIR</button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-slate-200">Popüler iller</div>
                  <Link href="/jobs" className="text-[11px] text-emerald-400 hover:text-emerald-300">Tüm ilanlar</Link>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {(statsTopCities || []).slice(0, 8).map((c: any) => {
                    const code = String(c?.cityCode || "").trim();
                    const label = String(c?.label || code || "-") || "-";
                    if (!code) return null;
                    return (
                      <Link
                        key={code}
                        href={`/jobs?cityCode=${encodeURIComponent(code)}`}
                        className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900/40"
                        title={label}
                      >
                        <span className="truncate max-w-[160px]">{label}</span>
                        <span className="ml-2 text-slate-500">{Number(c?.count || 0)}</span>
                      </Link>
                    );
                  })}

                  {(!statsTopCities || statsTopCities.length === 0) && !statsErr ? (
                    <span className="text-[11px] text-slate-500">Yükleniyor...</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                <div className="text-emerald-400 font-semibold mb-1">Kriter Motoru</div>
                <div className="text-slate-300">SRC, ADR, ehliyet, deneyim, lokasyon gibi kriterlerle doğru eşleşme.</div>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                <div className="text-emerald-400 font-semibold mb-1">Mobil Başvuru</div>
                <div className="text-slate-300">Adaylar için hızlı başvuru, takip ve belge hatırlatmaları.</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-4">
              <div className="text-xs font-semibold text-slate-100">İşverenler için hızlı başlangıç</div>
              <div className="mt-1 text-xs text-slate-300">
                İlan oluştur, onaya gönder, yayınla. Başvuruları tek panelden yönet.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/employer/jobs/new"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  İlan Oluştur
                </Link>
                <Link
                  href="/employer/job-requests/new"
                  className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/40"
                >
                  Paket ile Yayınla
                </Link>
                <Link
                  href="/packages"
                  className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/40"
                >
                  Paketleri Gör
                </Link>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-4">
              <div className="text-xs font-semibold text-slate-100">Adaylar için hızlı başlangıç</div>
              <div className="mt-1 text-xs text-slate-300">
                Profilini oluştur, ilanları filtrele, tek dokunuşla başvur.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/cv"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  Profilimi Oluştur
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/40"
                >
                  İlanları Keşfet
                </Link>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Öne Çıkan İlanlar</div>
                <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300">Tümünü gör</Link>
              </div>

              {featuredErr ? (
                <div className="mt-3 text-[11px] text-slate-400">İlanlar yüklenemedi.</div>
              ) : null}

              <div className="mt-3 space-y-2">
                {(featuredJobs || []).slice(0, 6).map((j: any) => (
                  <Link
                    key={String(j?._id)}
                    href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`}
                    className="block rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-900/40"
                  >
                    <div className="text-sm font-semibold text-slate-100 line-clamp-1">{String(j?.title || "İlan")}</div>
                    <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                      {String(j?.location?.label || j?.location?.cityCode || "Türkiye")}
                    </div>
                  </Link>
                ))}

                {(!featuredJobs || featuredJobs.length === 0) && !featuredErr ? (
                  <div className="text-[11px] text-slate-400">Henüz ilan yok. İlk ilanları görmek için İlanlar sayfasına geç.</div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">İlan Paketleri</div>
                <Link href="/packages" className="text-xs text-emerald-400 hover:text-emerald-300">Tümü</Link>
              </div>

              {packagesErr ? (
                <div className="mt-3 text-[11px] text-slate-400">Paketler yüklenemedi.</div>
              ) : null}

              <div className="mt-3 grid gap-2">
                {(publicPackages || []).slice(0, 6).map((p: any) => (
                  <div key={String(p?._id)} className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-100 line-clamp-1">{String(p?.name || "Paket")}</div>
                    <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                      {String(p?.country || "ALL")} • {String(p?.currency || "TRY")} {String(p?.price ?? "0")}
                      {p?.credits?.jobPostCount ? ` • ${String(p.credits.jobPostCount)} ilan` : ""}
                    </div>
                  </div>
                ))}

                {(!publicPackages || publicPackages.length === 0) && !packagesErr ? (
                  <div className="text-[11px] text-slate-400">Henüz paket yok.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-12">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Popüler İlanlar & Top İller</div>
                <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300">İlanlara git</Link>
              </div>

              {statsErr ? (
                <div className="mt-3 text-[11px] text-slate-400">İstatistikler yüklenemedi.</div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="text-xs text-slate-400">En popüler ilanlar (ilk 5)</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(statsTopJobs || []).slice(0, 5).map((j: any) => (
                      <Link
                        key={String(j?._id || "")}
                        href={`/jobs/${encodeURIComponent(String(j?._id || ""))}`}
                        className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                        title={String(j?.title || "")}
                      >
                        <span className="truncate max-w-[220px]">{String(j?.title || "İlan")}</span>
                        <span className="ml-2 text-slate-500">{Number(j?.applyCount || 0)}</span>
                      </Link>
                    ))}

                    {(!statsTopJobs || statsTopJobs.length === 0) && !statsErr ? (
                      <div className="text-[11px] text-slate-500">Henüz veri yok.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="text-xs text-slate-400">En çok ilan yayınlanan iller (ilk 5)</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(statsTopCities || []).slice(0, 5).map((c: any) => {
                      const cityCode = String(c?.cityCode || "");
                      const label = String(c?.label || cityCode || "-") || "-";
                      return (
                        <Link
                          key={cityCode || label}
                          href={`/jobs?cityCode=${encodeURIComponent(cityCode)}`}
                          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                          title={label}
                        >
                          <span className="truncate max-w-[220px]">{label}</span>
                          <span className="ml-2 text-slate-500">{Number(c?.count || 0)}</span>
                        </Link>
                      );
                    })}

                    {(!statsTopCities || statsTopCities.length === 0) && !statsErr ? (
                      <div className="text-[11px] text-slate-500">Henüz veri yok.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
              <div className="text-sm font-semibold">Nasıl Çalışır?</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-semibold text-emerald-400">1) Profil</div>
                  <div className="mt-1 text-xs text-slate-300">Konumunu ve aday tipini seç, CV’ni tamamla.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-semibold text-emerald-400">2) Filtre</div>
                  <div className="mt-1 text-xs text-slate-300">İl/kriter filtreleri ile doğru ilanları bul.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-semibold text-emerald-400">3) Başvur</div>
                  <div className="mt-1 text-xs text-slate-300">Başvurunu gönder, süreci panelden takip et.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
              <div className="text-sm font-semibold">Neden DriverAll?</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="font-semibold text-slate-100">Adaylar için</div>
                  <div className="mt-1 text-xs text-slate-300">Mobilde hızlı başvuru, CV yönetimi, belge tarihlerini kaçırmama.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="font-semibold text-slate-100">İşverenler için</div>
                  <div className="mt-1 text-xs text-slate-300">Kriterlere göre eşleşme, başvuru süreci yönetimi, görüşme takibi.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Sana Uygun İlanlar</div>
                  <div className="text-xs text-slate-400">İl/ilçe ve aday tipine göre hızlı öneriler</div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={smartSuggestEnabled}
                    onChange={(e) => setSmartSuggestEnabled(e.target.checked)}
                  />
                  Otomatik öner
                </label>
              </div>

              {smartSuggestEnabled ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {smartSuggestCityCode ? (
                    <Link
                      href={`/jobs?cityCode=${encodeURIComponent(smartSuggestCityCode)}`}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    >
                      İl filtresi
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-500">İl bilgisi için profilini güncelle.</span>
                  )}

                  {(smartSuggestSubRoles || []).slice(0, 4).map((sr) => (
                    <Link
                      key={sr}
                      href={`/jobs?subRole=${encodeURIComponent(sr)}${smartSuggestCityCode ? `&cityCode=${encodeURIComponent(smartSuggestCityCode)}` : ""}`}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    >
                      {sr}
                    </Link>
                  ))}

                  <div className="w-full" />
                  <div className="text-[11px] text-slate-400">
                    Not: İlanların kriter eşleşmesi ve reklam kişiselleştirme adımını sıradaki iterasyonda backend tarafına taşıyacağız.
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-[11px] text-slate-400">Kapalı. Hero arama ile manuel filtreleyebilirsin.</div>
              )}
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
              <div className="text-sm font-semibold text-slate-100">Mobil için hızlı giriş</div>
              <div className="mt-2 text-xs text-slate-400">
                Giriş/Kayıt artık üst menüde (popup). Mobilde tek tuş ile aç.
              </div>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-xs text-slate-300">İpucu</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Aday olarak kayıt olup il/ilçe ve aday tipini profilde doldurursan sana uygun ilanları öne çıkarırız.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pb-10 text-xs text-slate-400">
          Not: Sosyal giriş (Google/Apple/Huawei) şu an sadece arayüzde. İsterseniz sıradaki adımda
          gerçek OAuth akışını ekleriz.
        </div>
      </div>
    </div>
  );
}
