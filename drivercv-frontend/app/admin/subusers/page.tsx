"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/subusers/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { authHeaders } from "@/lib/api/_core";
import { getToken } from "@/lib/session";

type RoleOption = {
  _id: string;
  name: string;
  displayName?: string;
  category?: string;
  isActive?: boolean;
};

type BranchOption = {
  _id: string;
  name: string;
  displayName: string;
};

type PermissionAction = {
  action: string;
  allowed: boolean;
};

type PermissionItem = {
  module: string;
  actions: PermissionAction[];
};

const PERMISSION_MODULES = ["profile", "jobs", "ads", "users", "branches"];
const PERMISSION_ACTIONS = ["create", "read", "update", "delete"];

function buildPermissionDraft(current: PermissionItem[] = []) {
  return PERMISSION_MODULES.map((module) => {
    const existing = current.find((item) => item.module === module);
    return {
      module,
      actions: PERMISSION_ACTIONS.map((action) => ({
        action,
        allowed: !!existing?.actions?.find((a) => a.action === action)?.allowed,
      })),
    };
  });
}

function toSafeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function getRoleBadgeClass(category?: string) {
  const classes: Record<string, string> = {
    candidate: "bg-purple-500/20 text-purple-400",
    business: "bg-green-500/20 text-green-400",
    admin: "bg-red-500/20 text-red-400",
  };
  return classes[category || ""] || "bg-slate-600/20 text-slate-400";
}

interface SubUser {
  _id: string;
  parentUser?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  phone: string;
  role?: {
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
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  const [branchesList, setBranchesList] = useState<BranchOption[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"edit" | "permissions" | "branches" | null>(null);
  const [activeSubUser, setActiveSubUser] = useState<SubUser | null>(null);
  const [savingModal, setSavingModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    title: "",
    department: "",
    role: "",
  });
  const [permissionDraft, setPermissionDraft] = useState<PermissionItem[]>([]);
  const [assignedBranchIds, setAssignedBranchIds] = useState<string[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("");

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const fetchSubUsers = async () => {
    try {
      const token = getToken();
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

  const upsertSubUser = (updated: SubUser) => {
    setSubUsers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
  };

  const fetchReferenceData = async () => {
    const token = getToken();
    if (!token) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }

    const [rolesRes, branchesRes] = await Promise.all([
      fetch("/api/admin/dynamic-roles", { headers: authHeaders() }),
      fetch("/api/admin/branches", { headers: authHeaders() }),
    ]);

    const rolesData = await rolesRes.json().catch(() => ({}));
    const branchesData = await branchesRes.json().catch(() => ({}));

    if (!rolesRes.ok) {
      throw new Error(rolesData?.message || `Roller alınamadı (HTTP ${rolesRes.status})`);
    }
    if (!branchesRes.ok) {
      throw new Error(branchesData?.message || `Şubeler alınamadı (HTTP ${branchesRes.status})`);
    }

    setRolesList(Array.isArray(rolesData?.roles) ? rolesData.roles : []);
    setBranchesList(Array.isArray(branchesData?.branches) ? branchesData.branches : []);
  };

  const runAction = async (subuserId: string, request: () => Promise<any>) => {
    try {
      setActionError(null);
      setActionInfo(null);
      setBusyActionId(subuserId);
      const data = await request();
      if (data?.subuser) {
        upsertSubUser(data.subuser);
      }
      if (data?.message) {
        setActionInfo(data.message);
      }
      return data;
    } catch (err) {
      console.error("Alt kullanıcı aksiyon hatası:", err);
      setActionError(err instanceof Error ? err.message : "İşlem yapılamadı");
      return null;
    } finally {
      setBusyActionId(null);
    }
  };

  const requestJson = async (url: string, init?: RequestInit) => {
    const token = getToken();
    if (!token) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `HTTP ${response.status}: İşlem başarısız`);
    }
    return data;
  };

  const openEditModal = async (subuser: SubUser) => {
    try {
      setActionError(null);
      setActionInfo(null);
      if (rolesList.length === 0 || branchesList.length === 0) {
        await fetchReferenceData();
      }
      setActiveSubUser(subuser);
      setEditForm({
        name: subuser.name || "",
        phone: subuser.phone || "",
        title: subuser.profile?.title || "",
        department: subuser.profile?.department || "",
        role: subuser.role?._id || "",
      });
      setModalType("edit");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Düzenleme formu açılamadı");
    }
  };

  const openPermissionsModal = async (subuser: SubUser) => {
    try {
      setActionError(null);
      setActionInfo(null);
      setActiveSubUser(subuser);
      setPermissionDraft(buildPermissionDraft(subuser.permissions as PermissionItem[]));
      setModalType("permissions");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Yetki formu açılamadı");
    }
  };

  const openBranchesModal = async (subuser: SubUser) => {
    try {
      setActionError(null);
      setActionInfo(null);
      if (branchesList.length === 0) {
        await fetchReferenceData();
      }
      setActiveSubUser(subuser);
      const assigned = toSafeArray(subuser.assignedBranches);
      const normalizedAssigned = assigned.filter((item) => item?.branch?._id);
      setAssignedBranchIds(normalizedAssigned.map((item) => item.branch._id));
      setPrimaryBranchId(normalizedAssigned.find((item) => item.isPrimary)?.branch._id || normalizedAssigned[0]?.branch._id || "");
      setModalType("branches");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Şube atama formu açılamadı");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setActiveSubUser(null);
    setSavingModal(false);
  };

  const saveEditModal = async () => {
    if (!activeSubUser) return;
    setSavingModal(true);
    const data = await runAction(activeSubUser._id, () =>
      requestJson(`/api/admin/subusers/${activeSubUser._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          role: editForm.role,
          profile: {
            ...(activeSubUser.profile || {}),
            title: editForm.title,
            department: editForm.department,
          },
        }),
      })
    );
    setSavingModal(false);
    if (data?.subuser) closeModal();
  };

  const savePermissionsModal = async () => {
    if (!activeSubUser) return;
    setSavingModal(true);
    const data = await runAction(activeSubUser._id, () =>
      requestJson(`/api/admin/subusers/${activeSubUser._id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: permissionDraft }),
      })
    );
    setSavingModal(false);
    if (data?.subuser) closeModal();
  };

  const saveBranchesModal = async () => {
    if (!activeSubUser) return;
    setSavingModal(true);
    const assignedBranches = assignedBranchIds.map((branchId) => ({
      branch: branchId,
      isPrimary: branchId === primaryBranchId,
      permissions: [],
    }));
    const data = await runAction(activeSubUser._id, () =>
      requestJson(`/api/admin/subusers/${activeSubUser._id}`, {
        method: "PUT",
        body: JSON.stringify({ assignedBranches }),
      })
    );
    setSavingModal(false);
    if (data?.subuser) closeModal();
  };

  const handleResetPassword = async (subuser: SubUser) => {
    const newPassword = prompt(`${subuser.name} için yeni şifre girin (en az 6 karakter):`);
    if (!newPassword) return;
    await runAction(subuser._id, async () => {
      const data = await requestJson(`/api/admin/subusers/${subuser._id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      upsertSubUser({
        ...subuser,
        status: {
          ...subuser.status,
          passwordResetRequired: true,
        },
      });
      return data;
    });
  };

  const handleApproveOrToggle = async (subuser: SubUser) => {
    if (!subuser.status.isApproved) {
      await runAction(subuser._id, () =>
        requestJson(`/api/admin/subusers/${subuser._id}/owner-approve`, {
          method: "POST",
          body: JSON.stringify({ notes: "Admin panelinden onaylandı" }),
        })
      );
      return;
    }

    const reason = subuser.status.isActive
      ? prompt("Pasif yapma sebebi (opsiyonel):") || ""
      : "";

    await runAction(subuser._id, () =>
      requestJson(`/api/admin/subusers/${subuser._id}/toggle-active`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
    );
  };

  const filteredSubUsers = subusers.filter(subuser => {
    const statusMatch = selectedStatus === "all" || 
      (selectedStatus === "active" && subuser.status.isActive && subuser.status.isApproved) ||
      (selectedStatus === "pending" && !subuser.status.isApproved) ||
      (selectedStatus === "inactive" && !subuser.status.isActive);
    
    const roleCategory = subuser.role?.category || "";
    const roleMatch = selectedRole === "all" || roleCategory === selectedRole;
    const parentUserName = subuser.parentUser?.name || "";
    const subuserName = subuser.name || "";
    const subuserEmail = subuser.email || "";
    
    const searchMatch = searchTerm === "" || 
      subuserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subuserEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parentUserName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && roleMatch && searchMatch;
  });

  const roles = Array.from(new Set(subusers.map((subuser) => subuser.role?.category).filter(Boolean))) as string[];

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

  const handleDeleteSubUser = async (subuser: SubUser) => {
    const confirmed = confirm(`Alt kullanıcı silinsin mi?\n\n${subuser.name} (${subuser.email})`);
    if (!confirmed) return;

    try {
      setError(null);
      setBusyDeleteId(subuser._id);

      const token = getToken();
      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await fetch(`/api/admin/subusers/${subuser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `HTTP ${response.status}: Alt kullanıcı silinemedi`);
      }

      setSubUsers((prev) => prev.filter((item) => item._id !== subuser._id));
    } catch (err) {
      console.error("Alt kullanıcı silme hatası:", err);
      setError(err instanceof Error ? err.message : "Alt kullanıcı silinemedi");
    } finally {
      setBusyDeleteId(null);
    }
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
            {actionError ? (
              <div className="mb-3 rounded border border-red-800 bg-red-950/30 px-3 py-2 text-sm text-red-300">{actionError}</div>
            ) : null}
            {actionInfo ? (
              <div className="mb-3 rounded border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">{actionInfo}</div>
            ) : null}
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
                    <span className="text-2xl">{getRoleIcon(subuser.role?.category || "")}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{subuser.name || "-"}</h3>
                      <p className="text-sm text-slate-400">{subuser.email || "-"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ana Kullanıcı: {subuser.parentUser?.name || "-"} ({subuser.parentUser?.email || "-"})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(subuser.role?.category)}`}
                    >
                      {subuser.role?.displayName || "Rol yok"}
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
                    <div className="text-slate-300">{subuser.phone || "-"}</div>
                    {subuser.profile?.title && (
                      <div className="text-xs text-slate-500">Unvan: {subuser.profile?.title}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">Atanan Şubeler:</span>
                    <div className="text-slate-300">
                      {toSafeArray(subuser.assignedBranches).filter((ab) => ab?.branch?._id).length > 0 ? (
                        toSafeArray(subuser.assignedBranches).filter((ab) => ab?.branch?._id).map(ab => (
                          <div key={ab.branch._id} className="flex items-center space-x-2">
                            <span>{ab.branch.displayName || ab.branch.name || "-"}</span>
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
                      {toSafeArray(subuser.permissions).map(perm => (
                        <div key={perm.module} className="text-xs">
                          {perm.module}: {toSafeArray(perm.actions).filter(a => a.allowed).map(a => a.action).join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Lokasyon Kısıtlaması:</span>
                    <div className="text-slate-300">
                      {subuser.locationRestrictions?.type === "none" 
                        ? "Kısıtlama yok"
                        : subuser.locationRestrictions?.type === "state"
                        ? `${toSafeArray(subuser.locationRestrictions?.allowedStates).length} il`
                        : subuser.locationRestrictions?.type === "district"
                        ? `${toSafeArray(subuser.locationRestrictions?.allowedDistricts).length} ilçe`
                        : subuser.locationRestrictions?.type || "Kısıtlama yok"
                      }
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(subuser)}
                    disabled={busyActionId === subuser._id}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-900/50 text-white rounded text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => openPermissionsModal(subuser)}
                    disabled={busyActionId === subuser._id}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white rounded text-sm"
                  >
                    Yetkiler
                  </button>
                  <button
                    onClick={() => openBranchesModal(subuser)}
                    disabled={busyActionId === subuser._id}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white rounded text-sm"
                  >
                    Şube Ata
                  </button>
                  <button
                    onClick={() => handleResetPassword(subuser)}
                    disabled={busyActionId === subuser._id}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-900/50 text-white rounded text-sm"
                  >
                    Şifre Sıfırla
                  </button>
                  <button
                    onClick={() => handleApproveOrToggle(subuser)}
                    disabled={busyActionId === subuser._id}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900/50 text-white rounded text-sm"
                  >
                    {busyActionId === subuser._id ? "İşleniyor..." : subuser.status.isApproved ? (subuser.status.isActive ? "Pasif Yap" : "Aktif Yap") : "Onayla"}
                  </button>
                  <button
                    onClick={() => handleDeleteSubUser(subuser)}
                    disabled={busyDeleteId === subuser._id || busyActionId === subuser._id}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:text-slate-300 text-white rounded text-sm"
                  >
                    {busyDeleteId === subuser._id ? "Siliniyor..." : "Sil"}
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

          {modalType && activeSubUser ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      {modalType === "edit" ? "Alt Kullanıcı Düzenle" : modalType === "permissions" ? "Yetkileri Düzenle" : "Şube Ata"}
                    </h2>
                    <p className="text-sm text-slate-400">{activeSubUser.name} ({activeSubUser.email})</p>
                  </div>
                  <button onClick={closeModal} className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">Kapat</button>
                </div>

                {modalType === "edit" ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-400">Ad Soyad</label>
                      <input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Telefon</label>
                      <input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Unvan</label>
                      <input value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Departman</label>
                      <input value={editForm.department} onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400">Rol</label>
                      <select value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200">
                        {rolesList.filter((role) => role.isActive !== false).map((role) => (
                          <option key={role._id} value={role._id}>{role.displayName || role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {modalType === "permissions" ? (
                  <div className="space-y-3">
                    {permissionDraft.map((perm) => (
                      <div key={perm.module} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                        <div className="mb-2 text-sm font-medium capitalize text-slate-200">{perm.module}</div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {perm.actions.map((action) => (
                            <label key={action.action} className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2 text-sm text-slate-200">
                              <input
                                type="checkbox"
                                checked={action.allowed}
                                onChange={(e) => setPermissionDraft((prev) => prev.map((item) => item.module !== perm.module ? item : { ...item, actions: item.actions.map((a) => a.action !== action.action ? a : { ...a, allowed: e.target.checked }) }))}
                              />
                              <span className="capitalize">{action.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {modalType === "branches" ? (
                  <div className="space-y-3">
                    {branchesList.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">Atanabilir şube bulunamadı.</div>
                    ) : (
                      branchesList.map((branch) => {
                        const checked = assignedBranchIds.includes(branch._id);
                        return (
                          <div key={branch._id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
                            <label className="flex items-center gap-3 text-sm text-slate-200">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextChecked = e.target.checked;
                                  setAssignedBranchIds((prev) => nextChecked ? [...prev, branch._id] : prev.filter((id) => id !== branch._id));
                                  if (!nextChecked && primaryBranchId === branch._id) {
                                    setPrimaryBranchId("");
                                  }
                                  if (nextChecked && !primaryBranchId) {
                                    setPrimaryBranchId(branch._id);
                                  }
                                }}
                              />
                              <span>{branch.displayName || branch.name}</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-400">
                              <input
                                type="radio"
                                name="primaryBranch"
                                checked={primaryBranchId === branch._id}
                                disabled={!checked}
                                onChange={() => setPrimaryBranchId(branch._id)}
                              />
                              Ana Şube
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}

                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-600">Vazgeç</button>
                  <button
                    onClick={modalType === "edit" ? saveEditModal : modalType === "permissions" ? savePermissionsModal : saveBranchesModal}
                    disabled={savingModal}
                    className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:bg-sky-900/50"
                  >
                    {savingModal ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminOnly>
  );
}
