"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/approvals/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";
import { getToken, clearSession } from "@/lib/session";

interface AdvertiserUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvalNote?: string;
  rejectionReason?: string;
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdvertiserUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleAuthFailure = (message?: string) => {
    clearSession();
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/register/auth");
  };

  const apiFetch = async (path: string, init?: RequestInit) => {
    try {
      return await fetch(path, init);
    } catch (err) {
      const msg = String((err as any)?.message || err || "");
      const isNetwork = err instanceof TypeError || msg.toLowerCase().includes("failed to fetch");
      if (!isNetwork) throw err;
      const directUrl = `http://127.0.0.1:3002${path}`;
      return await fetch(directUrl, init);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [selectedStatus]);

  const fetchApprovals = async () => {
    try {
      const token = getToken();
      if (!token) {
        return handleAuthFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      let url = "/api/admin/approvals/advertisers";
      const status = String(selectedStatus || "pending").toLowerCase();
      if (status !== "all") {
        url += `?status=${encodeURIComponent(status)}`;
      }

      const response = await apiFetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        return handleAuthFailure(errorData?.message || `HTTP ${response.status}: Oturum geçersiz`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Onaylar yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Onaylar yüklenemedi");
      }

      const list = Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
    } catch (err) {
      console.error("Onaylar yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, note?: string) => {
    try {
      const token = getToken();
      if (!token) {
        return handleAuthFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await apiFetch(`/api/admin/approvals/advertisers/${encodeURIComponent(userId)}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: note || "" }),
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        return handleAuthFailure(errorData?.message || `HTTP ${response.status}: Oturum geçersiz`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Onaylama başarısız`);
      }

      const data = await response.json().catch(() => ({}));
      if (data && data.success === false) throw new Error(data.message || "Onaylama başarısız");

      setUsers((prev) =>
        (Array.isArray(prev) ? prev : []).map((u) =>
          u._id === userId
            ? {
                ...u,
                isApproved: true,
                isActive: true,
                approvedAt: new Date().toISOString(),
                approvalNote: note || u.approvalNote,
              }
            : u
        )
      );
    } catch (err) {
      console.error("Onaylama hatası:", err);
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    try {
      const token = getToken();
      if (!token) {
        return handleAuthFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await apiFetch(`/api/admin/approvals/advertisers/${encodeURIComponent(userId)}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason || "" }),
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        return handleAuthFailure(errorData?.message || `HTTP ${response.status}: Oturum geçersiz`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Reddetme başarısız`);
      }

      const data = await response.json().catch(() => ({}));
      if (data && data.success === false) throw new Error(data.message || "Reddetme başarısız");

      setUsers((prev) =>
        (Array.isArray(prev) ? prev : []).map((u) =>
          u._id === userId
            ? {
                ...u,
                isApproved: false,
                isActive: false,
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason || u.rejectionReason,
              }
            : u
        )
      );
    } catch (err) {
      console.error("Reddetme hatası:", err);
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    const name = String(u.name || "");
    const email = String(u.email || "");
    const searchMatch =
      searchTerm === "" ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      approved: "emerald",
      rejected: "red"
    };
    return colors[status] || "slate";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Bekliyor",
      approved: "Onaylandı",
      rejected: "Reddedildi"
    };
    return labels[status] || status;
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
                <h1 className="text-2xl font-bold text-slate-100">✅ Reklamveren Onayları</h1>
                <p className="text-sm text-slate-400 mt-1">Advertiser başvurularını onayla / reddet</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Onay ara..."
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
                    <option value="pending">Bekleyen</option>
                    <option value="approved">Onaylanan</option>
                    <option value="rejected">Reddedilen</option>
                  </select>
                </div>
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                >
                  ← Geri
                </Link>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{users.length}</div>
              <div className="text-sm text-slate-400">Toplam Onay</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {users.filter((u) => !u.isApproved && u.isActive !== false).length}
              </div>
              <div className="text-sm text-slate-400">Bekleyen</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {users.filter((u) => u.isApproved === true).length}
              </div>
              <div className="text-sm text-slate-400">Onaylanan</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {users.filter((u) => u.isActive === false).length}
              </div>
              <div className="text-sm text-slate-400">Reddedilen</div>
            </div>
          </div>

          {/* Onaylar Listesi */}
          <div className="space-y-4">
            {filteredUsers.map((u) => {
              const status = u.isActive === false ? "rejected" : u.isApproved ? "approved" : "pending";
              const requestDate = u.createdAt || "";

              return (
              <div key={u._id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📣</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{u.name || "(İsim yok)"}</h3>
                      <p className="text-sm text-slate-400">{u.email || "(E-posta yok)"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-${getStatusColor(status)}-500/20 text-${getStatusColor(status)}-400`}
                    >
                      {getStatusLabel(status)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {requestDate ? new Date(requestDate).toLocaleDateString("tr-TR") : "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Rol:</span>
                    <div className="text-slate-300">{String(u.role || "advertiser")}</div>
                    <div className="text-xs text-slate-500">Aktif: {u.isActive === false ? "hayır" : "evet"}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Talep Tarihi:</span>
                    <div className="text-slate-300">
                      {requestDate ? new Date(requestDate).toLocaleString("tr-TR") : "-"}
                    </div>
                    {u.approvedAt && (
                      <div className="text-xs text-slate-500">
                        Onay: {new Date(u.approvedAt).toLocaleString("tr-TR")}
                      </div>
                    )}
                    {u.rejectedAt && (
                      <div className="text-xs text-slate-500">
                        Red: {new Date(u.rejectedAt).toLocaleString("tr-TR")}
                      </div>
                    )}
                  </div>
                </div>

                {u.approvalNote && (
                  <div className="mt-3">
                    <span className="text-slate-400 text-sm">Notlar:</span>
                    <div className="text-slate-300 text-sm mt-1">{u.approvalNote}</div>
                  </div>
                )}

                {status === "pending" && (
                  <div className="mt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(u._id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm"
                    >
                      ✅ Onayla
                    </button>
                    <button
                      onClick={() => handleReject(u._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      ❌ Reddet
                    </button>
                  </div>
                )}
              </div>
            );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {searchTerm || selectedStatus !== "all"
                  ? "Arama kriterlerinize uygun onay bulunamadı." 
                  : "Henüz bekleyen onay bulunmuyor."
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
