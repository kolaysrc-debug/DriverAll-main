"use client";

// PATH: DriverAll-main/drivercv-frontend/components/TopBar.tsx
// ----------------------------------------------------------
// TopBar (revize)
// - Rol bazlı menüler
// - Admin menüsü: İlan / Reklam başlıkları kapalı -> hover ile sağa açılan (flyout)
// - Admin "Ana motorlar": Groups + Criteria + Fields
// - Auth state'i localStorage'dan okur
// - Login/Logout sonrası sayfa yenilemeye gerek kalmadan güncellenir (custom event)
// - Route değişince menüler kapanır
// ----------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { loginUser, registerMinimalUser } from "@/lib/api/auth";
import { LangSwitcher, useLang } from "@/lib/LanguageContext";

type UserLike = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
};

const AUTH_CHANGED_EVENT = "driverall-auth-changed";

function normalizeRoleForRegister(input: any) {
  const v = String(input || "").trim().toLowerCase();
  if (v === "employer") return "employer";
  if (v === "advertiser") return "advertiser";
  return "driver";
}

function setSessionFromAuthResponse(data: any) {
  const token = data?.token ? String(data.token) : "";
  const user = data?.user && typeof data.user === "object" ? data.user : null;
  if (!token || !user) throw new Error("Oturum oluşturulamadı.");

  try {
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

function AuthModal(props: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"driver" | "employer" | "advertiser">("driver");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) return;
    setErr(null);
  }, [props.open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.open, props.onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (tab === "login") {
        const data = await loginUser({ email: String(email || "").trim(), password: String(password || "") });
        setSessionFromAuthResponse(data);
        props.onClose();
      } else {
        const data = await registerMinimalUser({
          name: String(name || "").trim(),
          email: String(email || "").trim(),
          phone: String(phone || "").trim(),
          role: normalizeRoleForRegister(role),
        });
        setSessionFromAuthResponse(data);
        props.onClose();
      }
    } catch (e2: any) {
      setErr(e2?.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="close"
        onClick={props.onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div className="absolute left-1/2 top-16 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-xl" style={{ border: "1px solid var(--da-border-med)", backgroundColor: "var(--da-bg-card-2)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-tight text-zinc-100">{t("auth.title")}</div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg px-3 py-1 text-xs font-medium transition" style={{ border: "1px solid var(--da-border-str)", color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
          >
            {t("auth.close")}
          </button>
        </div>

        <div className="mt-3 inline-flex rounded-xl p-1 text-xs" style={{ border: "1px solid var(--da-border)", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <button
            type="button"
            onClick={() => setTab("login")}
            className="rounded-lg px-3 py-1.5 font-medium transition"
            style={tab === "login" ? { backgroundColor: "var(--da-blue)", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.4)" } : { color: "var(--da-text-2)" }}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className="rounded-lg px-3 py-1.5 font-medium transition"
            style={tab === "register" ? { backgroundColor: "var(--da-blue)", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.4)" } : { color: "var(--da-text-2)" }}
          >
            {t("auth.register")}
          </button>
        </div>

        {err ? (
          <div className="mt-3 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            {err}
          </div>
        ) : null}

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          {tab === "register" ? (
            <>
              <div>
                <div className="text-[11px] text-zinc-500">{t("auth.name")}</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="da-input w-full rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">{t("auth.phone")}</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="da-input w-full rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">{t("auth.role")}</div>
                <select
                  value={role}
                  onChange={(e) => setRole(normalizeRoleForRegister(e.target.value) as any)}
                  className="da-input w-full rounded-lg px-3 py-2 text-sm"
                >
                  <option value="driver">{t("auth.role.driver")}</option>
                  <option value="employer">{t("auth.role.employer")}</option>
                  <option value="advertiser">{t("auth.role.advertiser")}</option>
                </select>
              </div>
            </>
          ) : null}

          <div>
            <div className="text-[11px] text-zinc-500">{t("auth.email")}</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="da-input w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {tab === "login" ? (
            <div>
              <div className="text-[11px] text-zinc-500">�?ifre</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="da-input w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="da-btn-primary w-full rounded-xl px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? t("auth.busy") : tab === "login" ? t("auth.submit.login") : t("auth.submit.register")}
          </button>
        </form>
      </div>
    </div>
  );
}

function getStoredUser(): UserLike | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserLike;
  } catch {
    return null;
  }
}

function hasStoredToken(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage.getItem("token");
  } catch {
    return false;
  }
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserLike | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadAuthFromStorage = useCallback(() => {
    setHasToken(hasStoredToken());
    setUser(getStoredUser());
  }, []);

  // Route değişince auth'ı oku + menüleri kapat
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadAuthFromStorage();
    setOpen(false);
  }, [pathname, loadAuthFromStorage]);

  // Login/Logout gibi "storage değişti" durumlarında anında güncelle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => loadAuthFromStorage();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [loadAuthFromStorage]);

  // Tarayıcı geçmişinde geri/ileri gidildiğinde auth'ı yeniden kontrol et
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => loadAuthFromStorage();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [loadAuthFromStorage]);

  const role = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isEmployer = role === "employer" || role === "company";
  const isAdvertiser = role === "advertiser";
  const isServiceProvider = role === "service_provider";
  const isDriver = role === "driver" || (!isAdmin && !isEmployer && !isAdvertiser && !isServiceProvider);

  const dashboardHref = useMemo(() => {
    if (isAdmin) return "/admin/dashboard";
    if (isEmployer) return "/employer/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    if (isServiceProvider) return "/service-provider/dashboard";
    return "/driver/dashboard";
  }, [isAdmin, isEmployer, isAdvertiser, isServiceProvider]);

  const profileHref = useMemo(() => {
    if (isDriver) return "/cv";
    if (isEmployer) return "/employer/profile";
    if (isAdvertiser) return "/advertiser/profile";
    if (isServiceProvider) return "/service-provider/profile";
    return null;
  }, [isDriver, isEmployer, isAdvertiser, isServiceProvider]);

  const displayName = useMemo(() => {
    const name = (user?.name || "").trim();
    if (name) return name;
    const email = (user?.email || "").trim();
    if (email) return email;
    return "Hesabım";
  }, [user]);

  const roleLabel = useMemo(() => {
    const r = (user?.role || "").toLowerCase();
    if (!r) return "";
    if (r === "admin") return "Admin";
    if (r === "employer" || r === "company") return "İşveren";
    if (r === "advertiser") return "Reklamveren";
    if (r === "driver") return "Sürücü";
    if (r === "service_provider") return "Hizmet Veren";
    return r;
  }, [user]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    } catch {}
    setOpen(false);
    router.replace("/");
  };

  // Menü açıkken dışarı tıklanınca kapat
  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const root = document.querySelector("[data-topbar-root='1']");
      if (root && root.contains(target)) return;

      setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleMenuLinkClick = () => setOpen(false);

  const { t } = useLang();

  // ----------------------------------------------------------
  // Üst menü kısayolları (rol bazlı) - kısa tutuldu
  // ----------------------------------------------------------
  const topShortcuts = useMemo(() => {
    const items: { href: string; label: string }[] = [];

    // Giriş yapılmışsa her zaman ana sayfa linki göster
    if (hasToken) {
      items.push({ href: "/", label: t("nav.home") });
      items.push({ href: dashboardHref, label: t("nav.dashboard") });
    } else {
      items.push({ href: "/jobs", label: t("nav.jobs") });
      return items;
    }

    if (isAdmin) {
      items.push(
        // Ana motorlar (kısa menüde en azından Fields görünür olsun)
        { href: "/admin/fields", label: "Fields" },

        // Operasyon
        { href: "/admin/job-approvals", label: "İlan" },
        { href: "/admin/ad-requests", label: "Reklam" },
        { href: "/admin/users", label: "Kullanıcılar" }
      );
    } else if (isEmployer) {
      items.push(
        { href: "/employer/jobs", label: "İlanlarım" },
        { href: "/employer/job-requests", label: "Taleplerim" }
      );
    } else if (isAdvertiser) {
      items.push(
        { href: "/advertiser/ads", label: "Reklamlarım" },
        { href: "/advertiser/requests", label: "Taleplerim" }
      );
    } else if (isServiceProvider) {
      items.push(
        { href: "/service-provider/services", label: "Hizmetlerim" },
        { href: "/service-provider/services/new", label: "Hizmet Ekle" }
      );
    } else if (isDriver) {
      items.push(
        { href: "/jobs", label: "İlanlar" },
        { href: "/driver/applications", label: "Başvurularım" },
        { href: "/cv", label: "CV" }
      );
    }

    const seen = new Set<string>();
    return items.filter((it) => {
      if (seen.has(it.href)) return false;
      seen.add(it.href);
      return true;
    });
  }, [hasToken, dashboardHref, isAdmin, isEmployer, isAdvertiser, isServiceProvider, isDriver, t]);

  // ----------------------------------------------------------
  // Admin flyout menüler (hover ile sağa açılır)
  // ----------------------------------------------------------
  const adminFlyouts = useMemo(() => {
    if (!isAdmin) return null;

    return {
      engines: {
        title: "Ana motorlar",
        links: [
          { href: "/admin/groups", label: "Grup Hiyerarşisi" },
          { href: "/admin/fields", label: "Fields Motoru" },
          { href: "/admin/profile-roles", label: "Profil Roller" },
          { href: "/admin/profile-sections", label: "Profil Bölümler" },
          { href: "/admin/profile-fields", label: "Profil Alanları" },
          { href: "/admin/profile-overrides", label: "Profil Override'lar" },
        ],
      },
      jobs: {
        title: "İlan Yönetimi",
        links: [
          { href: "/admin/job-approvals", label: "İlan Onay" },
          { href: "/admin/job-requests", label: "İlan Talepleri" },
          { href: "/admin/packages", label: "Paketler" },
          { href: "/admin/orders", label: "Siparişler" },
          { href: "/admin/jobs", label: "İlanlar" },
        ],
      },
      ads: {
        title: "Reklam Yönetimi",
        links: [
          { href: "/admin/ad-packages", label: "Reklam Paketleri" },
          { href: "/admin/ad-campaigns", label: "Reklam Kampanyaları" },
          { href: "/admin/ad-requests", label: "Reklam Talepleri" },
          { href: "/admin/placements", label: "Ad Placements" },
          { href: "/admin/geo-groups", label: "Geo Groups" },
          { href: "/admin/business-policies", label: "Business Policies" },
          { href: "/admin/company-profiles", label: "Company Profiles" },
        ],
      },
    };
  }, [isAdmin, t]);

  return (
    <header
      data-topbar-root="1"
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{ borderBottom: "1px solid var(--da-border)", backgroundColor: "rgba(7,16,30,0.92)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight" style={{ color: "var(--da-text)" }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg" style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}>
              D
            </span>
            DriverAll
          </Link>

          <nav className="hidden items-center gap-0.5 text-sm md:flex" style={{ color: "var(--da-text-2)" }}>
            {topShortcuts.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-lg px-3 py-1.5 transition-all hover:text-white"
                style={{ color: "inherit" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.1)"; (e.currentTarget as HTMLElement).style.color = "#93C5FD"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = ""; }}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative flex items-center gap-2">
          <LangSwitcher />
          {!user && hasToken ? (
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--da-border-str)", color: "var(--da-text-2)", backgroundColor: "transparent" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
            >
              {t("nav.logout")}
            </button>
          ) : !hasToken ? (
            <Link
              href="/register/auth"
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", boxShadow: "0 4px 14px rgba(59,130,246,0.4)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#60A5FA,#3B82F6)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#3B82F6,#1D4ED8)"; }}
            >
              {t("nav.login")}
            </Link>
          ) : (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-all"
                style={{ border: "1px solid var(--da-border-med)", backgroundColor: "var(--da-bg-card)", color: "var(--da-text)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--da-border-str)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--da-border-med)"; }}
              >
                <div className="leading-tight">
                  <div className="font-medium">{displayName}</div>
                  {roleLabel ? <div className="text-[11px]" style={{ color: "var(--da-text-3)" }}>{roleLabel}</div> : null}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 top-12 w-72 rounded-xl p-2 shadow-2xl" style={{ border: "1px solid var(--da-border-med)", backgroundColor: "var(--da-bg-card-2)" }}>
                  <div className="px-2 pb-2 pt-1">
                    <div className="text-xs font-semibold" style={{ color: "var(--da-text-3)" }}>{t("nav.quickmenu")}</div>
                  </div>

                  <Link
                    href="/"
                    onClick={handleMenuLinkClick}
                    className="block rounded-md px-2 py-2 text-sm transition-colors hover:text-white"
                    style={{ color: "var(--da-text-2)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                  >
                    g��� Ana Sayfa
                  </Link>

                  <Link
                    href={dashboardHref}
                    onClick={handleMenuLinkClick}
                    className="block rounded-md px-2 py-2 text-sm transition-colors"
                    style={{ color: "var(--da-text-2)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                  >
                    Dashboard
                  </Link>

                  {profileHref && !isAdmin && (
                    <Link
                      href={profileHref}
                      onClick={handleMenuLinkClick}
                      className="block rounded-md px-2 py-2 text-sm transition-colors"
                      style={{ color: "var(--da-text-2)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                    >
                      {t("nav.profile")}
                    </Link>
                  )}

                  {/* Employer menü */}
                  {isEmployer && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold" style={{ color: "var(--da-text-3)" }}>İlan</div>
                      <Link
                        href="/employer/jobs"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        İlanlarım
                      </Link>
                      <Link
                        href="/employer/job-requests"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        İlan Taleplerim
                      </Link>
                      <Link
                        href="/employer/applications"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Başvurular
                      </Link>
                      <Link
                        href="/employer/orders"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Siparişler
                      </Link>
                      <Link
                        href="/employer/branches"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        �?ubeler
                      </Link>
                    </>
                  )}

                  {/* Advertiser menü */}
                  {isAdvertiser && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold" style={{ color: "var(--da-text-3)" }}>Reklam</div>
                      <Link
                        href="/advertiser/ads"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Reklamlarım
                      </Link>
                      <Link
                        href="/advertiser/requests"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Reklam Taleplerim
                      </Link>
                      <Link
                        href="/advertiser/profile"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Profil
                      </Link>
                    </>
                  )}

                  {/* Driver menü */}
                  {isDriver && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold text-zinc-500">Sürücü</div>
                      <Link
                        href="/jobs"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        İlanlar
                      </Link>
                      <Link
                        href="/driver/applications"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Başvurularım
                      </Link>
                      <Link
                        href="/cv"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        CV Düzenle
                      </Link>
                    </>
                  )}

                  {/* Service Provider menü */}
                  {isServiceProvider && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold text-zinc-500">Hizmet Veren</div>
                      <Link
                        href="/service-provider/services"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Hizmetlerim
                      </Link>
                      <Link
                        href="/service-provider/services/new"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Hizmet Ekle
                      </Link>
                      <Link
                        href="/service-provider/profile"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Firma Profili
                      </Link>
                    </>
                  )}

                  {/* Admin menü */}
                  {isAdmin && adminFlyouts && (
                    <>
                      <div className="mt-2 h-px bg-white/[0.08]" />

                      {/* Flyout: Ana motorlar */}
                      <div className="relative group after:content-[''] after:absolute after:top-0 after:left-full after:h-full after:w-2 after:bg-transparent">
                        <div className="mt-2 px-2 pb-1 text-xs font-semibold text-zinc-500">Motorlar</div>

                        <div className="rounded-md hover:bg-white/[0.06]">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-zinc-200">
                            <span>{adminFlyouts.engines.title}</span>
                            <span className="text-xs text-zinc-500">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-7 ml-2 hidden w-72 rounded-xl border border-white/[0.1] bg-zinc-950/98 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-zinc-200">{adminFlyouts.engines.title}</div>
                            <div className="text-[11px] text-zinc-500">Projenin omurgası.</div>
                          </div>
                          {adminFlyouts.engines.links.map((l) => (
                            <Link
                              key={`eng-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Flyout: İlan Yönetimi */}
                      <div className="relative group after:content-[''] after:absolute after:top-0 after:left-full after:h-full after:w-2 after:bg-transparent">
                        <div className="rounded-md hover:bg-white/[0.06]">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-zinc-200">
                            <span>{adminFlyouts.jobs.title}</span>
                            <span className="text-xs text-zinc-500">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-0 ml-2 hidden w-72 rounded-xl border border-white/[0.1] bg-zinc-950/98 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-zinc-200">{adminFlyouts.jobs.title}</div>
                            <div className="text-[11px] text-zinc-500">Üzerine gelince açılır (flyout).</div>
                          </div>
                          {adminFlyouts.jobs.links.map((l) => (
                            <Link
                              key={`jobs-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Flyout: Reklam Yönetimi */}
                      <div className="relative group after:content-[''] after:absolute after:top-0 after:left-full after:h-full after:w-2 after:bg-transparent">
                        <div className="rounded-md hover:bg-white/[0.06]">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-zinc-200">
                            <span>{adminFlyouts.ads.title}</span>
                            <span className="text-xs text-zinc-500">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-0 ml-2 hidden w-72 rounded-xl border border-white/[0.1] bg-zinc-950/98 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-zinc-200">{adminFlyouts.ads.title}</div>
                            <div className="text-[11px] text-zinc-500">Üzerine gelince açılır (flyout).</div>
                          </div>
                          {adminFlyouts.ads.links.map((l) => (
                            <Link
                              key={`ads-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="my-2 h-px bg-white/[0.08]" />

                      <div className="px-2 pb-1 text-xs font-semibold text-zinc-500">Kullanıcı / Sistem</div>
                      <Link
                        href="/admin/users"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Kullanıcılar
                      </Link>
                      <Link
                        href="/admin/approvals"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm transition-colors" style={{ color: "var(--da-text-2)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--da-text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "var(--da-text-2)"; }}
                      >
                        Onaylar
                      </Link>
                    </>
                  )}

                  <div className="my-2 h-px bg-white/[0.08]" />

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-2 py-2 text-left text-sm text-rose-200 hover:bg-rose-950/30"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
