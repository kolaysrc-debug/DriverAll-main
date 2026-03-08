"use client";

// PATH: DriverAll-main/drivercv-frontend/app/page.tsx
// ----------------------------------------------------------
// Home (Landing + Auth Consolidation)
// - Giriş/Kayıt tek ekranda (sekme ile)
// - /login ve /register sayfaları buraya redirect eder
// - Kayıtta rol seçimi: driver | employer (admin/advertiser yok)
// - Auth ok -> token/user localStorage + driverall-auth-changed
// - Başarılı işlem -> /dashboard (rol yönlendirme tek merkez)
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser, requestOtp, verifyOtp } from "@/lib/api/auth";
import { setSession } from "@/lib/session";
import AdSlot from "@/components/AdSlot";

type UserRole = "driver" | "employer" | "admin";

type StoredUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
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
  const token = window.localStorage.getItem("token") || window.localStorage.getItem("driverall_token");
  const userRaw = window.localStorage.getItem("user") || window.localStorage.getItem("driverall_user");
  const user = safeParseJson<StoredUser>(userRaw);
  return { token, user };
}

function normalizeRole(r: any): UserRole {
  const v = String(r || "").toLowerCase();
  if (v === "admin") return "admin";
  if (v === "employer") return "employer";
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

  const [loginMethod, setLoginMethod] = useState<"password" | "phone">("password");
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // /login ve /register redirect ile gelindiyse tab güncelle
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "login") {
      setLoginMethod("password");
      setPhone("");
      setOtpStep("request");
      setOtpCode("");
      return;
    }

    setPhone((p) => String(p || ""));
    setOtpStep("request");
    setOtpCode("");
  }, [mode, loginMethod]);

  const loggedInRole = useMemo<UserRole>(() => normalizeRole(sessionUser?.role), [sessionUser]);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (mode === "login" && loginMethod === "phone") {
      if (!String(phone || "").trim()) {
        setError("Lütfen telefon numaranızı girin.");
        return;
      }

      if (otpStep === "verify" && !String(otpCode || "").trim()) {
        setError("Lütfen doğrulama kodunu girin.");
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError("Lütfen e-posta ve şifreyi girin.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "login" && loginMethod === "phone") {
        if (otpStep === "request") {
          await requestOtp({ phone: String(phone || "").trim(), channel: "sms" });
          setOtpStep("verify");
          setSuccess("Kod gönderildi.");
          return;
        }

        const res = await verifyOtp({
          phone: String(phone || "").trim(),
          code: String(otpCode || "").trim(),
        });

        if (res?.token) {
          if (typeof window !== "undefined") {
            try {
              setSession(String(res.token), (res.user || {}) as any);
            } catch {
              // ignore
            }
          }

          setSuccess("Giriş başarılı. Yönlendiriliyorsunuz...");

          if (nextUrl) router.replace(nextUrl);
          else router.replace("/dashboard");
          return;
        }

        throw new Error(res?.message || "Doğrulama başarısız.");
      }

      if (mode === "register") {
        const regName = (name || "").trim() || email.split("@")[0] || "Yeni Kullanıcı";
        const res = await registerUser({
          name: regName,
          email: email.trim(),
          password,
          role, // sadece driver|employer
        });

        if (res?.token && typeof window !== "undefined") setSession(String(res.token), (res.user || {}) as any);

        setSuccess("Kayıt başarılı. Yönlendiriliyorsunuz...");
        router.replace("/dashboard");
        return;
      }

      // login
      const data = await loginUser({ email: email.trim(), password });

      if (typeof window !== "undefined" && data?.token) setSession(String(data.token), (data.user || {}) as any);

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
                      href="/profile"
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
                  <Link className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40" href="/profile">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Sol taraf – slogan ve açıklama */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-4 py-1 border border-slate-700/70 text-xs tracking-wide uppercase text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            DriverAll • İK Platformu
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            <span className="block">DriverAll&apos;a Hoş Geldiniz</span>
            <span className="mt-2 block text-emerald-400">
              Sürücüler ve lojistik firmaları için
            </span>
          </h1>

          {/* HOME TOP reklam slotu */}
          <div className="pt-1">
            <AdSlot placement="HOME_TOP" country="TR" />
          </div>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Tek bir platform üzerinden sürücü profillerini yönetin, ilanlarınızı yayınlayın,
            kriter motoru ile eşleştirin ve başvuruları süreç halinde takip edin.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="text-emerald-400 font-semibold mb-1">Kriter Motoru</div>
              <div className="text-slate-300">
                SRC, ADR, ehliyet, deneyim, lokasyon gibi kriterlerle doğru eşleşme.
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="text-emerald-400 font-semibold mb-1">Başvuru Süreci</div>
              <div className="text-slate-300">
                Görüş, puan, renk, meeting linki ile profesyonel takip.
              </div>
            </div>
          </div>
        </div>

        {/* Sağ taraf – Auth Panel (tek ekran) */}
        <div className="bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-2xl shadow-black/40 p-6 md:p-8 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-semibold">Giriş / Kayıt</h2>

            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-md px-3 py-1.5 ${mode === "login" ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:text-slate-100"}`}
              >
                Giriş
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-md px-3 py-1.5 ${mode === "register" ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:text-slate-100"}`}
              >
                Kayıt
              </button>
            </div>
          </div>

          <p className="mt-2 text-slate-300 text-sm">
            {mode === "login"
              ? "Hesabınızla giriş yapın."
              : "Hızlı kayıt ile hesap oluşturun. Rolünüzü seçin (Sürücü veya İşveren)."}
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {mode === "register" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-200">Ad / Firma Yetkilisi</label>
                  <input
                    className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                    placeholder="Ad Soyad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-200">Rol</label>
                  <select
                    className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                    value={role}
                    onChange={(e) => setRole(normalizeRole(e.target.value))}
                  >
                    <option value="driver">Aday / Sürücü</option>
                    <option value="employer">İşveren (İlan Veren)</option>
                  </select>
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Giriş Yöntemi</label>
                <div className="inline-flex w-full rounded-lg border border-slate-700 bg-slate-950/40 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("password")}
                    className={`flex-1 rounded-md px-3 py-1.5 ${loginMethod === "password" ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:text-slate-100"}`}
                  >
                    Şifre
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`flex-1 rounded-md px-3 py-1.5 ${loginMethod === "phone" ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:text-slate-100"}`}
                  >
                    Telefon (OTP)
                  </button>
                </div>
              </div>
            )}

            {(mode === "register" || (mode === "login" && loginMethod === "password")) && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">E-posta</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="ornek@driverall.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            {mode === "login" && loginMethod === "phone" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Telefon</label>
                <input
                  type="tel"
                  required
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="+90 5XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            )}

            {mode === "login" && loginMethod === "phone" && otpStep === "verify" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Doğrulama Kodu</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
            )}

            {(mode === "register" || (mode === "login" && loginMethod === "password")) && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Şifre</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`w-full inline-flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                mode === "register"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "bg-sky-600 hover:bg-sky-500 text-white"
              }`}
            >
              {busy
                ? mode === "register"
                  ? "Kayıt yapılıyor..."
                  : "İşleniyor..."
                : mode === "register"
                  ? "Kayıt Ol"
                  : loginMethod === "phone"
                    ? otpStep === "request"
                      ? "Kod Gönder"
                      : "Kodu Doğrula"
                    : "Giriş Yap"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-300 bg-red-950/30 border border-red-800/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-700/60 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px flex-1 bg-slate-700" />
              <span className="text-[10px] uppercase tracking-wide text-slate-400">sosyal giriş (yakında)</span>
              <span className="h-px flex-1 bg-slate-700" />
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/40 py-2 opacity-60"
              >
                Google ile devam et
              </button>
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/40 py-2 opacity-60"
              >
                Apple ile devam et
              </button>
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/40 py-2 opacity-60"
              >
                Huawei ile devam et
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-center text-slate-400">
            {mode === "login" ? (
              <>
                Hesabın yoksa{" "}
                <button type="button" onClick={() => setMode("register")} className="text-emerald-400 hover:text-emerald-300 font-medium">
                  kayıt ol
                </button>
                .
              </>
            ) : (
              <>
                Zaten hesabın varsa{" "}
                <button type="button" onClick={() => setMode("login")} className="text-emerald-400 hover:text-emerald-300 font-medium">
                  giriş yap
                </button>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
