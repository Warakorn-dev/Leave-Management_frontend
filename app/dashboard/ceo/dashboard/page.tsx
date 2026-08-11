'use client';

import { Kanit } from 'next/font/google';

const kanit = Kanit({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap'
});

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useLeave } from '@/hooks/useLeave';
import { useEmployee } from '@/hooks/useEmployee';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, CheckCircle2, XCircle, Search, Filter, Bell, Settings, Paperclip } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { previewAttachment } from "@/lib/attachmentPreview";
import { Leave } from '@/lib/types';

export default function CEODashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [announcementYear, setAnnouncementYear] = useState<number>(currentYear);

  const { data: ceoStats, isLoading: isCeoLoading } = useDashboardStats(selectedYear, 'team');
  const { useLeavesQuery } = useLeave();
  const { useEmployeesQuery } = useEmployee();

  const { data: allLeaves = [], isLoading: isLeavesLoading } = useLeavesQuery();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployeesQuery();



  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pendingCEOLeaves = useMemo(() => {
    return allLeaves.filter(l => {
      if (l.status === 'Waiting CEO') return true;
      if (l.status === 'Pending') {
        const employee = employees.find(e => e.id === l.employeeId || e.employeeId === l.employeeId || e.username === l.userId || (e.firstName + ' ' + e.lastName) === l.userId);
        return employee?.role === 'manager';
      }
      return false;
    });
  }, [allLeaves, employees]);

  const recentLeaves = useMemo(() => {
    // Sort CEO-specific leaves by latest createdAt, and take the top 7 to show in the dashboard
    return [...pendingCEOLeaves].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 7);
  }, [pendingCEOLeaves]);

  if (!user || !isMounted || isCeoLoading || isLeavesLoading || isEmployeesLoading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
    </div>
  );

  // Calculate stats from API
  let totalEmployees = 0;
  let leavesToday = 0;
  let remainingEmployees = 0;
  let pendingCount = pendingCEOLeaves.length;

  // Personal Stats
  let remainingVacation = 0;
  let personalPending = 0;
  let personalApproved = 0;
  let personalRejected = 0;

  if (ceoStats) {
    totalEmployees = ceoStats.totalEmployees || 0;
    leavesToday = ceoStats.leavesToday || 0;
    remainingEmployees = ceoStats.remainingEmployees || 0;

    if (ceoStats.personal) {
      remainingVacation = ceoStats.personal.remainingVacation || 0;
      personalPending = ceoStats.personal.pendingApprovals || 0;
      personalApproved = ceoStats.personal.approvedThisYear || 0;
      personalRejected = ceoStats.personal.rejectedRequests || 0;
    }
  }


  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const chartData = ceoStats?.chart
    ? ceoStats.chart.map((value: number, index: number) => ({ name: thaiMonths[index], value }))
    : thaiMonths.map((month: string) => ({ name: month, value: 0 }));

  const announcements = ceoStats?.announcements || [];
  const recentActivities: any[] = [];
  allLeaves.forEach((req: any) => {
    let typeText = 'ยื่นคำขอลา';
    let color = 'bg-[#FF9800]';
    if (req.status === 'Approved') {
      typeText = 'อนุมัติแล้ว';
      color = 'bg-[#4CAF50]';
    } else if (req.status === 'Rejected') {
      typeText = 'ปฏิเสธแล้ว';
      color = 'bg-[#F44336]';
    } else if (req.status === 'Waiting CEO') {
      typeText = 'รอ CEO อนุมัติ';
      color = 'bg-[#2196F3]';
    }

    const empName = req.user?.firstName || req.employeeName || req.userId || 'พนักงาน';
    const title = `${empName} - ${typeText}`;

    const timeMs = new Date(req.updatedAt || req.createdAt).getTime();
    const now = Date.now();
    const diffMs = now - timeMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let timeStr = 'เมื่อไม่นานมานี้';
    if (diffMins > 0 && diffMins < 60) {
      timeStr = `${diffMins} นาทีที่แล้ว`;
    } else if (diffHours >= 1 && diffHours < 24) {
      timeStr = `${diffHours} ชม. ที่แล้ว`;
    } else if (diffHours >= 24) {
      const diffDays = Math.floor(diffHours / 24);
      timeStr = `${diffDays} วันที่แล้ว`;
    }

    recentActivities.push({
      title,
      time: timeStr,
      color,
      timestamp: timeMs
    });
  });

  recentActivities.sort((a, b) => b.timestamp - a.timestamp);
  const activities = recentActivities.slice(0, 5);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">อนุมัติ</span>;
      case 'rejected':
        return <span className="text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">ปฏิเสธ</span>;
      case 'cancelled':
        return <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">ยกเลิก</span>;
      default:
        return <span className="text-amber-500 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold">รออนุมัติ</span>;
    }
  };

  const formatDateRange = (startDateStr: string, endDateStr: string) => {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const startDay = format(start, 'd');
      const startMonth = format(start, 'MMM', { locale: th });
      const endDay = format(end, 'd');
      const endMonth = format(end, 'MMM', { locale: th });

      if (startDateStr === endDateStr) {
        return `${startDay} ${startMonth}`;
      } else if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      }
    } catch {
      return startDateStr;
    }
  };

  return (
    <div className="p-6 md:p-8 w-full min-h-full bg-[#F8F9FA]">
      <div className="space-y-6 max-w-[1200px] mx-auto pb-10">

        {/* Hero Banner */}
        <div className="bg-[#091136] rounded-[24px] p-8 pb-10 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-white">
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">สวัสดี คุณ CEOครับ</h1>
              <p className="text-indigo-200 text-sm mb-4">ยินดีต้อนรับสู่ Dashboard ของคุณ</p>
              {/* Buttons removed for CEO */}
            </div>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 px-2">

          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-700">พนักงานใน<br />บริษัททั้งหมด</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-[40px] font-bold text-slate-800">{totalEmployees}</span>
              <span className="text-sm font-bold text-slate-600">คน</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-700">จำนวนการลาวันนี้</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-[40px] font-bold text-slate-800">{leavesToday}</span>
              <span className="text-sm font-bold text-slate-600">คน</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-700">รายการรออนุมัติ</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-[40px] font-bold text-slate-800">{pendingCount}</span>
              <span className="text-sm font-bold text-slate-600">คน</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <XCircle className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-700">พนักงานพร้อมปฏิบัติงาน</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-[40px] font-bold text-slate-800">{remainingEmployees}</span>
              <span className="text-sm font-bold text-slate-600">คน</span>
            </div>
          </div>
        </div>

        {/* Bottom Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Bar Chart Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-slate-800">สถิติการลารายเดือน</h3>
              <select
                className="bg-[#e2e8f0] text-slate-700 text-xs px-3 py-1.5 rounded-md font-medium outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 border-none"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value="2026">ปี 2026</option>
                <option value="2025">ปี 2025</option>
                <option value="2024">ปี 2024</option>
              </select>
            </div>
            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [value, 'จำนวนคนลา']}
                  />
                  <Bar dataKey="value" fill="#0EA5E9" radius={[2, 2, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Leaves Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">รายการคำขอล่าสุดที่รออนุมัติ</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-[#e0e7ff] text-[#4f46e5]">
                  <tr>
                    <th className="py-3 px-4 font-bold whitespace-nowrap">รหัสคำขอลา</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap">พนักงาน</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap">แผนก</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap">ประเภทการลา</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap">วันที่</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {recentLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">ไม่มีรายการคำขอ</td>
                    </tr>
                  ) : (
                    recentLeaves.map((leave) => {
                      // Match short dept name by looking up the employee
                      const employee = employees.find(e => e.id === leave.employeeId || e.employeeId === leave.employeeId || e.username === leave.userId || (e.firstName + ' ' + e.lastName) === leave.userId);
                      const dept = employee?.departmentName || leave.departmentName || leave.department || '';
                      const shortDept = dept ? `(${dept.substring(0, 3).toUpperCase()})` : '(-)';
                      const empName = leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';
                      const leaveType = leave.leaveTypeName || leave.type || '-';

                      return (
                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-semibold text-blue-600 whitespace-nowrap">{leave.requestCode || '-'}</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{empName.split(' ')[0]}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-500">{shortDept}</td>
                          <td className="py-3 px-4 truncate max-w-[100px] text-slate-700">{leaveType.split(' ')[0]}</td>
                          <td className="py-3 px-4">{formatDateRange(leave.startDate, leave.endDate)}</td>
                          <td className="py-3 px-4 text-center">
                            {getStatusLabel(leave.status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Company Announcements */}
          <div className="bg-gradient-to-b from-[#111c4e] to-[#243b81] rounded-xl p-8 shadow-xl border-2 border-blue-600 text-white min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className={`font-bold text-3xl tracking-wide drop-shadow-md ${kanit.className}`}>ประกาศบริษัท</h3>
              <select
                value={announcementYear}
                onChange={(e) => setAnnouncementYear(parseInt(e.target.value))}
                className="bg-[#1F2456] text-white border border-[#3C4280] text-sm font-bold rounded-lg py-2 px-4 outline-none cursor-pointer"
              >
                <option value={currentYear}>{`ปี ${currentYear}`}</option>
                <option value={currentYear - 1}>{`ปี ${currentYear - 1}`}</option>
                <option value={currentYear - 2}>{`ปี ${currentYear - 2}`}</option>
                <option value={currentYear - 3}>{`ปี ${currentYear - 3}`}</option>
              </select>
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!announcements || announcements.filter((ann: any) => new Date(ann.createdAt).getFullYear() === announcementYear).length === 0 ? (
                <p className="text-slate-300 text-sm">ไม่มีประกาศในขณะนี้</p>
              ) : (
                [...announcements]
                  .filter((ann: any) => new Date(ann.createdAt).getFullYear() === announcementYear)
                  .sort((a: any, b: any) => {
                    if (a.isImportant === b.isImportant) return 0;
                    return a.isImportant ? -1 : 1;
                  }).map((ann: any, idx: number) => (
                    <div key={idx} className={`${ann.isImportant ? 'bg-[#5b7ab9] border-[#6b8ac9]' : 'bg-[#4d6a99] border-[#3b5581]'} hover:bg-[#6c8bcb] transition-colors p-5 rounded-xl border cursor-pointer shadow-inner`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold text-xl text-white tracking-wide ${kanit.className}`}>{ann.title}</h4>
                        {ann.isImportant && (
                          <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            สำคัญ
                          </span>
                        )}
                      </div>
                      <p className={`text-blue-100 text-[15px] font-medium mb-2 ${kanit.className}`}>{ann.subtitle}</p>
                      {ann.attachmentName && (
                        <a
                          href="#"
                          className={`inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[12px] text-blue-100 hover:text-white rounded-md transition-all border border-white/5 ${kanit.className}`}
                          onClick={(e) => previewAttachment(e, ann.attachmentData, ann.attachmentName)}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{ann.attachmentName}</span>
                        </a>
                      )}
                      <div className="flex justify-between items-center mt-3 border-t border-white/20 pt-3">
                        <span className="text-[12px] text-blue-200/90 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : 'ไม่ระบุวันที่'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Latest Activities Timeline */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6">กิจกรรมล่าสุด</h3>
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-slate-200" />

              <div className="space-y-6 relative z-10">
                {activities.length === 0 ? (
                  <p className="text-slate-400 text-sm ml-6">ไม่มีกิจกรรม</p>
                ) : (
                  activities.map((act: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full ${act.color} ring-4 ring-white flex-shrink-0 mt-0.5`} />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700">{act.title}</h4>
                        <p className="text-slate-400 text-xs mt-1">{act.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
