"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PieChart, FileCheck, FileText, User, Calendar, Settings, Menu, ChevronLeft } from "lucide-react";

export function CEOSidebar({ onNavigate }: { onNavigate?: () => void }) {
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
    const userId = sessionStorage.getItem("userId");
    setUsername(sessionStorage.getItem("username") || "");
    const storedPic = sessionStorage.getItem("profilePic");
    if (storedPic) setProfilePic(storedPic);

    if (userId) {
      fetch(`/api/users/${userId}`)
        .then(r => r.json())
        .then(user => {
          if (user) {
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
            if (name) setFullName(name);
            const deptName = typeof user.department === "object" && user.department !== null
              ? user.department.name || "" : user.departmentName || "";
            setDepartment(deptName);
            const posName = user.positionName || user.position?.name || "Chief Executive Officer";
            setPosition(posName);
            const avatar = user.user?.avatarUrl || user.avatarUrl || user.profilePic;
          if (avatar) {
            setProfilePic(avatar);
            sessionStorage.setItem("profilePic", avatar);
          }
            if (name) sessionStorage.setItem("fullName", name);
            sessionStorage.setItem("position", posName);
            sessionStorage.setItem("department", deptName);
          }
        })
        .catch(() => {
          setFullName(sessionStorage.getItem("fullName") || "");
          setPosition(sessionStorage.getItem("position") || "Chief Executive Officer");
          setDepartment(sessionStorage.getItem("department") || "");
        });
    } else {
      setFullName(sessionStorage.getItem("fullName") || "");
      setPosition(sessionStorage.getItem("position") || "Chief Executive Officer");
      setDepartment(sessionStorage.getItem("department") || "");
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard/ceo/dashboard", icon: PieChart },
    { name: "พนักงานทั้งหมด", href: "/dashboard/ceo/employees", icon: User },
    { name: "ปฏิทิน", href: "/dashboard/ceo/calendar", icon: Calendar },
    { name: "อนุมัติการลา", href: "/dashboard/ceo/approval", icon: FileCheck },
    { name: "รายงานสถิติ", href: "/dashboard/ceo/report", icon: FileText },
    { name: "ตั้งค่าบัญชี", href: "/dashboard/ceo/settings", icon: Settings },
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
          const isExactActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
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

