"use client";

import React, { useEffect, useState } from "react";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  isApproved?: boolean;
  createdAt?: string;
};

// Token'ı localStorage'dan oku
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

// Backend'e admin token'ı ile istek atan helper
async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>) || {},
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const { res, data } = await authFetch("/api/admin/users");

      if (!res.ok) {
        setError(
          String((data as any).message || "Kullanıcı listesi alınamadı.")
        );
        setUsers([]);
        return;
      }

      setUsers(((data as any).users || []) as User[]);
    } catch (err: any) {
      setError(err.message || "Kullanıcı listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleActive(id: string) {
    const { res, data } = await authFetch(
      `/api/admin/users/${id}/toggle-active`,
      { method: "PUT" }
    );
    if (!res.ok) {
      alert((data as any).message || "Aktif/pasif işlemi başarısız.");
      return;
    }
    loadUsers();
  }

  async function handleToggleApprove(id: string) {
    const { res, data } = await authFetch(
      `/api/admin/users/${id}/toggle-approve`,
      { method: "PUT" }
    );
    if (!res.ok) {
      alert((data as any).message || "Onay işlemi başarısız.");
      return;
    }
    loadUsers();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Bu kullanıcıyı silmek istediğine emin misin?")) return;

    const { res, data } = await authFetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert((data as any).message || "Kullanıcı silinemedi.");
      return;
    }
    loadUsers();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Kullanıcı Yönetimi
            </h1>
            <p className="text-slate-400 text-sm">
              Tüm sürücü ve kullanıcı hesaplarını buradan yönetebilirsin.
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Yenile
          </button>
        </header>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Ad</th>
                <th className="px-3 py-2 text-left">E-posta</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-center">Durum</th>
                <th className="px-3 py-2 text-center">Onay</th>
                <th className="px-3 py-2 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-400"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-400"
                  >
                    Kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-slate-800 hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 text-slate-300">{u.email}</td>
                    <td className="px-3 py-2 text-slate-300">{u.role}</td>
                    <td className="px-3 py-2 text-center">
                      {u.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-700/30 text-slate-300 text-[11px] px-2 py-0.5">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {u.isApproved ? (
                        <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5">
                          Onaylı
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5">
                          Beklemede
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {u.role === "admin" ? (
                        <span className="text-[11px] text-slate-500">
                          Admin değiştirilemez
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u._id)}
                            className="text-[11px] px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
                          >
                            Aktif/Pasif
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(u._id)}
                            className="text-[11px] px-2 py-0.5 rounded border border-sky-600 text-sky-300 hover:bg-sky-900/40"
                          >
                            Onay Değiştir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u._id)}
                            className="text-[11px] px-2 py-0.5 rounded border border-rose-600 text-rose-300 hover:bg-rose-900/40"
                          >
                            Sil
                          </button>
                        </div>
                      )}
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
