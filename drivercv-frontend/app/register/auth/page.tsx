"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser, requestOtp, verifyOtp } from "@/lib/api/auth";
import { setSession } from "@/lib/session";

const AuthPageContent: React.FC = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const next = (sp?.get("next") || "").trim();

  const goAfterAuth = () => {
    if (next && next.startsWith("/")) {
      router.push(next);
      return;
    }
    router.push("/dashboard");
  };

  // Sekme: email mi, telefon mu?
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

  // Email akışı
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Telefon akışı (ileri için)
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // E-posta ile "giriş + yoksa otomatik kayıt" akışı
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1) Önce login dene
      try {
        const res = await loginUser({ email, password });

        if (res.token && res.user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", res.token);
            localStorage.setItem("user", JSON.stringify(res.user));
          }

          setSuccess("Giriş başarılı.");
          goAfterAuth();
          return;
        }
      } catch (loginErr: any) {
        // 403 = hesap bloklu/onay bekliyor → kullanıcıya göster
        // 500 = sunucu hatası → kullanıcıya göster
        const msg = String(loginErr?.message || "");
        if (msg.includes("pasif") || msg.includes("bloklu") || msg.includes("onay") || msg.includes("Sunucu hatası")) {
          throw loginErr;
        }
        // Diğer hatalar (400: "E-posta veya şifre hatalı" vs.) → kayıt dene
      }

      // 2) Buraya geldiysek: kullanıcı yok veya şifre uyuşmadı, kayıt dene
      const displayName = name.trim() || email.split("@")[0];

      try {
        const regRes = await registerUser({
          name: displayName,
          email,
          password,
          role: "driver",
        });

        if (!regRes.user) {
          throw new Error(regRes.message || "Kayıt sırasında beklenmeyen hata.");
        }

        // 3) Kayıttan sonra otomatik login
        const loginRes = await loginUser({ email, password });

        if (loginRes.token && loginRes.user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", loginRes.token);
            localStorage.setItem("user", JSON.stringify(loginRes.user));
          }

          setSuccess("Kayıt ve giriş başarılı.");
          goAfterAuth();
        } else {
          throw new Error("Giriş beklenmedik bir şekilde başarısız oldu.");
        }
      } catch (regErr: any) {
        const regMsg = String(regErr?.message || "");
        if (regMsg.includes("zaten bir hesap var") || regMsg.includes("already")) {
          throw new Error("Bu e-posta ile kayıtlı hesap var. Lütfen şifrenizi kontrol edin veya 'Şifremi unuttum' bağlantısını kullanın.");
        }
        throw regErr;
      }
    } catch (err: any) {
      setError(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (otpStep === "request") {
        await requestOtp({ phone: String(phone || "").trim(), channel: "sms" });
        setOtpStep("verify");
        setSuccess("Kod gönderildi.");
        return;
      }

      const res = await verifyOtp({ phone: String(phone || "").trim(), code: String(otpCode || "").trim() });

      if (res.token && res.user) {
        if (typeof window !== "undefined") {
          try {
            setSession(String(res.token), res.user);
          } catch {
            // ignore
          }
          window.localStorage.setItem("token", String(res.token));
          window.localStorage.setItem("user", JSON.stringify(res.user));
        }
        setSuccess("Giriş başarılı.");
        goAfterAuth();
        return;
      }

      throw new Error(res.message || "Giriş beklenmedik bir şekilde başarısız oldu.");
    } catch (err: any) {
      setError(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Google / Apple butonları (UI hazır, backend sonra)
  const handleGoogle = () => {
    setError("Google ile giriş için OAuth ayarları henüz yapılmadı.");
  };

  const handleApple = () => {
    setError("Apple ile giriş için OAuth ayarları henüz yapılmadı.");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 8,
    marginTop: 4,
    backgroundColor: "#ffffff",
    color: "#000000",
    borderRadius: 4,
    border: "1px solid #ccc",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-2xl shadow-black/40 p-6 md:p-8 backdrop-blur">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          DriverAll&apos;a Hoş Geldiniz
        </h1>
        <p className="text-slate-300 text-sm mb-6">
          Tek bir ekrandan kayıt ol veya giriş yap. Google, Apple, e-posta veya
          telefon ile devam et.
        </p>

        {/* Sekmeler: Email / Telefon */}
        <div className="flex mb-4 text-xs border-b border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`px-3 py-2 border-b-2 ${
              activeTab === "email"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400"
            }`}
          >
            E-posta ile devam et
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={`px-3 py-2 border-b-2 ${
              activeTab === "phone"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400"
            }`}
          >
            Telefon ile devam et
          </button>
        </div>

        {/* Email formu */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-200">
                Ad Soyad (isteğe bağlı)
              </label>
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-200">
                E-posta
              </label>
              <input
                type="email"
                placeholder="ornek@driverall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-200">
                Şifre
              </label>
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-2.5 transition shadow-lg shadow-emerald-500/30"
            >
              {loading ? "İşleniyor..." : "Devam et (Giriş / Kayıt)"}
            </button>

            <div className="text-center mt-2">
              <a href="/reset-password" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
                Şifremi unuttum
              </a>
            </div>

            {/* Sosyal Giriş Butonları */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-slate-400">veya</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <a
                  href="/api/auth/google"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3.5 text-sm font-medium text-slate-200 transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </a>

                <a
                  href="/api/auth/yandex"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3.5 text-sm font-medium text-slate-200 transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FC3F1D">
                    <path d="M13.04 2h-2.08C7.65 2 5.5 4.15 5.5 7.46v3.08h-2v3.69h2V22h3.69v-7.77h2.46l.38-3.69h-2.84V7.69c0-.77.15-1.08.92-1.08h1.92V2z"/>
                  </svg>
                  Yandex
                </a>

                <a
                  href="/api/auth/apple"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3.5 text-sm font-medium text-slate-200 transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </a>
              </div>
            </div>
          </form>
        )}

        {/* Telefon formu (şimdilik pasif) */}
        {activeTab === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-200">
                Telefon Numarası
              </label>
              <input
                type="tel"
                placeholder="+90 5XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {otpStep === "verify" && (
              <div>
                <label className="text-xs font-medium text-slate-200">Doğrulama Kodu</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-2.5 transition shadow-lg shadow-emerald-500/30"
            >
              {loading
                ? "İşleniyor..."
                : otpStep === "request"
                  ? "Kod Gönder"
                  : "Kodu Doğrula"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-xs text-emerald-300">
            {success}
          </p>
        )}

        <p className="mt-6 text-[11px] text-center text-slate-500">
          Kayıt olduğunda DriverAll kullanım şartları ve KVKK metinlerini kabul etmiş
          olursun.
        </p>
      </div>
    </div>
  );
};

const AuthPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 flex items-center justify-center px-4">Yükleniyor...</div>}>
      <AuthPageContent />
    </Suspense>
  );
};

export default AuthPage;
