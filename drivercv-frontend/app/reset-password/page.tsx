"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "code" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setErr("E-posta zorunludur."); return; }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Bir hata oluştu."); return; }
      setStep("code");
    } catch {
      setErr("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setErr("Kod zorunludur."); return; }
    if (newPassword.length < 6) { setErr("Şifre en az 6 karakter olmalıdır."); return; }
    if (newPassword !== confirmPassword) { setErr("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Bir hata oluştu."); return; }
      setStep("done");
    } catch {
      setErr("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30 transition-colors";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-100">
              {step === "email" && "Şifremi Unuttum"}
              {step === "code" && "Şifre Sıfırlama"}
              {step === "done" && "Başarılı!"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {step === "email" && "E-posta adresinize bir sıfırlama kodu göndereceğiz."}
              {step === "code" && "E-postanıza gelen 6 haneli kodu girin."}
              {step === "done" && "Şifreniz başarıyla güncellendi."}
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 mb-4 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}

          {/* Step: Email */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">E-posta</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="ornek@email.com"
                  type="email"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Gönderiliyor..." : "Kod Gönder"}
              </button>
            </form>
          )}

          {/* Step: Code + New Password */}
          {step === "code" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">Sıfırlama Kodu</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${inputCls} text-center text-lg tracking-[0.3em] font-bold`}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Yeni Şifre</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                  placeholder="En az 6 karakter"
                  type="password"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Şifre Tekrar</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                  placeholder="Şifreyi tekrar girin"
                  type="password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sıfırlanıyor..." : "Şifreyi Sıfırla"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setErr(null); }}
                className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Farklı e-posta dene
              </button>
            </form>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✓</div>
              <button
                onClick={() => router.push("/register/auth")}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Giriş Yap
              </button>
            </div>
          )}

          {/* Footer link */}
          {step !== "done" && (
            <div className="mt-6 text-center">
              <Link href="/register/auth" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
                Giriş sayfasına dön
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
