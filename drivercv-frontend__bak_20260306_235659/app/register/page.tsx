"use client";

// PATH: DriverAll-main/drivercv-frontend/app/register/page.tsx
// ----------------------------------------------------------
// Register Page (Redirect)
// - Çift kayıt ekranını kaldırmak için /register -> /?auth=register
// ----------------------------------------------------------

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=register");
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-slate-100">
      Yönlendiriliyorsunuz...
    </div>
  );
}
