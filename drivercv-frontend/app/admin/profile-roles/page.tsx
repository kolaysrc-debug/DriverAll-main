"use client";

// GMN Entegrasyonlu Profil Roller Yönetimi
// - Oluştur, düzenle, sil
// - Yetki belirleme
// - GMN logic entegrasyonu

import React, { useState, useEffect } from "react";

interface ProfileRole {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
  };
  gmnCriteria?: {
    experienceMin: number;
    experienceMax: number;
    requiredSkills: string[];
    locationRestrictions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProfileRolesPage() {
  const [roles, setRoles] = useState<ProfileRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<ProfileRole | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile-roles");
      if (!res.ok) throw new Error("Roller yuklenemedi");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRole(roleData: Partial<ProfileRole>) {
    try {
      const res = await fetch("/api/admin/profile-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData),
      });

      if (!res.ok) throw new Error("Rol olusturulamadi");
      
      await loadRoles();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUpdateRole(roleId: string, roleData: Partial<ProfileRole>) {
    try {
      const res = await fetch(`/api/admin/profile-roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData),
      });

      if (!res.ok) throw new Error("Rol guncellenemedi");
      
      await loadRoles();
      setEditingRole(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!confirm("Bu rolu silmek istediginizden emin misiniz?")) return;
    
    try {
      const res = await fetch(`/api/admin/profile-roles/${roleId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Rol silinemedi");
      
      await loadRoles();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Profil Roller</h1>
              <div className="text-sm text-slate-400">GMN entegrasyonlu rol yonetimi</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Rol
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400">Yukleniyor...</div>
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-4">
            <div className="text-red-300">{error}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Toplam Roller</div>
                <div className="text-2xl font-bold">{roles.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Aktif Roller</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {roles.filter(r => r.isActive).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">GMN Optimize</div>
                <div className="text-2xl font-bold text-blue-400">
                  {roles.filter(r => r.gmnCriteria).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Admin Yetkili</div>
                <div className="text-2xl font-bold text-purple-400">
                  {roles.filter(r => r.permissions.canManageUsers).length}
                </div>
              </div>
            </div>

            {/* Roles List */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold">Profil Roller</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {roles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    Henüz profil rolü tanimlanmamis
                  </div>
                ) : (
                  roles.map((role) => (
                    <div key={role._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              role.isActive 
                                ? 'bg-emerald-900/50 text-emerald-300' 
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {role.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            {role.gmnCriteria && (
                              <span className="px-2 py-1 text-xs rounded bg-blue-900/50 text-blue-300">
                                GMN
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-slate-400">{role.description}</p>
                          )}
                          
                          {/* GMN Criteria */}
                          {role.gmnCriteria && (
                            <div className="mt-3 p-3 bg-blue-950/20 rounded-lg">
                              <div className="text-xs font-semibold text-blue-300 mb-2">GMN Kriterleri</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-400">Deneyim:</span>
                                  <span className="text-slate-200">
                                    {role.gmnCriteria.experienceMin}-{role.gmnCriteria.experienceMax} yil
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Gerekli Yetenekler:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {role.gmnCriteria.requiredSkills.map((skill, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Permissions */}
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-400 mb-1">Yetkiler:</div>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.canCreate && (
                                <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">
                                  Olustur
                                </span>
                              )}
                              {role.permissions.canEdit && (
                                <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                                  Duzenle
                                </span>
                              )}
                              {role.permissions.canDelete && (
                                <span className="px-2 py-1 bg-red-900/50 text-red-300 text-xs rounded">
                                  Sil
                                </span>
                              )}
                              {role.permissions.canManageUsers && (
                                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded">
                                  Kullanici Yonetimi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
                          >
                            Duzenle
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role._id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRole) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingRole ? "Rol Duzenle" : "Yeni Rol Olustur"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRole(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            
            <RoleForm
              role={editingRole}
              onSubmit={editingRole ? 
                (data) => handleUpdateRole(editingRole._id, data) : 
                handleCreateRole
              }
              onCancel={() => {
                setShowCreateModal(false);
                setEditingRole(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Role Form Component
function RoleForm({ role, onSubmit, onCancel }: {
  role: ProfileRole | null;
  onSubmit: (data: Partial<ProfileRole>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    permissions: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManageUsers: false,
    },
    gmnCriteria: {
      experienceMin: 0,
      experienceMax: 50,
      requiredSkills: [] as string[],
      locationRestrictions: [] as string[],
    },
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        isActive: role.isActive,
        permissions: role.permissions,
        gmnCriteria: role.gmnCriteria || {
          experienceMin: 0,
          experienceMax: 50,
          requiredSkills: [] as string[],
          locationRestrictions: [] as string[],
        },
      });
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Rol Adi</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Aciklama</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          rows={3}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="bg-slate-950 border border-slate-800 rounded text-slate-100 focus:ring-2 focus:ring-sky-500"
        />
        <label className="ml-2 text-sm text-slate-300">Aktif</label>
      </div>

      {/* Permissions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Yetkiler</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions.canCreate}
              onChange={(e) => setFormData({ 
                ...formData, 
                permissions: { ...formData.permissions, canCreate: e.target.checked }
              })}
              className="bg-slate-950 border border-slate-800 rounded text-slate-100 focus:ring-2 focus:ring-sky-500"
            />
            <span className="ml-2 text-sm text-slate-300">Olustur</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions.canEdit}
              onChange={(e) => setFormData({ 
                ...formData, 
                permissions: { ...formData.permissions, canEdit: e.target.checked }
              })}
              className="bg-slate-950 border border-slate-800 rounded text-slate-100 focus:ring-2 focus:ring-sky-500"
            />
            <span className="ml-2 text-sm text-slate-300">Duzenle</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions.canDelete}
              onChange={(e) => setFormData({ 
                ...formData, 
                permissions: { ...formData.permissions, canDelete: e.target.checked }
              })}
              className="bg-slate-950 border border-slate-800 rounded text-slate-100 focus:ring-2 focus:ring-sky-500"
            />
            <span className="ml-2 text-sm text-slate-300">Sil</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions.canManageUsers}
              onChange={(e) => setFormData({ 
                ...formData, 
                permissions: { ...formData.permissions, canManageUsers: e.target.checked }
              })}
              className="bg-slate-950 border border-slate-800 rounded text-slate-100 focus:ring-2 focus:ring-sky-500"
            />
            <span className="ml-2 text-sm text-slate-300">Kullanici Yonetimi</span>
          </label>
        </div>
      </div>

      {/* GMN Criteria */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">GMN Kriterleri</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Minimum Deneyim</label>
            <input
              type="number"
              value={formData.gmnCriteria.experienceMin}
              onChange={(e) => setFormData({ 
                ...formData, 
                gmnCriteria: { ...formData.gmnCriteria, experienceMin: Number(e.target.value) }
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Maksimum Deneyim</label>
            <input
              type="number"
              value={formData.gmnCriteria.experienceMax}
              onChange={(e) => setFormData({ 
                ...formData, 
                gmnCriteria: { ...formData.gmnCriteria, experienceMax: Number(e.target.value) }
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              min="0"
              max="50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Gerekli Yetenekler</label>
          <input
            type="text"
            value={formData.gmnCriteria.requiredSkills.join(", ")}
            onChange={(e) => setFormData({ 
                ...formData, 
                gmnCriteria: { ...formData.gmnCriteria, requiredSkills: e.target.value.split(",").map(s => s.trim()) }
              })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Virgulle ayirin: ehliyet, src, deneyim"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Lokasyon Kisitlamalari</label>
          <input
            type="text"
            value={formData.gmnCriteria.locationRestrictions.join(", ")}
            onChange={(e) => setFormData({ 
                ...formData, 
                gmnCriteria: { ...formData.gmnCriteria, locationRestrictions: e.target.value.split(",").map(s => s.trim()) }
              })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Virgulle ayirin: Istanbul, Ankara, Izmir"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Iptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          {role ? "Guncelle" : "Olustur"}
        </button>
      </div>
    </form>
  );
}
