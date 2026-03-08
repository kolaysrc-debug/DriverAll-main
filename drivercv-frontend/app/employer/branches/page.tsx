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
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Şubeler</h1>
            <div className="text-xs text-slate-400">İlanlarda kullanılacak şube kayıtlarını yönetin.</div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employer/dashboard"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <button
              onClick={beginCreate}
              className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              + Şube ekle
            </button>
          </div>
        </div>

        {err ? (
          <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>
        ) : null}
        {info ? (
          <div className="mb-4 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 text-sm text-emerald-200">{info}</div>
        ) : null}

        <div className="mb-4 grid gap-2 md:grid-cols-12">
          <div className="md:col-span-8">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Şube ara (isim/lokasyon)"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />
          </div>
          <div className="md:col-span-4">
            <Link
              href="/employer/jobs/new"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm text-slate-100 hover:bg-slate-800"
            >
              Yeni ilan
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950">
          {loading ? (
            <div className="p-4 text-sm text-slate-300">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-slate-300">Şube bulunamadı.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-slate-200">
                  <tr>
                    <th className="px-3 py-2">Şube</th>
                    <th className="px-3 py-2">Lokasyon</th>
                    <th className="px-3 py-2">Telefon</th>
                    <th className="px-3 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b: any) => (
                    <tr key={b._id} className="border-t border-slate-800">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">{String(b?.displayName || b?.name || "-")}</div>
                        <div className="text-xs text-slate-500">code: {String(b?.code || "-")}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {String(b?.location?.stateName || b?.location?.stateCode || "-")}
                        {b?.location?.districtName ? ` / ${String(b.location.districtName)}` : ""}
                      </td>
                      <td className="px-3 py-2 text-slate-200">{String(b?.contact?.phone || "-")}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => beginEdit(b)}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => onDelete(String(b._id))}
                            className="rounded-md border border-rose-800/60 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-950/40"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-100">
                  {editing ? "Şube Düzenle" : "Yeni Şube"}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                >
                  Kapat
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
      </div>
    </EmployerOnly>
  );
}
