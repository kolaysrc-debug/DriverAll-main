"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dynamic-fields/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";

interface DynamicField {
  _id: string;
  key: string;
  label: string;
  description: string;
  type: string;
  category: string;
  section: string;
  roleVisibility: Array<{
    role: {
      _id: string;
      name: string;
      displayName: string;
    };
    isVisible: boolean;
    isRequired: boolean;
    isEditable: boolean;
  }>;
  globalValidation: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  appearance: {
    width: string;
    icon: string;
    placeholder?: string;
  };
  order: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicFieldsPage() {
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const response = await fetch("/api/admin/dynamic-fields", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Alanlar yüklenemedi`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Alanlar yüklenemedi");
      }
      
      setFields(data.fields);
    } catch (err) {
      console.error("Alanlar yüklenirken hata:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const filteredFields = fields.filter(field => {
    const categoryMatch = selectedCategory === "all" || field.category === selectedCategory;
    const searchMatch = searchTerm === "" || 
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  const categories = Array.from(new Set(fields.map(field => field.category)));

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      personal: "👤",
      contact: "📞",
      business: "🏢",
      professional: "💼",
      admin: "👨‍💼"
    };
    return icons[category] || "📋";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: "purple",
      contact: "blue",
      business: "green",
      professional: "orange",
      admin: "red"
    };
    return colors[category] || "slate";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: "📝",
      number: "🔢",
      email: "✉️",
      phone: "📱",
      url: "🔗",
      textarea: "📄",
      date: "📅",
      select: "📋",
      multiselect: "☑️",
      radio: "⭕",
      checkbox: "☑️"
    };
    return icons[type] || "📋";
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
                <h1 className="text-2xl font-bold text-slate-100">📋 Dinamik Profil Alanları</h1>
                <p className="text-sm text-slate-400 mt-1">Role göre profil alanları ve validasyon kuralları</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Alan ara..."
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
                        {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
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
                <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">
                  + Yeni Alan
                </button>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{fields.length}</div>
              <div className="text-sm text-slate-400">Toplam Alan</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{fields.filter(f => f.isActive).length}</div>
              <div className="text-sm text-slate-400">Aktif Alan</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{fields.filter(f => f.isSystem).length}</div>
              <div className="text-sm text-slate-400">Sistem Alanı</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">{categories.length}</div>
              <div className="text-sm text-slate-400">Kategori</div>
            </div>
          </div>

          {/* Alanlar Listesi */}
          <div className="space-y-4">
            {filteredFields.map((field) => (
              <div key={field._id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{field.appearance.icon || getTypeIcon(field.type)}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{field.label}</h3>
                      <p className="text-sm text-slate-400">{field.key}</p>
                      <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-${getCategoryColor(field.category)}-500/20 text-${getCategoryColor(field.category)}-400`}
                    >
                      {getCategoryIcon(field.category)} {field.category}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-600/20 text-slate-400">
                      {getTypeIcon(field.type)} {field.type}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        field.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {field.isActive ? "Aktif" : "Pasif"}
                    </span>
                    {field.isSystem && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                        Sistem
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Rol Görünürlüğü:</span>
                    <div className="mt-1 space-y-1">
                      {field.roleVisibility.map((rv, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="text-slate-300">{rv.role.displayName}</span>
                          <span className={`text-xs ${rv.isVisible ? "text-green-400" : "text-red-400"}`}>
                            {rv.isVisible ? "✓" : "✗"}
                          </span>
                          {rv.isRequired && (
                            <span className="text-xs text-orange-400">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Validasyon:</span>
                    <div className="mt-1 space-y-1">
                      {field.globalValidation?.required && (
                        <div className="text-slate-300">Zorunlu</div>
                      )}
                      {field.globalValidation?.minLength && (
                        <div className="text-slate-300">Min: {field.globalValidation.minLength} karakter</div>
                      )}
                      {field.globalValidation?.maxLength && (
                        <div className="text-slate-300">Max: {field.globalValidation.maxLength} karakter</div>
                      )}
                      {field.globalValidation?.min !== undefined && (
                        <div className="text-slate-300">Min: {field.globalValidation.min}</div>
                      )}
                      {field.globalValidation?.max !== undefined && (
                        <div className="text-slate-300">Max: {field.globalValidation.max}</div>
                      )}
                      {field.globalValidation?.options && (
                        <div className="text-slate-300">Seçenekler: {field.globalValidation.options.join(", ")}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">
                    Düzenle
                  </button>
                  <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm">
                    Kopyala
                  </button>
                  {!field.isSystem && (
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                      Sil
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredFields.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {searchTerm || selectedCategory !== "all" 
                  ? "Arama kriterlerinize uygun alan bulunamadı." 
                  : "Henüz alan tanımlanmamış."
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
