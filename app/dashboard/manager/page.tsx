"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardStats } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  ChevronDown,
  Paperclip,
  Calendar,
  XCircle
} from "lucide-react";
import { previewAttachment } from "@/lib/attachmentPreview";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from "next/link";

interface DashboardData {
  stats: {
    remaining: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  monthlyStats: { month: string; value: number }[];
  announcements: { id: string; title: string; subtitle: string; isImportant?: boolean }[];
  activities: { id: string; title: string; time: string; type: 'leave' | 'approve' | 'system' }[];
}

import { useDashboardStats } from "@/hooks/useDashboard";

export default function ManagerPersonalDashboard() {
  const [username, setUsername] = useState("ชื่อ xxxxx xxxx");
  const [currentYear] = useState(new Date().getFullYear());
  const [targetYear, setTargetYear] = useState(currentYear);
  const [announcementYear, setAnnouncementYear] = useState(currentYear);
  const { data, isLoading } = useDashboardStats(targetYear);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername && storedUsername !== "Manager") {
      setUsername(sessionStorage.getItem("fullName") || storedUsername);
    }
  }, []);

  if (isLoading || !data) return <div className="p-8 text-black flex justify-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 md:p-8 w-full space-y-6 text-black min-h-full bg-[#F8F9FA]">
      {/* Banner */}
      <div className="bg-[#0B0F4E] rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between text-white relative overflow-hidden shadow-sm">
        <div className="z-10">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">สวัสดี, {username}</h1>
          <p className="text-[#9EA1FF] text-[13px] font-medium mb-4">ยินดีต้อนรับสู่ Dashboard ของคุณ</p>
          <div className="flex bg-[#1E295E] p-1 rounded-xl w-fit">
            <Link 
              href="/dashboard/manager/team"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:text-white"
            >
              ภาพรวมแผนก
            </Link>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-[#0B1547]"
            >
              ข้อมูลส่วนตัว
            </button>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 mt-6 md:mt-0 z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/dashboard/manager/status">
              <Button variant="secondary" className="bg-white text-[#0B1547] hover:bg-gray-100 font-bold rounded-xl px-5 py-5 shadow-sm text-sm">
                ตรวจสอบสถานะ
              </Button>
            </Link>
            <Link href="/dashboard/manager/request">
              <Button className="bg-[#2D3A7A] hover:bg-[#3D4B92] text-white border border-[#4452A3] font-bold rounded-xl px-5 py-5 shadow-sm flex items-center gap-2 text-sm">
                <span className="text-lg leading-none font-normal">+</span> ยื่นคำลา
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Remaining */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-5">
              <Calendar className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <p className="text-[12px] font-extrabold text-gray-700 mb-2">วันลาพักผ่อนประจำปี คงเหลือ</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-black text-gray-800 leading-none tracking-tighter">{data?.remainingVacation ?? 0}</span>
              <span className="text-[12px] font-bold text-gray-600">วัน</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-[#FFF8E1] flex items-center justify-center mb-5">
              <Clock className="w-4 h-4 text-[#FFB300]" />
            </div>
            <p className="text-[12px] font-extrabold text-gray-700 mb-2">รายการรออนุมัติ</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-black text-gray-800 leading-none tracking-tighter">{data?.pendingApprovals ?? 0}</span>
              <span className="text-[12px] font-bold text-gray-600">รายการ</span>
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-5">
              <CheckCircle2 className="w-4 h-4 text-[#5C6BC0]" />
            </div>
            <p className="text-[12px] font-extrabold text-gray-700 mb-2">อนุมัติแล้ว (ปีนี้)</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-black text-gray-800 leading-none tracking-tighter">{data?.approvedThisYear ?? 0}</span>
              <span className="text-[12px] font-bold text-gray-600">รายการ</span>
            </div>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-[#FFEBEE] flex items-center justify-center mb-5">
              <XCircle className="w-4 h-4 text-[#EF5350]" />
            </div>
            <p className="text-[12px] font-extrabold text-gray-700 mb-2">คำขอที่ถูกปฏิเสธ</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-black text-gray-800 leading-none tracking-tighter">{data?.rejectedRequests ?? 0}</span>
              <span className="text-[12px] font-bold text-gray-600">รายการ</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Chart */}
        <Card className="lg:col-span-2 rounded-2xl border border-gray-200 shadow-sm bg-white h-[320px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
            <CardTitle className="text-[16px] font-extrabold text-gray-800">สถิติการลารายเดือน</CardTitle>
            <div className="relative">
              <select 
                value={targetYear}
                onChange={e => setTargetYear(Number(e.target.value))}
                className="bg-[#E2E4E9] pl-3 pr-7 py-1 rounded-lg text-[11px] font-bold text-gray-600 appearance-none outline-none cursor-pointer hover:bg-gray-300 transition-colors"
              >
                <option value={currentYear}>{`ปี ${currentYear}`}</option>
                <option value={currentYear - 1}>{`ปี ${currentYear - 1}`}</option>
                <option value={currentYear - 2}>{`ปี ${currentYear - 2}`}</option>
                <option value={currentYear - 3}>{`ปี ${currentYear - 3}`}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-6 pb-6 pt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-1 rounded-2xl border-none shadow-sm bg-[#0B0F4E] text-white flex flex-col h-[320px]">
          <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[16px] font-extrabold">ประกาศบริษัท</CardTitle>
            <div className="relative">
              <select 
                value={announcementYear}
                onChange={e => setAnnouncementYear(Number(e.target.value))}
                className="bg-[#2A3175] pl-3 pr-7 py-1 rounded-lg text-[11px] font-bold text-white appearance-none outline-none cursor-pointer hover:bg-[#343D91] transition-colors"
              >
                <option value={currentYear}>{`ปี ${currentYear}`}</option>
                <option value={currentYear - 1}>{`ปี ${currentYear - 1}`}</option>
                <option value={currentYear - 2}>{`ปี ${currentYear - 2}`}</option>
                <option value={currentYear - 3}>{`ปี ${currentYear - 3}`}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-6 space-y-3 overflow-y-auto custom-scrollbar">
            {data.announcements && [...data.announcements]
              .filter((ann: any) => new Date(ann.createdAt).getFullYear() === announcementYear)
              .sort((a: any, b: any) => {
              if (a.isImportant === b.isImportant) return 0;
              return a.isImportant ? -1 : 1;
            }).map((ann: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl ${ann.isImportant ? 'bg-[#3b82f6]/20 border border-[#3b82f6]/50' : 'bg-[#2A3175]'} shadow-sm relative overflow-hidden`}>
                {ann.isImportant && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> สำคัญ
                  </div>
                )}
                <h4 className="font-extrabold text-[12px] mb-1 pr-12">{ann.title}</h4>
                <p className="text-[11px] text-[#9EA1FF] font-semibold mb-2">{ann.content || ann.subtitle}</p>
                {ann.attachmentName && (
                  <a 
                    href="#" 
                    className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[9px] text-[#9EA1FF] hover:text-white rounded-md transition-all border border-white/5"
                    onClick={(e) => previewAttachment(e, ann.attachmentData, ann.attachmentName)}
                  >
                    <Paperclip className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[150px]">{ann.attachmentName}</span>
                  </a>
                )}
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                  <span className="text-[9px] text-[#9EA1FF]/80 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : 'ไม่ระบุวันที่'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card className="lg:col-span-1 rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col h-[320px]">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-[16px] font-extrabold text-gray-800">กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 overflow-y-auto custom-scrollbar">
            <div className="relative pl-5 space-y-7 mt-2">
              {/* Vertical line connecting timeline items */}
              <div className="absolute left-[7px] top-2 bottom-4 w-px bg-gray-200"></div>
              
              {data.activities?.map((act: any, i: number) => (
                <div key={i} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full shadow-sm ${
                    act.type === 'leave' ? 'bg-[#FF9800]' : 
                    act.type === 'approve' ? 'bg-[#4CAF50]' : 
                    'bg-[#2196F3]'
                  }`}></div>
                  
                  <h4 className="text-[12px] font-extrabold text-gray-800 leading-tight">{act.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">{act.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

