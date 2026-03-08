"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/profile-fields/page.tsx
// ----------------------------------------------------------
// Profil Alanları Yönetimi
// - GMN entegrasyonlu profil alanları
// - Dinamik alan tanımlama ve yönetim
// ----------------------------------------------------------

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileField {
  _id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  section?: string;
  required: boolean;
  isActive: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileFieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleAuthFailure(message?: string) {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  useEffect(() => {
    loadFields();
  }, []); // Sadece ilk mount'ta çalışsın

  async function loadFields() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/profile-fields", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleAuthFailure(data?.message);
          return;
        }
        throw new Error(data?.message || "Alanlar yüklenemedi");
      }
      setFields(data.fields || []);
    } catch (err: any) {
      setError(err?.message || "Alanlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateField() {
    alert('Yeni profil alanı oluşturma modalı açılacak - GMN entegrasyonu');
  }

  async function handleBulkEdit() {
    alert('Toplu alan düzenleme arayüzü açılacak - Excel desteği');
  }

  const fieldTypeColors = {
    text: 'bg-blue-900/50 text-blue-300',
    number: 'bg-green-900/50 text-green-300',
    select: 'bg-purple-900/50 text-purple-300',
    multiselect: 'bg-orange-900/50 text-orange-300',
    date: 'bg-pink-900/50 text-pink-300',
    boolean: 'bg-cyan-900/50 text-cyan-300',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/admin/dashboard" 
              className="text-slate-400 hover:text-slate-200"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Profil Alanları</h1>
          </div>
          <div className="text-sm text-slate-400">
            GMN entegrasyonlu dinamik profil alanları yönetimi
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400">Yükleniyor...</div>
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
                <div className="text-sm text-slate-400">Toplam Alanlar</div>
                <div className="text-2xl font-bold">{fields.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Aktif Alanlar</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {fields.filter(f => f.isActive).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Zorunlu Alanlar</div>
                <div className="text-2xl font-bold text-orange-400">
                  {fields.filter(f => f.required).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">GMN Optimize</div>
                <div className="text-2xl font-bold text-blue-400">
                  {fields.filter(f => f.validation).length}
                </div>
              </div>
            </div>

            {/* Fields List */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Profil Alanları</h2>
                  <div className="flex gap-2">
                    <button className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
                      Filtrele
                    </button>
                    <button className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
                      Dışa Aktar
                    </button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {fields.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    Henüz profil alanı tanımlanmamış
                  </div>
                ) : (
                  fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                    <div key={field._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{field.label}</h3>
                            <span className="text-xs text-slate-500">({field.name})</span>
                            <span className={`px-2 py-1 text-xs rounded ${fieldTypeColors[field.type]}`}>
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 text-xs rounded bg-red-900/50 text-red-300">
                                Zorunlu
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded ${
                              field.isActive 
                                ? 'bg-emerald-900/50 text-emerald-300' 
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {field.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            {field.validation && (
                              <span className="px-2 py-1 text-xs rounded bg-blue-900/50 text-blue-300">
                                GMN
                              </span>
                            )}
                          </div>
                          {field.section && (
                            <div className="text-xs text-slate-500 mb-1">Bölüm: {field.section}</div>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-slate-500 mb-1">Seçenekler:</div>
                              <div className="flex flex-wrap gap-1">
                                {field.options.map((option, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs bg-slate-800 rounded">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {field.validation && (
                            <div className="mt-2">
                              <div className="text-xs text-slate-500 mb-1">Validasyon:</div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {field.validation.min !== undefined && (
                                  <span className="px-2 py-1 bg-slate-800 rounded">
                                    Min: {field.validation.min}
                                  </span>
                                )}
                                {field.validation.max !== undefined && (
                                  <span className="px-2 py-1 bg-slate-800 rounded">
                                    Max: {field.validation.max}
                                  </span>
                                )}
                                {field.validation.pattern && (
                                  <span className="px-2 py-1 bg-slate-800 rounded">
                                    Pattern: {field.validation.pattern}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button 
                onClick={handleBulkEdit}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Toplu Düzenle
              </button>
              <button 
                onClick={handleCreateField}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Profil Alanı
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
