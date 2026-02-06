"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMyAdRequests } from "@/lib/api/adRequests";

export default function AdvertiserAdRequestsPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await fetchMyAdRequests();
      setList(data?.list || []);
    } catch (e: any) {
      setErr(e?.message || "load failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Reklam Taleplerim</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => router.push("/advertiser/ad-requests/new")}>Yeni Talep</button>
          <button className="btn" onClick={load}>Yenile</button>
        </div>
      </div>

      {err ? <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(255,0,0,0.12)" }}>{err}</div> : null}

      <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.6fr 0.6fr", gap: 10, padding: 10, opacity: 0.8, fontSize: 12 }}>
          <div>Reklam</div>
          <div>Paket</div>
          <div>Placement</div>
          <div>Gün</div>
          <div>Durum</div>
        </div>
        {(list || []).map((r) => (
          <div key={r._id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.6fr 0.6fr", gap: 10, padding: 10, borderRadius: 12, background: "rgba(0,0,0,0.18)", marginBottom: 8 }}>
            <div>{r.adTitle || "-"}</div>
            <div>{r.packageName || "-"}</div>
            <div>{r.placementKey || "-"}</div>
            <div>{r.requestedDays || 0}</div>
            <div>{r.status}</div>
          </div>
        ))}
        {list.length === 0 ? <div style={{ opacity: 0.8 }}>Henüz talep yok.</div> : null}
      </div>
    </div>
  );
}
