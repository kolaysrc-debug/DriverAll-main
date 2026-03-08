"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const role = String(user?.role || "").trim().toLowerCase();

      if (!token || !user) {
        router.replace("/login");
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
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 text-sm">
      Yönlendiriliyor...
    </div>
  );
}