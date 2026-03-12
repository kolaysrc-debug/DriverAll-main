"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";
import { authHeaders } from "@/lib/api/_core";

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
        id: "ad-campaigns",
        title: "Reklam Kampanyaları",
        href: "/admin/ad-campaigns",
        description: "Onaylanmış kampanyaları izle / durdur / bitir"
      },
      {
        id: "placements",
        title: "Ad Placements",
        href: "/admin/placements",
        description: "Slot/placement anahtarlarını ve kurallarını yönet"
      },
      {
        id: "geo-groups",
        title: "Geo Groups",
        href: "/admin/geo-groups",
        description: "Hedefleme için ülke bazlı geo group tanımları"
      },
      {
        id: "packages-new",
        title: "Paketler",
        href: "/admin/packages",
        description: "Paket tanımla / düzenle / aktif-pasif"
      },
      {
        id: "orders",
        title: "Siparişler",
        href: "/admin/orders",
        description: "Paket siparişlerini onayla/aktif et ve hakları yönet"
      },
      {
        id: "payments",
        title: "Ödemeler",
        href: "/admin/payments",
        description: "Tahsilat (ledger) kayıtlarını onayla/reddet"
      }
    ]
  },
  {
    id: "legacy",
    title: "Eski Fonksiyonlar",
    href: "#",
    description: "Geçiş dönemi: eski admin ekranları",
    children: [
      {
        id: "legacy-ad-packages",
        title: "Legacy Ad Packages",
        href: "/admin/ad-packages",
        description: "Eski reklam paket ekranı"
      },
      {
        id: "legacy-job-packages",
        title: "Legacy Job Packages",
        href: "/admin/job-packages",
        description: "Eski ilan paket ekranı"
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
        id: "ad-approvals",
        title: "Reklam Onayları",
        href: "/admin/ad-approvals",
        description: "Reklam taleplerini (approve/reject) yönet"
      },
      {
        id: "ad-requests",
        title: "Reklam Talepleri",
        href: "/admin/ad-requests",
        description: "Advertiser taleplerini onayla / reddet"
      },
      {
        id: "job-approvals",
        title: "İlan Onayları",
        href: "/admin/job-approvals",
        description: "Employer ilanlarını kontrol et / onayla"
      },
      {
        id: "job-requests",
        title: "İlan Talep Onayları",
        href: "/admin/job-requests",
        description: "PackageOrder ile gelen ilan taleplerini onayla / reddet"
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
      },
      {
        id: "subusers",
        title: "Alt Kullanıcılar",
        href: "/admin/subusers",
        description: "Alt kullanıcıları listele / yönet"
      },
      {
        id: "branches",
        title: "Şubeler",
        href: "/admin/branches",
        description: "Şubeleri ve lokasyonları yönet"
      },
      {
        id: "company-profiles",
        title: "Company Profiles",
        href: "/admin/company-profiles",
        description: "Firma profilleri ve reklam hedefleme istisnaları"
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
        id: "tasks",
        title: "Talimat / Yapılacak Takibi",
        href: "/admin/tasks",
        description: "Konuşulan talimatları görev olarak kaydet ve takip et",
      },
      {
        id: "business-policies",
        title: "Business Policies",
        href: "/admin/business-policies",
        description: "İş tipine göre reklam hedefleme kısıtları"
      },
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

export default function AdminHomePage() {
  const pathname = usePathname();

  const [taskCounts, setTaskCounts] = useState<{ total: number; open: number; needsAdminTest: number; notOk: number } | null>(null);
  const [taskCountsErr, setTaskCountsErr] = useState<string | null>(null);

  type DashStats = {
    users: { total: number; drivers: number; employers: number; advertisers: number; newThisWeek: number };
    jobs: { total: number; published: number };
    payments: { pending: number };
    orders: { active: number };
    recentUsers: { _id: string; name: string; email: string; role: string; createdAt: string }[];
  };
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadTaskCounts() {
      try {
        setTaskCountsErr(null);
        const res = await fetch("/api/admin/tasks", { headers: { ...authHeaders() }, cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
        const total = tasks.length;
        const open = tasks.filter((t: any) => !["done", "canceled"].includes(String(t?.status || ""))).length;
        const needsAdminTest = tasks.filter((t: any) => {
          const st = String(t?.status || "");
          if (["done", "canceled"].includes(st)) return false;
          return !!t?.devDone && !t?.adminTested;
        }).length;
        const notOk = tasks.filter((t: any) => {
          const st = String(t?.status || "");
          if (["done", "canceled"].includes(st)) return false;
          return !!t?.adminTested && String(t?.adminResult || "") === "not_ok";
        }).length;

        if (!alive) return;
        setTaskCounts({ total, open, needsAdminTest, notOk });
      } catch (e: any) {
        if (!alive) return;
        setTaskCounts(null);
        setTaskCountsErr(e?.message || "Task listesi okunamadı");
      }
    }

    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard/stats", { headers: { ...authHeaders() }, cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) return;
        if (alive) setStats(data.stats);
      } catch {}
    }

    loadTaskCounts();
    loadStats();
    return () => { alive = false; };
  }, []);

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

            {/* Canlı İstatistikler */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Toplam Kullanıcı</div>
                  <div className="text-xl font-bold text-slate-100 mt-1">{stats.users.total}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{stats.users.newThisWeek} bu hafta</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Sürücüler</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">{stats.users.drivers}</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">İşverenler</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{stats.users.employers}</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Yayındaki İlanlar</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{stats.jobs.published}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{stats.jobs.total} toplam</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Bekleyen Ödeme</div>
                  <div className={`text-xl font-bold mt-1 ${stats.payments.pending > 0 ? "text-rose-400" : "text-slate-400"}`}>{stats.payments.pending}</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Aktif Sipariş</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{stats.orders.active}</div>
                </div>
              </div>
            )}

            {/* Son Kayıtlar */}
            {stats?.recentUsers && stats.recentUsers.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-100 mb-3">Son Kayıtlar</h3>
                <div className="space-y-2">
                  {stats.recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 text-xs">
                      <span className="w-16 shrink-0 rounded-full border border-slate-600 bg-slate-900/50 px-2 py-0.5 text-center text-[10px] font-semibold text-slate-300">{u.role}</span>
                      <span className="text-slate-200 truncate flex-1">{u.name}</span>
                      <span className="text-slate-500 truncate">{u.email}</span>
                      <span className="text-slate-600 shrink-0">{new Date(u.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Ana sayfa için hızlı erişim kartları */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Paket Yönetimi</h3>
                <p className="text-sm text-slate-400 mb-3">Reklam ve ilan paketlerini yönetin</p>
                <div className="space-y-2">
                  <Link href="/admin/ad-packages" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Reklam Paketleri
                  </Link>
                  <Link href="/admin/packages" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Paketler
                  </Link>
                  <Link href="/admin/orders" className="block text-xs text-sky-400 hover:text-sky-300">
                    → Siparişler
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="font-semibold text-slate-100 mb-2">Task Takibi</h3>
                <p className="text-sm text-slate-400 mb-3">Talimat checklistlerini kontrol et / test et / onayla</p>
                {taskCountsErr ? (
                  <div className="text-xs text-red-300 mb-3">{taskCountsErr}</div>
                ) : taskCounts ? (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 px-2 py-2">
                      <div className="text-[10px] text-slate-400">Açık</div>
                      <div className="text-sm font-semibold text-slate-100">{taskCounts.open}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 px-2 py-2">
                      <div className="text-[10px] text-slate-400">Admin Test</div>
                      <div className="text-sm font-semibold text-slate-100">{taskCounts.needsAdminTest}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 px-2 py-2">
                      <div className="text-[10px] text-slate-400">Not OK</div>
                      <div className="text-sm font-semibold text-slate-100">{taskCounts.notOk}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 px-2 py-2">
                      <div className="text-[10px] text-slate-400">Toplam</div>
                      <div className="text-sm font-semibold text-slate-100">{taskCounts.total}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mb-3">Yükleniyor...</div>
                )}
                <Link href="/admin/tasks" className="block text-xs text-sky-400 hover:text-sky-300">
                  → Task ekranına git
                </Link>
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
            </div>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Eski Dosyalar / Referanslar</h3>
              <p className="text-sm text-slate-400 mb-3">Durum takibi, handoff ve önceki notlar için referans dosyaları.</p>
              <div className="space-y-2">
                <div className="text-xs text-slate-300">- `STATUS_OVERVIEW.md`</div>
                <div className="text-xs text-slate-300">- `TODO.md`</div>
                <div className="text-xs text-slate-300">- `PROJECT_TODO.md`</div>
                <div className="text-xs text-slate-300">- `REMINDER_next_session.md`</div>
                <div className="text-xs text-slate-300">- `LOGS_checklist_next_session.md`</div>
                <div className="text-xs text-slate-300">- `handoff/latest.md`</div>
              </div>

              <div className="mt-4 border-t border-slate-700 pt-4">
                <Link href="/admin/tasks" className="block text-sm font-medium text-sky-400 hover:text-sky-300">
                  → Talimat / Yapılacak Takibi ekranına git
                </Link>
                <div className="mt-1 text-xs text-slate-500">Konuşulan görevleri buradan kaydedip takip edebilirsin.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
