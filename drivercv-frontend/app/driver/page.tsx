"use client";

// PATH: drivercv-frontend/app/driver/page.tsx
// /driver → /driver/dashboard yönlendirmesi

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/driver/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center text-sm">
      Yönlendiriliyor…
    </div>
  );
}
