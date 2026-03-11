"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";
import { authHeaders } from "@/lib/api/_core";
import { getToken } from "@/lib/session";

type ParentUser = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type RoleItem = {
  _id: string;
  name: string;
  displayName?: string;
  category?: string;
  isActive?: boolean;
};

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

export default function AdminSubUserNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parents, setParents] = useState<ParentUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    parentUser: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    requireOwnerApproval: true,
    requireActionApproval: false,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

        const [usersRes, rolesRes] = await Promise.all([
          fetch("/api/admin/users", { headers: authHeaders() }),
          fetch("/api/admin/dynamic-roles", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const usersData = await usersRes.json().catch(() => ({}));
        if (!usersRes.ok) {
          throw new Error(usersData?.message || `Kullanıcılar alınamadı (HTTP ${usersRes.status})`);
        }

        const rolesData = await rolesRes.json().catch(() => ({}));
        if (!rolesRes.ok) {
          throw new Error(rolesData?.message || `Roller alınamadı (HTTP ${rolesRes.status})`);
        }

        const usersList: ParentUser[] = Array.isArray(usersData?.users) ? usersData.users : [];
        const rolesList: RoleItem[] = Array.isArray(rolesData?.roles) ? rolesData.roles : [];

        setParents(usersList);
        setRoles(rolesList);

        const firstParent = usersList.find((u) => u.role !== "admin")?._id || usersList[0]?._id || "";
        const firstRole = rolesList.find((r) => r.isActive !== false)?._id || rolesList[0]?._id || "";

        setForm((prev) => ({
          ...prev,
          parentUser: prev.parentUser || firstParent,
          role: prev.role || firstRole,
        }));
      } catch (e: any) {
        setError(e?.message || "Yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (!form.parentUser) missing.push("Ana kullanıcı seç");
    if (!form.role) missing.push("Rol seç");
    if (!form.name.trim()) missing.push("Ad soyad gir");
    if (!form.email.trim()) missing.push("E-posta gir");
    if (form.password.length < 6) missing.push("Şifre (en az 6 karakter)");
    if (parents.length === 0) missing.push("Ana kullanıcı listesi boş");
    if (roles.filter((r) => r.isActive !== false).length === 0) missing.push("Rol listesi boş");
    return missing;
  }, [form, parents.length, roles]);

  const canSubmit = useMemo(() => {
    return (
      !!form.parentUser &&
      !!form.role &&
      !!form.name.trim() &&
      !!form.email.trim() &&
      form.password.length >= 6 &&
      parents.length > 0 &&
      roles.some((r) => r.isActive !== false) &&
      !saving
    );
  }, [form, saving, parents.length, roles]);

  async function submit() {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/admin/subusers", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          parentUser: form.parentUser,
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          approvalSettings: {
            requireOwnerApproval: form.requireOwnerApproval !== false,
            requireActionApproval: form.requireActionApproval === true,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Alt kullanıcı oluşturulamadı (HTTP ${res.status})`);
      }

      router.replace("/admin/subusers");
    } catch (e: any) {
      setError(e?.message || "Alt kullanıcı oluşturulamadı");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Yükleniyor...</div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Yeni Alt Kullanıcı</h1>
              <p className="text-sm text-slate-400 mt-1">Admin olarak alt kullanıcı oluştur</p>
            </div>
            <button
              onClick={() => router.replace("/admin/subusers")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              ← Geri
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {!error && missingRequirements.length > 0 && (
            <div className="mb-4 p-3 rounded bg-slate-800/40 border border-slate-700 text-slate-200 text-sm">
              <div className="text-slate-300">Oluştur butonunu aktifleştirmek için:</div>
              <div className="text-slate-400 text-xs mt-1">{missingRequirements.join(" · ")}</div>
            </div>
          )}

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400">Ana Kullanıcı</label>
                <select
                  value={form.parentUser}
                  onChange={(e) => setForm({ ...form, parentUser: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                >
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {(p.name || "(İsimsiz)") + " - " + (p.email || "") + (p.role ? ` (${p.role})` : "")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                >
                  {roles
                    .filter((r) => r.isActive !== false)
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {(r.displayName || r.name) + (r.category ? ` (${r.category})` : "")}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400">Ad Soyad</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                  placeholder="Örn. Ali Veli"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400">E-posta</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                  placeholder="ornek@firma.com"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400">Telefon (opsiyonel)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                  placeholder="05xx..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400">Şifre (min 6)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requireOwnerApproval}
                  onChange={(e) => setForm({ ...form, requireOwnerApproval: e.target.checked })}
                />
                Owner onayı gerekli (sub-user aktif olmadan önce)
              </label>

              <label className="text-sm text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requireActionApproval}
                  onChange={(e) => setForm({ ...form, requireActionApproval: e.target.checked })}
                />
                İşlem bazlı onay gerekli (publish/buy vb.)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Oluşturuluyor..." : "Oluştur"}
              </button>
              <button
                onClick={() => router.replace("/admin/subusers")}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
