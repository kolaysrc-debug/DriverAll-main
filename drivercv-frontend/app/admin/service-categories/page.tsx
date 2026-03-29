"use client";

// PATH: drivercv-frontend/app/admin/service-categories/page.tsx
// ----------------------------------------------------------
// Admin — Hizmet Kategorileri CRUD
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { authHeaders } from "@/lib/api/_core";

type Cat = {
  _id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  relatedCriteriaKeys: string[];
  relatedGroupKeys: string[];
  sortOrder: number;
  active: boolean;
  country: string;
};

const empty: Omit<Cat, "_id"> = {
  key: "", label: "", description: "", icon: "",
  relatedCriteriaKeys: [], relatedGroupKeys: [],
  sortOrder: 0, active: true, country: "TR",
};

export default function AdminServiceCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/service-categories", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Yüklenemedi");
      setItems(data.categories || []);
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
    setForm({ ...empty });
    setShowForm(true);
  }

  function openEdit(cat: Cat) {
    setShowForm(true);
    setEditing(cat);
    setForm({
      key: cat.key,
      label: cat.label,
      description: cat.description,
      icon: cat.icon,
      relatedCriteriaKeys: cat.relatedCriteriaKeys || [],
      relatedGroupKeys: cat.relatedGroupKeys || [],
      sortOrder: cat.sortOrder,
      active: cat.active,
      country: cat.country,
    });
  }

  async function onSave() {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        ...form,
        relatedCriteriaKeys: typeof form.relatedCriteriaKeys === "string"
          ? (form.relatedCriteriaKeys as unknown as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : form.relatedCriteriaKeys,
        relatedGroupKeys: typeof form.relatedGroupKeys === "string"
          ? (form.relatedGroupKeys as unknown as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : form.relatedGroupKeys,
      };

      const url = editing
        ? `/api/admin/service-categories/${editing._id}`
        : "/api/admin/service-categories";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders() as Record<string, string>, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Kayıt başarısız");
      setInfo(editing ? "Güncellendi." : "Oluşturuldu.");
      setEditing(null);
      setForm({ ...empty });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/service-categories/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Silinemedi");
      setInfo("Silindi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-600/50 focus:ring-1 focus:ring-violet-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Hizmet Kategorileri</h1>
                <p className="text-xs text-slate-400 mt-0.5">Hizmet verenler için dinamik kategori yönetimi</p>
              </div>
              <button onClick={openNew} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">+ Yeni Kategori</button>
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
              <div className="text-sm font-semibold text-slate-100">{editing ? "Kategori Düzenle" : "Yeni Kategori"}</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Key *</label>
                  <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className={inputCls} placeholder="Örn: src_egitimi" />
                </div>
                <div>
                  <label className={labelCls}>Label *</label>
                  <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} placeholder="Örn: SRC Eğitimi" />
                </div>
                <div>
                  <label className={labelCls}>İkon</label>
                  <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="Örn: 📋" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Açıklama</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Kısa açıklama" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelCls}>İlgili Kriter Key'leri (virgülle)</label>
                  <input
                    value={Array.isArray(form.relatedCriteriaKeys) ? form.relatedCriteriaKeys.join(", ") : form.relatedCriteriaKeys}
                    onChange={(e) => setForm({ ...form, relatedCriteriaKeys: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="SRC1_TR, SRC2_TR"
                  />
                </div>
                <div>
                  <label className={labelCls}>İlgili Grup Key'leri (virgülle)</label>
                  <input
                    value={Array.isArray(form.relatedGroupKeys) ? form.relatedGroupKeys.join(", ") : form.relatedGroupKeys}
                    onChange={(e) => setForm({ ...form, relatedGroupKeys: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="SRC_TR"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Sıralama</label>
                  <input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} className={inputCls} type="number" />
                </div>
                <div>
                  <label className={labelCls}>Ülke</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} placeholder="TR" />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-500" />
                  <label className="text-xs text-slate-300">Aktif</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onSave} disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
                  {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Oluştur"}
                </button>
                <button onClick={() => { setEditing(null); setForm({ ...empty }); setShowForm(false); }} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">İptal</button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
              Yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center text-slate-400 text-sm">
              Henüz kategori yok. <button onClick={openNew} className="text-violet-400 underline">Ekle</button> veya <code className="text-xs">node scripts/seedServiceCategories.js</code> çalıştırın.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((cat) => (
                <div key={cat._id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat.icon && <span className="text-base">{cat.icon}</span>}
                        <span className="text-sm font-semibold text-slate-100">{cat.label}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">{cat.key}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cat.active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}>
                          {cat.active ? "Aktif" : "Pasif"}
                        </span>
                        <span className="text-[10px] text-slate-500">#{cat.sortOrder}</span>
                      </div>
                      {cat.description && <div className="text-xs text-slate-400 mt-1">{cat.description}</div>}
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                        {cat.relatedGroupKeys?.length > 0 && <span>Gruplar: {cat.relatedGroupKeys.join(", ")}</span>}
                        {cat.relatedCriteriaKeys?.length > 0 && <span>Kriterler: {cat.relatedCriteriaKeys.join(", ")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(cat)} className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900/30 transition-colors">Düzenle</button>
                      <button onClick={() => onDelete(cat._id)} className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors">Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
