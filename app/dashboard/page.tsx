"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    const role = sessionStorage.getItem("role")?.toLowerCase();
    if (role === "user") {
      router.replace("/dashboard/user/dashboard");
    } else if (role === "manager") {
      router.replace("/dashboard/manager/dashboard");
    } else if (role === "hr") {
      router.replace("/dashboard/hr/dashboard");
    } else if (role === "ceo") {
      router.replace("/dashboard/ceo/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-zinc-400">กำลังโหลดหน้า dashboard...</div>
    </div>
  );
}

