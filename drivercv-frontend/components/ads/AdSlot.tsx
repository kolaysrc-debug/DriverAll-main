"use client";

import React, { useEffect, useState } from "react";

type Creative = { kind?: string; url?: string; alt?: string };
type SlotItem = { _id: string; title: string; clickUrl: string; creatives: Creative[] };

type SlotResponse = {
  success: boolean;
  placement: string;
  country: string;
  viewerGeo?: { provinceCode?: string; districtCode?: string };
  fixed: SlotItem | null;
  carousel: SlotItem[];
  rules?: { defaultCarouselSpeedMs?: number };
};

function pickImage(item: SlotItem | null): Creative | null {
  if (!item) return null;
  const list = Array.isArray(item.creatives) ? item.creatives : [];
  const img = list.find((c) => (c.kind || "image") === "image" && c.url);
  return img || (list[0] || null);
}

export default function AdSlot({
  placement,
  country = "TR",
  provinceCode,
  districtCode,
  ipProvinceCode,
  ipDistrictCode,
  className = "",
}: {
  placement: string;
  country?: string;
  provinceCode?: string;
  districtCode?: string;
  ipProvinceCode?: string;
  ipDistrictCode?: string;
  className?: string;
}) {
  const [data, setData] = useState<SlotResponse | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const sp = new URLSearchParams({
          placement,
          country: String(country || "TR").toUpperCase(),
        });

        if (provinceCode) sp.set("provinceCode", String(provinceCode));
        if (districtCode) sp.set("districtCode", String(districtCode));
        if (ipProvinceCode) sp.set("ipProvinceCode", String(ipProvinceCode));
        if (ipDistrictCode) sp.set("ipDistrictCode", String(ipDistrictCode));

        const res = await fetch(`/api/public/ad-campaigns/slot?${sp.toString()}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as SlotResponse | null;

        if (!alive) return;

        if (!res.ok || !json?.success) {
          setData({ success: false, placement, country, fixed: null, carousel: [] });
          return;
        }

        setData(json);
      } catch {
        if (!alive) return;
        setData({ success: false, placement, country, fixed: null, carousel: [] });
      }
    })();

    return () => {
      alive = false;
    };
  }, [placement, country, provinceCode, districtCode, ipProvinceCode, ipDistrictCode]);

  useEffect(() => {
    if (!data?.carousel?.length) return;
    const speed = Number(data?.rules?.defaultCarouselSpeedMs || 4500);
    const t = window.setInterval(() => setIdx((p) => (p + 1) % data.carousel.length), speed);
    return () => window.clearInterval(t);
  }, [data]);

  if (!data) return null;

  const fixedImg = pickImage(data.fixed);
  const carItem = data.carousel?.length ? data.carousel[idx] : null;
  const carImg = pickImage(carItem);

  // hiç reklam yoksa hiç render etme
  if (!fixedImg && !carImg) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fixedImg ? (
          <a
            href={data.fixed?.clickUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
            title={data.fixed?.title || ""}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixedImg.url || ""} alt={fixedImg.alt || data.fixed?.title || "ad"} className="h-[120px] w-full object-cover" />
          </a>
        ) : (
          <div className="hidden md:block" />
        )}

        {carImg ? (
          <a
            href={carItem?.clickUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
            title={carItem?.title || ""}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={carImg.url || ""} alt={carImg.alt || carItem?.title || "ad"} className="h-[120px] w-full object-cover" />
          </a>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>
    </div>
  );
}
