"use client";

// PATH: drivercv-frontend/components/AdvertiserOnly.tsx
// BUILD_MARK: DA-FIX-2026-01-13
// ----------------------------------------------------------
// AdvertiserOnly
// - advertiser / employer / admin girişine izin verir
//   (Employer'ı reklamveren akışına dahil etmek için)
// ----------------------------------------------------------

import React from "react";
import RoleGate from "@/components/RoleGate";

export default function AdvertiserOnly({ children }: { children: React.ReactNode }) {
  return <RoleGate allowRoles={["advertiser", "employer", "admin"]}>{children}</RoleGate>;
}
