"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/applications/page.tsx
// ----------------------------------------------------------
// Employer Applications
// - İşverene gelen başvuruları listeler
// - employerNote + labelColor + score + meetingUrl güncellenir
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import {
  listEmployerApplications,
  updateApplication,
  DriverApplication,
  LabelColor,
} from "@/lib/api/applications";

function clampText(s: string, max: number) {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR");
  } catch {
    return iso;
  }
}

const labelOptions: LabelColor[] = ["none", "red", "yellow", "orange", "green"];

export default function EmployerApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<DriverApplication[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Local edit states
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [labelMap, setLabelMap] = useState<Record<string, LabelColor>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, string>>({});
  const [meetMap, setMeetMap] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await listEmployerApplications();
      setApps(Array.isArray(list) ? list : []);

      // init maps
      const n: Record<string, string> = {};
      const l: Record<string, LabelColor> = {};
      const s: Record<string, string> = {};
      const m: Record<string, string> = {};

      for (const a of list || []) {
        if (!a?._id) continue;
        n[a._id] = (a.employerNote || "").toString();
        l[a._id] = (a.labelColor || "none") as LabelColor;
        s[a._id] = a.score == null ? "" : String(a.score);
        m[a._id] = (a.meetingUrl || "").toString();
      }

      setNoteMap(n);
      setLabelMap(l);
      setScoreMap(s);
      setMeetMap(m);
    } catch (e: any) {
      setError(e?.message || "Başvurular alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => {
    const arr = [...apps]; // burada kesinlikle [...apps] olmalı
    arr.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
    return arr;
  }, [apps]);

  async function save(appId: string) {
    setSavingId(appId);
    setError(null);

    const rawScore = (scoreMap[appId] || "").trim();
    let score: number | null = null;
    if (rawScore !== "") {
      const n = Number(rawScore);
      score = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
    }

    const employerNote = clampText(noteMap[appId] || "", 420);
    const labelColor = (labelMap[appId] || "none") as LabelColor;
    const meetingUrl = (meetMap[appId] || "").trim();

    try {
      const updated = await updateApplication(appId, {
        score,
        employerNote,
        labelColor,
        meetingUrl,
      });

      setApps((prev) =>
        prev.map((x) => (x._id === appId ? { ...x, ...updated } : x))
      );
    } catch (e: any) {
      setError(e?.message || "Güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <RoleGate roles={["employer", "admin"]}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Gelen Başvurular</h1>
            <div className="text-xs text-slate-400">
              Adayları puanlayın, renk etiketi verin, görüşme linki gönderin.
            </div>
          </div>

          <Link
            href="/employer/dashboard"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-300">Yükleniyor…</div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            Şu an başvuru yok.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const jobTitle = a?.job?.title || "(ilan başlığı yok)";
              const driverName = a?.driver?.name || "(aday adı yok)";
              const driverEmail = a?.driver?.email || "";
              const driverNote = clampText(a?.note || "", 420);

              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-50">
                        {jobTitle}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Aday:{" "}
                        <span className="text-slate-200">{driverName}</span>
                        {driverEmail ? (
                          <span className="text-slate-500"> • {driverEmail}</span>
                        ) : null}
                        {" • "}
                        Başvuru: {fmtDate(a.createdAt)}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      Durum: <span className="text-slate-200">{a.status}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Aday Görüşü (Kısa)
                      </div>
                      <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                        {driverNote ? driverNote : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">
                        (Driver notunu kısa tutuyoruz; 3–4 cümle ideal.)
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Değerlendirme (İşveren)
                      </div>

                      <div className="mt-2 grid gap-2">
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Renk etiketi
                            </label>
                            <select
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
                              value={labelMap[a._id] || "none"}
                              onChange={(e) =>
                                setLabelMap((p) => ({
                                  ...p,
                                  [a._id]: e.target.value as LabelColor,
                                }))
                              }
                            >
                              {labelOptions.map((x) => (
                                <option key={x} value={x}>
                                  {x}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Puan (0–100)
                            </label>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
                              value={scoreMap[a._id] ?? ""}
                              onChange={(e) =>
                                setScoreMap((p) => ({
                                  ...p,
                                  [a._id]: e.target.value,
                                }))
                              }
                              placeholder="örn: 75"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Görüşme linki
                            </label>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
                              value={meetMap[a._id] ?? ""}
                              onChange={(e) =>
                                setMeetMap((p) => ({
                                  ...p,
                                  [a._id]: e.target.value,
                                }))
                              }
                              placeholder="Google Meet / URL"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400">
                            İşveren notu (kısa)
                          </label>
                          <textarea
                            className="mt-1 min-h-[84px] w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
                            value={noteMap[a._id] ?? ""}
                            onChange={(e) =>
                              setNoteMap((p) => ({
                                ...p,
                                [a._id]: e.target.value,
                              }))
                            }
                            placeholder="Kısa değerlendirme: 3–4 cümle."
                          />
                          <div className="mt-1 text-[11px] text-slate-500">
                            (Sistem kalite puanı daha sonra eklenecek; bu alan işveren puanı/notu.)
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {(meetMap[a._id] || "").trim() ? (
                            <a
                              href={(meetMap[a._id] || "").trim()}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
                            >
                              Linki aç
                            </a>
                          ) : null}

                          <button
                            onClick={() => save(a._id)}
                            disabled={savingId === a._id}
                            className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
                          >
                            {savingId === a._id ? "Kaydediliyor…" : "Kaydet"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
