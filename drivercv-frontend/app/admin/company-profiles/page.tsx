"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

type CompanyProfile = {
  _id: string;
  ownerUserId: string;
  legalName?: string;
  taxNo?: string;
  taxOffice?: string;
  addressText?: string;
  country?: string;
  provinceCode?: string;
  districtCodes?: string[];
  businessType?: string;
  verifiedStatus?: "pending" | "verified" | "rejected";
  adminNote?: string;
  adTargetingOverride?: {
    enabled?: boolean;
    geoLevel?: "" | "country" | "province" | "district" | "geoGroup";
    geoTargets?: string[];
    note?: string;
    updatedBy?: string | null;
    updatedAt?: string | null;
  };
};

const geoLevelOptions: Array<NonNullable<NonNullable<CompanyProfile["adTargetingOverride"]>["geoLevel"]>> = [
  "country",
  "province",
  "district",
  "geoGroup",
];

export default function AdminCompanyProfilesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "verified" | "rejected" | "">("pending");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [list, setList] = useState<CompanyProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const selected = useMemo(() => list.find((x) => String(x._id) === String(selectedId)) || null, [list, selectedId]);

  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideGeoLevel, setOverrideGeoLevel] = useState<"country" | "province" | "district" | "geoGroup">("district");
  const [overrideGeoTargetsText, setOverrideGeoTargetsText] = useState<string>("");
  const [overrideNote, setOverrideNote] = useState<string>("");

  function handleAuthFailure(message: string) {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event("driverall-auth-changed"));
    } catch {}
    setErr(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  const load = async () => {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/company-profile/admin/list${qs}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı");

      const items: CompanyProfile[] = Array.isArray(data?.list) ? data.list : [];
      setList(items);
      if (items.length && !selectedId) setSelectedId(String(items[0]._id));
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    setInfo(null);
    setErr(null);

    const o = selected?.adTargetingOverride;
    const enabled = o?.enabled === true;
    setOverrideEnabled(enabled);

    const level = (o?.geoLevel || "district") as any;
    setOverrideGeoLevel(geoLevelOptions.includes(level) ? level : "district");

    const targets = Array.isArray(o?.geoTargets) ? o?.geoTargets : [];
    setOverrideGeoTargetsText(targets.join(", "));

    setOverrideNote(String(o?.note || ""));
  }, [selectedId, selected]);

  const saveOverride = async () => {
    if (!selected) return;

    setErr(null);
    setInfo(null);
    try {
      const geoTargets = String(overrideGeoTargetsText || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const body = {
        enabled: overrideEnabled,
        geoLevel: overrideGeoLevel,
        geoTargets,
        note: overrideNote,
      };

      const res = await fetch(`/api/company-profile/admin/${encodeURIComponent(String(selected._id))}/ad-targeting-override`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Kaydedilemedi");

      setInfo("İstisna kaydedildi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 text-slate-200">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Company Profiles</h1>
            <div className="text-xs text-slate-400">Firma profilleri ve reklam hedefleme istisnaları.</div>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="pending">pending</option>
                <option value="verified">verified</option>
                <option value="rejected">rejected</option>
                <option value="">all</option>
              </select>
            </div>
            <button
              onClick={load}
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Yenile
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {info}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Liste</div>
              <div className="text-xs text-slate-400">{list.length} kayıt</div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-400">Yükleniyor…</div>
            ) : list.length === 0 ? (
              <div className="text-sm text-slate-400">Kayıt yok.</div>
            ) : (
              <div className="space-y-2 pointer-events-auto">
                {list.map((c) => {
                  const isSel = String(c._id) === String(selectedId);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => setSelectedId(String(c._id))}
                      className={`w-full cursor-pointer rounded-lg border p-3 text-left hover:bg-slate-900 ${
                        isSel ? "border-sky-600 bg-slate-900/60" : "border-slate-800 bg-slate-950/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-slate-100">{c.legalName || "(no name)"}</div>
                        <div className="text-xs text-slate-400">{c.verifiedStatus || ""}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {String(c.businessType || "OTHER")}
                        {c.provinceCode ? ` • ${c.provinceCode}` : ""}
                        {Array.isArray(c.districtCodes) && c.districtCodes.length ? ` • districts: ${c.districtCodes.length}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        override: {String(c.adTargetingOverride?.enabled === true)}
                        {c.adTargetingOverride?.enabled ? ` • ${c.adTargetingOverride.geoLevel}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 text-sm font-semibold">Reklam Hedefleme İstisnası</div>

            {!selected ? (
              <div className="text-sm text-slate-400">Seçim yok.</div>
            ) : (
              <>
                <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <div className="text-sm font-semibold text-slate-100">{selected.legalName || "(no name)"}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    businessType: {String(selected.businessType || "OTHER")} • status: {String(selected.verifiedStatus || "")}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={overrideEnabled}
                      onChange={(e) => setOverrideEnabled(e.target.checked)}
                    />
                    <span>İstisna açık (enabled)</span>
                  </label>

                  <div>
                    <div className="mb-1 text-xs text-slate-400">geoLevel</div>
                    <select
                      value={overrideGeoLevel}
                      onChange={(e) => setOverrideGeoLevel(e.target.value as any)}
                      disabled={!overrideEnabled}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {geoLevelOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-400">geoTargets (virgülle)</div>
                    <input
                      value={overrideGeoTargetsText}
                      onChange={(e) => setOverrideGeoTargetsText(e.target.value)}
                      disabled={!overrideEnabled}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
                      placeholder={overrideGeoLevel === "geoGroup" ? "ISTANBUL_EUROPE" : "TR-34, TR-06 veya TR"}
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      country: boş bırakılırsa otomatik (TR). province/district: en az 1 hedef gerekir. geoGroup: tek grupKey.
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-400">note</div>
                    <textarea
                      value={overrideNote}
                      onChange={(e) => setOverrideNote(e.target.value)}
                      disabled={!overrideEnabled}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm min-h-[90px] disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveOverride}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
}
