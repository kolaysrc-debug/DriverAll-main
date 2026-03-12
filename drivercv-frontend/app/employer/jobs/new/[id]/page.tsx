"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/jobs/[id]/page.tsx
// ----------------------------------------------------------
// Employer Job Edit
// - GET /api/jobs/:id  (published değilse 401 gelebilir; bu sayfa employer/admin için kullanılacak)
// - PUT /api/jobs/:id
// Not: Backend şu an draft read’i public kapalı. Bu sayfa yine de işe yarasın diye
//      “GET ile açamazsa” employer listeden gelen veriye ihtiyaç olur. Şimdilik basit çözüm:
//      GET başarısız olursa kullanıcıya mesaj gösteriyoruz ve sadece update ile ilerliyoruz.
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJobById, updateJob, archiveJob, deleteJob } from "@/lib/api/jobs";
import { getUser } from "@/lib/session";

export default function EmployerJobEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("TR");
  const [cityCode, setCityCode] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [criteriaJson, setCriteriaJson] = useState("{}");
  const [status, setStatus] = useState<string>("draft");
  const [adminNote, setAdminNote] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u?.role) {
      router.replace("/register/auth");
      return;
    }
    if (u.role !== "employer" && u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchJobById(id);
        if (!alive) return;

        const j = data?.job;
        if (j) {
          setTitle(String(j.title || ""));
          setDescription(String(j.description || ""));
          setCountry(String(j.country || j.location?.countryCode || "TR"));
          setCityCode(String(j.location?.cityCode || ""));
          setLocationLabel(String(j.location?.label || ""));
          setStatus(String(j.status || "draft"));
          setAdminNote(String(j.adminNote || ""));
          setCriteriaJson(JSON.stringify(j.criteria || {}, null, 2));
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "İlan okunamadı (draft okuma kısıtı olabilir). Bu sayfada yine de update deneyebilirsin.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave() {
    setErr(null);
    const t = title.trim();
    if (!t) {
      setErr("Başlık zorunlu.");
      return;
    }

    let criteriaObj: any = {};
    try {
      criteriaObj = criteriaJson.trim() ? JSON.parse(criteriaJson) : {};
    } catch {
      setErr("Kriter JSON geçersiz. Örn: { \"SRC1\": true }");
      return;
    }

    setSaving(true);
    try {
      await updateJob(id, {
        title: t,
        description,
        country,
        location: {
          countryCode: country,
          cityCode: cityCode.trim(),
          label: locationLabel.trim(),
        },
        criteria: criteriaObj,
      });
      router.replace("/employer/jobs");
    } catch (e: any) {
      setErr(e?.message || "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive() {
    setErr(null);
    setSaving(true);
    try {
      await archiveJob(id);
      router.replace("/employer/jobs");
    } catch (e: any) {
      setErr(e?.message || "Arşiv başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Bu ilan silinsin mi? (Geri alınamaz)");
    if (!ok) return;

    setErr(null);
    setSaving(true);
    try {
      await deleteJob(id);
      router.replace("/employer/jobs");
    } catch (e: any) {
      setErr(e?.message || "Silme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">İlan Düzenle</h1>
            <p className="text-sm text-slate-400">
              status: <span className="text-slate-200">{status}</span> • id:{" "}
              <span className="text-slate-200">{id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/employer/jobs")}
            className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Listeye Dön
          </button>
        </header>

        {err && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {!loading && !err && status !== "published" ? (
          <div
            className={
              "text-sm rounded-lg px-3 py-2 border " +
              (status === "pending"
                ? "bg-amber-950/30 border-amber-800/60 text-amber-200"
                : status === "rejected"
                  ? "bg-rose-950/30 border-rose-800/60 text-rose-200"
                  : status === "archived"
                    ? "bg-slate-900/40 border-slate-700 text-slate-200"
                    : "bg-sky-950/20 border-sky-800/60 text-sky-200")
            }
          >
            {status === "draft" ? (
              <div>Bu ilan taslak. Henüz yayında değil.</div>
            ) : status === "pending" ? (
              <div>Bu ilan admin onayı bekliyor. Onaylanana kadar yayında görünmez.</div>
            ) : status === "rejected" ? (
              <div>
                <div>Bu ilan reddedildi. Düzenleyip tekrar gönderebilirsin.</div>
                {adminNote ? <div className="mt-1 text-xs opacity-90">Admin notu: {adminNote}</div> : null}
              </div>
            ) : status === "archived" ? (
              <div>Bu ilan arşivli. Yayında değil.</div>
            ) : (
              <div>Bu ilan yayında değil. (Durum: {String(status)})</div>
            )}
          </div>
        ) : null}

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-400">Yükleniyor...</p>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400">Başlık</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Açıklama</label>
                <textarea
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-h-[140px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Ülke</label>
                  <select
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="TR">TR</option>
                    <option value="DE">DE</option>
                    <option value="NL">NL</option>
                    <option value="NO">NO</option>
                    <option value="FI">FI</option>
                    <option value="ES">ES</option>
                    <option value="IT">IT</option>
                    <option value="HU">HU</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Şehir Kodu</label>
                  <input
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                    value={cityCode}
                    onChange={(e) => setCityCode(e.target.value)}
                    placeholder="örn: IST"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Lokasyon Etiketi</label>
                  <input
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder="örn: İstanbul"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Kriter JSON</label>
                <textarea
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-h-[160px] font-mono text-xs"
                  value={criteriaJson}
                  onChange={(e) => setCriteriaJson(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Şimdilik manuel. Sonraki sprintte burada “kriter seçici UI” bağlayacağız.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>

                <button
                  type="button"
                  onClick={onArchive}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 disabled:opacity-60"
                >
                  Arşivle
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                >
                  Sil
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
