"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, requestOtp, verifyOtp } from "@/lib/api/auth";
import { setSession } from "@/lib/session";

const AuthPage: React.FC = () => {
  const router = useRouter();

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
          // Profil doldurmaya yönlendirme
          router.push("/cv");
          return;
        }
      } catch (err: any) {
        // Login hata verdiyse kontrol et
        if (!err.message?.includes("Kullanıcı bulunamadı")) {
          // Kullanıcı var ama şifre yanlış vs.
          throw err;
        }
        // Eğer "Kullanıcı bulunamadı" ise -> arkada kayıt + login yapacağız
      }

      // 2) Buraya geldiysek: kullanıcı yok, otomatik kayıt et
      const displayName = name.trim() || email.split("@")[0];

      const regRes = await registerUser({
        name: displayName,
        email,
        password,
        role: "driver", // varsayılan rol
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
        router.push("/cv");
      } else {
        throw new Error("Giriş beklenmedik bir şekilde başarısız oldu.");
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
        router.push("/cv");
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

        {/* Sosyal butonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-xs">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/40 py-2 hover:bg-slate-900 transition"
          >
            Google ile devam et
          </button>
          <button
            type="button"
            onClick={handleApple}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/40 py-2 hover:bg-slate-900 transition"
          >
            Apple ile devam et
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="h-px flex-1 bg-slate-700" />
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            veya
          </span>
          <span className="h-px flex-1 bg-slate-700" />
        </div>

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

export default AuthPage;
