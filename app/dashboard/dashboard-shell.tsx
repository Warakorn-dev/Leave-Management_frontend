"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { UserSidebar } from "@/components/sidebar-user";
import { ManagerSidebar } from "@/components/ManagerSidebar";
import { HRSidebar } from "@/components/HRSidebar";
import { CEOSidebar } from "@/components/sidebar-ceo";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize theme from storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme") || localStorage.getItem("auth-theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light" || savedTheme === "gray") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const storedRole = sessionStorage.getItem("role")?.toLowerCase();
    const storedName = sessionStorage.getItem("username");
    if (storedName) {
      setUsername(storedName);
    }
    if (!storedRole) {
      router.push("/login");
    } else {
      if (storedRole === "manager" && !pathname.startsWith("/dashboard/manager")) {
        router.push("/dashboard/manager/dashboard");
        return;
      }
      if ((storedRole === "user" || storedRole === "employee") && !pathname.startsWith("/dashboard/user")) {
        router.push("/dashboard/user/dashboard");
        return;
      }
      if (storedRole === "hr" && !pathname.startsWith("/dashboard/hr")) {
        router.push("/dashboard/hr/dashboard");
        return;
      }
      if (storedRole === "ceo" && !pathname.startsWith("/dashboard/ceo")) {
        router.push("/dashboard/ceo/dashboard");
        return;
      }

      setRole(storedRole);
      setUsername(storedName || storedRole);
    }
  }, [router, pathname]);

  if (!role) return null; // loading

  const renderSidebar = () => {
    switch (role) {
      case "manager": return <ManagerSidebar onNavigate={() => setMobileMenuOpen(false)} />;
      case "hr": return <HRSidebar onNavigate={() => setMobileMenuOpen(false)} />;
      case "ceo": return <CEOSidebar onNavigate={() => setMobileMenuOpen(false)} />;
      default: return <UserSidebar onNavigate={() => setMobileMenuOpen(false)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F4E] text-white flex selection:bg-blue-500/30">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        {renderSidebar()}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="absolute left-0 top-0 h-full w-[280px] shadow-2xl animate-slide-in-left">
            {renderSidebar()}
          </div>
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 left-[290px] w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Global Centralized Header */}
        <GlobalHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
