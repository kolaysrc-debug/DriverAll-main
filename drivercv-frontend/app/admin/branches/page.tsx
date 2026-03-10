"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/branches/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";

interface Branch {
  _id: string;
  parentUser?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  displayName: string;
  description: string;
  code: string;
  location: {
    countryCode: string;
    stateCode: string;
    stateName: string;
    districtCode: string;
    districtName: string;
    fullAddress: string;
  };
  contact: {
    phone: string;
    mobilePhone: string;
    fax: string;
    email: string;
    website: string;
  };
  manager?: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  status: {
    isActive: boolean;
    isApproved: boolean;
    approvalDate: string;
    isMainBranch: boolean;
  };
  stats: {
    employeeCount: number;
    subUserCount: number;
    jobPostCount: number;
    adPostCount: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  function handleAuthFailure(message: string) {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event("driverall-auth-changed"));
    } catch {}
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleAuthFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }

      const response = await fetch("/api/admin/branches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure(errorData.message || `HTTP ${response.status}: Oturum geçersiz`);
          return;
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Şubeler yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Şubeler yüklenemedi");
      }
      
      setBranches(data.branches);
    } catch (err) {
      console.error("Şubeler yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch => {
    const statusMatch = selectedStatus === "all" || 
      (selectedStatus === "active" && branch.status.isActive && branch.status.isApproved) ||
      (selectedStatus === "pending" && !branch.status.isApproved) ||
      (selectedStatus === "inactive" && !branch.status.isActive);
    
    const displayName = branch.displayName || "";
    const name = branch.name || "";
    const stateName = branch.location?.stateName || "";
    const districtName = branch.location?.districtName || "";
    const parentUserName = branch.parentUser?.name || "";

    const searchMatch = searchTerm === "" || 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parentUserName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

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
                <h1 className="text-2xl font-bold text-slate-100">🏪 Şubeler</h1>
                <p className="text-sm text-slate-400 mt-1">İşletme şubeleri ve lokasyon yönetimi</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Şube ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  />
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
                <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">
                  + Yeni Şube
                </button>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{branches.length}</div>
              <div className="text-sm text-slate-400">Toplam Şube</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {branches.filter(b => b.status.isActive && b.status.isApproved).length}
              </div>
              <div className="text-sm text-slate-400">Aktif Şube</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {branches.filter(b => !b.status.isApproved).length}
              </div>
              <div className="text-sm text-slate-400">Bekleyen Onay</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {branches.filter(b => b.status.isMainBranch).length}
              </div>
              <div className="text-sm text-slate-400">Ana Şube</div>
            </div>
          </div>

          {/* Şubeler Listesi */}
          <div className="space-y-4">
            {filteredBranches.map((branch) => (
              <div key={branch._id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{branch.displayName}</h3>
                      <p className="text-sm text-slate-400">{branch.name} ({branch.code})</p>
                      <p className="text-xs text-slate-500 mt-1">{branch.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        branch.status.isMainBranch
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-slate-600/20 text-slate-400"
                      }`}
                    >
                      {branch.status.isMainBranch ? "Ana Şube" : "Şube"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        branch.status.isActive && branch.status.isApproved
                          ? "bg-emerald-500/20 text-emerald-400"
                          : !branch.status.isApproved
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {branch.status.isApproved 
                        ? (branch.status.isActive ? "Aktif" : "Pasif")
                        : "Bekleyen"
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">İşletme:</span>
                    <div className="text-slate-300">{branch.parentUser?.name || "-"}</div>
                    <div className="text-xs text-slate-500">{branch.parentUser?.email || "-"}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Lokasyon:</span>
                    <div className="text-slate-300">{branch.location?.stateName || "-"} / {branch.location?.districtName || "-"}</div>
                    <div className="text-xs text-slate-500">{branch.location?.fullAddress || "-"}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">İletişim:</span>
                    <div className="text-slate-300">{branch.contact?.phone || "-"}</div>
                    {branch.contact?.email && (
                      <div className="text-xs text-slate-500">{branch.contact.email}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">İstatistikler:</span>
                    <div className="text-slate-300">
                      Alt Kullanıcı: {branch.stats?.subUserCount || 0} | 
                      Çalışan: {branch.stats?.employeeCount || 0}
                    </div>
                    {branch.manager?.name && (
                      <div className="text-xs text-slate-500">
                        Yönetici: {branch.manager.name} ({branch.manager.title || "-"})
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">
                    Düzenle
                  </button>
                  <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm">
                    Detaylar
                  </button>
                  {!branch.status.isMainBranch && (
                    <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">
                      Ana Şube Yap
                    </button>
                  )}
                  <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm">
                    {branch.status.isApproved ? "Pasif Yap" : "Onayla"}
                  </button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredBranches.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {searchTerm || selectedStatus !== "all" 
                  ? "Arama kriterlerinize uygun şube bulunamadı." 
                  : "Henüz şube tanımlanmamış."
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
