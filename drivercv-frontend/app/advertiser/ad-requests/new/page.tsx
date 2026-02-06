"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAdRequestFromAd } from "@/lib/api/adRequests";

export default function AdvertiserAdRequestNewPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const preAdId = useMemo(() => String(sp.get("adId") || ""), [sp]);

  const [adId, setAdId] = useState(preAdId);
  const [packageId, setPackageId] = useState("");
  const [placementKey, setPlacementKey] = useState("");
  const [requestedDays, setRequestedDays] = useState(7);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    try {
      await createAdRequestFromAd(adId, { packageId, placementKey, requestedDays, note });
      router.replace("/advertiser/ad-requests?created=1");
    } catch (e: any) {
      setErr(e?.message || "request failed");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Yeni Reklam Talebi</h1>

      {err ? <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(255,0,0,0.12)" }}>{err}</div> : null}

      <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Ad ID</div>
          <input value={adId} onChange={(e) => setAdId(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Package ID</div>
          <input value={packageId} onChange={(e) => setPackageId(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Placement Key</div>
          <input value={placementKey} onChange={(e) => setPlacementKey(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Requested Days</div>
          <input type="number" value={requestedDays} onChange={(e) => setRequestedDays(Number(e.target.value || 0))} style={{ width: "100%", padding: 10, borderRadius: 12 }} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Not</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12, minHeight: 80 }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => router.back()}>Vazgeç</button>
          <button className="btn" onClick={submit}>Talep Gönder</button>
        </div>
      </div>
    </div>
  );
}
