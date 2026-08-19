"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PieChart, FileEdit, Activity, BookOpen, Calendar, User, Settings, Menu, ChevronLeft } from "lucide-react";

export function UserSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Start collapsed on mobile (<1024px), expanded on desktop
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
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch("/api/leave/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const user = json.data || json;
          
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
          if (name) {
            setFullName(name);
            sessionStorage.setItem("fullName", name);
          }
          
          const deptName = typeof user.department === "object" && user.department !== null
            ? user.department.name || "" : user.departmentName || "";
          setDepartment(deptName);
          sessionStorage.setItem("department", deptName);
          
          const posName = typeof user.position === "object" && user.position !== null
            ? user.position.name || "" : user.positionName || "";
          setPosition(posName);
          sessionStorage.setItem("position", posName);
          
          const avatar = user.user?.avatarUrl || user.avatarUrl || user.profilePic;
          if (avatar) {
            setProfilePic(avatar);
            sessionStorage.setItem("profilePic", avatar);
          }
        } else {
          // fallback
          setFullName(sessionStorage.getItem("fullName") || "");
          setPosition(sessionStorage.getItem("position") || "");
          setDepartment(sessionStorage.getItem("department") || "");
        }
      } catch (error) {
        setFullName(sessionStorage.getItem("fullName") || "");
        setPosition(sessionStorage.getItem("position") || "");
        setDepartment(sessionStorage.getItem("department") || "");
      }
    };
    
    setUsername(sessionStorage.getItem("username") || "");
    const storedPic = sessionStorage.getItem("profilePic");
    if (storedPic) setProfilePic(storedPic);
    
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard/user/dashboard", icon: PieChart },
    { name: "สร้างคำขอลา", href: "/dashboard/user/request", icon: FileEdit },
    { name: "สถานะการลา", href: "/dashboard/user/status", icon: Activity },
    { name: "ประวัติการลา", href: "/dashboard/user/history", icon: BookOpen },
    { name: "ปฏิทินวันลา", href: "/dashboard/user/calendar", icon: Calendar },
    { name: "ตั้งค่าผู้ใช้", href: "/dashboard/user/settings", icon: Settings },
  ];

  return (
    <aside 
      className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} bg-[#0B0F4E] text-white flex flex-col h-screen font-sans shrink-0 border-r border-white/10 sticky top-0 transition-all duration-300 relative z-50`}
    >

      {/* Logo + Hamburger */}
      <div className={`relative flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center px-0 py-4' : 'justify-center px-4 py-4'}`}>
        {!isCollapsed && <img src="/logo.png" alt="NID PROGRESS TECHNOLOGY" className="w-[110px] h-auto object-contain" />}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 ${isCollapsed ? '' : 'absolute right-4'}`}
          title={isCollapsed ? 'เปิดเมนู' : 'ปิดเมนู'}
        >
          {isCollapsed ? <Menu className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto mt-4 pb-6">
        {menuItems.map((item) => {
          const isExactActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-3.5 rounded-xl transition-all relative overflow-hidden ${
                isExactActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title={isCollapsed ? item.name : undefined}
              onClick={onNavigate}
            >
              {isExactActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
              )}
              <item.icon className="w-[22px] h-[22px] shrink-0" strokeWidth={2.5} />
              {!isCollapsed && <span className="font-semibold text-sm tracking-wide truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


