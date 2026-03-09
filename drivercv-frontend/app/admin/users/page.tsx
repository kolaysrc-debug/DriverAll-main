// PATH: DriverAll-main/drivercv-frontend/app/admin/users/page.tsx
// ----------------------------------------------------------
// Admin Users Page (UI = eski /drivers sayfası ile aynı)
// Not: backend endpoint halen /api/drivers olabilir (isimlendirme karışıklığı sadece route'ta çözüldü)
// ----------------------------------------------------------

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listDrivers,
  updateDriver,
  deleteDriver,
  DriverUser,
} from "@/lib/api/drivers";

type LoggedInUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

// ✅ advertiser eklendi
type RoleFilter = "all" | "driver" | "employer" | "advertiser" | "admin";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DriverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  
  // SubRoles için state
  const [availableSubRoles, setAvailableSubRoles] = useState<Array<{key: string, label: string}>>([]);
  const [subRolesLoading, setSubRolesLoading] = useState(false);

  function handleAuthFailure(message: string) {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event("driverall-auth-changed"));
    } catch {}
    setError(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  function isAuthError(e: any) {
    const msg = String(e?.message || "");
    return msg.includes("HTTP 401") || msg.includes("HTTP 403");
  }

  // Düzenleme formu
  const [editing, setEditing] = useState<DriverUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("driver");
  const [editNotes, setEditNotes] = useState("");
  const [editSubRoles, setEditSubRoles] = useState<string[]>([]);

  const [editActivityAreasCsv, setEditActivityAreasCsv] = useState("");
  const [editAllowedCountriesCsv, setEditAllowedCountriesCsv] = useState("");
  const [editAllowedCityCodesCsv, setEditAllowedCityCodesCsv] = useState("");
  const [editAllowedDistrictCodesCsv, setEditAllowedDistrictCodesCsv] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await listDrivers();
      setUsers(data);
    } catch (err: any) {
      if (isAuthError(err)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setError(err.message || "Kullanıcılar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubRoles() {
    try {
      setSubRolesLoading(true);
      const res = await fetch("/api/public/roles/candidate-subroles");
      const data = await res.json();
      if (data.success && Array.isArray(data.roles)) {
        setAvailableSubRoles(data.roles.map((r: any) => ({
          key: r.key || r.name,
          label: r.label || r.displayName || r.name
        })));
      }
    } catch (err) {
      console.error("SubRoles yükleme hatası:", err);
    } finally {
      setSubRolesLoading(false);
    }
  }

  // Kullanıcı + listeyi yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("user");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setCurrentUser(parsed);
        } catch {
          // geçersiz JSON'u boşver
        }
      }
    }

    loadUsers();
    loadSubRoles();
  }, []);

  // ----------------------------------------------------
  // Filtrelenmiş liste
  // ----------------------------------------------------
  const filteredUsers = users.filter((u) => {
    // Rol filtresi
    const role = (u.role || "driver") as RoleFilter;
    if (roleFilter !== "all" && role !== roleFilter) {
      return false;
    }

    // Arama filtresi
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.role || "").toLowerCase().includes(s)
    );
  });

  // ----------------------------------------------------
  // Aktif / pasif toggle
  // ----------------------------------------------------
  async function handleToggleActive(user: DriverUser) {
    try {
      await updateDriver(user._id, { isActive: !user.isActive });
      await loadUsers();
    } catch (err: any) {
      if (isAuthError(err)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setError(err.message || "Durum güncellenirken hata oluştu.");
    }
  }

  // ----------------------------------------------------
  // Onay toggle
  // ----------------------------------------------------
  async function handleToggleApproved(user: DriverUser) {
    try {
      await updateDriver(user._id, { isApproved: !user.isApproved });
      await loadUsers();
    } catch (err: any) {
      if (isAuthError(err)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setError(err.message || "Onay durumu güncellenirken hata oluştu.");
    }
  }

  // ----------------------------------------------------
  // Silme
  // ----------------------------------------------------
  async function handleDelete(user: DriverUser) {
    if (
      !window.confirm(
        `"${user.name || user.email}" kullanıcısını silmek istiyor musun?`
      )
    ) {
      return;
    }

    try {
      await deleteDriver(user._id);
      await loadUsers();
    } catch (err: any) {
      if (isAuthError(err)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setError(err.message || "Kullanıcı silinirken hata oluştu.");
    }
  }

  // ----------------------------------------------------
  // Düzenleme başlat / iptal / kaydet
  // ----------------------------------------------------
  function startEdit(user: DriverUser) {
    setEditing(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "driver");
    setEditNotes(user.notes || "");
    const subRoles = Array.isArray((user as any).subRoles) ? ((user as any).subRoles as string[]) : [];
    setEditSubRoles(subRoles);

    const areas = Array.isArray((user as any).activityAreas) ? ((user as any).activityAreas as string[]) : [];
    setEditActivityAreasCsv(areas.join(","));

    const pl = (user as any).providerLimits || {};
    const ac = Array.isArray(pl.allowedCountries) ? (pl.allowedCountries as string[]) : [];
    const acc = Array.isArray(pl.allowedCityCodes) ? (pl.allowedCityCodes as string[]) : [];
    const adc = Array.isArray(pl.allowedDistrictCodes) ? (pl.allowedDistrictCodes as string[]) : [];
    setEditAllowedCountriesCsv(ac.join(","));
    setEditAllowedCityCodesCsv(acc.join(","));
    setEditAllowedDistrictCodesCsv(adc.join(","));
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    try {
      const toCsvArr = (v: string) =>
        String(v || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

      const activityAreas = toCsvArr(editActivityAreasCsv);
      const providerLimits = {
        allowedCountries: toCsvArr(editAllowedCountriesCsv),
        allowedCityCodes: toCsvArr(editAllowedCityCodesCsv),
        allowedDistrictCodes: toCsvArr(editAllowedDistrictCodesCsv),
      };

      await updateDriver(editing._id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        notes: editNotes.trim(),
        subRoles: editSubRoles,
        activityAreas,
        providerLimits,
      });

      setEditing(null);
      await loadUsers();
    } catch (err: any) {
      if (isAuthError(err)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setError(err.message || "Kullanıcı güncellenirken hata oluştu.");
    }
  }

  // ----------------------------------------------------
  // Yardımcı formatlayıcılar
  // ----------------------------------------------------
  function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCvInfo(user: DriverUser): string {
    const info = (user as any).cvInfo;
    if (!info || !info.hasCv) return "CV yok";

    const count =
      info.filledKeysCount !== undefined ? info.filledKeysCount : undefined;
    const datePart = info.updatedAt ? formatDate(info.updatedAt) : "-";

    if (count !== undefined) {
      return `${count} alan · ${datePart}`;
    }
    return datePart;
  }

  // ----------------------------------------------------
  // JSX
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Başlık */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Kullanıcılar
            </h1>
            <p className="text-slate-400 text-sm">
              Bu ekran, sisteme kayıt olan tüm sürücü, işveren, reklamveren ve admin
              kullanıcıları admin tarafından izlemek ve yönetmek içindir.
              Roller, CV durumu, onay ve aktiflik burada ayrışır.
            </p>
            {currentUser && (
              <p className="text-[11px] text-slate-400 mt-1">
                Aktif oturum:{" "}
                <span className="font-semibold text-slate-100">
                  {currentUser.name || currentUser.email || "Bilinmeyen"}
                </span>
                {currentUser.email && currentUser.name && (
                  <span className="text-slate-500"> ({currentUser.email})</span>
                )}
                {currentUser.role && (
                  <span className="ml-2 text-slate-500">
                    • Rol: {currentUser.role}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5">
              <button
                type="button"
                onClick={() => setRoleFilter("all")}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  roleFilter === "all"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("driver")}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  roleFilter === "driver"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Sürücüler
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("employer")}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  roleFilter === "employer"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                İşverenler
              </button>

              {/* ✅ Reklamverenler butonu eklendi */}
              <button
                type="button"
                onClick={() => setRoleFilter("advertiser")}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  roleFilter === "advertiser"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Reklamverenler
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter("admin")}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  roleFilter === "admin"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Admin
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="İsim, e-posta veya rol ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={loadUsers}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm px-3 py-1.5 border border-slate-600"
              >
                Yenile
              </button>
            </div>
          </div>
        </header>

        {/* Düzenleme formu */}
        {editing && (
          <section className="bg-slate-900/70 border border-amber-500/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-amber-300">
                "{editing.name || editing.email}" kullanıcısını düzenliyorsun
              </h2>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-slate-300 hover:text-slate-50 underline"
              >
                Düzenlemeyi iptal et
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSaveEdit}>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="İsim"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                  required
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="E-posta"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                  required
                />

                {/* ✅ advertiser option eklendi */}
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                >
                  <option value="driver">Sürücü / Aday</option>
                  <option value="employer">İşveren / Firma</option>
                  <option value="advertiser">Reklamveren</option>
                  <option value="admin">Admin</option>
                </select>

                {/* SubRoles multi-select */}
                <div>
                  <div className="mb-1 text-xs text-slate-400">
                    Alt Roller (Ctrl/Cmd ile çoklu seçim)
                  </div>
                  <select
                    multiple
                    value={editSubRoles}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      setEditSubRoles(options.map(opt => opt.value));
                    }}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none min-h-[100px]"
                    disabled={subRolesLoading || availableSubRoles.length === 0}
                  >
                    {availableSubRoles.length > 0 ? (
                      availableSubRoles.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        {subRolesLoading ? "Yükleniyor..." : "Alt rol bulunamadı"}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {(editRole === "advertiser" || editRole === "employer") && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs text-slate-400">
                      Faaliyet alanları (CSV)
                    </div>
                    <input
                      type="text"
                      value={editActivityAreasCsv}
                      onChange={(e) => setEditActivityAreasCsv(e.target.value)}
                      placeholder="src,adr,psikoteknik,myk"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-400">
                      Ülke kısıtı (CSV)
                    </div>
                    <input
                      type="text"
                      value={editAllowedCountriesCsv}
                      onChange={(e) => setEditAllowedCountriesCsv(e.target.value)}
                      placeholder="TR"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-400">
                      İl kısıtı (cityCode) (CSV)
                    </div>
                    <input
                      type="text"
                      value={editAllowedCityCodesCsv}
                      onChange={(e) => setEditAllowedCityCodesCsv(e.target.value)}
                      placeholder="34,06"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-400">
                      İlçe kısıtı (districtCode) (CSV)
                    </div>
                    <input
                      type="text"
                      value={editAllowedDistrictCodesCsv}
                      onChange={(e) => setEditAllowedDistrictCodesCsv(e.target.value)}
                      placeholder="3401,0601"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Admin notu (sakıncalı aday, açıklama vb.)"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Hata */}
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Liste */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Kullanıcı</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">CV</th>
                <th className="px-3 py-2 text-left">Onay</th>
                <th className="px-3 py-2 text-left">Durum</th>
                <th className="px-3 py-2 text-left">Oluşturma</th>
                <th className="px-3 py-2 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
                    Kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user._id}
                    className="border-t border-slate-800 hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>

                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-50">
                        {user.name || "-"}
                      </div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                      {user.notes && (
                        <div className="text-[11px] text-amber-300 mt-0.5">
                          Not: {user.notes}
                        </div>
                      )}
                    </td>

                    {/* ✅ advertiser etiketi eklendi */}
                    <td className="px-3 py-2 text-xs">
                      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px]">
                        {user.role === "admin" && "Admin"}
                        {user.role === "employer" && "İşveren / Firma"}
                        {user.role === "advertiser" && "Reklamveren"}
                        {(!user.role || user.role === "driver") && "Sürücü / Aday"}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      {(user as any).cvInfo && (user as any).cvInfo.hasCv ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                            CV VAR
                          </span>
                          <span className="text-[11px] text-emerald-300">
                            {formatCvInfo(user)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full bg-rose-500/20 text-rose-300 text-[11px] px-2 py-0.5">
                          CV YOK
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {user.isApproved ? (
                        <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                          Onaylı
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-700/30 text-slate-300 text-[11px] px-2 py-0.5">
                          Beklemede
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {user.isActive !== false ? (
                        <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-rose-500/20 text-rose-300 text-[11px] px-2 py-0.5">
                          Pasif / Bloklu
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-slate-300">
                      {formatDate(user.createdAt as any)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="text-[11px] px-2 py-0.5 rounded border border-sky-600 text-sky-300 hover:bg-sky-900/40"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleApproved(user)}
                          className="text-[11px] px-2 py-0.5 rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-900/30"
                        >
                          {user.isApproved ? "Onayı Kaldır" : "Onayla"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className="text-[11px] px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
                        >
                          {user.isActive !== false ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="text-[11px] px-2 py-0.5 rounded border border-rose-600 text-rose-300 hover:bg-rose-900/40"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
