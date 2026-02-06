"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Creative = { kind?: string; url: string; alt?: string };

type SlotItem = {
  _id: string;
  title?: string;
  clickUrl?: string;
  creatives?: Creative[];
  startAt?: string;
  endAt?: string;
};

type SlotResponse = {
  success: boolean;
  placement: string;
  country: string;
  viewerGeo?: { districtCode?: string; provinceCode?: string };
  fixed?: SlotItem | null;
  carousel?: SlotItem[];
  rules?: {
    fixedEnabled?: boolean;
    carouselEnabled?: boolean;
    carouselMaxUnits?: number;
    carouselMaxMergeUnits?: number;
    carouselIntervalMs?: number;
  };
  message?: string;
};

function pickFirstImage(item?: SlotItem | null) {
  const c = item?.creatives || [];
  const img = c.find((x) => (x.kind || "image") === "image" && x.url);
  return img?.url || "";
}

function safeUrl(u: string) {
  // boş veya çok şüpheli şeyleri göstermeyelim
  const s = String(u || "").trim();
  if (!s) return "";
  return s;
}

export default function AdSlot(props: {
  placement: string;
  country?: string;
  className?: string;
  variant?: "fixed" | "carousel" | "both";
}) {
  const placement = String(props.placement || "").trim();
  const country = String(props.country || "TR").toUpperCase();
  const variant = props.variant || "both";

  const [data, setData] = useState<SlotResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const timerRef = useRef<any>(null);

  const fixed = useMemo(() => (data?.fixed ? data.fixed : null), [data]);
  const carousel = useMemo(() => (Array.isArray(data?.carousel) ? data!.carousel! : []), [data]);

  async function load() {
    if (!placement) {
      setErr("placement required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const qs = new URLSearchParams();
      qs.set("country", country);
      qs.set("placement", placement);

      const res = await fetch(`/api/public/ad-campaigns/slot?${qs.toString()}`, {
        cache: "no-store",
      });

      const json = (await res.json().catch(() => null)) as SlotResponse | null;

      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      if (!json?.success) {
        throw new Error(json?.message || "slot failed");
      }

      setData(json);
      setCarouselIndex(0);
    } catch (e: any) {
      setData(null);
      setErr(e?.message || "slot error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, country]);

  // carousel timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const enabled = data?.rules?.carouselEnabled !== false;
    const intervalMs = Number(data?.rules?.carouselIntervalMs || 3500);

    if (!enabled) return;
    if (!carousel.length) return;
    if (variant === "fixed") return;

    timerRef.current = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % carousel.length);
    }, Math.max(1200, intervalMs));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [carousel.length, data?.rules?.carouselEnabled, data?.rules?.carouselIntervalMs, variant]);

  if (!placement) return null;

  if (loading) {
    return (
      <div className={props.className || ""}>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
          Reklam yükleniyor…
        </div>
      </div>
    );
  }

  if (err) {
    // Reklam hata verirse sayfayı bozmayalım: sessiz ve küçük uyarı
    return (
      <div className={props.className || ""}>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-500">
          Reklam alanı boş.
        </div>
      </div>
    );
  }

  const showFixed = variant !== "carousel" && data?.rules?.fixedEnabled !== false && fixed;
  const showCarousel =
    variant !== "fixed" && data?.rules?.carouselEnabled !== false && carousel.length > 0;

  if (!showFixed && !showCarousel) return null;

  function renderItem(item: SlotItem, kind: "fixed" | "carousel") {
    const imgUrl = safeUrl(pickFirstImage(item));
    const click = safeUrl(item.clickUrl || "");
    const title = String(item.title || "").trim();

    const box = (
      <div
        className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${
          kind === "fixed" ? "" : ""
        }`}
      >
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={item.creatives?.[0]?.alt || title || "ad"}
            className="h-24 w-full object-cover md:h-28"
            loading="lazy"
          />
        ) : (
          <div className="h-24 w-full bg-slate-900 md:h-28" />
        )}

        {/* Minimum yazı felsefesi: sadece çok küçük başlık */}
        {title ? (
          <div className="px-3 py-2 text-[11px] text-slate-300 line-clamp-1">{title}</div>
        ) : (
          <div className="px-3 py-2 text-[11px] text-slate-500"> </div>
        )}
      </div>
    );

    if (click) {
      return (
        <a href={click} target="_blank" rel="noreferrer" aria-label={title || "ad"}>
          {box}
        </a>
      );
    }
    return box;
  }

  const currentCarouselItem = carousel.length ? carousel[carouselIndex % carousel.length] : null;

  return (
    <div className={props.className || ""}>
      <div className="space-y-2">
        {showFixed ? <div>{renderItem(fixed!, "fixed")}</div> : null}

        {showCarousel && currentCarouselItem ? (
          <div>{renderItem(currentCarouselItem, "carousel")}</div>
        ) : null}
      </div>
    </div>
  );
}
