"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";

type Task = {
  _id: string;
  key: string;
  title: string;
  description?: string;
  instruction?: string;
  devDone?: boolean;
  adminTested?: boolean;
  adminResult?: "" | "ok" | "not_ok";
  adminResultNote?: string;
  status: "pending" | "in_progress" | "blocked" | "done" | "canceled";
  priority: "low" | "medium" | "high";
  tags?: string[];
  updatedAt?: string;
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { ...(init?.headers as any), ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newInstruction, setNewInstruction] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      const data = await apiFetch(`/api/admin/tasks${params.toString() ? `?${params.toString()}` : ""}`);
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (e: any) {
      setTasks([]);
      setErr(e?.message || "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const s = String(t.status || "pending");
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(t);
    }
    return map;
  }, [tasks]);

  async function createTask() {
    setErr(null);
    try {
      if (!newTitle.trim()) {
        setErr("Başlık zorunlu");
        return;
      }
      await apiFetch("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          instruction: newInstruction.trim(),
          priority: "high",
          tags: ["instruction"],
        }),
      });
      setNewTitle("");
      setNewDesc("");
      setNewInstruction("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Oluşturulamadı");
    }
  }

  async function setTaskStatus(id: string, next: Task["status"]) {
    setErr(null);
    try {
      await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Güncellenemedi");
    }
  }

  async function patchTask(id: string, patch: Record<string, any>) {
    setErr(null);
    try {
      await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch || {}),
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Güncellenemedi");
    }
  }

  function renderTaskRow(t: Task) {
    const devDone = !!t.devDone;
    const adminTested = !!t.adminTested;
    const adminResult = (t.adminResult || "") as Task["adminResult"];
    const canSetDone = adminTested && adminResult === "ok";

    return (
      <div key={t._id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{t.key}</div>
          <div className="font-semibold">{t.title}</div>
          {t.description ? <div className="text-xs text-slate-400 mt-1">{t.description}</div> : null}
          {t.instruction ? (
            <div className="text-xs text-slate-300 mt-2">
              <span className="text-slate-500">Talimat:</span> {t.instruction}
            </div>
          ) : null}
          {t.updatedAt ? <div className="text-[10px] text-slate-600 mt-2">Güncelleme: {new Date(t.updatedAt).toLocaleString()}</div> : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={devDone}
              onChange={(e) => patchTask(t._id, { devDone: e.target.checked, status: e.target.checked ? "in_progress" : t.status })}
            />
            Dev yaptı
          </label>

          <label className="flex items-center gap-1 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={adminTested}
              onChange={(e) => {
                const checked = e.target.checked;
                patchTask(t._id, { adminTested: checked, adminResult: checked ? adminResult : "", adminResultNote: checked ? (t.adminResultNote || "") : "" });
              }}
            />
            Admin test
          </label>

          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
            value={adminResult || ""}
            disabled={!adminTested}
            onChange={(e) => patchTask(t._id, { adminResult: e.target.value })}
          >
            <option value="">sonuç</option>
            <option value="ok">ok</option>
            <option value="not_ok">not ok</option>
          </select>

          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs min-w-[180px]"
            placeholder="not"
            value={t.adminResultNote || ""}
            disabled={!adminTested}
            onChange={(e) => patchTask(t._id, { adminResultNote: e.target.value })}
          />

          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
            value={t.status}
            onChange={(e) => {
              const next = e.target.value as any;
              if (next === "done" && !canSetDone) {
                setErr("done için önce admin test ve sonuç=ok gerekli");
                return;
              }
              setTaskStatus(t._id, next);
            }}
          >
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="blocked">blocked</option>
            <option value="done">done</option>
            <option value="canceled">canceled</option>
          </select>
          <div className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-300">{t.priority}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">Talimat / Yapılacak Takibi</h1>
              <p className="text-sm text-slate-400">Konuşulan talimatları burada kaydedip işaretleyerek ilerleyeceğiz.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={load}
                className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
                disabled={loading}
              >
                {loading ? "Yükleniyor..." : "Yenile"}
              </button>
            </div>
          </header>

          {err ? <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">{err}</div> : null}

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ara (key/title)"
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              >
                <option value="">Tüm statüler</option>
                <option value="pending">pending</option>
                <option value="in_progress">in_progress</option>
                <option value="blocked">blocked</option>
                <option value="done">done</option>
                <option value="canceled">canceled</option>
              </select>
              <button
                type="button"
                onClick={load}
                className="px-3 py-2 rounded-lg bg-sky-700/60 border border-sky-400 text-sky-50 text-xs"
              >
                Filtrele
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="text-sm font-semibold">Yeni talimat ekle</div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Başlık"
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none w-full"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Açıklama"
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none w-full min-h-[80px]"
            />
            <textarea
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="Talimat (checklist için net adımlar / beklenti)"
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none w-full min-h-[80px]"
            />
            <button
              type="button"
              onClick={createTask}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-slate-950 text-xs font-semibold"
            >
              Oluştur
            </button>
          </div>

          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([st, list]) => (
              <div key={st} className="space-y-2">
                <div className="text-sm font-semibold text-slate-200">{st} ({list.length})</div>
                {list.map(renderTaskRow)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
