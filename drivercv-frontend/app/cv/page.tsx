"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/session";

export default function CvPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const user = getUser();
      const role = String(user?.role || "").trim().toLowerCase();

      if (role && role !== "driver" && role !== "admin") {
        router.replace("/dashboard");
        return;
      }
    } catch {
      // ignore
    }

    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    router.replace("/profile/cv");
  }, [ready, router]);

  useEffect(() => {
    if (!ready) return;
    window.scrollTo({ top: 0, left: 0 });
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 text-sm">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 text-sm">
      Yönlendiriliyor...
    </div>
  );
}
