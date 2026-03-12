"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dynamic-roles/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/session";

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  level: number;
  isActive: boolean;
  isSystem: boolean;
  icon: string;
  color: string;
  sortOrder?: number;
  parentRole?: string;
  childRoles?: Role[];
  criteria: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  permissions: Array<{
    module: string;
    actions: Array<{
      action: string;
      allowed: boolean;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMainRoleId, setSelectedMainRoleId] = useState<string | null>(null);
  const [selectedSubRoleId, setSelectedSubRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    displayName: "",
    description: "",
    category: "candidate",
    parentRole: "",
    icon: "🎭",
    color: "#6366f1",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAuthFailure = (message?: string) => {
    clearSession();
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/register/auth");
  };

  const fetchRoles = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await fetch("/api/admin/dynamic-roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure(errorData?.message);
          return;
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Roller yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Roller yüklenemedi");
      }
      
      setRoles(data.roles || []);
    } catch (err) {
      console.error("Roller yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleSaveRole = async (updatedRole: Role) => {
    try {
      const token = getToken();
      const payload: any = {
        displayName: updatedRole.displayName,
        description: updatedRole.description,
        icon: updatedRole.icon,
        color: updatedRole.color,
        sortOrder: (updatedRole as any).sortOrder,
      };

      if (!updatedRole.isSystem) {
        payload.category = updatedRole.category;
        payload.criteria = updatedRole.criteria;
        payload.permissions = updatedRole.permissions;
        payload.isActive = updatedRole.isActive;
      }

      const response = await fetch(`/api/admin/dynamic-roles/${updatedRole._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure(errorData?.message);
          return;
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Rol güncellenemedi`);
      }

      const data = await response.json();
      if (data.success) {
        setRoles((prev) => prev.map(role => role._id === updatedRole._id ? data.role : role));
        setEditingRole({ ...data.role });
        alert("Rol başarıyla güncellendi ✅");
      } else {
        throw new Error(data.message || "Rol güncellenemedi");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Bu rolü silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/admin/dynamic-roles/${roleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure(errorData?.message);
          return;
        }
        throw new Error(errorData?.message || "Rol silinemedi");
      }

      const data = await response.json();
      if (data.success) {
        setRoles((prev) => prev.filter(role => role._id !== roleId));
        if (selectedSubRoleId === roleId) {
          setSelectedSubRoleId(null);
          setEditingRole(null);
        }
        alert("Rol başarıyla silindi ✅");
      } else {
        throw new Error(data.message || "Rol silinemedi");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleToggleActive = async (role: Role) => {
    try {
      if (role.isSystem) {
        alert("Sistem rolünün aktif/pasif durumu değiştirilemez.");
        return;
      }
      const token = getToken();
      const response = await fetch(`/api/admin/dynamic-roles/${role._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !role.isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure(errorData?.message);
          return;
        }
        throw new Error(errorData?.message || "Rol durumu güncellenemedi");
      }

      const data = await response.json();
      if (data.success) {
        setRoles((prev) => prev.map(r => r._id === role._id ? data.role : r));
        setEditingRole({ ...data.role });
      } else {
        throw new Error(data.message || "Rol durumu güncellenemedi");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const toggleRoleExpansion = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const renderRoleTree = (rootIds: string[], byId: Map<string, Role>, childrenByParent: Map<string, string[]>, level = 0) => {
    return rootIds.map((roleId) => {
      const role = byId.get(roleId);
      if (!role) return null;

      const childIds = childrenByParent.get(role._id) || [];
      const hasChildren = childIds.length > 0;

      return (
        <div key={role._id} className="border-l-2 border-slate-700" style={{ marginLeft: `${level * 24}px` }}>
          <div className="bg-slate-800/50 rounded-lg p-4 mb-2 hover:bg-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{role.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-100">{role.displayName}</h3>
                  <p className="text-sm text-slate-400">{role.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    role.category === "candidate"
                      ? "bg-purple-500/20 text-purple-400"
                      : role.category === "business"
                      ? "bg-green-500/20 text-green-400"
                      : role.category === "admin"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {role.category === "candidate" ? "Aday" : role.category === "business" ? "İşletme" : role.category === "admin" ? "Admin" : role.category}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    role.isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {role.isActive ? "Aktif" : "Pasif"}
                </span>
                {role.level === 0 && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                    Ana Rol
                  </span>
                )}
                {role.isSystem && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                    Sistem
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Kriterler:</span>
                <div className="mt-1 space-y-1">
                  {role.criteria.length > 0 ? (
                    role.criteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-slate-300">{criterion.label}</span>
                        <span className="text-xs text-slate-500">({criterion.type})</span>
                        {criterion.required && <span className="text-xs text-red-400">*</span>}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500">Kriter tanımlanmamış</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Yetkiler:</span>
                <div className="mt-1 space-y-1">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-slate-300">{perm.module}</span>
                        <span className="text-xs text-slate-500">
                          ({perm.actions.filter((a) => a.allowed).map((a) => a.action).join(", ")})
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500">Yetki tanımlanmamış</span>
                  )}
                </div>
              </div>
            </div>

            {hasChildren ? (
              <div className="mt-3">
                <button
                  onClick={() => toggleRoleExpansion(role._id)}
                  className="flex items-center space-x-2 text-sky-400 hover:text-sky-300 text-sm"
                >
                  <span>{expandedRoles.has(role._id) ? "▼" : "▶"}</span>
                  <span>Alt Roller</span>
                </button>
              </div>
            ) : null}

            {role.level === 0 ? (
              <div className="mt-4 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
                ℹ️ Ana roller sistem tarafından tanımlıdır ve düzenlenemez
              </div>
            ) : (
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => handleEditRole(role)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm"
                >
                  Düzenle
                </button>
                <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm">
                  Kopyala
                </button>
                <button
                  onClick={() => handleToggleActive(role)}
                  className="px-3 py-1 rounded text-sm bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {role.isActive ? "Pasif Yap" : "Aktif Yap"}
                </button>
                <button
                  onClick={() => handleDeleteRole(role._id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Sil
                </button>
              </div>
            )}
          </div>

          {hasChildren && expandedRoles.has(role._id) ? (
            <div className="mt-2">{renderRoleTree(childIds, byId, childrenByParent, level + 1)}</div>
          ) : null}
        </div>
      );
    });
  };

  const visibleRoles = selectedCategory === "all" ? roles : roles.filter((r) => r.category === selectedCategory);
  
  // Ana rolleri kategorilere göre grupla
  const mainRoles = visibleRoles.filter(r => r.level === 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const subRoles = visibleRoles.filter(r => r.level > 0);
  
  // Her kategori için alt rolleri grupla
  const subRolesByCategory = new Map<string, Role[]>();
  subRoles.forEach(role => {
    if (!subRolesByCategory.has(role.category)) {
      subRolesByCategory.set(role.category, []);
    }
    subRolesByCategory.get(role.category)!.push(role);
  });

  useEffect(() => {
    if (mainRoles.length === 0) {
      setSelectedMainRoleId(null);
      setSelectedSubRoleId(null);
      setEditingRole(null);
      return;
    }

    const hasSelectedMain = selectedMainRoleId && mainRoles.some((r) => r._id === selectedMainRoleId);
    if (!hasSelectedMain) {
      setSelectedMainRoleId(mainRoles[0]._id);
    }
  }, [mainRoles, selectedMainRoleId]);

  const selectedMainRole = mainRoles.find((r) => r._id === selectedMainRoleId) || null;
  const selectedMainSubRoles = selectedMainRole ? (subRolesByCategory.get(selectedMainRole.category) || []) : [];

  useEffect(() => {
    if (selectedMainSubRoles.length === 0) {
      setSelectedSubRoleId(null);
      setEditingRole(null);
      return;
    }

    const hasSelectedSub = selectedSubRoleId && selectedMainSubRoles.some((r) => r._id === selectedSubRoleId);
    if (!hasSelectedSub) {
      setSelectedSubRoleId(selectedMainSubRoles[0]._id);
      setEditingRole({ ...selectedMainSubRoles[0] });
      return;
    }

    const current = selectedMainSubRoles.find((r) => r._id === selectedSubRoleId);
    if (current) {
      setEditingRole((prev) => {
        if (!prev || prev._id !== current._id) return { ...current };
        return prev;
      });
    }
  }, [selectedMainSubRoles, selectedSubRoleId]);

  if (loading) {
    return (
      <AdminOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-slate-400">Yükleniyor...</div>
        </div>
      </AdminOnly>
    );
  }

  if (error) {
    return (
      <AdminOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-red-400">Hata: {error}</div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-900">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">🎭 Dinamik Roller</h1>
                <p className="text-sm text-slate-400 mt-1">Hiyerarşik rol sistemi ve kriter yönetimi</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-slate-400">Kategori Filtresi:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setExpandedRoles(new Set()); // Tüm genişletmeleri sıfırla
                      setSelectedMainRoleId(null);
                      setSelectedSubRoleId(null);
                      setEditingRole(null);
                    }}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="candidate">Aday</option>
                    <option value="employer">İşveren / Firma</option>
                    <option value="advertiser">Reklamveren</option>
                    <option value="service_provider">Hizmet Veren</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                >
                  ← Geri
                </Link>
                <button 
                  onClick={() => {
                    setCreateForm((p) => ({
                      ...p,
                      category: selectedMainRole?.category || "candidate",
                      parentRole: selectedMainRole?._id || "",
                    }));
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm"
                >
                  + Yeni Rol
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{roles.length}</div>
              <div className="text-sm text-slate-400">Toplam Rol</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {roles.filter(r => r.isActive).length}
              </div>
              <div className="text-sm text-slate-400">Aktif Rol</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {roles.filter(r => r.level === 0).length}
              </div>
              <div className="text-sm text-slate-400">Ana Rol</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {roles.filter(r => r.level > 0).length}
              </div>
              <div className="text-sm text-slate-400">Alt Rol</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setCreateForm((p) => ({
                    ...p,
                    category: selectedMainRole?.category || "candidate",
                    parentRole: selectedMainRole?._id || "",
                  }));
                  setShowCreateModal(true);
                }}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                + Yeni Alt Rol
              </button>

              <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-200">Ana Roller</h2>
                  <span className="text-xs text-slate-400">{mainRoles.length} rol</span>
                </div>

                <div className="max-h-[calc(100vh-340px)] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 sticky top-0">
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 text-left">Rol</th>
                        <th className="px-3 py-2 text-right">Alt</th>
                      </tr>
                    </thead>
                    <tbody>
                     {mainRoles.map((role) => (
                        <tr
                          key={role._id}
                          className={`border-t border-slate-800 cursor-pointer hover:bg-slate-800/50 ${selectedMainRoleId === role._id ? "bg-sky-500/15 ring-1 ring-inset ring-sky-500/40" : "bg-slate-900/40"}`}
                          onClick={() => {
                            setSelectedMainRoleId(role._id);
                            setSelectedSubRoleId(null);
                            setEditingRole(null);
                          }}
                        >
                          <td className={`px-3 py-2 ${selectedMainRoleId === role._id ? "border-l-4 border-sky-400" : "border-l-4 border-transparent"}`}>
                            <div className="flex items-center gap-2">
                              <span>{role.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-slate-100">{role.displayName}</div>
                                  {selectedMainRoleId === role._id ? (
                                    <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                                      Seçili
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-slate-400">{role.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-slate-400">
                            {(subRolesByCategory.get(role.category) || []).length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Alt Roller</h2>

              {!selectedMainRole ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Soldan bir ana rol seç.
                </div>
              ) : selectedMainSubRoles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Bu ana role bağlı henüz alt rol yok.
                </div>
              ) : (
                <div className="max-h-[calc(100vh-300px)] overflow-auto">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">
                      {selectedMainRole.displayName} / {selectedMainSubRoles.length} alt rol
                    </div>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 sticky top-0">
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 text-left">Key</th>
                        <th className="px-3 py-2 text-left">Etiket</th>
                        <th className="px-3 py-2 text-left">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMainSubRoles
                        .slice()
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.displayName.localeCompare(b.displayName, "tr"))
                        .map((role) => (
                          <tr
                            key={role._id}
                            className={`border-t border-slate-800 cursor-pointer hover:bg-slate-800/50 ${selectedSubRoleId === role._id ? "bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/40" : "bg-slate-900/40"}`}
                            onClick={() => {
                              setSelectedSubRoleId(role._id);
                              setEditingRole({ ...role });
                            }}
                          >
                            <td className={`px-3 py-2 text-xs font-mono text-slate-300 ${selectedSubRoleId === role._id ? "border-l-4 border-emerald-400" : "border-l-4 border-transparent"}`}>{role.name}</td>
                            <td className="px-3 py-2 text-sm text-slate-100">
                              <div className="flex items-center gap-2">
                                <span>{role.displayName}</span>
                                {selectedSubRoleId === role._id ? (
                                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                    Seçili
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">{role.isActive ? "Aktif" : "Pasif"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Detay / Düzenleme</h2>

              {!selectedMainRole ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Soldan bir ana rol seç.
                </div>
              ) : !editingRole ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Ortadan bir alt rol seç veya yeni alt rol ekle.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Rol Adı</label>
                    <input
                      type="text"
                      value={editingRole.name}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Görünen Ad</label>
                    <input
                      type="text"
                      value={editingRole.displayName}
                      onChange={(e) => setEditingRole({ ...editingRole, displayName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                    <textarea
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                      <input
                        type="text"
                        value={editingRole.category}
                        readOnly
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Seviye</label>
                      <input
                        type="number"
                        value={editingRole.level}
                        readOnly
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">İkon</label>
                      <input
                        type="text"
                        value={editingRole.icon}
                        onChange={(e) => setEditingRole({ ...editingRole, icon: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
                      <input
                        type="text"
                        value={editingRole.color}
                        onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingRole.isActive}
                      onChange={(e) => setEditingRole({ ...editingRole, isActive: e.target.checked })}
                    />
                    Aktif
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const original = selectedMainSubRoles.find((r) => r._id === editingRole._id);
                        setEditingRole(original ? { ...original } : null);
                      }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
                    >
                      Geri Al
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(editingRole)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
                    >
                      {editingRole.isActive ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(editingRole._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveRole(editingRole)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-100 mb-2">Yeni Alt Rol Oluştur</h2>

              {createForm.parentRole && (() => {
                const parent = roles.find((r) => r._id === createForm.parentRole);
                return parent ? (
                  <div className="mb-3 text-sm text-sky-300 bg-sky-950/30 border border-sky-800/50 rounded-lg px-3 py-2">
                    {parent.icon} <strong>{parent.displayName}</strong> altına yeni alt rol ekleniyor
                  </div>
                ) : null;
              })()}

              {createError ? (
                <div className="mb-3 text-sm text-red-300 bg-red-950/30 border border-red-800/60 rounded-lg px-3 py-2">
                  {createError}
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Rol Key (name)</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      placeholder="driver / courier / ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Görünen Ad</label>
                    <input
                      type="text"
                      value={createForm.displayName}
                      onChange={(e) => setCreateForm((p) => ({ ...p, displayName: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                      placeholder="Sürücü"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Hangi ana rolün altına eklenecek?</label>
                  <select
                    value={createForm.parentRole}
                    onChange={(e) => {
                      const selected = roles.find((r) => r._id === e.target.value);
                      setCreateForm((p) => ({
                        ...p,
                        parentRole: e.target.value,
                        category: selected?.category || p.category,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  >
                    <option value="">-- Ana rol seçin --</option>
                    {roles
                      .filter((r) => r.level === 0)
                      .map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.icon} {r.displayName}
                        </option>
                      ))}
                  </select>
                  {!createForm.parentRole && (
                    <p className="text-[11px] text-amber-400/80 mt-1">Ana rol seçimi zorunludur.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">İkon</label>
                    <input
                      type="text"
                      value={createForm.icon}
                      onChange={(e) => setCreateForm((p) => ({ ...p, icon: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
                    <input
                      type="text"
                      value={createForm.color}
                      onChange={(e) => setCreateForm((p) => ({ ...p, color: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sıralama</label>
                    <input
                      type="number"
                      value={createForm.sortOrder}
                      onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={createForm.isActive}
                      onChange={(e) => setCreateForm((p) => ({ ...p, isActive: e.target.checked }))}
                    />
                    <div className="text-sm text-slate-300">Aktif</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
                  disabled={creating}
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    try {
                      setCreateError(null);
                      if (!createForm.parentRole) {
                        setCreateError("Lütfen ana rol seçin.");
                        return;
                      }
                      setCreating(true);
                      const token = getToken();
                      if (!token) throw new Error("Token bulunamadı");

                      const payload: any = {
                        name: String(createForm.name || "").trim(),
                        displayName: String(createForm.displayName || "").trim(),
                        description: String(createForm.description || "").trim(),
                        category: createForm.category,
                        level: 1, // Alt roller için level = 1
                        parentRole: createForm.parentRole || null,
                        icon: createForm.icon,
                        color: createForm.color,
                        sortOrder: createForm.sortOrder,
                        isActive: createForm.isActive,
                      };

                      const res = await fetch("/api/admin/dynamic-roles", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      const data = await res.json().catch(() => ({}));
                      if (res.status === 401 || res.status === 403) {
                        handleAuthFailure(data?.message);
                        return;
                      }
                      if (!res.ok || !data?.success) {
                        throw new Error(data?.message || `HTTP ${res.status}: Rol oluşturulamadı`);
                      }

                      setShowCreateModal(false);
                      setCreateForm({
                        name: "",
                        displayName: "",
                        description: "",
                        category: "candidate",
                        parentRole: "",
                        icon: "🎭",
                        color: "#6366f1",
                        sortOrder: 0,
                        isActive: true,
                      });

                      await fetchRoles();
                    } catch (e: any) {
                      setCreateError(e?.message || "Rol oluşturulamadı");
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded"
                  disabled={creating}
                >
                  {creating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
