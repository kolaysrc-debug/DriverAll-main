"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/subusers/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";

interface SubUser {
  _id: string;
  parentUser: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  phone: string;
  role: {
    _id: string;
    name: string;
    displayName: string;
    category: string;
  };
  assignedBranches: Array<{
    branch: {
      _id: string;
      name: string;
      displayName: string;
    };
    isPrimary: boolean;
    permissions: string[];
  }>;
  permissions: Array<{
    module: string;
    actions: Array<{
      action: string;
      allowed: boolean;
    }>;
  }>;
  locationRestrictions: {
    type: string;
    allowedStates: string[];
    allowedDistricts: string[];
  };
  status: {
    isActive: boolean;
    isApproved: boolean;
    approvalDate: string;
    lastLogin: string;
    passwordResetRequired: boolean;
  };
  profile?: {
    avatar?: string;
    title?: string;
    department?: string;
    about?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SubUsersPage() {
  const [subusers, setSubUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const fetchSubUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await fetch("/api/admin/subusers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Alt kullanıcılar yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Alt kullanıcılar yüklenemedi");
      }
      
      setSubUsers(data.subusers);
    } catch (err) {
      console.error("Alt kullanıcılar yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubUsers = subusers.filter(subuser => {
    const statusMatch = selectedStatus === "all" || 
      (selectedStatus === "active" && subuser.status.isActive && subuser.status.isApproved) ||
      (selectedStatus === "pending" && !subuser.status.isApproved) ||
      (selectedStatus === "inactive" && !subuser.status.isActive);
    
    const roleMatch = selectedRole === "all" || subuser.role.category === selectedRole;
    
    const searchMatch = searchTerm === "" || 
      subuser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subuser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subuser.parentUser.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && roleMatch && searchMatch;
  });

  const roles = Array.from(new Set(subusers.map(subuser => subuser.role.category)));

  const getRoleIcon = (category: string) => {
    const icons: Record<string, string> = {
      candidate: "👤",
      business: "🏢",
      admin: "👨‍💼"
    };
    return icons[category] || "👤";
  };

  const getRoleColor = (category: string) => {
    const colors: Record<string, string> = {
      candidate: "purple",
      business: "green",
      admin: "red"
    };
    return colors[category] || "slate";
  };

  if (loading) {
    return (
      <AdminOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Yükleniyor...</div>
        </div>
      </AdminOnly>
    );
  }

  if (error) {
    return (
      <AdminOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
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
                <h1 className="text-2xl font-bold text-slate-100">👥 Alt Kullanıcılar</h1>
                <p className="text-sm text-slate-400 mt-1">İşletme ve admin alt kullanıcıları</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  >
                    <option value="all">Tüm Roller</option>
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {getRoleIcon(role)} {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="pending">Bekleyen</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                >
                  ← Geri
                </Link>
                <Link
                  href="/admin/subusers/new"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm"
                >
                  + Yeni Kullanıcı
                </Link>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{subusers.length}</div>
              <div className="text-sm text-slate-400">Toplam Alt Kullanıcı</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {subusers.filter(u => u.status.isActive && u.status.isApproved).length}
              </div>
              <div className="text-sm text-slate-400">Aktif Kullanıcı</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {subusers.filter(u => !u.status.isApproved).length}
              </div>
              <div className="text-sm text-slate-400">Bekleyen Onay</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {subusers.filter(u => u.status.passwordResetRequired).length}
              </div>
              <div className="text-sm text-slate-400">Şifre Değişimi</div>
            </div>
          </div>

          {/* Alt Kullanıcılar Listesi */}
          <div className="space-y-4">
            {filteredSubUsers.map((subuser) => (
              <div key={subuser._id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getRoleIcon(subuser.role.category)}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{subuser.name}</h3>
                      <p className="text-sm text-slate-400">{subuser.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ana Kullanıcı: {subuser.parentUser.name} ({subuser.parentUser.email})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-${getRoleColor(subuser.role.category)}-500/20 text-${getRoleColor(subuser.role.category)}-400`}
                    >
                      {subuser.role.displayName}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        subuser.status.isActive && subuser.status.isApproved
                          ? "bg-emerald-500/20 text-emerald-400"
                          : !subuser.status.isApproved
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {subuser.status.isApproved 
                        ? (subuser.status.isActive ? "Aktif" : "Pasif")
                        : "Bekleyen"
                      }
                    </span>
                    {subuser.status.passwordResetRequired && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        Şifre Değişimi
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">İletişim:</span>
                    <div className="text-slate-300">{subuser.phone}</div>
                    {subuser.profile?.title && (
                      <div className="text-xs text-slate-500">Unvan: {subuser.profile?.title}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">Atanan Şubeler:</span>
                    <div className="text-slate-300">
                      {subuser.assignedBranches.length > 0 ? (
                        subuser.assignedBranches.map(ab => (
                          <div key={ab.branch._id} className="flex items-center space-x-2">
                            <span>{ab.branch.displayName}</span>
                            {ab.isPrimary && (
                              <span className="text-xs text-purple-400">(Ana)</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Şube atanmamış</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Yetkiler:</span>
                    <div className="text-slate-300">
                      {subuser.permissions.map(perm => (
                        <div key={perm.module} className="text-xs">
                          {perm.module}: {perm.actions.filter(a => a.allowed).map(a => a.action).join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Lokasyon Kısıtlaması:</span>
                    <div className="text-slate-300">
                      {subuser.locationRestrictions.type === "none" 
                        ? "Kısıtlama yok"
                        : subuser.locationRestrictions.type === "state"
                        ? `${subuser.locationRestrictions.allowedStates.length} il`
                        : subuser.locationRestrictions.type === "district"
                        ? `${subuser.locationRestrictions.allowedDistricts.length} ilçe`
                        : subuser.locationRestrictions.type
                      }
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">
                    Düzenle
                  </button>
                  <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm">
                    Yetkiler
                  </button>
                  <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">
                    Şube Ata
                  </button>
                  <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm">
                    Şifre Sıfırla
                  </button>
                  <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm">
                    {subuser.status.isApproved ? "Pasif Yap" : "Onayla"}
                  </button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSubUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {searchTerm || selectedStatus !== "all" || selectedRole !== "all"
                  ? "Arama kriterlerinize uygun kullanıcı bulunamadı." 
                  : "Henüz alt kullanıcı tanımlanmamış."
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
