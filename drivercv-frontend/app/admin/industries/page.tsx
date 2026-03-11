"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/industries/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { getToken } from "@/lib/session";

interface Industry {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  code: string;
  category: string;
  icon: string;
  color: string;
  customFields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    order: number;
  }>;
  branchStructure: {
    allowsMultipleBranches: boolean;
    requiresMainBranch: boolean;
    branchTypes: Array<{
      type: string;
      name: string;
      description: string;
      isRequired: boolean;
      maxCount?: number;
    }>;
  };
  requirements: {
    licenses: Array<{
      name: string;
      description: string;
      isRequired: boolean;
    }>;
    certifications: Array<{
      name: string;
      description: string;
      isRequired: boolean;
    }>;
    permits: Array<{
      name: string;
      description: string;
      isRequired: boolean;
    }>;
  };
  services: Array<{
    name: string;
    description: string;
    order: number;
  }>;
  isActive: boolean;
  isSystem: boolean;
  stats: {
    companyCount: number;
    branchCount: number;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [editIndustry, setEditIndustry] = useState({
    displayName: "",
    description: "",
    icon: "",
    color: "#6366f1",
    isActive: true,
  });
  const [newIndustry, setNewIndustry] = useState({
    name: "",
    displayName: "",
    description: "",
    code: "",
    category: "transport",
    icon: "",
    color: "#6366f1",
    isActive: true,
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await fetch("/api/admin/industries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Sektörler yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Sektörler yüklenemedi");
      }
      
      setIndustries(data.industries);
    } catch (err) {
      console.error("Sektörler yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(industry => {
    const categoryMatch = selectedCategory === "all" || industry.category === selectedCategory;
    const searchMatch = searchTerm === "" || 
      industry.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      industry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  const categories = Array.from(new Set(industries.map(industry => industry.category)));

  const openEdit = (industry: Industry) => {
    setSelectedIndustry(industry);
    setEditIndustry({
      displayName: industry.displayName || "",
      description: industry.description || "",
      icon: industry.icon || "",
      color: industry.color || "#6366f1",
      isActive: !!industry.isActive,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdateIndustry = async () => {
    try {
      if (!selectedIndustry) return;
      setEditing(true);
      setEditError(null);

      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

      const response = await fetch(`/api/admin/industries/${selectedIndustry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: editIndustry.displayName,
          description: editIndustry.description,
          icon: editIndustry.icon,
          color: editIndustry.color,
          isActive: editIndustry.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Sektör güncellenemedi`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Sektör güncellenemedi");

      setIndustries((prev) => prev.map((i) => (i._id === selectedIndustry._id ? data.industry : i)));
      setShowEditModal(false);
      setSelectedIndustry(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteIndustry = async (industry: Industry) => {
    try {
      if (industry.isSystem) return;
      const ok = window.confirm("Bu sektörü silmek istediğinize emin misiniz?");
      if (!ok) return;

      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

      const response = await fetch(`/api/admin/industries/${industry._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Sektör silinemedi`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Sektör silinemedi");

      setIndustries((prev) => prev.filter((i) => i._id !== industry._id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleToggleActive = async (industry: Industry) => {
    try {
      if (industry.isSystem) return;
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

      const response = await fetch(`/api/admin/industries/${industry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !industry.isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Durum değiştirilemedi`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Durum değiştirilemedi");

      setIndustries((prev) => prev.map((i) => (i._id === industry._id ? data.industry : i)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleCreateIndustry = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

      const response = await fetch("/api/admin/industries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newIndustry.name,
          displayName: newIndustry.displayName,
          description: newIndustry.description,
          code: newIndustry.code || undefined,
          category: newIndustry.category,
          icon: newIndustry.icon,
          color: newIndustry.color,
          isActive: newIndustry.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Sektör oluşturulamadı`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Sektör oluşturulamadı");

      setIndustries((prev) => [data.industry, ...prev]);
      setShowCreateModal(false);
      setNewIndustry({
        name: "",
        displayName: "",
        description: "",
        code: "",
        category: "transport",
        icon: "",
        color: "#6366f1",
        isActive: true,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      transport: "Taşımacılık",
      manufacturing: "İmalat",
      storage: "Depolama",
      education: "Eğitim",
      service: "Hizmet",
      technology: "Teknoloji",
      other: "Diğer"
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      transport: "🚚",
      manufacturing: "🏭",
      storage: "📦",
      education: "🎓",
      service: "🛠️",
      technology: "💻",
      other: "🏪"
    };
    return icons[category] || "🏢";
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
                <h1 className="text-2xl font-bold text-slate-100">🏭 Sektörler</h1>
                <p className="text-sm text-slate-400 mt-1">İşletme sektörleri ve özel alanları</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Sektör ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryIcon(category)} {getCategoryLabel(category)}
                      </option>
                    ))}
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
                    setCreateError(null);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm"
                >
                  + Yeni Sektör
                </button>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{industries.length}</div>
              <div className="text-sm text-slate-400">Toplam Sektör</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{industries.filter(i => i.isActive).length}</div>
              <div className="text-sm text-slate-400">Aktif Sektör</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {industries.reduce((sum, i) => sum + i.stats.companyCount, 0)}
              </div>
              <div className="text-sm text-slate-400">Toplam Firma</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">
                {industries.reduce((sum, i) => sum + i.stats.branchCount, 0)}
              </div>
              <div className="text-sm text-slate-400">Toplam Şube</div>
            </div>
          </div>

          {/* Sektörler Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndustries.map((industry) => (
              <div key={industry._id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{industry.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{industry.displayName}</h3>
                      <p className="text-sm text-slate-400">{industry.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium`}
                      style={{ backgroundColor: `${industry.color}20`, color: industry.color }}
                    >
                      {getCategoryLabel(industry.category)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        industry.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {industry.isActive ? "Aktif" : "Pasif"}
                    </span>
                    {industry.isSystem && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                        Sistem
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-4">{industry.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-slate-400">Özel Alanlar:</span>
                    <div className="text-slate-300">{industry.customFields.length} alan</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Şube Tipleri:</span>
                    <div className="text-slate-300">{industry.branchStructure.branchTypes.length} tip</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Firma:</span>
                    <div className="text-slate-300">{industry.stats.companyCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Şube:</span>
                    <div className="text-slate-300">{industry.stats.branchCount}</div>
                  </div>
                </div>

                {/* Şube Tipleri */}
                {industry.branchStructure.branchTypes.length > 0 && (
                  <div className="mb-4">
                    <span className="text-slate-400 text-sm">Şube Tipleri:</span>
                    <div className="mt-1 space-y-1">
                      {industry.branchStructure.branchTypes.map((branchType, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">{branchType.name}</span>
                          <div className="flex items-center space-x-2">
                            {branchType.isRequired && (
                              <span className="text-orange-400">*</span>
                            )}
                            {branchType.maxCount && (
                              <span className="text-slate-500">Max: {branchType.maxCount}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Servisler */}
                {industry.services.length > 0 && (
                  <div className="mb-4">
                    <span className="text-slate-400 text-sm">Servisler:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {industry.services.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEdit(industry)}
                    className={`px-3 py-1 text-white rounded text-sm ${
                      industry.isSystem ? "bg-slate-600 opacity-60 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
                    }`}
                    disabled={industry.isSystem}
                  >
                    Düzenle
                  </button>
                  {!industry.isSystem && (
                    <button
                      onClick={() => handleToggleActive(industry)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                    >
                      {industry.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  )}
                  {!industry.isSystem && (
                    <button
                      onClick={() => handleDeleteIndustry(industry)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredIndustries.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {searchTerm || selectedCategory !== "all"
                  ? "Arama kriterlerinize uygun sektör bulunamadı."
                  : "Henüz sektör eklenmemiş."
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Yeni Sektör Oluştur</h2>

            {createError && (
              <div className="mb-4 p-3 rounded bg-red-500/20 text-red-300 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Sektör Adı (name)</label>
                  <input
                    type="text"
                    value={newIndustry.name}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="logistics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Görünen Ad</label>
                  <input
                    type="text"
                    value={newIndustry.displayName}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="Lojistik"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                <textarea
                  value={newIndustry.description}
                  onChange={(e) => setNewIndustry((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  rows={3}
                  placeholder="Sektör açıklaması"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                  <select
                    value={newIndustry.category}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  >
                    <option value="transport">Taşımacılık</option>
                    <option value="manufacturing">İmalat</option>
                    <option value="storage">Depolama</option>
                    <option value="education">Eğitim</option>
                    <option value="service">Hizmet</option>
                    <option value="technology">Teknoloji</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kod (opsiyonel)</label>
                  <input
                    type="text"
                    value={newIndustry.code}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="LOGISTICS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">İkon (opsiyonel)</label>
                  <input
                    type="text"
                    value={newIndustry.icon}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="🏭"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
                  <input
                    type="text"
                    value={newIndustry.color}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, color: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    placeholder="#6366f1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newIndustryIsActive"
                    checked={newIndustry.isActive}
                    onChange={(e) => setNewIndustry((p) => ({ ...p, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="newIndustryIsActive" className="text-sm text-slate-300">Aktif</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
                disabled={creating}
              >
                İptal
              </button>
              <button
                onClick={handleCreateIndustry}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded disabled:opacity-60"
                disabled={creating}
              >
                {creating ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedIndustry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-1">Sektör Düzenle</h2>
            <div className="text-xs text-slate-400 mb-4">{selectedIndustry.displayName}</div>

            {editError && (
              <div className="mb-4 p-3 rounded bg-red-500/20 text-red-300 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Görünen Ad</label>
                  <input
                    type="text"
                    value={editIndustry.displayName}
                    onChange={(e) => setEditIndustry((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">İkon</label>
                  <input
                    type="text"
                    value={editIndustry.icon}
                    onChange={(e) => setEditIndustry((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                <textarea
                  value={editIndustry.description}
                  onChange={(e) => setEditIndustry((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
                  <input
                    type="text"
                    value={editIndustry.color}
                    onChange={(e) => setEditIndustry((p) => ({ ...p, color: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIndustryIsActive"
                    checked={editIndustry.isActive}
                    onChange={(e) => setEditIndustry((p) => ({ ...p, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="editIndustryIsActive" className="text-sm text-slate-300">Aktif</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedIndustry(null);
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
                disabled={editing}
              >
                İptal
              </button>
              <button
                onClick={handleUpdateIndustry}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded disabled:opacity-60"
                disabled={editing}
              >
                {editing ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminOnly>
  );
}
