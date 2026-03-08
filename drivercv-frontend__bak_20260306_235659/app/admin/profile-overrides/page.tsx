"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/profile-overrides/page.tsx
// ----------------------------------------------------------
// Profil Override'ları Yönetimi
// - GMN entegrasyonlu profil override'ları
// - Özel durumlar ve istisnai yönetimi
// ----------------------------------------------------------

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ProfileOverride {
  _id: string;
  name: string;
  description?: string;
  conditions: {
    role?: string;
    section?: string;
    field?: string;
    customLogic?: string;
  };
  actions: {
    show?: boolean;
    require?: boolean;
    defaultValue?: any;
    validation?: string;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileOverridesPage() {
  const [overrides, setOverrides] = useState<ProfileOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverrides();
  }, []); // Sadece ilk mount'ta çalışsın

  async function loadOverrides() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile-overrides");
      if (!res.ok) throw new Error("Override'lar yüklenemedi");
      const data = await res.json();
      setOverrides(data.overrides || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOverride() {
    alert('Yeni profil override olusturma modal acilacak - GMN logic test');
  }

  async function handleTestGMN() {
    alert('GMN mantiksal motoru test arayuzu acilacak');
  }

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
            <h1 className="text-2xl font-bold">Profil Override'ları</h1>
          </div>
          <div className="text-sm text-slate-400">
            GMN entegrasyonlu profil override'ları ve istisnai yönetimi
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
                <div className="text-sm text-slate-400">Toplam Override'lar</div>
                <div className="text-2xl font-bold">{overrides.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Aktif Override'lar</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {overrides.filter(o => o.isActive).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Rol Bazlı</div>
                <div className="text-2xl font-bold text-purple-400">
                  {overrides.filter(o => o.conditions.role).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">GMN Logic</div>
                <div className="text-2xl font-bold text-blue-400">
                  {overrides.filter(o => o.conditions.customLogic).length}
                </div>
              </div>
            </div>

            {/* Overrides List */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Profil Override'ları</h2>
                  <div className="flex gap-2">
                    <button className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
                      Test Et
                    </button>
                    <button className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
                      İçe Aktar
                    </button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {overrides.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    Henüz profil override'ı tanımlanmamış
                  </div>
                ) : (
                  overrides
                    .sort((a, b) => b.priority - a.priority)
                    .map((override) => (
                    <div key={override._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{override.name}</h3>
                            <span className="text-xs text-slate-500">Öncelik: {override.priority}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              override.isActive 
                                ? 'bg-emerald-900/50 text-emerald-300' 
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {override.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            {override.conditions.customLogic && (
                              <span className="px-2 py-1 text-xs rounded bg-blue-900/50 text-blue-300">
                                GMN
                              </span>
                            )}
                          </div>
                          {override.description && (
                            <p className="text-sm text-slate-400 mb-2">{override.description}</p>
                          )}
                          
                          {/* Conditions */}
                          <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-1">Koşullar:</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {override.conditions.role && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Rol:</span>
                                  <span className="px-2 py-1 bg-slate-800 rounded">{override.conditions.role}</span>
                                </div>
                              )}
                              {override.conditions.section && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Bölüm:</span>
                                  <span className="px-2 py-1 bg-slate-800 rounded">{override.conditions.section}</span>
                                </div>
                              )}
                              {override.conditions.field && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Alan:</span>
                                  <span className="px-2 py-1 bg-slate-800 rounded">{override.conditions.field}</span>
                                </div>
                              )}
                              {override.conditions.customLogic && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">GMN Logic:</span>
                                  <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded font-mono">
                                    {override.conditions.customLogic.substring(0, 20)}...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Aksiyonlar:</div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {override.actions.show !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  override.actions.show ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
                                }`}>
                                  Göster: {override.actions.show ? 'Evet' : 'Hayır'}
                                </span>
                              )}
                              {override.actions.require !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  override.actions.require ? 'bg-orange-900/50 text-orange-300' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  Gerekli: {override.actions.require ? 'Evet' : 'Hayır'}
                                </span>
                              )}
                              {override.actions.defaultValue !== undefined && (
                                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                                  Varsayılan: {String(override.actions.defaultValue)}
                                </span>
                              )}
                              {override.actions.validation && (
                                <span className="px-2 py-1 bg-cyan-900/50 text-cyan-300 rounded">
                                  Validasyon: {override.actions.validation}
                                </span>
                              )}
                            </div>
                          </div>
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
                onClick={handleTestGMN}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                GMN Logic Test
              </button>
              <button 
                onClick={handleCreateOverride}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Profil Override'ı
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
