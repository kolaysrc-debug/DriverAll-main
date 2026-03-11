"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EmployerOnly from "@/components/EmployerOnly";
import { createBranch, deleteBranch, fetchMyBranches, updateBranch } from "@/lib/api/branches";

type LocItem = {
  code: string;
  name: string;
};

type BranchRow = any;

function normalizeCountryCode(value: string, fallback = "TR") {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return fallback;
  if (v.length === 2) return v;
  return fallback;
}

async function fetchLocations(params: { country: string; level: "state" | "district"; parentCode?: string }) {
  const qs = new URLSearchParams();
  qs.set("country", params.country);
  qs.set("level", params.level);
  if (params.parentCode) qs.set("parentCode", params.parentCode);

  const res = await fetch(`/api/locations/list?${qs.toString()}`, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Locations alınamadı.");
  }
  return Array.isArray(json.list) ? json.list : [];
}

export default function EmployerBranchesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [items, setItems] = useState<BranchRow[]>([]);

  const [q, setQ] = useState("");

  // create/edit modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(() => items.find((x) => String(x._id) === String(editingId)) || null, [items, editingId]);

  const [saving, setSaving] = useState(false);

  // form fields
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [country, setCountry] = useState("TR");
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [states, setStates] = useState<LocItem[]>([]);
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  const stateObj = useMemo(() => states.find((x) => String(x.code) === String(stateCode)) || null, [states, stateCode]);
  const districtObj = useMemo(
    () => districts.find((x) => String(x.code) === String(districtCode)) || null,
    [districts, districtCode]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const data = await fetchMyBranches();
      setItems(Array.isArray(data?.branches) ? data.branches : []);
    } catch (e: any) {
      setErr(e?.message || "Şubeler alınamadı.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function beginCreate() {
    setEditingId(null);
    setName("");
    setDisplayName("");
    setDescription("");
    setPhone("");
    setFullAddress("");
    setCountry("TR");
    setStateCode("");
    setDistrictCode("");
    setOpen(true);
    setErr(null);
    setInfo(null);
  }

  function beginEdit(row: BranchRow) {
    setEditingId(String(row._id));
    setName(String(row?.name || ""));
    setDisplayName(String(row?.displayName || ""));
    setDescription(String(row?.description || ""));
    setPhone(String(row?.contact?.phone || ""));
    setFullAddress(String(row?.location?.fullAddress || ""));

    setCountry(normalizeCountryCode(String(row?.location?.countryCode || "TR"), "TR"));
    setStateCode(String(row?.location?.stateCode || ""));
    setDistrictCode(String(row?.location?.districtCode || ""));

    setOpen(true);
    setErr(null);
    setInfo(null);
  }

  useEffect(() => {
    load();
  }, []);

  // load states (TR)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLocLoading(true);
        const c = normalizeCountryCode(country, "TR");
        if (c !== "TR") {
          if (!alive) return;
          setStates([]);
          setDistricts([]);
          return;
        }
        const s = await fetchLocations({ country: "TR", level: "state" });
        s.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || ""), "tr"));
        if (!alive) return;
        setStates(s);
      } catch {
        if (!alive) return;
        setStates([]);
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [country]);

  // load districts
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDistricts([]);
        setDistrictCode((prev) => prev);

        const c = normalizeCountryCode(country, "TR");
        if (c !== "TR" || !stateCode) return;

        setLocLoading(true);
        const d = await fetchLocations({ country: "TR", level: "district", parentCode: stateCode });
        d.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || ""), "tr"));
        if (!alive) return;
        setDistricts(d);

        if (districtCode) {
          const exists = d.some((x: any) => String(x.code) === String(districtCode));
          if (!exists) setDistrictCode("");
        }
      } catch {
        if (!alive) return;
        setDistricts([]);
      } finally {
        if (!alive) return;
        setLocLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [country, stateCode]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((b: any) => {
      const nm = String(b?.displayName || b?.name || "").toLowerCase();
      const loc = String(b?.location?.stateName || b?.location?.districtName || b?.location?.stateCode || "").toLowerCase();
      return nm.includes(term) || loc.includes(term);
    });
  }, [items, q]);

  async function onSave() {
    setErr(null);
    setInfo(null);

    const nm = name.trim();
    const dn = (displayName || "").trim() || nm;
    if (!nm) {
      setErr("Şube adı zorunlu.");
      return;
    }
    if (!phone.trim()) {
      setErr("Telefon zorunlu.");
      return;
    }
    if (!stateCode) {
      setErr("İl seçimi zorunlu.");
      return;
    }
    if (!districtCode) {
      setErr("İlçe seçimi zorunlu.");
      return;
    }
    if (!fullAddress.trim()) {
      setErr("Adres zorunlu.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: nm,
        displayName: dn,
        description: description.trim(),
        location: {
          countryCode: "TR",
          stateCode,
          stateName: stateObj?.name || "",
          districtCode,
          districtName: districtObj?.name || "",
          fullAddress: fullAddress.trim(),
        },
        contact: {
          phone: phone.trim(),
        },
      };

      if (editingId) {
        await updateBranch(editingId, payload);
        setInfo("Şube güncellendi.");
      } else {
        await createBranch(payload);
        setInfo("Şube oluşturuldu.");
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Bu şubeyi silmek istiyor musunuz?")) return;
    setErr(null);
    setInfo(null);
    try {
      await deleteBranch(id);
      setInfo("Şube silindi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Silinemedi.");
    }
  }

  return (
    <EmployerOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Şubeler</h1>
                <p className="text-xs text-slate-400 mt-0.5">İlanlarda kullanılacak şube kayıtlarını yönetin</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <button onClick={beginCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">+ Şube Ekle</button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {info}
            </div>
          )}

          {/* Search */}
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Şube ara (isim/lokasyon)…"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
            />
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50">
              Yenile
            </button>
          </div>

          {/* Count */}
          <div className="text-xs text-slate-500">{filtered.length} şube</div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-slate-400 text-sm">Henüz şube eklenmemiş.</div>
              <button onClick={beginCreate} className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                İlk Şubeyi Ekle
              </button>
            </div>
          )}

          {/* Branch Table */}
          {!loading && filtered.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Şube</th>
                      <th className="px-4 py-3">Lokasyon</th>
                      <th className="px-4 py-3">Telefon</th>
                      <th className="px-4 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b: any) => (
                      <tr key={b._id} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{String(b?.displayName || b?.name || "-")}</div>
                          <div className="text-xs text-slate-500">code: {String(b?.code || "-")}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {String(b?.location?.stateName || b?.location?.stateCode || "-")}
                          {b?.location?.districtName ? ` / ${String(b.location.districtName)}` : ""}
                        </td>
                        <td className="px-4 py-3 text-slate-200">{String(b?.contact?.phone || "-")}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button onClick={() => beginEdit(b)} className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900/30 transition-colors">Düzenle</button>
                            <button onClick={() => onDelete(String(b._id))} className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors">Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>{/* /space-y-4 */}

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-100">
                  {editing ? "Şube Düzenle" : "Yeni Şube"}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400">Şube adı</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    placeholder="Örn: Merkez Şube"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Görünen ad</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    placeholder="(boşsa şube adı kullanılır)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Açıklama</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Telefon</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    placeholder="0xxx..."
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Ülke</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    placeholder="TR"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">İl</label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    disabled={locLoading || normalizeCountryCode(country, "TR") !== "TR"}
                  >
                    <option value="">{locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">İlçe</label>
                  <select
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    disabled={locLoading || !stateCode || normalizeCountryCode(country, "TR") !== "TR"}
                  >
                    <option value="">{!stateCode ? "Önce il seçiniz" : locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Adres</label>
                  <textarea
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    rows={2}
                    placeholder="Mahalle, cadde, no..."
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                  disabled={saving}
                >
                  Vazgeç
                </button>
                <button
                  onClick={onSave}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/employer/jobs" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">İlanlar</Link>
              <Link href="/employer/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
              <Link href="/employer/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </EmployerOnly>
  );
}
