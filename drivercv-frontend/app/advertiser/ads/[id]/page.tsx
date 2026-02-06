"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAdById, updateAd } from "@/lib/api/ads";

export default function AdvertiserAdEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || "");

  const [ad, setAd] = useState<any>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [countryTargets, setCountryTargets] = useState("ALL");

  async function load() {
    setErr("");
    setOk("");
    try {
      const data = await fetchAdById(id);
      const a = data?.ad;
      setAd(a);
      setTitle(a?.title || "");
      setImageUrl(a?.imageUrl || "");
      setTargetUrl(a?.targetUrl || "");
      setCountryTargets((a?.countryTargets || ["ALL"]).join(","));
    } catch (e: any) {
      setErr(e?.message || "load failed");
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    setErr("");
    setOk("");
    try {
      await updateAd(id, {
        title,
        imageUrl,
        targetUrl,
        countryTargets: countryTargets.split(",").map((x) => x.trim()).filter(Boolean),
      });
      setOk("Kaydedildi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "save failed");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Reklam Düzenle</h1>
          <div style={{ opacity: 0.75, fontSize: 12 }}>status: {ad?.status || "-"} · id: {id}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => router.push("/advertiser/ads")}>Listeye Dön</button>
          <button className="btn" onClick={() => router.push("/advertiser/ad-requests/new?adId=" + encodeURIComponent(id))}>
            Yayın Talebi Oluştur
          </button>
        </div>
      </div>

      {err ? <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(255,0,0,0.12)" }}>{err}</div> : null}
      {ok ? <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(0,255,0,0.10)" }}>{ok}</div> : null}

      <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Başlık</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Görsel URL</div>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Hedef URL</div>
          <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Ülke Hedefleri (virgülle)</div>
          <input value={countryTargets} onChange={(e) => setCountryTargets(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}
