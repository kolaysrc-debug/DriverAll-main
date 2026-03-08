"use client";

// PATH: DriverAll-main/drivercv-frontend/app/login/page.tsx
// ----------------------------------------------------------
// Login Page (Redirect)
// - Çift giriş ekranını kaldırmak için /login -> /?auth=login
// - next paramı korunur
// ----------------------------------------------------------

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const next = sp?.get("next");
    const qs = new URLSearchParams();
    if (next && next.startsWith("/")) qs.set("next", next);
    router.replace(`/register/auth?${qs.toString()}`);
  }, [router, sp]);

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-slate-100">
      Yönlendiriliyorsunuz...
    </div>
  );
}
