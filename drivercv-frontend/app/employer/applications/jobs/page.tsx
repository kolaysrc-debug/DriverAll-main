"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployerApplicationsJobsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employer/applications");
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-300">
      Yönlendiriliyor...
    </div>
  );
}
