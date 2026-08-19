"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { RealtimeClock } from "@/components/RealtimeClock";
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

  // Ensure default clean theme
  useEffect(() => {
    document.documentElement.classList.remove("dark", "fantasy-mode");
    localStorage.removeItem("app_theme");
    localStorage.removeItem("global_app_theme");
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8F9FA] text-slate-900">
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-gray-200 bg-white z-40 sticky top-0 shrink-0 shadow-sm relative">
          
          {/* Left / Center Area: Mobile Toggle & Real-time Live Clock */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger - only on small screens */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Real-time Clock Component */}
            <RealtimeClock />
          </div>

          {/* Right Area: Notifications */}
          <div className="flex items-center gap-4 sm:gap-6 text-black relative">
            <NotificationDropdown />
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
