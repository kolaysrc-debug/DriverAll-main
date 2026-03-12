"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "driverall_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COOKIE_KEY);
      if (!v) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="mx-auto max-w-xl pointer-events-auto rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-sm p-4 shadow-2xl shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-xs text-slate-300 leading-relaxed flex-1">
            Bu site, deneyiminizi iyileştirmek için çerez ve yerel depolama kullanır.
            Devam ederek{" "}
            <Link href="/legal/privacy" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
              Gizlilik Politikamızı
            </Link>{" "}
            kabul etmiş olursunuz.
          </p>
          <button
            onClick={accept}
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
