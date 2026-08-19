"use client";

import React, { useState, useEffect } from "react";
import { Menu, Sun, Moon } from "lucide-react";
import { RealtimeClock } from "@/components/RealtimeClock";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

interface GlobalHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function GlobalHeader({ onOpenMobileMenu }: GlobalHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("app_theme") || localStorage.getItem("auth-theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
      localStorage.setItem("auth-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
      localStorage.setItem("auth-theme", "gray");
    }
  };

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 sticky top-0 shrink-0 shadow-xs select-none transition-colors duration-200">
      {/* Left: Mobile Drawer Trigger & Live Date/Time Clock */}
      <div className="flex items-center gap-2 sm:gap-4">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="เปิดเมนูนำทาง"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Global Live Clock */}
        <RealtimeClock />
      </div>

      {/* Right: Theme Switcher, Real-Time Notification Bell & User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle Button */}
        {mounted && (
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label={isDark ? "เปลี่ยนเป็นธีมสว่าง (Light Mode)" : "เปลี่ยนเป็นธีมมืด (Dark Mode)"}
            title={isDark ? "เปลี่ยนเป็นธีมสว่าง (Light Mode)" : "เปลี่ยนเป็นธีมมืด (Dark Mode)"}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" strokeWidth={2} />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform duration-300" strokeWidth={2} />
            )}
          </button>
        )}

        {/* Global Notification Bell with Real Badge */}
        <NotificationDropdown />

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* Global User Profile Pill */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
