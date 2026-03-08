"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/profile-sections/page.tsx
// ----------------------------------------------------------
// Profil Bölümleri Yönetimi
// - GMN entegrasyonlu profil bölümleri
// - Profil yapısı ve hiyerarşi
// ----------------------------------------------------------

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileSection {
  _id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  fields?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProfileSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<ProfileSection[]>([]);
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
    loadSections();
  }, []); // Sadece ilk mount'ta çalışsın

  async function loadSections() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/profile-sections", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleAuthFailure(data?.message);
          return;
        }
        throw new Error(data?.message || "Bölümler yüklenemedi");
      }
      setSections(data.sections || []);
    } catch (err: any) {
      setError(err?.message || "Bölümler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSection() {
    alert('Yeni profil bölümü oluşturma modalı açılacak - GMN entegrasyonu');
  }

  async function handleReorderSections() {
    alert('Bölüm sıralama arayüzü açılacak -拖拽 desteği');
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
            <h1 className="text-2xl font-bold">Profil Bölümleri</h1>
          </div>
          <div className="text-sm text-slate-400">
            GMN entegrasyonlu profil bölümleri ve hiyerarşi yönetimi
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Toplam Bölümler</div>
                <div className="text-2xl font-bold">{sections.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Aktif Bölümler</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {sections.filter(s => s.isActive).length}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">Ortalama Alan</div>
                <div className="text-2xl font-bold text-blue-400">
                  {sections.length > 0 ? Math.round(sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0) / sections.length) : 0}
                </div>
              </div>
            </div>

            {/* Sections List */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold">Profil Bölümleri</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {sections.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    Henüz profil bölümü tanımlanmamış
                  </div>
                ) : (
                  sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                    <div key={section._id} className="p-4 hover:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{section.name}</h3>
                            <span className="text-xs text-slate-500">Sıra: {section.order}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              section.isActive 
                                ? 'bg-emerald-900/50 text-emerald-300' 
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {section.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          {section.description && (
                            <p className="text-sm text-slate-400 mt-1">{section.description}</p>
                          )}
                          {section.fields && section.fields.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-slate-500 mb-1">Alanlar ({section.fields.length}):</div>
                              <div className="flex flex-wrap gap-1">
                                {section.fields.slice(0, 5).map((field, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs bg-slate-800 rounded">
                                    {field}
                                  </span>
                                ))}
                                {section.fields.length > 5 && (
                                  <span className="px-2 py-1 text-xs bg-slate-700 rounded">
                                    +{section.fields.length - 5} daha
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
                onClick={handleReorderSections}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sıralamayı Düzenle
              </button>
              <button 
                onClick={handleCreateSection}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Profil Bölümü
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
