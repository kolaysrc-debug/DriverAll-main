"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dashboard/page.tsx

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";
import Tooltip from "@/components/Tooltip";

export default function AdminDashboardPage() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const p = String(pathname || "");
    return p === href || p.startsWith(href + "/");
  };

  const linkCls = (href: string) =>
    `block rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? "bg-slate-800 text-slate-50 border border-slate-600"
        : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50"
    }`;

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl p-6">
          <div className="mb-6">
            <div className="text-2xl font-bold text-slate-100">Admin Dashboard</div>
            <div className="mt-1 text-sm text-slate-400">Yönetim ekranları ve iş akışları</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <aside className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 h-fit">
              <div className="text-xs font-semibold text-slate-400 px-2 py-2">Menü</div>

              <div className="mt-1 space-y-1">
                <Link href="/admin/dashboard" className={linkCls("/admin/dashboard")}>
                  Dashboard
                </Link>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Onaylar</div>
                <div className="space-y-1">
                  <Link href="/admin/approvals" className={linkCls("/admin/approvals")}>
                    Reklamveren Onayları
                  </Link>
                  <Link href="/admin/ad-approvals" className={linkCls("/admin/ad-approvals")}>
                    Reklam Onayları
                  </Link>
                  <Link href="/admin/ad-requests" className={linkCls("/admin/ad-requests")}>
                    Reklam Talepleri
                  </Link>
                  <Link href="/admin/job-approvals" className={linkCls("/admin/job-approvals")}>
                    İlan Onayları
                  </Link>
                  <Link href="/admin/job-requests" className={linkCls("/admin/job-requests")}>
                    İlan Talep Onayları
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Paketler / Siparişler / Reklam</div>
                <div className="space-y-1">
                  <Link href="/admin/packages" className={linkCls("/admin/packages")}>
                    Paketler
                  </Link>
                  <Link href="/admin/orders" className={linkCls("/admin/orders")}>
                    Siparişler
                  </Link>
                  <Link href="/admin/payments" className={linkCls("/admin/payments")}>
                    Ödemeler
                  </Link>
                  <Link href="/admin/ad-campaigns" className={linkCls("/admin/ad-campaigns")}>
                    Reklam Kampanyaları
                  </Link>
                  <Link href="/admin/placements" className={linkCls("/admin/placements")}>
                    Ad Placements
                  </Link>
                  <Link href="/admin/geo-groups" className={linkCls("/admin/geo-groups")}>
                    Geo Groups
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Kullanıcı / Organizasyon</div>
                <div className="space-y-1">
                  <Link href="/admin/users" className={linkCls("/admin/users")}>
                    Kullanıcılar
                  </Link>
                  <Link href="/admin/subusers" className={linkCls("/admin/subusers")}>
                    Alt Kullanıcılar
                  </Link>
                  <Link href="/admin/branches" className={linkCls("/admin/branches")}>
                    Şubeler
                  </Link>
                  <Link href="/admin/company-profiles" className={linkCls("/admin/company-profiles")}>
                    Company Profiles
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Kurallar / Motor</div>
                <div className="space-y-1">
                  <Link href="/admin/tasks" className={linkCls("/admin/tasks")}>
                    Talimat / Yapılacak Takibi
                  </Link>
                  <Link href="/admin/commit-logs" className={linkCls("/admin/commit-logs")}>
                    Commit İzleme
                  </Link>
                  <Link href="/admin/business-policies" className={linkCls("/admin/business-policies")}>
                    Business Policies
                  </Link>
                  <Link href="/admin/groups" className={linkCls("/admin/groups")}>
                    Grup Motoru
                  </Link>
                  <Link href="/admin/criteria" className={linkCls("/admin/criteria")}>
                    Kriter Motoru
                  </Link>
                  <Link href="/admin/fields" className={linkCls("/admin/fields")}>
                    Alan / Eşleme
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Profil / Rol</div>
                <div className="space-y-1">
                  <Link href="/admin/dynamic-roles" className={linkCls("/admin/dynamic-roles")}>
                    Dinamik Roller
                  </Link>
                  <Link href="/admin/dynamic-profiles" className={linkCls("/admin/dynamic-profiles")}>
                    Dinamik Profiller
                  </Link>
                  <Link href="/admin/dynamic-fields" className={linkCls("/admin/dynamic-fields")}>
                    Profil Alanları
                  </Link>
                  <Link href="/admin/industries" className={linkCls("/admin/industries")}>
                    Sektörler
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Hizmet Veren</div>
                <div className="space-y-1">
                  <Link href="/admin/service-categories" className={linkCls("/admin/service-categories")}>
                    Hizmet Kategorileri
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 px-2 py-2">Eski Fonksiyonlar</div>
                <div className="space-y-1">
                  <Link href="/admin/ad-packages" className={linkCls("/admin/ad-packages")}>
                    Legacy Ad Packages
                  </Link>
                  <Link href="/admin/job-packages" className={linkCls("/admin/job-packages")}>
                    Legacy Job Packages
                  </Link>
                </div>
              </div>
            </aside>

            <main>

              {/* 🎭 Profil ve Rol Yönetimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Tooltip content="Rol ağacını ve rol yetkilerini yönet. Sub-user yetkileri ve profil görünümü bu rollere göre şekillenir.">
              <Link href="/admin/dynamic-roles" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-purple-400 transition-colors">🎭</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Dinamik Roller</h3>
                  <p className="text-sm text-slate-400">Hiyerarşik rol sistemi ve kriter yönetimi</p>
                  <div className="mt-4 flex items-center text-purple-400 text-sm group-hover:text-purple-300">
                    <span>Yönet</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>

            <Tooltip content="Kullanıcı profillerini ve rollerle ilişkili dinamik profil yapılarını görüntüle.">
              <Link href="/admin/dynamic-profiles" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-blue-400 transition-colors">👤</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Dinamik Profiller</h3>
                  <p className="text-sm text-slate-400">Kullanıcı profilleri ve rol atamaları</p>
                  <div className="mt-4 flex items-center text-blue-400 text-sm group-hover:text-blue-300">
                    <span>Görüntüle</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>

            <Tooltip content="Dinamik profil alanlarını, validasyonlarını ve alan konfigürasyonunu yönet.">
              <Link href="/admin/dynamic-fields" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-green-400 transition-colors">📋</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Profil Alanları</h3>
                  <p className="text-sm text-slate-400">Dinamik alanlar ve validasyon kuralları</p>
                  <div className="mt-4 flex items-center text-green-400 text-sm group-hover:text-green-300">
                    <span>Yapılandır</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>

            <Tooltip content="Sektör tanımlarını yönet. İşletme profilleri ve filtreleme bu listeye bağlıdır.">
              <Link href="/admin/industries" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-orange-400 transition-colors">🏭</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Sektörler</h3>
                  <p className="text-sm text-slate-400">İşletme sektörleri ve özel alanlar</p>
                  <div className="mt-4 flex items-center text-orange-400 text-sm group-hover:text-orange-300">
                    <span>Yönet</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>
          </div>

              {/* 🏢 İşletme Yönetimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Tooltip content="Şubeleri, lokasyonları ve şube bazlı kısıtları yönet.">
              <Link href="/admin/branches" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-teal-500/20 text-teal-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-teal-400 transition-colors">🏪</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Şubeler</h3>
                  <p className="text-sm text-slate-400">İşletme şubeleri ve lokasyonlar</p>
                  <div className="mt-4 flex items-center text-teal-400 text-sm group-hover:text-teal-300">
                    <span>Yönet</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>

            <Tooltip content="Alt kullanıcıları görüntüle ve gerektiğinde müdahale et (aktif/pasif, düzenleme vb.).">
              <Link href="/admin/subusers" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-pink-500/20 text-pink-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-pink-400 transition-colors">👥</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Alt Kullanıcılar</h3>
                  <p className="text-sm text-slate-400">İşletme ve admin alt kullanıcıları</p>
                  <div className="mt-4 flex items-center text-pink-400 text-sm group-hover:text-pink-300">
                    <span>Yönet</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>

            <Tooltip content="Bekleyen onay taleplerini incele. (Akışlar otomatik onaylıysa burada 0 normaldir.)">
              <Link href="/admin/approvals" className="group">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl text-slate-400 group-hover:text-emerald-400 transition-colors">✅</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">Bekleyen Onaylar</h3>
                  <p className="text-sm text-slate-400">Şube ve kullanıcı onayları</p>
                  <div className="mt-4 flex items-center text-emerald-400 text-sm group-hover:text-emerald-300">
                    <span>İncele</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Tooltip>
          </div>

              {/* 📊 İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">3</div>
              <div className="text-sm text-slate-400">Ana Rol</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">6</div>
              <div className="text-sm text-slate-400">Sektör</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">15</div>
              <div className="text-sm text-slate-400">Profil Alanı</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-100">0</div>
              <div className="text-sm text-slate-400">Bekleyen Onay</div>
            </div>
          </div>

              {/* 📋 Hızlı Erişim */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Paket Yönetimi</h3>
              <p className="text-sm text-slate-400 mb-3">Reklam ve ilan paketlerini yönetin</p>
              <div className="space-y-2">
                <Link href="/admin/packages" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Paketler
                </Link>
                <Link href="/admin/orders" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Siparişler
                </Link>
                <Link href="/admin/ad-campaigns" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Reklam Kampanyaları
                </Link>
                <Link href="/admin/placements" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Ad Placements
                </Link>
                <Link href="/admin/geo-groups" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Geo Groups
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Onay İşlemleri</h3>
              <p className="text-sm text-slate-400 mb-3">Bekleyen talepleri onaylayın</p>
              <div className="space-y-2">
                <Link href="/admin/ad-requests" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Reklam Talepleri
                </Link>
                <Link href="/admin/job-approvals" className="block text-xs text-sky-400 hover:text-sky-300">
                  → İlan Onayları
                </Link>
                <Link href="/admin/job-requests" className="block text-xs text-sky-400 hover:text-sky-300">
                  → İlan Talep Onayları
                </Link>
                <Link href="/admin/approvals" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Reklamveren Onayları
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Kullanıcılar</h3>
              <p className="text-sm text-slate-400 mb-3">Kullanıcıları yönetin</p>
              <div className="space-y-2">
                <Link href="/admin/users" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Kullanıcı Listesi
                </Link>
                <Link href="/admin/subusers" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Alt Kullanıcılar
                </Link>
              </div>
            </div>
              </div>

              {/* 🛠️ Proje Takip Araçları */}
              <div className="mt-10 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">🛠️</span>
                  <h2 className="text-base font-bold text-slate-100">Proje Takip Araçları</h2>
                  <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">AI + İnsan kontrol sistemi</span>
                </div>

                {/* Akış Şeması */}
                <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 mb-4">
                  <div className="text-xs font-semibold text-slate-400 mb-3">Görev Yaşam Döngüsü</div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-amber-300 font-semibold">
                      1. Görev Yaz
                    </div>
                    <span className="text-slate-600">→</span>
                    <div className="rounded-lg border border-violet-700/40 bg-violet-950/30 px-3 py-2 text-violet-300 font-semibold">
                      2. AI Yapar
                    </div>
                    <span className="text-slate-600">→</span>
                    <div className="rounded-lg border border-sky-700/40 bg-sky-950/30 px-3 py-2 text-sky-300 font-semibold">
                      3. devDone ✓
                    </div>
                    <span className="text-slate-600">→</span>
                    <div className="rounded-lg border border-teal-700/40 bg-teal-950/30 px-3 py-2 text-teal-300 font-semibold">
                      4. Admin Test
                    </div>
                    <span className="text-slate-600">→</span>
                    <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/30 px-3 py-2 text-emerald-300 font-semibold">
                      5. OK / NOT OK
                    </div>
                    <span className="text-slate-600">→</span>
                    <div className="rounded-lg border border-rose-700/40 bg-rose-950/30 px-3 py-2 text-rose-300 font-semibold">
                      6. Commit Al
                    </div>
                  </div>
                </div>

                {/* 4 Araç Kartı */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Tasks */}
                  <Link href="/admin/tasks" className="group">
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:bg-slate-800 transition-all hover:scale-[1.02] hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 text-sm">Talimat / Görev Takibi</h3>
                          <span className="text-[10px] text-amber-400/70">Ana kontrol paneli</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Görevleri yaz, AI&apos;a talimat ver. Yapılınca &quot;devDone&quot; işaretlenir. Sen test edip onaylarsın.</p>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>• Görev oluştur / düzenle / sil</div>
                        <div>• devDone → adminTested → OK / NOT OK</div>
                        <div>• Öncelik: high / medium / low</div>
                      </div>
                      <div className="mt-3 flex items-center text-amber-400 text-xs group-hover:text-amber-300">
                        <span>Aç</span>
                        <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* Commit Log */}
                  <Link href="/admin/commit-logs" className="group">
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:bg-slate-800 transition-all hover:scale-[1.02] hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-violet-500/20 text-violet-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 text-sm">Commit İzleme</h3>
                          <span className="text-[10px] text-violet-400/70">Proje geçmişi</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Her commit&apos;in kaydı: ne yapıldı, kaç dosya değişti, build/TS durumu, admin onayı.</p>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>• Hash, tarih, yapılanların özeti</div>
                        <div>• Dosya/satır istatistikleri (+/-)</div>
                        <div>• Build ✓/✕ &amp; TypeScript ✓/✕</div>
                        <div>• Admin inceleme &amp; not</div>
                      </div>
                      <div className="mt-3 flex items-center text-violet-400 text-xs group-hover:text-violet-300">
                        <span>Aç</span>
                        <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* STATUS_OVERVIEW.md */}
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 text-sm">STATUS_OVERVIEW.md</h3>
                        <span className="text-[10px] text-sky-400/70">AI bağlam dosyası</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">AI oturum kaybettiğinde bu dosyayı okuyarak bağlamı geri alır. Proje durumu tek yerde.</p>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <div>• Tamamlanan özellikler listesi</div>
                      <div>• Sayfa haritası (tüm roller)</div>
                      <div>• Açık görevler (öncelik sıralı)</div>
                      <div>• Teknik notlar (DB, port, auth, seed)</div>
                      <div>• Oturum geçmişi</div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-600">
                      Dosya: <code className="text-slate-500">STATUS_OVERVIEW.md</code> (repo kökü)
                    </div>
                  </div>

                  {/* TODO Dosyaları */}
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 text-sm">Detay TODO Dosyaları</h3>
                        <span className="text-[10px] text-teal-400/70">Karmaşık görev planları</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Büyük görevlerin detaylı planları ayrı .md dosyalarında tutulur.</p>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <div>• <code className="text-slate-400">TODO.md</code> — Admin UI audit</div>
                      <div>• <code className="text-slate-400">TODO_subRoles_improvements.md</code> — SubRoles planı</div>
                      <div>• <code className="text-slate-400">PROJECT_TODO.md</code> — Motor tasarım notları</div>
                      <div>• <code className="text-slate-400">REMINDER_next_session.md</code> — Oturum hatırlatıcıları</div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-600">
                      Konum: repo kökü (<code className="text-slate-500">DriverAll-main/</code>)
                    </div>
                  </div>
                </div>

                {/* Nasıl Çalışır Açıklaması */}
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-4">
                  <div className="text-xs font-semibold text-slate-300 mb-2">📌 Nasıl Çalışır?</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400">
                    <div>
                      <div className="font-semibold text-amber-300 mb-1">1. Görev Oluştur</div>
                      <div>Tasks sayfasından yeni görev yaz veya TODO dosyasına ekle. AI bunu okuyup işe başlar.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-violet-300 mb-1">2. Geliştir &amp; Commit</div>
                      <div>AI görevi yapar → devDone işaretler → commit alınır → Commit İzleme&apos;ye kaydedilir.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-300 mb-1">3. Test &amp; Onayla</div>
                      <div>Admin test eder → OK ise onaylar. NOT OK ise görev tekrar açılır. STATUS dosyası güncellenir.</div>
                    </div>
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
