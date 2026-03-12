"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/team/page.tsx
// ----------------------------------------------------------
// Employer Team Management — Alt kullanıcı yönetimi
// CRUD: listele, oluştur, düzenle, sil, aktif/pasif
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EmployerOnly from "@/components/EmployerOnly";
import { fetchMyTeam, createSubUser, updateSubUser, deleteSubUser, toggleSubUserActive } from "@/lib/api/team";
import { fetchMyBranches } from "@/lib/api/branches";
import { authHeaders } from "@/lib/api/_core";

type RoleOption = { _id: string; name: string; displayName: string; description?: string };
type BranchOption = { _id: string; name: string; displayName: string };
type SubUserRow = any;

type PermAction = { action: string; label: string; description: string };
type PermModuleDef = { module: string; label: string; icon: string; description: string; restrictions: string[]; actions: PermAction[] };
type PermActionState = { action: string; allowed: boolean; restrictions: { ownOnly: boolean; branchBased: boolean; locationBased: boolean } };
type PermModuleState = { module: string; actions: PermActionState[] };

export default function EmployerTeamPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [items, setItems] = useState<SubUserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [q, setQ] = useState("");

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState("");
  const [fBranch, setFBranch] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fDepartment, setFDepartment] = useState("");

  // Permission state
  const [permDefs, setPermDefs] = useState<PermModuleDef[]>([]);
  const [fPerms, setFPerms] = useState<PermModuleState[]>([]);
  const [modalTab, setModalTab] = useState<"info" | "perms">("info");

  // Load data
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [teamData, branchData] = await Promise.all([
        fetchMyTeam(),
        fetchMyBranches(),
      ]);
      setItems(teamData.subusers || []);
      setBranches(branchData.branches || []);

      // Employer alt rollerini yükle
      try {
        const srRes = await fetch("/api/public/roles/subroles?category=employer");
        const srData = await srRes.json();
        if (srRes.ok && Array.isArray(srData.subRoles)) {
          setRoles(srData.subRoles.map((sr: any) => ({
            _id: sr.key,
            name: sr.key,
            displayName: sr.label,
            description: sr.description,
          })));
        }
      } catch { /* opsiyonel */ }

      // Ayrıca DB'deki gerçek Role dokümanlarını da çek (ObjectId lazım)
      try {
        const rolesRes = await fetch("/api/admin/dynamic-roles?category=employer", {
          headers: authHeaders(),
        });
        const rolesData = await rolesRes.json();
        if (rolesRes.ok && Array.isArray(rolesData.roles)) {
          const subRolesFromDb = rolesData.roles.filter((r: any) => r.level > 0);
          if (subRolesFromDb.length > 0) {
            setRoles(subRolesFromDb.map((r: any) => ({
              _id: r._id,
              name: r.name,
              displayName: r.displayName,
              description: r.description,
            })));
          }
        }
      } catch { /* admin endpoint'i yoksa yukarıdaki kullanılır */ }

      // Yetki tanımlarını yükle
      try {
        const permRes = await fetch("/api/public/roles/permissions");
        const permData = await permRes.json();
        if (permRes.ok && Array.isArray(permData.modules)) {
          setPermDefs(permData.modules);
        }
      } catch { /* opsiyonel */ }

    } catch (e: any) {
      setErr(e?.message || "Veriler yüklenemedi");
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

  // Filtered list
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter((su: SubUserRow) =>
      (su.name || "").toLowerCase().includes(lower) ||
      (su.email || "").toLowerCase().includes(lower) ||
      (su.role?.displayName || "").toLowerCase().includes(lower)
    );
  }, [items, q]);

  // Boş yetki seti üret (tümü kapalı)
  function buildEmptyPerms(): PermModuleState[] {
    return permDefs.map((mod) => ({
      module: mod.module,
      actions: mod.actions.map((a) => ({
        action: a.action,
        allowed: false,
        restrictions: { ownOnly: false, branchBased: false, locationBased: false },
      })),
    }));
  }

  // Tam yetki seti üret (tümü açık)
  function buildFullPerms(): PermModuleState[] {
    return permDefs.map((mod) => ({
      module: mod.module,
      actions: mod.actions.map((a) => ({
        action: a.action,
        allowed: true,
        restrictions: { ownOnly: false, branchBased: false, locationBased: false },
      })),
    }));
  }

  // Open create modal
  function openCreate() {
    setEditingId(null);
    setFName("");
    setFEmail("");
    setFPhone("");
    setFPassword("");
    setFRole(roles.length > 0 ? roles[0]._id : "");
    setFBranch("");
    setFTitle("");
    setFDepartment("");
    setFPerms(buildEmptyPerms());
    setModalTab("info");
    setOpen(true);
  }

  // Open edit modal
  function openEdit(su: SubUserRow) {
    setEditingId(su._id);
    setFName(su.name || "");
    setFEmail(su.email || "");
    setFPhone(su.phone || "");
    setFPassword("");
    setFRole(su.role?._id || su.role || "");
    const primaryBranch = su.assignedBranches?.find((ab: any) => ab.isPrimary)?.branch?._id
      || su.assignedBranches?.[0]?.branch?._id
      || su.assignedBranches?.[0]?.branch
      || "";
    setFBranch(primaryBranch);
    setFTitle(su.profile?.title || "");
    setFDepartment(su.profile?.department || "");

    // Mevcut yetkileri yükle, eksik modülleri boş olarak ekle
    const existingPerms: PermModuleState[] = Array.isArray(su.permissions) ? su.permissions : [];
    const merged = permDefs.map((mod) => {
      const existing = existingPerms.find((p: any) => p.module === mod.module);
      return {
        module: mod.module,
        actions: mod.actions.map((a) => {
          const existAct = existing?.actions?.find((ea: any) => ea.action === a.action);
          return {
            action: a.action,
            allowed: existAct?.allowed ?? false,
            restrictions: {
              ownOnly: existAct?.restrictions?.ownOnly ?? false,
              branchBased: existAct?.restrictions?.branchBased ?? false,
              locationBased: existAct?.restrictions?.locationBased ?? false,
            },
          };
        }),
      };
    });
    setFPerms(merged);
    setModalTab("info");
    setOpen(true);
  }

  // Save (create/update)
  async function onSave() {
    if (!fName.trim()) { setErr("İsim zorunludur"); return; }
    if (!fEmail.trim()) { setErr("E-posta zorunludur"); return; }
    if (!editingId && (!fPassword || fPassword.length < 6)) { setErr("Şifre en az 6 karakter olmalıdır"); return; }
    if (!fRole) { setErr("Rol seçimi zorunludur"); return; }

    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        name: fName.trim(),
        email: fEmail.trim(),
        phone: fPhone.trim(),
        role: fRole,
        profile: {
          title: fTitle.trim(),
          department: fDepartment.trim(),
        },
      };

      if (fPassword) body.password = fPassword;
      if (fBranch) {
        body.assignedBranches = [{ branch: fBranch, isPrimary: true }];
      } else {
        body.assignedBranches = [];
      }

      // Yetkiler
      body.permissions = fPerms;

      if (editingId) {
        await updateSubUser(editingId, body);
        setInfo("Alt kullanıcı güncellendi.");
      } else {
        body.password = fPassword;
        await createSubUser(body);
        setInfo("Alt kullanıcı oluşturuldu.");
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Kayıt hatası");
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function onDelete(id: string) {
    if (!confirm("Bu alt kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteSubUser(id);
      setInfo("Alt kullanıcı silindi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Silme hatası");
    }
  }

  // Toggle active
  async function onToggle(id: string) {
    try {
      const data = await toggleSubUserActive(id);
      setInfo(data.message || "Durum değiştirildi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Durum değiştirme hatası");
    }
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  return (
    <EmployerOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Ekibim</h1>
                <p className="text-xs text-slate-400 mt-0.5">Alt kullanıcıları yönetin, roller ve şubeler atayın</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <button
                  onClick={openCreate}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  + Yeni Üye
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
              <button onClick={() => setErr(null)} className="ml-auto text-rose-400 hover:text-rose-300 text-xs">Kapat</button>
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {info}
            </div>
          )}

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                <div className="text-lg font-bold text-slate-100">{items.length}</div>
                <div className="text-[11px] text-slate-400">Toplam Üye</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">{items.filter((s: SubUserRow) => s.status?.isActive).length}</div>
                <div className="text-[11px] text-slate-400">Aktif</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{branches.length}</div>
                <div className="text-[11px] text-slate-400">Şube</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={inputCls}
              placeholder="İsim, e-posta veya rol ile ara..."
            />
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center">
              <div className="text-sm text-slate-400">
                {items.length === 0
                  ? "Henüz alt kullanıcı yok. Yukarıdaki \"+ Yeni Üye\" butonuyla ekleyin."
                  : "Arama sonucu bulunamadı."}
              </div>
              {roles.length === 0 && items.length === 0 && (
                <div className="mt-3 text-xs text-amber-400/70">
                  Önce admin panelinden Employer kategorisine alt roller tanımlanmalıdır.
                </div>
              )}
            </div>
          ) : (
            /* Team list */
            <div className="space-y-2">
              {filtered.map((su: SubUserRow) => {
                const roleName = su.role?.displayName || su.role?.name || "—";
                const branchName = su.assignedBranches?.[0]?.branch?.displayName
                  || su.assignedBranches?.[0]?.branch?.name
                  || "Atanmamış";
                const isActive = su.status?.isActive;

                return (
                  <div
                    key={su._id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isActive
                        ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800/50"
                        : "border-slate-800/50 bg-slate-950/60 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100 truncate">{su.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/50 text-slate-400"
                          }`}>
                            {isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{su.email}</div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                          <span className="text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">{roleName}</span>
                          <span className="text-slate-400">📍 {branchName}</span>
                          {su.profile?.title && <span className="text-slate-500">{su.profile.title}</span>}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onToggle(su._id)}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            isActive
                              ? "border border-amber-600/30 text-amber-300 hover:bg-amber-900/20"
                              : "border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/20"
                          }`}
                        >
                          {isActive ? "Pasif Yap" : "Aktif Yap"}
                        </button>
                        <button
                          onClick={() => openEdit(su)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => onDelete(su._id)}
                          className="rounded-lg border border-rose-800/40 px-2.5 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-900/20 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Create / Edit Modal ─── */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-100">
                  {editingId ? "Üye Düzenle" : "Yeni Üye Ekle"}
                </h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-slate-700 pb-1">
                <button
                  onClick={() => setModalTab("info")}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                    modalTab === "info" ? "bg-slate-800 text-emerald-300 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Bilgiler
                </button>
                <button
                  onClick={() => setModalTab("perms")}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                    modalTab === "perms" ? "bg-slate-800 text-amber-300 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Yetkiler
                  {fPerms.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-full">
                      {fPerms.reduce((n, m) => n + m.actions.filter((a) => a.allowed).length, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab: Bilgiler */}
              {modalTab === "info" && (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>İsim *</label>
                    <input value={fName} onChange={(e) => setFName(e.target.value)} className={inputCls} placeholder="Ad Soyad" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>E-posta *</label>
                      <input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className={inputCls} placeholder="ornek@firma.com" type="email" />
                    </div>
                    <div>
                      <label className={labelCls}>Telefon</label>
                      <input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className={inputCls} placeholder="05xx..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{editingId ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre *"}</label>
                    <input value={fPassword} onChange={(e) => setFPassword(e.target.value)} className={inputCls} placeholder="En az 6 karakter" type="password" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Rol *</label>
                      <select value={fRole} onChange={(e) => setFRole(e.target.value)} className={inputCls}>
                        <option value="">Seçiniz</option>
                        {roles.map((r) => (
                          <option key={r._id} value={r._id}>{r.displayName}</option>
                        ))}
                      </select>
                      {roles.length === 0 && (
                        <div className="text-[10px] text-amber-400/70 mt-1">
                          Admin panelinden Employer alt rolleri tanımlanmalı
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Şube</label>
                      <select value={fBranch} onChange={(e) => setFBranch(e.target.value)} className={inputCls}>
                        <option value="">Atanmamış</option>
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>{b.displayName || b.name}</option>
                        ))}
                      </select>
                      {branches.length === 0 && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          <Link href="/employer/branches" className="text-emerald-400 underline">Şube ekle →</Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Ünvan</label>
                      <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className={inputCls} placeholder="Örn: Bölge Müdürü" />
                    </div>
                    <div>
                      <label className={labelCls}>Departman</label>
                      <input value={fDepartment} onChange={(e) => setFDepartment(e.target.value)} className={inputCls} placeholder="Örn: Operasyon" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Yetkiler */}
              {modalTab === "perms" && (
                <div className="space-y-3">
                  {/* Toplu işlemler */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setFPerms(buildFullPerms())}
                      className="rounded-lg border border-emerald-600/30 bg-emerald-950/20 px-3 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-900/30 transition-colors"
                    >
                      Tümünü Aç
                    </button>
                    <button
                      onClick={() => setFPerms(buildEmptyPerms())}
                      className="rounded-lg border border-rose-600/30 bg-rose-950/20 px-3 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-900/30 transition-colors"
                    >
                      Tümünü Kapat
                    </button>
                    <div className="ml-auto text-[10px] text-slate-500">
                      {fPerms.reduce((n, m) => n + m.actions.filter((a) => a.allowed).length, 0)} / {fPerms.reduce((n, m) => n + m.actions.length, 0)} yetki açık
                    </div>
                  </div>

                  {/* Modül listesi */}
                  {permDefs.map((mod) => {
                    const modState = fPerms.find((p) => p.module === mod.module);
                    if (!modState) return null;
                    const allOn = modState.actions.every((a) => a.allowed);
                    const someOn = modState.actions.some((a) => a.allowed);

                    return (
                      <div key={mod.module} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        {/* Modül başlık */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{mod.icon}</span>
                            <div>
                              <div className="text-xs font-semibold text-slate-200">{mod.label}</div>
                              <div className="text-[10px] text-slate-500">{mod.description}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setFPerms((prev) =>
                                prev.map((p) =>
                                  p.module !== mod.module ? p : {
                                    ...p,
                                    actions: p.actions.map((a) => ({ ...a, allowed: !allOn })),
                                  }
                                )
                              );
                            }}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              allOn
                                ? "bg-emerald-500/15 text-emerald-300"
                                : someOn
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-slate-700/40 text-slate-400"
                            }`}
                          >
                            {allOn ? "Tam Yetki" : someOn ? "Kısmi" : "Yetkisiz"}
                          </button>
                        </div>

                        {/* Aksiyonlar */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {mod.actions.map((actDef) => {
                            const actState = modState.actions.find((a) => a.action === actDef.action);
                            if (!actState) return null;

                            return (
                              <label
                                key={actDef.action}
                                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors ${
                                  actState.allowed
                                    ? "border-emerald-600/30 bg-emerald-950/20"
                                    : "border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={actState.allowed}
                                  onChange={(e) => {
                                    setFPerms((prev) =>
                                      prev.map((p) =>
                                        p.module !== mod.module ? p : {
                                          ...p,
                                          actions: p.actions.map((a) =>
                                            a.action !== actDef.action ? a : { ...a, allowed: e.target.checked }
                                          ),
                                        }
                                      )
                                    );
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950 text-emerald-500 accent-emerald-500"
                                />
                                <div>
                                  <div className={`text-[11px] font-medium ${actState.allowed ? "text-emerald-200" : "text-slate-400"}`}>
                                    {actDef.label}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {/* Kısıtlama seçenekleri (modül destekliyorsa) */}
                        {mod.restrictions.length > 0 && someOn && (
                          <div className="mt-2 flex items-center gap-3 pl-1">
                            {mod.restrictions.includes("ownOnly") && (
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={modState.actions.some((a) => a.allowed && a.restrictions.ownOnly)}
                                  onChange={(e) => {
                                    setFPerms((prev) =>
                                      prev.map((p) =>
                                        p.module !== mod.module ? p : {
                                          ...p,
                                          actions: p.actions.map((a) =>
                                            !a.allowed ? a : { ...a, restrictions: { ...a.restrictions, ownOnly: e.target.checked } }
                                          ),
                                        }
                                      )
                                    );
                                  }}
                                  className="h-3 w-3 rounded border-slate-600 bg-slate-950 text-amber-500 accent-amber-500"
                                />
                                <span className="text-[10px] text-amber-300/70">Sadece kendininki</span>
                              </label>
                            )}
                            {mod.restrictions.includes("branchBased") && (
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={modState.actions.some((a) => a.allowed && a.restrictions.branchBased)}
                                  onChange={(e) => {
                                    setFPerms((prev) =>
                                      prev.map((p) =>
                                        p.module !== mod.module ? p : {
                                          ...p,
                                          actions: p.actions.map((a) =>
                                            !a.allowed ? a : { ...a, restrictions: { ...a.restrictions, branchBased: e.target.checked } }
                                          ),
                                        }
                                      )
                                    );
                                  }}
                                  className="h-3 w-3 rounded border-slate-600 bg-slate-950 text-amber-500 accent-amber-500"
                                />
                                <span className="text-[10px] text-amber-300/70">Sadece şubesindeki</span>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {permDefs.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-6">
                      Yetki tanımları yüklenemedi.
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/employer/branches" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Şubeler</Link>
              <Link href="/employer/team" className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-2 py-2 text-center text-[11px] font-medium text-emerald-300">Ekip</Link>
              <Link href="/employer/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </EmployerOnly>
  );
}
