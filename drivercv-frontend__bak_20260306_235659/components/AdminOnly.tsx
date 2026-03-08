"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserLike = {
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  email?: string;
  name?: string;
  _id?: string;
} | null;

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// JWT decode (base64url) – fallback amaçlı
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getStoredUser(): UserLike {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  const parsed = safeParseJSON<UserLike>(raw);
  if (parsed) return parsed;

  // user yoksa token’dan role çekmeyi dene
  const t = getStoredToken();
  if (!t) return null;
  const payload = decodeJwtPayload(t);
  if (!payload) return null;
  return {
    role: payload.role,
    email: payload.email,
    _id: payload.userId,
  };
}

export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = getStoredToken();
    if (!token) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
      return;
    }

    const user = getStoredUser();
    const role = user?.role;

    if (role !== "admin") {
      // Eskiden /profile idi. Artık rol bazlı dağıtım için /dashboard daha doğru.
      router.replace("/dashboard");
      return;
    }

    setAllowed(true);
  }, [router, pathname]);

  if (!mounted) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
