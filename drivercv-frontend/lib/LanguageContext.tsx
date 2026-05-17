"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { detectLang, getT, Lang, LANG_LABELS, LANG_NAMES, saveLang, TKey } from "./i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, fallback?: string) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: "tr",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
  }, []);

  const t = useCallback((key: TKey, fallback?: string) => getT(lang)(key, fallback), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// ─── Dil Değiştirici Buton ────────────────────────────────────────────────────
export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
        style={{ border: "1px solid var(--da-border-med)", color: "var(--da-text-2)", backgroundColor: "var(--da-bg-card)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--da-border-str)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--da-border-med)"; }}
        aria-label="Change language"
      >
        <span>🌐</span>
        <span>{LANG_LABELS[lang]}</span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-50 min-w-[130px] rounded-xl p-1.5 shadow-2xl"
          style={{ border: "1px solid var(--da-border-med)", backgroundColor: "var(--da-bg-card-2)" }}
        >
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLang(l); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition"
              style={{
                color: lang === l ? "var(--da-blue-hover)" : "var(--da-text-2)",
                backgroundColor: lang === l ? "var(--da-blue-dim)" : "transparent",
              }}
              onMouseEnter={e => { if (lang !== l) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.07)"; }}
              onMouseLeave={e => { if (lang !== l) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <span className="w-6 text-center font-bold">{LANG_LABELS[l]}</span>
              <span>{LANG_NAMES[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
