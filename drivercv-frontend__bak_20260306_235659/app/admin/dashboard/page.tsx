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
            </main>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
