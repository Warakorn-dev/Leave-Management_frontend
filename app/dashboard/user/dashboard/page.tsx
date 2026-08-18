'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Paperclip,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboard';
import { previewAttachment } from '@/lib/api/attachmentPreview';

export default function UserDashboard() {
  const [username, setUsername] = useState('ชื่อ xxxxx xxxx');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [announcementYear, setAnnouncementYear] = useState(
    new Date().getFullYear(),
  );

  const [stats, setStats] = useState({
    remainingLeaves: 8,
    pending: 1,
    approved: 5,
    rejected: 1,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Round max value up to nearest multiple of 4 for clean division on the Y-axis (at least 4)
  const rawMax = Math.max(4, ...chartData.map((d) => d.value || 0));
  const dynamicMax = Math.ceil(rawMax / 4) * 4;
  const step = dynamicMax / 4;

  const { data: dashboardData, isLoading: isDashboardLoading } =
    useDashboardStats(selectedYear);

  useEffect(() => {
    const fullName =
      sessionStorage.getItem('fullName') ||
      sessionStorage.getItem('username') ||
      'ผู้ใช้งาน';
    setUsername(fullName);

    if (dashboardData) {
      setStats({
        remainingLeaves: dashboardData.remainingVacation || 0,
        pending: dashboardData.pendingApprovals || 0,
        approved: dashboardData.approvedThisYear || 0,
        rejected: dashboardData.rejectedRequests || 0,
      });
      setAnnouncements(dashboardData.announcements || []);
      if (dashboardData.employeeName) {
        setUsername(dashboardData.employeeName);
      }

      if (dashboardData.chartData && dashboardData.chartData.length === 12) {
        setChartData(
          dashboardData.chartData.map((d: any) => ({
            month: d.name,
            value: d.value,
          })),
        );
      }
    }

    if (dashboardData?.activities) {
      const formattedActivities = dashboardData.activities.map((a: any) => ({
        ...a,
        time: new Date(a.time).toLocaleDateString('th-TH'),
      }));
      setActivities(formattedActivities);
    }
  }, [dashboardData]);
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-6 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-[#0B1547] rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between mb-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-1">
            สวัสดี,{username}
          </h1>
          <p className="text-[#9EA1FF]  text-sm mb-4">
            ยินดีต้อนรับสู่ Dashboard ของคุณ
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6 md:mt-0 relative z-10">
          <Link href="/dashboard/user/status">
            <button className="bg-white hover:bg-gray-100 text-[#0B1038] font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm">
              ตรวจสอบสถานะ
            </button>
          </Link>
          <Link href="/dashboard/user/request">
            <button className="bg-[#1F2456] hover:bg-[#2A316E] border border-[#3C4280] text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              ยื่นคำขอลา
            </button>
          </Link>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Remaining Leaves */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            วันลาพักผ่อน คงเหลือ
          </p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.remainingLeaves}
            </span>
            <span className="text-xs font-bold text-slate-600">วัน</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            รายการรออนุมัติ
          </p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.pending ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            อนุมัติแล้วปีนี้
          </p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.approved ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            ถูกปฏิเสธ
          </p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.rejected ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-600">รายการ</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        {/* Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              สถิติการลารายเดือน
            </h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-gray-100 border-none text-sm font-bold text-gray-600 rounded-md py-1 px-3 outline-none"
            >
              <option value={2026}>ปี 2026</option>
              <option value={2025}>ปี 2025</option>
              <option value={2024}>ปี 2024</option>
            </select>
          </div>

          <div className="flex-1 flex items-end gap-1 md:gap-2 mt-4 relative overflow-x-auto overflow-y-hidden custom-scrollbar">
            {/* Y-axis Labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 font-bold pr-2 bg-white z-10 w-8">
              <span>{dynamicMax.toFixed(1)}</span>
              <span>{(dynamicMax - step).toFixed(1)}</span>
              <span>{(dynamicMax - step * 2).toFixed(1)}</span>
              <span>{(dynamicMax - step * 3).toFixed(1)}</span>
              <span>0</span>
            </div>

            {/* Grid lines */}
            <div className="absolute left-8 right-0 top-1.5 bottom-6 flex flex-col justify-between z-0">
              <div className="w-full border-b border-gray-100 h-0"></div>
              <div className="w-full border-b border-gray-100 h-0"></div>
              <div className="w-full border-b border-gray-100 h-0"></div>
              <div className="w-full border-b border-gray-100 h-0"></div>
              <div className="w-full border-b border-gray-200 h-0"></div>
            </div>

            {/* Bars */}
            <div className="flex-1 flex items-end justify-between pl-10 pr-2 z-10 h-[calc(100%-1.5rem)] pb-1">
              {chartData.map((data, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div
                    className="w-full max-w-[28px] bg-[#009DE0] rounded-sm relative group"
                    style={{
                      height: `${(data.value / dynamicMax) * 100}%`,
                      minHeight: data.value > 0 ? '4px' : '0',
                    }}
                  >
                    {data.value > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity font-bold">
                        {data.value}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-4 bg-[#0B1038] rounded-xl shadow-sm p-6 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">ประกาศบริษัท</h2>
            <select
              value={announcementYear}
              onChange={(e) => setAnnouncementYear(parseInt(e.target.value))}
              className="bg-[#1F2456] text-white border border-[#3C4280] text-[11px] font-bold rounded-md py-1.5 px-3 outline-none cursor-pointer"
            >
              <option
                value={new Date().getFullYear()}
              >{`ปี ${new Date().getFullYear()}`}</option>
              <option
                value={new Date().getFullYear() - 1}
              >{`ปี ${new Date().getFullYear() - 1}`}</option>
              <option
                value={new Date().getFullYear() - 2}
              >{`ปี ${new Date().getFullYear() - 2}`}</option>
            </select>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {announcements.filter(
              (ann) =>
                new Date(ann.createdAt).getFullYear() === announcementYear,
            ).length > 0 ? (
              [...announcements]
                .filter(
                  (ann) =>
                    new Date(ann.createdAt).getFullYear() === announcementYear,
                )
                .sort((a, b) => {
                  if (a.isImportant === b.isImportant) return 0;
                  return a.isImportant ? -1 : 1;
                })
                .map((ann, idx) => (
                  <div
                    key={idx}
                    className={`${ann.isImportant ? 'bg-[#3b82f6]/20 border-[#3b82f6]/50' : 'bg-[#2B3B7B] border-white/5'} p-4 rounded-xl border hover:bg-[#34468f] transition-colors cursor-pointer relative overflow-hidden`}
                  >
                    {ann.isImportant && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>{' '}
                        สำคัญ
                      </div>
                    )}
                    <h3 className="font-bold text-white text-sm mb-1 pr-12">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-blue-200/70 mb-2">
                      {ann.subtitle}
                    </p>
                    {ann.attachmentName && (
                      <a
                        href="#"
                        className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[10px] text-blue-100 rounded-md transition-all border border-white/5"
                        onClick={(e) =>
                          previewAttachment(
                            e,
                            ann.attachmentData,
                            ann.attachmentName,
                          )
                        }
                      >
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">
                          {ann.attachmentName}
                        </span>
                      </a>
                    )}
                    <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                      <span className="text-[10px] text-blue-300/70 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {ann.createdAt
                          ? new Date(ann.createdAt).toLocaleDateString(
                              'th-TH',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            ) + ' น.'
                          : 'ไม่ระบุวันที่'}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-blue-200/70 py-8 text-sm">
                ไม่มีประกาศบริษัท
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col h-[340px]">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            กิจกรรมล่าสุด
          </h2>
          <div className="flex-1 relative">
            {/* Vertical Line */}
            <div className="absolute left-[7px] top-2 bottom-4 w-px bg-gray-200 z-0"></div>

            <div className="space-y-6 relative z-10">
              {activities.map((activity, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div
                    className={`w-[15px] h-[15px] rounded-full mt-0.5 border-2 border-white shadow-sm shrink-0 ${activity.color}`}
                  ></div>
                  <div className="-mt-1">
                    <h3 className="font-bold text-sm text-gray-800">
                      {activity.title}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
