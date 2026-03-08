"use client";

// PATH: drivercv-frontend/app/advertiser/page.tsx
// BUILD_MARK: DA-FIX-2026-01-13

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvertiserOnly from "@/components/AdvertiserOnly";

export default function AdvertiserRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/advertiser/dashboard");
  }, [router]);

  return (
    <AdvertiserOnly>
      <div className="p-4 text-slate-400">Yönlendiriliyor…</div>
    </AdvertiserOnly>
  );
}
