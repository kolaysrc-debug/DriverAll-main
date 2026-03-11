"use client";

// PATH: drivercv-frontend/app/admin/commit-logs/page.tsx
// ----------------------------------------------------------
// Admin — Commit İzleme Sayfası (Timeline)
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { authHeaders } from "@/lib/api/_core";

type CommitLog = {
  _id: string;
  hash: string;
  message: string;
  committedAt: string;
  summary: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  tags: string[];
  notes: string;
  buildStatus: "unknown" | "pass" | "fail";
  tsStatus: "unknown" | "pass" | "fail";
  author: string;
  adminReviewed: boolean;
  adminNote: string;
  createdAt?: string;
};

type StatusVal = "unknown" | "pass" | "fail";
type FormData = {
  hash: string;
  message: string;
  committedAt: string;
  summary: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  tags: string[];
  notes: string;
  buildStatus: StatusVal;
  tsStatus: StatusVal;
  author: string;
  adminReviewed: boolean;
  adminNote: string;
};

const empty: FormData = {
  hash: "",
  message: "",
  committedAt: new Date().toISOString().slice(0, 16),
  summary: "",
  filesChanged: 0,
  insertions: 0,
  deletions: 0,
  tags: [],
  notes: "",
  buildStatus: "unknown",
  tsStatus: "unknown",
  author: "Cascade AI",
  adminReviewed: false,
  adminNote: "",
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function statusBadge(s: string) {
  if (s === "pass") return { label: "✓ Geçti", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  if (s === "fail") return { label: "✕ Hata", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
  return { label: "?", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
}

export default function AdminCommitLogsPage() {
  const [items, setItems] = useState<CommitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [editing, setEditing] = useState<CommitLog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/commit-logs", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Yüklenemedi");
      setItems(data.logs || []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(null), 3000);
    return () => clearTimeout(t);
  }, [info]);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, committedAt: new Date().toISOString().slice(0, 16) });
    setTagsInput("");
    setShowForm(true);
  }

  function openEdit(log: CommitLog) {
    setEditing(log);
    setForm({
      hash: log.hash,
      message: log.message,
      committedAt: log.committedAt ? new Date(log.committedAt).toISOString().slice(0, 16) : "",
      summary: log.summary,
      filesChanged: log.filesChanged,
      insertions: log.insertions,
      deletions: log.deletions,
      tags: log.tags || [],
      notes: log.notes,
      buildStatus: log.buildStatus,
      tsStatus: log.tsStatus,
      author: log.author,
      adminReviewed: log.adminReviewed,
      adminNote: log.adminNote,
    });
    setTagsInput((log.tags || []).join(", "));
    setShowForm(true);
  }

  async function onSave() {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        ...form,
        tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
        committedAt: form.committedAt ? new Date(form.committedAt).toISOString() : new Date().toISOString(),
      };

      const url = editing
        ? `/api/admin/commit-logs/${editing._id}`
        : "/api/admin/commit-logs";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders() as Record<string, string>, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Kayıt başarısız");
      setInfo(editing ? "Güncellendi." : "Commit logu oluşturuldu.");
      setShowForm(false);
      setEditing(null);
      setForm({ ...empty });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Bu commit logunu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/commit-logs/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Silinemedi");
      setInfo("Silindi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  }

  async function toggleReview(log: CommitLog) {
    try {
      const res = await fetch(`/api/admin/commit-logs/${log._id}`, {
        method: "PUT",
        headers: { ...authHeaders() as Record<string, string>, "Content-Type": "application/json" },
        body: JSON.stringify({ adminReviewed: !log.adminReviewed }),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const reviewed = items.filter((i) => i.adminReviewed).length;
    const totalFiles = items.reduce((s, i) => s + (i.filesChanged || 0), 0);
    const totalIns = items.reduce((s, i) => s + (i.insertions || 0), 0);
    const totalDel = items.reduce((s, i) => s + (i.deletions || 0), 0);
    return { total, reviewed, totalFiles, totalIns, totalDel };
  }, [items]);

  const inputCls = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-600/50 focus:ring-1 focus:ring-violet-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Commit İzleme</h1>
                <p className="text-xs text-slate-400 mt-0.5">Proje snapshot geçmişi — ne yapıldı, hangi durumda</p>
              </div>
              <button onClick={openNew} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">+ Commit Ekle</button>
            </div>

            {/* Stats bar */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-slate-400">Toplam:</span>
                <span className="font-semibold text-slate-200">{stats.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400">İncelenen:</span>
                <span className="font-semibold text-emerald-300">{stats.reviewed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Dosya:</span>
                <span className="font-semibold text-slate-200">{stats.totalFiles}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">+{stats.totalIns}</span>
                <span className="text-rose-400">-{stats.totalDel}</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {info}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="text-sm font-semibold text-slate-100">{editing ? "Commit Düzenle" : "Yeni Commit Kaydı"}</div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Commit Hash *</label>
                  <input value={form.hash} onChange={(e) => setForm({ ...form, hash: e.target.value })} className={inputCls} placeholder="4e6b42f" />
                </div>
                <div>
                  <label className={labelCls}>Tarih *</label>
                  <input type="datetime-local" value={form.committedAt} onChange={(e) => setForm({ ...form, committedAt: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Yazar</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Commit Mesajı *</label>
                <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} placeholder="snapshot: 2026-03-11 ..." />
              </div>

              <div>
                <label className={labelCls}>Yapılanların Özeti (markdown)</label>
                <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputCls} rows={4} placeholder="- Service provider sayfaları eklendi&#10;- Dinamik kategori motoru&#10;- Navigasyon düzeltmeleri" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Değişen Dosya</label>
                  <input type="number" value={form.filesChanged} onChange={(e) => setForm({ ...form, filesChanged: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Eklenen Satır (+)</label>
                  <input type="number" value={form.insertions} onChange={(e) => setForm({ ...form, insertions: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Silinen Satır (-)</label>
                  <input type="number" value={form.deletions} onChange={(e) => setForm({ ...form, deletions: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Etiketler (virgülle)</label>
                  <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputCls} placeholder="backend, frontend, auth, service-provider" />
                </div>
                <div>
                  <label className={labelCls}>Önemli Notlar</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Breaking change, dikkat edilecekler..." />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Build Durumu</label>
                  <select value={form.buildStatus} onChange={(e) => setForm({ ...form, buildStatus: e.target.value as any })} className={inputCls}>
                    <option value="unknown">Bilinmiyor</option>
                    <option value="pass">Geçti ✓</option>
                    <option value="fail">Hata ✕</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>TypeScript Durumu</label>
                  <select value={form.tsStatus} onChange={(e) => setForm({ ...form, tsStatus: e.target.value as any })} className={inputCls}>
                    <option value="unknown">Bilinmiyor</option>
                    <option value="pass">Geçti ✓</option>
                    <option value="fail">Hata ✕</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input type="checkbox" checked={form.adminReviewed} onChange={(e) => setForm({ ...form, adminReviewed: e.target.checked })} className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-500" />
                  <label className="text-xs text-slate-300">Admin İnceledi</label>
                </div>
              </div>

              <div>
                <label className={labelCls}>Admin Notu</label>
                <input value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className={inputCls} placeholder="Test sonucu, eksikler..." />
              </div>

              <div className="flex gap-2">
                <button onClick={onSave} disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
                  {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Oluştur"}
                </button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">İptal</button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
              Yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center text-slate-400 text-sm">
              Henüz commit kaydı yok. <button onClick={openNew} className="text-violet-400 underline">İlk kaydı ekle</button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-800" />

              <div className="space-y-4">
                {items.map((log, idx) => {
                  const build = statusBadge(log.buildStatus);
                  const ts = statusBadge(log.tsStatus);
                  return (
                    <div key={log._id} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className={`absolute left-[12px] top-4 h-[15px] w-[15px] rounded-full border-2 ${
                        log.adminReviewed
                          ? "bg-emerald-500 border-emerald-400"
                          : "bg-slate-700 border-slate-600"
                      }`} />

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/20 transition-colors">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="rounded bg-violet-950/40 border border-violet-800/30 px-2 py-0.5 text-xs font-mono text-violet-300">{log.hash.slice(0, 8)}</code>
                              <span className="text-xs text-slate-500">{fmtDate(log.committedAt)}</span>
                              {log.adminReviewed && (
                                <span className="rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">İncelendi</span>
                              )}
                            </div>
                            <div className="mt-1.5 text-sm font-semibold text-slate-100">{log.message}</div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => toggleReview(log)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] transition-colors ${
                              log.adminReviewed
                                ? "border-emerald-700/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/30"
                                : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                            }`}>
                              {log.adminReviewed ? "✓ Onaylı" : "Onayla"}
                            </button>
                            <button onClick={() => openEdit(log)} className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-2.5 py-1.5 text-[10px] text-sky-300 hover:bg-sky-900/30 transition-colors">Düzenle</button>
                            <button onClick={() => onDelete(log._id)} className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-2.5 py-1.5 text-[10px] text-rose-300 hover:bg-rose-900/30 transition-colors">Sil</button>
                          </div>
                        </div>

                        {/* Summary */}
                        {log.summary && (
                          <div className="mt-2 rounded-lg bg-slate-950/50 border border-slate-800/50 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                            {log.summary}
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="mt-2.5 flex items-center gap-4 flex-wrap text-[11px]">
                          {(log.filesChanged > 0) && (
                            <span className="text-slate-400">{log.filesChanged} dosya</span>
                          )}
                          {(log.insertions > 0 || log.deletions > 0) && (
                            <span>
                              <span className="text-emerald-400">+{log.insertions}</span>
                              {" / "}
                              <span className="text-rose-400">-{log.deletions}</span>
                            </span>
                          )}
                          <span className="text-slate-500">by {log.author}</span>
                          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${build.cls}`}>Build: {build.label}</span>
                          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${ts.cls}`}>TS: {ts.label}</span>
                        </div>

                        {/* Tags */}
                        {log.tags && log.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {log.tags.map((tag, i) => (
                              <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{tag}</span>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {log.notes && (
                          <div className="mt-2 text-xs text-amber-300/80 flex items-start gap-1.5">
                            <span className="flex-shrink-0">⚠</span>
                            <span>{log.notes}</span>
                          </div>
                        )}

                        {/* Admin note */}
                        {log.adminNote && (
                          <div className="mt-2 text-xs text-sky-300/80 flex items-start gap-1.5">
                            <span className="flex-shrink-0">💬</span>
                            <span>{log.adminNote}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
