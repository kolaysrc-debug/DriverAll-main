"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/applications/page.tsx
// ----------------------------------------------------------
// Employer Applications — modern kart tabanlı tasarım
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
  try { return new Date(iso).toLocaleString("tr-TR"); } catch { return iso; }
}

const labelOptions: LabelColor[] = ["none", "red", "yellow", "orange", "green"];

const LABEL_BADGE: Record<string, { label: string; cls: string }> = {
  none:   { label: "Etiketsiz", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  red:    { label: "Kırmızı",  cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  yellow: { label: "Sarı",     cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  orange: { label: "Turuncu",  cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  green:  { label: "Yeşil",    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  reviewed: { label: "İncelendi", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  accepted: { label: "Kabul",     cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Red",       cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export default function EmployerApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<DriverApplication[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    const arr = [...apps];
    arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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
      const updated = await updateApplication(appId, { score, employerNote, labelColor, meetingUrl });
      setApps((prev) => prev.map((x) => (x._id === appId ? { ...x, ...updated } : x)));
    } catch (e: any) {
      setError(e?.message || "Güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <RoleGate allowRoles={["employer", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Gelen Başvurular</h1>
                <p className="text-xs text-slate-400 mt-0.5">Adayları puanlayın, etiketleyin, görüşme planlayın</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <button onClick={load} disabled={loading} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50">Yenile</button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {error}
            </div>
          )}

          {/* Count */}
          <div className="text-xs text-slate-500">{sorted.length} başvuru</div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          )}

          {/* Empty */}
          {!loading && sorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-slate-400 text-sm">Henüz başvuru almadınız.</div>
              <div className="mt-1 text-xs text-slate-500">İlan oluşturduğunuzda adaylar başvurmaya başlayacak.</div>
            </div>
          )}

          {/* Application Cards */}
          {!loading && sorted.length > 0 && (
            <div className="space-y-3">
              {sorted.map((a) => {
                const jobTitle = a?.job?.title || "(ilan başlığı yok)";
                const driverName = a?.driver?.name || "(aday adı yok)";
                const driverEmail = a?.driver?.email || "";
                const driverNote = clampText(a?.note || "", 420);
                const labelBadge = LABEL_BADGE[(labelMap[a._id] || a.labelColor || "none")] || LABEL_BADGE.none;
                const statusKey = String(a.status || "pending").toLowerCase();
                const statusBdg = STATUS_BADGE[statusKey] || STATUS_BADGE.pending;
                const isExpanded = expandedId === a._id;

                return (
                  <div
                    key={a._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors overflow-hidden"
                  >
                    {/* Summary Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : a._id)}
                      className="w-full text-left px-4 py-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-100 truncate">{jobTitle}</span>
                            <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBdg.cls}`}>
                              {statusBdg.label}
                            </span>
                            {(labelMap[a._id] || a.labelColor) && (labelMap[a._id] || a.labelColor) !== "none" && (
                              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${labelBadge.cls}`}>
                                {labelBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                            <span>
                              <span className="text-slate-200">{driverName}</span>
                              {driverEmail && <span className="text-slate-500"> • {driverEmail}</span>}
                            </span>
                            <span className="text-slate-500">{fmtDate(a.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.score != null && (
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                              Puan: {a.score}
                            </span>
                          )}
                          <svg className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 px-4 py-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Driver Note */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                            <div className="text-xs font-semibold text-slate-300 mb-2">Aday Notu</div>
                            <div className="text-xs text-slate-200 whitespace-pre-wrap min-h-[3rem]">
                              {driverNote || <span className="text-slate-500 italic">Aday not bırakmamış.</span>}
                            </div>
                          </div>

                          {/* Employer Evaluation */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                            <div className="text-xs font-semibold text-slate-300">Değerlendirme</div>

                            <div className="grid gap-2 grid-cols-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Etiket</label>
                                <select
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-emerald-600/50"
                                  value={labelMap[a._id] || "none"}
                                  onChange={(e) => setLabelMap((p) => ({ ...p, [a._id]: e.target.value as LabelColor }))}
                                >
                                  {labelOptions.map((x) => (
                                    <option key={x} value={x}>{LABEL_BADGE[x]?.label || x}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Puan (0–100)</label>
                                <input
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-emerald-600/50"
                                  value={scoreMap[a._id] ?? ""}
                                  onChange={(e) => setScoreMap((p) => ({ ...p, [a._id]: e.target.value }))}
                                  placeholder="75"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Görüşme</label>
                                <input
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-emerald-600/50"
                                  value={meetMap[a._id] ?? ""}
                                  onChange={(e) => setMeetMap((p) => ({ ...p, [a._id]: e.target.value }))}
                                  placeholder="URL"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">İşveren Notu</label>
                              <textarea
                                className="w-full min-h-[60px] rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-emerald-600/50"
                                value={noteMap[a._id] ?? ""}
                                onChange={(e) => setNoteMap((p) => ({ ...p, [a._id]: e.target.value }))}
                                placeholder="Kısa değerlendirme…"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              {(meetMap[a._id] || "").trim() && (
                                <a
                                  href={(meetMap[a._id] || "").trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800 transition-colors"
                                >
                                  Linki aç ↗
                                </a>
                              )}
                              <button
                                onClick={() => save(a._id)}
                                disabled={savingId === a._id}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                              >
                                {savingId === a._id ? "Kaydediliyor…" : "Kaydet"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/employer/jobs" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">İlanlar</Link>
              <Link href="/employer/applications" className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-2 py-2 text-center text-[11px] font-medium text-emerald-300">Başvurular</Link>
              <Link href="/employer/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </RoleGate>
  );
}
