"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PieChart, FileEdit, Activity, BookOpen, Calendar, CalendarDays, User, UserCog, Building, ListTodo, FileText, Settings, Menu, ChevronLeft, ChevronDown, Boxes, XCircle, FileCheck, Megaphone, BarChart3 } from "lucide-react";

type MenuIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type MenuLink = { name: string; href: string; icon: MenuIcon };
type MenuGroup = { name: string; icon: MenuIcon; children: MenuLink[] };
type NavItem = MenuLink | MenuGroup;

const isGroup = (item: NavItem): item is MenuGroup => "children" in item;

export function HRSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Start collapsed on mobile (<1024px), expanded on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };
    handleResize(); // run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setUsername(sessionStorage.getItem("username") || "");
    const storedPic = sessionStorage.getItem("profilePic");
    if (storedPic) setProfilePic(storedPic);

    const token = sessionStorage.getItem("accessToken");
    if (token) {
      fetch("/api/leave/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(res => {
          const user = res.data || res;
          if (user) {
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
            if (name) setFullName(name);
            const deptName = typeof user.department === "object" && user.department !== null
              ? user.department.name || "" : user.departmentName || "";
            setDepartment(deptName);
            const posName = user.positionName || user.position?.name || "";
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
          setPosition(sessionStorage.getItem("position") || "");
          setDepartment(sessionStorage.getItem("department") || "");
        });
    } else {
      setFullName(sessionStorage.getItem("fullName") || "");
      setPosition(sessionStorage.getItem("position") || "");
      setDepartment(sessionStorage.getItem("department") || "");
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  // Only a Leader position is a department head (same rule as the backend).
  const isLeader = position.toLowerCase().includes('leader');

  // Every route below is the original HR route; only the grouping changed.
  // Per-item visibility (isLeader) is kept on the child itself.
  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard/hr/dashboard", icon: PieChart },
    { name: "สร้างคำขอลา", href: "/dashboard/hr/leave-request", icon: FileEdit },
    { name: "สถานะการลา", href: "/dashboard/hr/leave-status", icon: Activity },
    { name: "ประวัติการลา", href: "/dashboard/hr/leave-history", icon: BookOpen },
    { name: "ตรวจสอบคำขอลา", href: "/dashboard/hr/approval", icon: ListTodo },
    { name: "ตรวจสอบคำขอยกเลิกการลา", href: "/dashboard/hr/cancel-approval", icon: XCircle },
    ...(isLeader ? [{ name: "อนุมัติการลา (หัวหน้าแผนก)", href: "/dashboard/hr/dept-approve", icon: FileCheck }] : []),
    { name: "ปฏิทินวันลา", href: "/dashboard/hr/calendar", icon: Calendar },
    { name: "วันหยุดบริษัท", href: "/dashboard/hr/holidays", icon: CalendarDays },
    {
      name: "บุคลากรและองค์กร",
      icon: Boxes,
      children: [
        { name: "ข้อมูลพนักงาน", href: "/dashboard/hr/employees", icon: UserCog },
        { name: "ตำแหน่งและแผนก", href: "/dashboard/hr/organization", icon: Building },
        { name: "ประกาศบริษัท", href: "/dashboard/hr/announcements", icon: Megaphone },
      ],
    },
    {
      name: "รายงาน",
      icon: BarChart3,
      children: [
        { name: "รายงานการลา", href: "/dashboard/hr/reports", icon: PieChart },
        { name: "สรุปการลา", href: "/dashboard/hr/leave-summary", icon: FileText },
      ],
    },
    {
      name: "ตั้งค่า",
      icon: Settings,
      children: [
        { name: "ตั้งค่าสิทธิ์และกฎการลา", href: "/dashboard/hr/leave-types", icon: ListTodo },
        { name: "ตั้งค่าผู้ใช้", href: "/dashboard/hr/settings", icon: UserCog },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const isGroupActive = (group: MenuGroup) => group.children.some((c) => isActive(c.href));
  const activeGroupName = navItems.find((item) => isGroup(item) && isGroupActive(item))?.name;

  // Auto-open the group owning the current route (also after a refresh). Other
  // groups keep whatever open/closed state the user gave them.
  useEffect(() => {
    if (activeGroupName) {
      setOpenGroups((prev) => (prev[activeGroupName] ? prev : { ...prev, [activeGroupName]: true }));
    }
  }, [activeGroupName]);

  const toggleGroup = (name: string) => {
    if (isCollapsed) {
      // Narrow mode has no room for submenus: widen the sidebar and show this group
      setIsCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [name]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderLink = (item: MenuLink, opts: { child?: boolean } = {}) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center ${isCollapsed ? 'justify-center px-0' : opts.child ? 'gap-3 px-4' : 'gap-4 px-5'} ${opts.child ? 'py-2.5' : 'py-3.5'} rounded-xl transition-all relative overflow-hidden ${active
            ? 'bg-white/10 text-white'
            : opts.child
              ? 'text-white/55 hover:text-white hover:bg-white/5'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        title={isCollapsed ? item.name : undefined}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
        )}
        <item.icon className={`${opts.child ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'} shrink-0`} strokeWidth={opts.child ? 2.25 : 2.5} />
        {/* Submenus are indented, so long child labels wrap instead of being cut off */}
        {!isCollapsed && <span className={`${opts.child ? 'font-medium text-[13px] leading-snug' : 'font-semibold text-sm truncate'} tracking-wide`}>{item.name}</span>}
      </Link>
    );
  };

  const renderGroup = (group: MenuGroup) => {
    const groupActive = isGroupActive(group);
    const open = !isCollapsed && !!openGroups[group.name];
    const panelId = `hr-nav-${group.name}`;
    return (
      <div key={group.name}>
        <button
          type="button"
          onClick={() => toggleGroup(group.name)}
          aria-expanded={open}
          aria-controls={panelId}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-3.5 rounded-xl transition-all relative overflow-hidden ${groupActive
              ? 'text-white bg-white/[0.06]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          title={isCollapsed ? group.name : undefined}
        >
          {/* In narrow mode the children are hidden, so the parent carries the active marker */}
          {groupActive && isCollapsed && (
            <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
          )}
          <group.icon className="w-[22px] h-[22px] shrink-0" strokeWidth={2.5} />
          {!isCollapsed && (
            <>
              <span className="font-semibold text-sm tracking-wide truncate flex-1 text-left">{group.name}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </>
          )}
        </button>

        {!isCollapsed && (
          <div
            id={panelId}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            inert={!open}
          >
            <div className="overflow-hidden">
              <div className="mt-1 ml-5 pl-3 border-l border-white/10 space-y-1">
                {group.children.map((child) => renderLink(child, { child: true }))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} bg-[#0B0F4E] text-white flex flex-col h-screen font-sans shrink-0 border-r border-white/10 sticky top-0 transition-all duration-300 relative z-50`}
    >

      {/* Logo + Hamburger */}
      <div className={`relative flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center px-0 py-4' : 'justify-center px-4 py-4'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, next/image adds no benefit here */}
        {!isCollapsed && <img src="/logo.png" alt="NID PROGRESS TECHNOLOGY" className="w-[110px] h-auto object-contain" />}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 ${isCollapsed ? '' : 'absolute right-4'}`}
          title={isCollapsed ? 'เปิดเมนู' : 'ปิดเมนู'}
        >
          {isCollapsed ? <Menu className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
        </button>
      </div>


      {/* User Profile */}
      <div className={`px-5 py-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10">
          <div className="bg-zinc-500 rounded-full w-11 h-11 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded avatar; next/image needs a configured remote loader
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <h3 className="font-bold text-[13px] truncate">{fullName || username}</h3>
            {department && <p className="text-[10px] text-blue-300/80 mt-0.5 truncate">{department}</p>}
            {position && <p className="text-[10px] text-zinc-400 truncate">{position}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2 pb-2" aria-label="เมนู HR">
        {navItems.map((item) => (isGroup(item) ? renderGroup(item) : renderLink(item)))}
      </nav>

      {/* Logout */}
      <div className="p-5 mt-auto">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3.5 rounded-xl transition-colors font-semibold text-sm tracking-wide border border-red-500/20`}
          title={isCollapsed ? "ออกจากระบบ" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          {!isCollapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
