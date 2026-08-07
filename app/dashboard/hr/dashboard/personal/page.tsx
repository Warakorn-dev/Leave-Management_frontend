'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { User, CheckCircle2, Clock, MapPin, AlertCircle, CalendarDays, Plus, Paperclip, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats, useAnnouncements, useActivities } from '@/hooks/useDashboard';
import { useLeaveBalance } from '@/hooks/useLeaveBalance';
import { previewAttachment } from "@/lib/attachmentPreview";

export default function HRPersonalDashboard() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [announcementYear, setAnnouncementYear] = useState<number>(new Date().getFullYear());

  const { data: rawData, isLoading } = useDashboardStats(selectedYear, 'personal');
  const { useLeaveBalancesQuery } = useLeaveBalance();
  const { data: balances = [] } = useLeaveBalancesQuery();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!user || !isMounted || isLoading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
    </div>
  );

  const data = rawData?.data || rawData || {};

  const vacationBal = Array.isArray(balances) 
    ? balances.find((b: any) => b.leaveType?.name?.includes('พักร้อน') || b.leaveType?.name?.includes('พักผ่อน'))
    : null;

  let remainingVacation = data?.remainingVacation ?? vacationBal?.remainingDays ?? 0;
  let personalPending = data?.pendingApprovals ?? 0;
  let personalApproved = data?.approvedThisYear ?? 0;
  let personalRejected = data?.rejectedRequests ?? 0;

  const chartData = data?.chartData || [];
  const announcements = data?.announcements || [];
  const activities = data?.activities || [];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Hero Banner */}
      <div className="bg-[#0B1547] rounded-3xl p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              สวัสดี, <span className="font-medium">{user.firstName} {user.lastName}</span>
            </h1>
            <p className="text-[#A3B8CC] text-sm mb-4">
              ยินดีต้อนรับสู่ Dashboard ของคุณ
            </p>
            <div className="flex bg-[#1E295E] p-1 rounded-xl w-fit">
              <Link 
                href="/dashboard/hr/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:text-white"
              >
                ภาพรวมบริษัท
              </Link>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-[#0B1547]"
              >
                ข้อมูลส่วนตัว
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex space-x-3">
              <Link href="/dashboard/hr/leave-status" className="bg-white text-[#0B1547] hover:bg-slate-100 font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center">
                ตรวจสอบสถานะ
              </Link>
              <Link href="/dashboard/hr/leave-request" className="bg-[#2D3A7A] hover:bg-[#3D4B92] text-white border border-[#4452A3] font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>ยื่นคำลา</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <CheckCircle2 className="w-5 h-5 fill-current" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">วันลาพักผ่อนประจำปีคงเหลือ</p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{remainingVacation}</span>
            <span className="text-xs font-bold text-slate-600">วัน</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">กำลังรออนุมัติ</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{personalPending}</span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">อนุมัติแล้วปีนี้</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{personalApproved}</span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">ถูกปฏิเสธ</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{personalRejected}</span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">สถิติการลารายเดือน</h3>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-medium outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 border-none"
            >
              <option value={2026}>ปี 2026</option>
              <option value={2025}>ปี 2025</option>
              <option value={2024}>ปี 2024</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={data?.monthlyStats ? "month" : "name"} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 7]} ticks={[0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0]} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Announcements */}
        <div className="bg-[#1E2659] rounded-3xl p-6 shadow-lg border border-[#2D3674] text-white flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">ประกาศบริษัท</h3>
            <select 
              value={announcementYear}
              onChange={(e) => setAnnouncementYear(parseInt(e.target.value))}
              className="bg-[#1F2456] text-white border border-[#3C4280] text-[11px] font-bold rounded-md py-1.5 px-3 outline-none cursor-pointer"
            >
              <option value={new Date().getFullYear()}>{`ปี ${new Date().getFullYear()}`}</option>
              <option value={new Date().getFullYear() - 1}>{`ปี ${new Date().getFullYear() - 1}`}</option>
              <option value={new Date().getFullYear() - 2}>{`ปี ${new Date().getFullYear() - 2}`}</option>
            </select>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[250px]">
            {announcements && announcements.filter((ann: any) => new Date(ann.createdAt).getFullYear() === announcementYear).length > 0 ? (
              [...announcements]
                .filter((ann: any) => new Date(ann.createdAt).getFullYear() === announcementYear)
                .sort((a: any, b: any) => {
                  if (a.isImportant === b.isImportant) return 0;
                  return a.isImportant ? -1 : 1;
                }).map((ann: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-2xl border transition-colors cursor-pointer relative overflow-hidden ${ann.isImportant ? 'bg-blue-500/20 border-blue-400/50 hover:bg-blue-500/30' : 'bg-white/10 border-white/5 hover:bg-white/15'}`}>
                  {ann.isImportant && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> สำคัญ
                    </div>
                  )}
                  <h4 className="font-semibold text-sm mb-1 pr-12">{ann.title}</h4>
                  <p className="text-indigo-200 text-xs mb-2">{ann.subtitle || ann.content}</p>
                  {ann.attachmentName && (
                    <a 
                      href="#" 
                      className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[10px] text-indigo-200 hover:text-white rounded-md transition-all border border-white/5"
                      onClick={(e) => previewAttachment(e, ann.attachmentData, ann.attachmentName)}
                    >
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{ann.attachmentName}</span>
                    </a>
                  )}
                  <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                    <span className="text-[10px] text-indigo-300/80 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : 'ไม่ระบุวันที่'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-indigo-200/60 py-8 text-sm">
                ไม่มีประกาศบริษัทในขณะนี้
              </div>
            )}
          </div>
        </div>

        {/* Latest Activities Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">กิจกรรมล่าสุด</h3>
          <div className="relative flex-1 overflow-y-auto max-h-[300px]">
            {activities && activities.length > 0 ? (
              <>
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-6 relative z-10">
                  {activities.map((act: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full ${act.color || 'bg-blue-500'} ring-4 ring-white dark:ring-slate-900 flex-shrink-0 mt-0.5`} />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{act.title || act.message}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{act.time ? new Date(act.time).toLocaleDateString('th-TH') : (act.createdAt ? new Date(act.createdAt).toLocaleDateString('th-TH') : '-')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">
                ไม่มีกิจกรรมล่าสุด
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
