"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Building2, 
  Briefcase, 
  Mail, 
  IdCard, 
  ShieldCheck 
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { resolveAssetUrl } from "@/lib/api/utils";

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Close on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    const result = await Swal.fire({
      title: "ออกจากระบบ",
      text: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      customClass: {
        popup: "rounded-3xl dark:bg-slate-900 dark:text-white",
        title: "font-bold text-lg",
        confirmButton: "rounded-xl font-medium px-5 py-2.5",
        cancelButton: "rounded-xl font-medium px-5 py-2.5",
      },
    });

    if (result.isConfirmed) {
      sessionStorage.clear();
      localStorage.removeItem("accessToken");
      router.push("/login");
    }
  };

  const displayName = user?.fullName || user?.firstName || user?.username || "ผู้ใช้งาน";
  const roleName = (user?.role || "user").toLowerCase();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ceo":
        return { label: "ผู้บริหาร (CEO)", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
      case "hr":
        return { label: "ฝ่ายบุคคล (HR)", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
      case "manager":
        return { label: "หัวหน้างาน", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
      default:
        return { label: "พนักงาน", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
    }
  };

  const roleInfo = getRoleBadge(roleName);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="โปรไฟล์ผู้ใช้"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-800">
          {user?.profilePic ? (
            <img
              src={resolveAssetUrl(user.profilePic)}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span>{getInitials(displayName)}</span>
          )}
        </div>

        {/* Name & Role (Desktop) */}
        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 max-w-[130px] lg:max-w-[170px] truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            {roleInfo.label}
          </span>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-[320px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header / User Info Banner */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800/50 dark:to-slate-900">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-base font-bold shadow-md shrink-0">
                  {user?.profilePic ? (
                    <img
                      src={resolveAssetUrl(user.profilePic)}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Meta Details */}
            <div className="p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {user?.department && (
                <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-400 dark:text-slate-500">แผนก:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.department}</span>
                </div>
              )}
              {user?.position && (
                <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-400 dark:text-slate-500">ตำแหน่ง:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.position}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-400 dark:text-slate-500">อีเมล:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</span>
                </div>
              )}
            </div>

            {/* Actions / Logout */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ (Logout)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
