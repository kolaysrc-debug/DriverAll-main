// PATH: DriverAll-main/drivercv-frontend/app/jobs/[id]/page.tsx
// ----------------------------------------------------------
// Public Job Detail Page
// + Driver logged in ise başvuru alanı
// ----------------------------------------------------------

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPublicJobById } from "@/lib/api/publicJobs";
import { applyToJob } from "@/lib/api/applications";

type JobOwner =
  | string
  | {
      _id?: string;
      name?: string;
      email?: string;
    };

type Job = {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  country?: string;
  location?: {
    countryCode?: string;
    cityCode?: string;
    cityName?: string;
    stateName?: string;
  };
  criteria?: Record<string, any>;
  createdAt?: string;
  publishedAt?: string | null;

  // ✅ Backend populate ederse burada name+email gelir
  employerUserId?: JobOwner | null;
};

type StoredUser = { role?: string; email?: string; name?: string };

function readUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

function getOwnerLabel(owner?: JobOwner | null) {
  if (!owner) return "-";
  if (typeof owner === "string") return owner; // eski veri/populate yoksa en azından id görünsün
  const name = String(owner.name || "").trim();
  const email = String(owner.email || "").trim();
  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  if (owner._id) return String(owner._id);
  return "-";
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = String((params as any)?.id || "");

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // apply UI
  const [note, setNote] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  const user = useMemo(() => readUser(), []);
  const token = useMemo(() => readToken(), []);

  const canApply = Boolean(token) && String(user?.role || "") === "driver";

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      setJob(null);

      if (!id) {
        setErr("İlan ID bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicJobById(id);
        if (!alive) return;

        const j = data?.job || null;
        setJob(j);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "İlan alınamadı.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function onApply() {
    if (!id) return;
    setApplyLoading(true);
    setApplyMsg(null);

    try {
      const data = await applyToJob(id, { note });
      if (data?.alreadyApplied) {
        setApplyMsg(data?.message || "Bu ilana zaten başvurmuşsunuz.");
      } else {
        setApplyMsg("Başvurunuz alındı. ‘Başvurularım’ ekranından takip edebilirsiniz.");
        setNote("");
      }
    } catch (e: any) {
      setApplyMsg(e?.message || "Başvuru gönderilemedi.");
    } finally {
      setApplyLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-slate-100">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
        >
          Geri
        </button>

        {canApply ? (
          <button
            type="button"
            onClick={() => router.push("/driver/applications")}
            className="text-xs px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800"
          >
            Başvurularım
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">Yükleniyor...</p>
        </div>
      ) : err ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-4">
          <p className="text-sm text-red-200">{err}</p>
          <p className="mt-2 text-xs text-slate-400">
            Not: Bu ilan taslak/arşiv olabilir veya yayından kaldırılmış olabilir.
          </p>
        </div>
      ) : !job ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">İlan bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">{job.title || "(Başlıksız)"}</h1>

                <p className="mt-1 text-xs text-slate-400">
                  {job.country || job.location?.countryCode || "-"}
                  {job.location?.cityName ? ` • ${job.location.cityName}` : ""}
                  {job.status ? ` • status: ${job.status}` : ""}
                </p>

                {/* ✅ ilan sahibi */}
                <p className="mt-1 text-xs text-slate-400">
                  İlan sahibi: <span className="text-slate-200">{getOwnerLabel(job.employerUserId)}</span>
                </p>
              </div>

              {job.status ? (
                <span className="text-xs px-2 py-1 rounded bg-slate-800">{job.status}</span>
              ) : null}
            </div>

            {job.description ? (
              <div className="text-sm text-slate-200 whitespace-pre-line">{job.description}</div>
            ) : (
              <div className="text-sm text-slate-400">Açıklama yok.</div>
            )}

            {job.criteria && Object.keys(job.criteria).length > 0 ? (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">Kriterler</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(job.criteria)
                    .filter(([, v]) => Boolean(v))
                    .slice(0, 50)
                    .map(([k]) => (
                      <span
                        key={k}
                        className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-950"
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Başvuru Alanı */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-sm font-semibold text-slate-100">Başvuru</div>

            {!token ? (
              <div className="mt-2 text-sm text-slate-300">
                Başvurmak için giriş yapmalısınız.{" "}
                <button className="underline text-sky-300" onClick={() => router.push("/login")}>
                  Giriş
                </button>
              </div>
            ) : String(user?.role || "") !== "driver" ? (
              <div className="mt-2 text-sm text-slate-300">Başvuru sadece sürücü hesabı ile yapılabilir.</div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-slate-400">
                  İsterseniz bu ilana dair kısa bir “görüş” yazın (ihtiyaç, beklenti, uygunluk vb.).
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                  placeholder="Örn: Uzun yol deneyimim var, ADR Tank mevcut, 2 hafta/1 hafta rota uygundur..."
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onApply}
                    disabled={applyLoading}
                    className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
                  >
                    {applyLoading ? "Gönderiliyor..." : "Başvur"}
                  </button>
                  {applyMsg ? <div className="text-sm text-slate-200">{applyMsg}</div> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
