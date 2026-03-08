"use client";

// PATH: drivercv-frontend/components/EmployerOnly.tsx
// ----------------------------------------------------------
// EmployerOnly
// - employer veya admin girişine izin verir
// ----------------------------------------------------------

import React from "react";
import RoleGate from "@/components/RoleGate";

export default function EmployerOnly({ children }: { children: React.ReactNode }) {
  return <RoleGate allowRoles={["employer", "admin"]}>{children}</RoleGate>;
}
