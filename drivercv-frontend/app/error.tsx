"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Bir Hata Oluştu</h1>
        <p className="text-sm text-slate-400 mb-6">
          Beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          onClick={reset}
          className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
