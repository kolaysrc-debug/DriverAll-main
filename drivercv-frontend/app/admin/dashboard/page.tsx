"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/dashboard/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";

type MenuItem = {
  id: string;
  title: string;
  href: string;
  description: string;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Ana Sayfa",
    href: "/admin",
    description: "Admin ana sayfası"
  },
  {
    id: "packages",
    title: "Paket Yönetimi",
    href: "#",
    description: "Reklam ve ilan paketleri",
    children: [
      {
        id: "ad-packages",
        title: "Reklam Paketleri",
        href: "/admin/ad-packages",
        description: "Paket tanımla / düzenle / aktif-pasif"
      },
      {
        id: "job-packages",
        title: "İlan Paketleri",
        href: "/admin/job-packages",
        description: "Paket tanımla / düzenle / aktif-pasif"
      }
    ]
  },
  {
    id: "approvals",
    title: "Onay İşlemleri",
    href: "#",
    description: "Talep ve başvuru onayları",
    children: [
      {
        id: "ad-requests",
        title: "Reklam Talepleri",
        href: "/admin/ad-requests",
        description: "Advertiser taleplerini onayla / reddet"
      },
      {
        id: "job-approvals",
        title: "İlan Onayları",
        href: "/admin/jobs",
        description: "Employer ilanlarını kontrol et / onayla"
      },
      {
        id: "advertiser-approvals",
        title: "Reklamveren Onayları",
        href: "/admin/approvals",
        description: "Advertiser başvurularını onayla / reddet"
      }
    ]
  },
  {
    id: "users",
    title: "Kullanıcı Yönetimi",
    href: "#",
    description: "Kullanıcı ve rol yönetimi",
    children: [
      {
        id: "user-list",
        title: "Kullanıcılar",
        href: "/admin/users",
        description: "Listele, aktif/pasif yap, onay durumlarını yönet"
      }
    ]
  },
  {
    id: "system",
    title: "Sistem Ayarları",
    href: "#",
    description: "Motor ve alan yönetimi",
    children: [
      {
        id: "groups",
        title: "Grup Motoru",
        href: "/admin/groups",
        description: "Grupları ve düzenlerini yönet"
      },
      {
        id: "criteria",
        title: "Kriter Motoru",
        href: "/admin/criteria",
        description: "Kriterleri ve bağlılıklarını yönet"
      },
      {
        id: "fields",
        title: "Alan / Eşleme",
        href: "/admin/fields",
        description: "Form alanları ve eşlemeleri yönet"
      }
    ]
  },
  {
    id: "jobs",
    title: "İlanlar",
    href: "/jobs",
    description: "Sistemde görünen ilanları kontrol et"
  }
];

function TreeNode({ item, level = 0 }: { item: MenuItem; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 rounded cursor-pointer transition-colors ${
          isActive
            ? "bg-sky-600/20 text-sky-400"
            : "hover:bg-slate-700/50 text-slate-300"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {hasChildren && (
          <span className="mr-1 text-xs">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
        {item.href !== "#" ? (
          <Link href={item.href} className="flex-1">
            <span className="text-sm">{item.title}</span>
          </Link>
        ) : (
          <span className="flex-1 text-sm">{item.title}</span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.children?.map((child) => (
            <TreeNode key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const pathname = usePathname();

  return (
    <AdminOnly>
      <div className="flex h-screen bg-slate-900">
        {/* Sol Ağaç Menü */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-lg font-bold text-slate-100">Admin Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Yönetim ekranları</p>
          </div>
          
          <nav className="p-2">
            {menuItems.map((item) => (
              <TreeNode key={item.id} item={item} />
            ))}
          </nav>
        </div>

        {/* Ana İçerik Alanı */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="text-2xl font-bold text-slate-100">Admin Dashboard</div>
              <div className="mt-1 text-sm text-slate-400">Yönetim ekranları ve iş akışları</div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Ana sayfa için hızlı erişim kartları */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Paket Yönetimi</h3>
                <p className="text-sm text-slate-400 mb-3">Reklam ve ilan paketlerini yönetin</p>
                <div className="space-y-2">
                  <Link href="/admin/ad-packages" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Reklam Paketleri
                  </Link>
                  <Link href="/admin/job-packages" className="block text-xs text-sky-400 hover:text-sky-300">
                    → İlan Paketleri
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
                  <Link href="/admin/jobs" className="block text-xs text-sky-400 hover:text-sky-300">
                    → İlan Onayları
                  </Link>
                  <Link href="/admin/approvals" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Reklamveren Onayları
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Sistem Ayarları</h3>
                <p className="text-sm text-slate-400 mb-3">Motor ve alanları yapılandırın</p>
                <div className="space-y-2">
                  <Link href="/admin/groups" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Grup Motoru
                  </Link>
                  <Link href="/admin/criteria" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Kriter Motoru
                  </Link>
                  <Link href="/admin/fields" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Alan / Eşleme
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Kullanıcılar</h3>
                <p className="text-sm text-slate-400 mb-3">Kullanıcıları yönetin</p>
                <Link href="/admin/users" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Kullanıcı Listesi
                </Link>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">İlanlar</h3>
                <p className="text-sm text-slate-400 mb-3">Tüm ilanları görüntüleyin</p>
                <Link href="/jobs" className="block text-xs text-sky-400 hover:text-sky-300">
                  → İlan Listesi
                </Link>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Dashboard</h3>
                <p className="text-sm text-slate-400 mb-3">Ana sayfaya dönün</p>
                <Link href="/admin" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Admin Ana Sayfa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
