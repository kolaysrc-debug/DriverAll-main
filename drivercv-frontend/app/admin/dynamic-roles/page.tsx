"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dynamic-roles/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";

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
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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
        setRoles(roles.map(role => role._id === updatedRole._id ? data.role : role));
        setEditingRole(null);
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
      const token = localStorage.getItem("token");
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
        setRoles(roles.filter(role => role._id !== roleId));
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
      const token = localStorage.getItem("token");
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
        setRoles(roles.map(r => r._id === role._id ? data.role : r));
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
                disabled={role.isSystem}
                className={`px-3 py-1 rounded text-sm disabled:opacity-60 ${
                  role.isActive ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {role.isActive ? "Pasif Yap" : "Aktif Yap"}
              </button>
              {!role.isSystem && (
                <button
                  onClick={() => handleDeleteRole(role._id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Sil
                </button>
              )}
            </div>
          </div>

          {hasChildren && expandedRoles.has(role._id) ? (
            <div className="mt-2">{renderRoleTree(childIds, byId, childrenByParent, level + 1)}</div>
          ) : null}
        </div>
      );
    });
  };

  const visibleRoles = selectedCategory === "all" ? roles : roles.filter((r) => r.category === selectedCategory);
  const byId = new Map<string, Role>(visibleRoles.map((r) => [r._id, r]));
  const childrenByParent = new Map<string, string[]>();
  visibleRoles.forEach((r) => {
    const parentId = r.parentRole ? String(r.parentRole) : "";
    if (!parentId) return;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId)!.push(r._id);
  });
  const rootIds = visibleRoles
    .filter((r) => !r.parentRole)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
    .map((r) => r._id);

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
                    }}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="candidate">Aday</option>
                    <option value="business">İşletme</option>
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
                  onClick={() => setShowCreateModal(true)}
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

          <div className="space-y-4">
            {renderRoleTree(rootIds, byId, childrenByParent)}
          </div>
        </div>

        {/* Düzenleme Modal */}
        {editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Rol Düzenle: {editingRole.displayName}</h2>
              
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
                    onChange={(e) => setEditingRole({...editingRole, displayName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                  <select
                    value={editingRole.category}
                    onChange={(e) => setEditingRole({...editingRole, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    disabled={editingRole.isSystem}
                  >
                    <option value="candidate">Aday</option>
                    <option value="business">İşletme</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Seviye</label>
                  <input
                    type="number"
                    value={editingRole.level}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    min="0"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">İkon</label>
                  <input
                    type="text"
                    value={editingRole.icon}
                    onChange={(e) => setEditingRole({...editingRole, icon: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="🎭"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
                  <input
                    type="text"
                    value={editingRole.color}
                    onChange={(e) => setEditingRole({...editingRole, color: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="#6366f1"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingRole.isActive}
                    onChange={(e) => setEditingRole({...editingRole, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-300">Aktif</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleSaveRole(editingRole)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Yeni Rol Oluştur</h2>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    >
                      <option value="candidate">Aday</option>
                      <option value="business">İşletme</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Parent Rol (alt rol yapmak için)</label>
                    <select
                      value={createForm.parentRole}
                      onChange={(e) => setCreateForm((p) => ({ ...p, parentRole: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    >
                      <option value="">(Ana rol)</option>
                      {roles
                        .filter((r) => !r.parentRole)
                        .map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.displayName} ({r.category})
                          </option>
                        ))}
                    </select>
                  </div>
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
                      setCreating(true);
                      const token = localStorage.getItem("token");
                      if (!token) throw new Error("Token bulunamadı");

                      const payload: any = {
                        name: String(createForm.name || "").trim(),
                        displayName: String(createForm.displayName || "").trim(),
                        description: String(createForm.description || "").trim(),
                        category: createForm.category,
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
