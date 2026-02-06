"use client";

import AdminOnly from "@/components/AdminOnly";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminOnly>{children}</AdminOnly>;
}
