"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = getToken();
      const user = getUser();
      const role = String(user?.role || "").trim().toLowerCase();

      if (!token || !user) {
        router.replace("/register/auth");
        return;
      }

      if (role === "employer" || role === "company") {
        router.replace("/employer/profile");
        return;
      }

      if (role === "advertiser") {
        router.replace("/advertiser/profile");
        return;
      }

      if (role === "admin" || role === "driver") {
        router.replace("/profile/cv");
        return;
      }

      router.replace("/profile/cv");
    } catch {
      router.replace("/register/auth");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 text-sm">
      Yönlendiriliyor...
    </div>
  );
}