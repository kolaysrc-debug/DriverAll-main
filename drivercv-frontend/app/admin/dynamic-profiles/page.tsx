"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dynamic-profiles/page.tsx

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";

type RoleItem = {
  _id: string;
  name: string;
  displayName: string;
  category?: string;
  parentRole?: string | null;
  level?: number;
  isActive?: boolean;
};

interface DynamicProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: {
    _id: string;
    name: string;
    displayName: string;
    category: string;
    icon: string;
    color: string;
  };
  basicInfo: {
    fullName: string;
    phone: string;
    email: string;
    about: string;
  };
  location: {
    countryCode: string;
    stateCode: string;
    stateName: string;
    districtCode: string;
    districtName: string;
  };
  status: {
    isProfileComplete: boolean;
    isVerified: boolean;
    completionPercentage: number;
  };
  stats: {
    profileViews: number;
    lastLogin: string;
    lastProfileUpdate: string;
    completedFields: number;
    totalFields: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DynamicProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DynamicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [filter, setFilter] = useState({
    role: "",
    category: "",
    isComplete: "",
    isVerified: "",
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProfiles();
  }, [filter]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAuthFailure = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      router.replace("/login");
    }
  };

  const isAuthError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("yetkisiz");
  };

  const fetchRoles = async () => {
    if (rolesLoaded) return;
    try {
      const token = getToken();
      const response = await fetch("/api/admin/dynamic-roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }
        throw new Error(data?.message || `HTTP ${response.status}: Roller yüklenemedi`);
      }

      const list: RoleItem[] = Array.isArray(data?.roles) ? data.roles : [];
      setRoles(list);
      setRolesLoaded(true);
    } catch {
      setRolesLoaded(true);
    }
  };

  const roleById = useMemo(() => new Map<string, RoleItem>(roles.map((r) => [String(r._id), r])), [roles]);

  const rolesByCategory = useMemo(() => {
    const catKey = (c?: string) => (c === "admin" ? "admin" : c === "business" ? "business" : "candidate");
    const byCat: Record<string, RoleItem[]> = { candidate: [], business: [], admin: [] };
    roles.forEach((r) => {
      byCat[catKey(r.category)].push(r);
    });

    const getParentName = (r: RoleItem) => {
      if (!r.parentRole) return "";
      const p = roleById.get(String(r.parentRole));
      return String(p?.displayName || p?.name || "");
    };

    const sortFn = (a: RoleItem, b: RoleItem) => {
      const aP = getParentName(a);
      const bP = getParentName(b);
      const pcmp = aP.localeCompare(bP, "tr");
      if (pcmp !== 0) return pcmp;
      const la = a.level ?? (a.parentRole ? 1 : 0);
      const lb = b.level ?? (b.parentRole ? 1 : 0);
      if (la !== lb) return la - lb;
      return String(a.displayName || a.name).localeCompare(String(b.displayName || b.name), "tr");
    };

    byCat.candidate.sort(sortFn);
    byCat.business.sort(sortFn);
    byCat.admin.sort(sortFn);
    return byCat;
  }, [roles, roleById]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const params = new URLSearchParams();
      if (filter.role) params.append("role", filter.role);
      if (filter.category) params.append("category", filter.category);
      if (filter.isComplete !== "") params.append("isComplete", filter.isComplete);
      if (filter.isVerified !== "") params.append("isVerified", filter.isVerified);
      params.append("page", filter.page.toString());
      params.append("limit", filter.limit.toString());

      const response = await fetch(`/api/profile/dynamic/admin/list?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }
        throw new Error(data?.message || `HTTP ${response.status}: Profiller yüklenemedi`);
      }
      setProfiles(data.profiles || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthFailure();
        return;
      }
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter((prev) => {
      if (key === "role") {
        return { ...prev, role: value, category: value ? "" : prev.category, page: 1 };
      }
      if (key === "category") {
        return { ...prev, category: value, role: value ? "" : prev.role, page: 1 };
      }
      return { ...prev, [key]: value, page: 1 };
    });
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

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
                <h1 className="text-2xl font-bold text-slate-100">👤 Dinamik Profiller</h1>
                <p className="text-sm text-slate-400 mt-1">Role-based profil yönetimi</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                >
                  ← Geri
                </Link>
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="mb-6 bg-slate-800/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rol</label>
                <select
                  value={filter.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                >
                  <option value="">Tümü</option>
                  {roles.length > 0 ? (
                    <>
                      <optgroup label="Aday">
                        {rolesByCategory.candidate.map((r) => {
                          const p = r.parentRole ? roleById.get(String(r.parentRole)) : null;
                          const isChild = !!r.parentRole;
                          const label = isChild
                            ? `  ${p?.displayName || p?.name || ""} › ${r.displayName || r.name}`.trim()
                            : `${r.displayName || r.name}`;
                          return (
                            <option key={r._id} value={r.name}>
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="İşletme">
                        {rolesByCategory.business.map((r) => {
                          const p = r.parentRole ? roleById.get(String(r.parentRole)) : null;
                          const isChild = !!r.parentRole;
                          const label = isChild
                            ? `  ${p?.displayName || p?.name || ""} › ${r.displayName || r.name}`.trim()
                            : `${r.displayName || r.name}`;
                          return (
                            <option key={r._id} value={r.name}>
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Admin">
                        {rolesByCategory.admin.map((r) => {
                          const p = r.parentRole ? roleById.get(String(r.parentRole)) : null;
                          const isChild = !!r.parentRole;
                          const label = isChild
                            ? `  ${p?.displayName || p?.name || ""} › ${r.displayName || r.name}`.trim()
                            : `${r.displayName || r.name}`;
                          return (
                            <option key={r._id} value={r.name}>
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                    </>
                  ) : null}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                <select
                  value={filter.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                >
                  <option value="">Tümü</option>
                  <option value="candidate">Aday</option>
                  <option value="business">İşletme</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Profil Durumu</label>
                <select
                  value={filter.isComplete}
                  onChange={(e) => handleFilterChange("isComplete", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                >
                  <option value="">Tümü</option>
                  <option value="true">Tamamlandı</option>
                  <option value="false">Tamamlanmadı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Doğrulama</label>
                <select
                  value={filter.isVerified}
                  onChange={(e) => handleFilterChange("isVerified", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                >
                  <option value="">Tümü</option>
                  <option value="true">Doğrulanmış</option>
                  <option value="false">Doğrulanmamış</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchProfiles}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm w-full"
                >
                  Filtrele
                </button>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{pagination.total}</div>
              <div className="text-sm text-slate-400">Toplam Profil</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {profiles.filter(p => p.status.isProfileComplete).length}
              </div>
              <div className="text-sm text-slate-400">Tamamlanmış Profil</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {profiles.filter(p => p.status.isVerified).length}
              </div>
              <div className="text-sm text-slate-400">Doğrulanmış Profil</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {profiles.length > 0 
                  ? Math.round(profiles.reduce((sum, p) => sum + p.status.completionPercentage, 0) / profiles.length)
                  : 0}%
              </div>
              <div className="text-sm text-slate-400">Ortalama Tamamlanma</div>
            </div>
          </div>

          {/* Profil Listesi */}
          <div className="bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Lokasyon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tamamlanma
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Son Güncelleme
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {profiles.map((profile) => (
                    <tr key={profile._id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {profile.basicInfo?.fullName || (profile.user as any)?.name || "—"}
                          </div>
                          <div className="text-sm text-slate-400">{(profile.user as any)?.email || "—"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{profile.role?.icon || "○"}</span>
                          <div>
                            <div className="text-sm font-medium text-slate-100">
                              {profile.role?.displayName || "—"}
                            </div>
                            <div className="text-xs text-slate-400">{profile.role?.name || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-300">
                          {profile.location?.stateName || "-"}
                          {profile.location?.districtName && ` / ${profile.location.districtName}`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              profile.status?.isProfileComplete
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {profile.status?.isProfileComplete ? "Tamamlandı" : "Eksik"}
                          </span>
                          {profile.status?.isVerified && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-sky-500/20 text-sky-400">
                              Doğrulanmış
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-sky-500 h-2 rounded-full"
                                style={{ width: `${profile.status?.completionPercentage ?? 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-slate-300">
                            {profile.status?.completionPercentage ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-300">
                          {profile.stats?.lastProfileUpdate ? new Date(profile.stats.lastProfileUpdate).toLocaleDateString("tr-TR") : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs">
                            Görüntüle
                          </button>
                          <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
                            Düzenle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sayfalama */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {pagination.total} profilden {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} arası
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50"
                >
                  Önceki
                </button>
                <span className="text-sm text-slate-300">
                  Sayfa {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
