"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<{ username?: string; email?: string } | null>(null);

  useEffect(() => {
    // Read from sessionStorage directly to avoid 403 on /leave/me which is restricted to Employees
    setProfile({
      username: sessionStorage.getItem("username") || "Super Admin",
      email: sessionStorage.getItem("email") || "admin@admin.com"
    });
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
              โปรไฟล์ผู้ดูแลระบบ
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              จัดการข้อมูลบัญชีผู้ดูแลระบบของคุณ
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{profile?.username || 'Super Admin'}</h2>
              <p className="text-slate-500">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                ผู้ดูแลระบบสูงสุด (SYSTEM ADMINISTRATOR)
              </span>
            </div>
          </div>
        </div>

        {/* Replaces the old inline form, which sent fields the API rejected (400). */}
        <ChangePasswordCard className="" />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
