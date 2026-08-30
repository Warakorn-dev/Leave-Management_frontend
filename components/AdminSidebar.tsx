"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PieChart, Users, Activity, Shield, Key, ClipboardList, HardDrive, Settings, Menu, ChevronLeft, User } from "lucide-react";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setUsername(sessionStorage.getItem("username") || "Super Admin");
    setFullName(sessionStorage.getItem("fullName") || "ผู้ดูแลระบบ");
    const storedPic = sessionStorage.getItem("profilePic");
    if (storedPic) setProfilePic(storedPic);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const menuItems = [
    { name: "ภาพรวมระบบ", href: "/dashboard/admin/dashboard", icon: PieChart },
    { name: "จัดการผู้ใช้งาน", href: "/dashboard/admin/users", icon: Users },
    { name: "ตั้งค่าความปลอดภัย", href: "/dashboard/admin/security", icon: Shield },
    { name: "ประวัติระบบ", href: "/dashboard/admin/audit-logs", icon: ClipboardList },
    { name: "จัดการสิทธิ์", href: "/dashboard/admin/roles", icon: Key },
    { name: "ตรวจสอบ CAPTCHA", href: "/dashboard/admin/captcha", icon: Activity },
    { name: "สถานะระบบ", href: "/dashboard/admin/system", icon: HardDrive },
    { name: "โปรไฟล์ผู้ดูแล", href: "/dashboard/admin/settings", icon: Settings },
  ];

  return (
    <aside
      className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} bg-[#0B0F4E] text-white flex flex-col h-screen font-sans shrink-0 border-r border-white/10 sticky top-0 transition-all duration-300 relative z-50`}
    >
      <div className={`relative flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center px-0 py-4' : 'justify-between px-6 py-4'}`}>
        {!isCollapsed && <span className="font-bold text-lg tracking-wider text-blue-200">🛡️ ผู้ดูแลระบบ</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 ${isCollapsed ? '' : ''}`}
          title={isCollapsed ? 'เปิดเมนู' : 'ปิดเมนู'}
        >
          {isCollapsed ? <Menu className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
        </button>
      </div>

      <div className={`px-5 py-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10">
          <div className="bg-blue-900 rounded-full w-11 h-11 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-blue-200" />
            )}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <h3 className="font-bold text-[13px] truncate text-white">{fullName || username}</h3>
            <p className="text-[11px] text-blue-300/80 mt-0.5 truncate">System Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2">
        {menuItems.map((item) => {
          const isExactActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-3.5 rounded-xl transition-all relative overflow-hidden ${isExactActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              title={isCollapsed ? item.name : undefined}
              onClick={onNavigate}
            >
              {isExactActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
              )}
              <item.icon className="w-[20px] h-[20px] shrink-0" strokeWidth={2.5} />
              {!isCollapsed && <span className="font-semibold text-sm tracking-wide truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 mt-auto">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} bg-white/5 hover:bg-white/10 text-red-300 py-3 rounded-xl transition-colors font-semibold text-sm tracking-wide border border-white/10`}
          title={isCollapsed ? "ออกจากระบบ" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          {!isCollapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
