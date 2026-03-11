"use client";

// PATH: drivercv-frontend/components/ServiceProviderOnly.tsx
// ----------------------------------------------------------
// ServiceProviderOnly — service_provider / admin girişine izin verir
// ----------------------------------------------------------

import React from "react";
import RoleGate from "@/components/RoleGate";

export default function ServiceProviderOnly({ children }: { children: React.ReactNode }) {
  return <RoleGate allowRoles={["service_provider", "admin"]}>{children}</RoleGate>;
}
