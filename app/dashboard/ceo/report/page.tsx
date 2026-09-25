'use client';

import React from 'react';
import { useLeave } from '@/hooks/useLeave';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useDepartment } from '@/hooks/useDepartment';
import Swal from 'sweetalert2';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Eye, BarChart3 } from 'lucide-react';
import { leaveApi, employeeApi, ceoApi } from '@/lib/api';
import { DatePicker } from '@/components/DateAndTime';
import { getLeaveStatusBadgeColor, getLeaveStatusText } from '@/lib/api/utils';
import { formatLeaveDateRange, formatLeaveDuration } from '@/lib/leaveDuration';
import { CeoLeaveDetailModal } from '@/components/ceo/CeoLeaveDetailModal';
import type { Leave, Employee } from '@/lib/api/types';
import { escapeHtml, safeDataUrlKind } from '@/lib/escapeHtml';

export default function CEOReport() {
  const { useDepartmentsQuery } = useDepartment();
  const { data: departments = [], isLoading: isDeptsLoading } =
    useDepartmentsQuery();

  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const { useHolidaysQuery } = useLeave();
  const { data: holidaysData = [] } = useHolidaysQuery();
  const [isLeavesLoading, setIsLeavesLoading] = React.useState(true);
  const [isEmployeesLoading, setIsEmployeesLoading] = React.useState(true);

  const [selectedDept, setSelectedDept] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState<{
    leave: Leave;
    employee?: Employee;
  } | null>(null);
  const [statsData, setStatsData] = React.useState<{
    workStatusData?: { name: string; value: number; color: string }[];
    leaveTypesData?: { name: string; percent: number; color: string }[];
    trendData?: { day: string; value: number }[];
  } | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesRes, empRes] = await Promise.all([
          leaveApi.getAllLeaves('HR'),
          employeeApi.getAll(),
        ]);

        if (leavesRes.success || leavesRes.data) {
          setLeaves(leavesRes.data ?? []);
        }

        if (empRes.success || empRes.data) {
          setEmployees(empRes.data ?? []);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLeavesLoading(false);
        setIsEmployeesLoading(false);
      }
    };
    fetchData();

    const fetchStats = async () => {
      try {
        const res = await ceoApi.getReportStats();
        if (res.success || res.data) {
          setStatsData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch CEO report stats:', err);
      }
    };
    fetchStats();
  }, []);

  React.useEffect(() => {
    const win = window as typeof window & {
      handleViewCEOAttachment?: (urlOrBase64: string) => void;
    };
    win.handleViewCEOAttachment = (urlOrBase64: string) => {
      if (urlOrBase64.startsWith('data:')) {
        // Only a well-formed image/PDF data URL is shown, and escaped: the
        // stored value comes from the uploader.
        const kind = safeDataUrlKind(urlOrBase64);
        if (!kind) return;
        const src = escapeHtml(urlOrBase64);
        const win = window.open();
        if (win) {
          if (kind === 'pdf') {
            win.document.write(
              `<iframe src="${src}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
            );
          } else {
            win.document.write(
              `<img src="${src}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`,
            );
          }
        }
      } else {
        const fileUrl = urlOrBase64.startsWith('/')
          ? urlOrBase64
          : '/' + urlOrBase64.replace(/\\/g, '/');
        // Same-site uploaded files only (no "//other-site" or other schemes).
        if (!fileUrl.startsWith('/uploads/')) return;
        window.open(fileUrl, '_blank', 'noopener');
      }
    };
    return () => {
      delete win.handleViewCEOAttachment;
    };
  }, []);

  const isLoading = isLeavesLoading || isEmployeesLoading || isDeptsLoading;
  const formatDateRange = formatLeaveDateRange;

  // Calculate Dynamic Data for Charts
  const totalEmployees = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthLeaves = leaves.filter(
    (l) =>
      (l.status || '').toLowerCase() === 'approved' &&
      l.startDate.startsWith(todayStr.substring(0, 7)),
  );
  const leavesToday = currentMonthLeaves.filter(
    (l) => l.startDate <= todayStr && l.endDate >= todayStr,
  ).length;

  const defaultWorkStatusData = [
    {
      name: 'มาทำงาน',
      value: Math.max(0, totalEmployees - leavesToday),
      color: '#16a34a',
    },
    { name: 'ลางาน', value: leavesToday, color: '#ef4444' },
  ];

  let sick = 0,
    personal = 0,
    vacation = 0;
  leaves.forEach((l) => {
    const t = l.type || l.leaveTypeName || '';
    if (t.includes('ป่วย')) sick++;
    else if (t.includes('กิจ')) personal++;
    else if (t.includes('พักร้อน')) vacation++;
  });
  const totalLeaveTypes = sick + personal + vacation || 1;

  const defaultLeaveTypesData = [
    {
      name: 'ลาป่วย',
      percent: Math.round((sick / totalLeaveTypes) * 100),
      color: '#f59e0b',
    },
    {
      name: 'ลากิจ',
      percent: Math.round((personal / totalLeaveTypes) * 100),
      color: '#16a34a',
    },
    {
      name: 'ลาพักร้อน',
      percent: Math.round((vacation / totalLeaveTypes) * 100),
      color: '#2563eb',
    },
  ];

  const defaultTrendData = [
    {
      day: '1',
      value: currentMonthLeaves.filter(
        (l) => new Date(l.startDate).getDate() <= 5,
      ).length,
    },
    {
      day: '5',
      value: currentMonthLeaves.filter(
        (l) =>
          new Date(l.startDate).getDate() > 5 &&
          new Date(l.startDate).getDate() <= 10,
      ).length,
    },
    {
      day: '10',
      value: currentMonthLeaves.filter(
        (l) =>
          new Date(l.startDate).getDate() > 10 &&
          new Date(l.startDate).getDate() <= 15,
      ).length,
    },
    {
      day: '15',
      value: currentMonthLeaves.filter(
        (l) =>
          new Date(l.startDate).getDate() > 15 &&
          new Date(l.startDate).getDate() <= 20,
      ).length,
    },
    {
      day: '20',
      value: currentMonthLeaves.filter(
        (l) =>
          new Date(l.startDate).getDate() > 20 &&
          new Date(l.startDate).getDate() <= 25,
      ).length,
    },
    {
      day: '25',
      value: currentMonthLeaves.filter(
        (l) => new Date(l.startDate).getDate() > 25,
      ).length,
    },
  ];

  const workStatusData = statsData?.workStatusData || defaultWorkStatusData;
  const leaveTypesData = statsData?.leaveTypesData || defaultLeaveTypesData;
  const trendData = statsData?.trendData || defaultTrendData;

  const totalStatEmployees = workStatusData.reduce(
    (acc: number, curr) => acc + curr.value,
    0,
  );
  const workingPercent =
    totalStatEmployees > 0
      ? Math.round((workStatusData[0].value / totalStatEmployees) * 100)
      : 0;

  const filteredLeaves = React.useMemo(() => {
    return leaves.filter((leave) => {
      let match = true;
      if (selectedDate) {
        const leaveStart = leave.startDate.split('T')[0];
        const leaveEnd = leave.endDate.split('T')[0];
        match = match && leaveStart <= selectedDate && leaveEnd >= selectedDate;
      }
      if (selectedDept) {
        const employee = employees.find(
          (e) =>
            e.id === leave.employeeId ||
            e.employeeId === leave.employeeId ||
            e.username === leave.userId ||
            e.firstName + ' ' + e.lastName === leave.userId,
        );
        const dept =
          employee?.departmentName ||
          leave.departmentName ||
          leave.department ||
          '';
        match = match && dept === selectedDept;
      }
      return match;
    });
  }, [leaves, selectedDate, selectedDept, employees]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE),
  );
  const currentLeaves = filteredLeaves.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // --- HANDLERS ---
  const handleExportCSV = () => {
    if (leaves.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่มีข้อมูล',
        text: 'ไม่พบข้อมูลสำหรับส่งออก',
      });
      return;
    }

    // CSV Header
    let csvContent =
      'รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,เหตุผลการลา,วันที่การลา,จำนวนวัน,สถานะ\n';

    leaves.forEach((l) => {
      const employee = employees.find(
        (e) =>
          e.id === l.employeeId ||
          e.employeeId === l.employeeId ||
          e.username === l.userId ||
          e.firstName + ' ' + e.lastName === l.userId,
      );
      const empId =
        employee?.employeeId || l.employee?.employeeCode || l.employeeId || '-';
      const empName = employee
        ? `${employee.firstName} ${employee.lastName}`
        : l.employeeName || l.userId || 'ไม่ระบุชื่อ';
      const deptName =
        employee?.departmentName || l.departmentName || l.department || '-';
      const dates = formatDateRange(l.startDate, l.endDate, l);
      const shortTypeName = (l.leaveTypeName || l.type || '').split(' ')[0];
      const statusText =
        (l.status || '').toLowerCase() === 'approved'
          ? 'อนุมัติ'
          : (l.status || '').toLowerCase() === 'pending'
            ? 'รออนุมัติ'
            : 'ไม่อนุมัติ';
      const durationText = formatLeaveDuration(l, holidaysData);

      csvContent += `${empId},${empName},${deptName},${shortTypeName},${dates},${durationText},${statusText}\n`;
    });

    // Create a Blob and Download
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `leave_report_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'ดาวน์โหลดสำเร็จ',
      text: 'ไฟล์ CSV ถูกดาวน์โหลดไปยังเครื่องของคุณเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleViewDetails = (leave: Leave, employee?: Employee) => {
    setSelectedRequest({ leave, employee });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <BarChart3 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            รายงานการลา (CEO Insights)
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            ภาพรวมสถิติและแนวโน้มการลางานของทั้งองค์กร
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 w-full">
        <div className="space-y-6 max-w-7xl mx-auto pb-4">

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Today's Work Status (Donut Chart) */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-lg text-slate-800 self-start mb-4">
              สถานะการปฏิบัติงานวันนี้
            </h3>
            <div className="flex items-center justify-center w-full relative h-[180px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workStatusData}
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    stroke="none"
                    dataKey="value"
                    paddingAngle={3}
                    cornerRadius={4}
                  >
                    {workStatusData.map((entry, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} คน`, 'จำนวน']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text for Donut */}
              <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                  {workingPercent}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  มาทำงาน
                </span>
              </div>

              {/* Legend */}
              <div className="absolute flex flex-col gap-3 right-2 top-1/2 -translate-y-1/2">
                {workStatusData.map((entry, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-[13px] font-bold text-slate-700"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-md"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="w-16">{entry.name}</span>
                    <span className="text-slate-400 font-medium">
                      ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Common Leave Types */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-6">
              ประเภทการลาที่พบบ่อย (เดือนนี้)
            </h3>
            <div className="space-y-5 flex-1 justify-center flex flex-col">
              {leaveTypesData.map((item, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="font-bold text-slate-700 w-16 text-sm">
                    {item.name}
                  </span>
                  <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                  <span className="font-bold text-slate-800 w-10 text-right text-sm">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Leave Trends */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              แนวโน้มการลาของเดือนนี้
            </h3>
            <div className="flex-1 w-full h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dx={-10}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden mt-6 pb-4">
          {/* Table Header Section */}
          <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-[22px] font-bold text-slate-800">
              รายชื่อการลาของพนักงาน (ทั้งหมด)
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="bg-[#581c87] hover:bg-[#4c1d95] text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                Export (CSV)
              </button>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 outline-none focus:border-[#581c87]"
              >
                <option value="">ทุกแผนก</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="w-[180px]">
                <DatePicker
                  selected={selectedDate ? new Date(selectedDate) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const d = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000,
                      );
                      setSelectedDate(d.toISOString().split('T')[0]);
                    } else {
                      setSelectedDate('');
                    }
                    setCurrentPage(1);
                  }}
                  placeholderText="วว/ดด/ปปปป"
                />
              </div>
              {(selectedDate || selectedDept) && (
                <button
                  onClick={() => {
                    setSelectedDate('');
                    setSelectedDept('');
                    setCurrentPage(1);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-800 underline"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable cols={7} rows={5} />
              </div>
            ) : (
              <table className="w-full text-center text-[14px]">
                <thead className="bg-[#add8e6] text-slate-800 border-b-2 border-white">
                  <tr>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      รหัสการลา
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      รหัสพนักงาน
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      ชื่อ
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      นามสกุล
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      แผนก
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      ประเภทการลา
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      วันที่การลา
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      จำนวนวัน
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      สถานะ
                    </th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {currentLeaves.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-12 text-center text-slate-500 font-medium"
                      >
                        ไม่มีข้อมูลการลา
                      </td>
                    </tr>
                  ) : (
                    currentLeaves.map((leave) => {
                      const employee = employees.find(
                        (e) =>
                          e.id === leave.employeeId ||
                          e.employeeId === leave.employeeId ||
                          e.username === leave.userId ||
                          e.firstName + ' ' + e.lastName === leave.userId,
                      );
                      const rawEmpId =
                        employee?.employeeId ||
                        leave.employee?.employeeCode ||
                        leave.employeeId ||
                        '-';
                      const empId = rawEmpId.startsWith('EMP-')
                        ? rawEmpId
                        : rawEmpId === '-'
                          ? '-'
                          : `EMP-${String(rawEmpId).substring(0, 6).toUpperCase()}`;
                      const empName = employee
                        ? `${employee.firstName} ${employee.lastName}`
                        : leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';

                      let firstName = '-';
                      let lastName = '-';
                      if (employee && employee.firstName) {
                        firstName = employee.firstName;
                        lastName = employee.lastName || '-';
                      } else {
                        const nameParts = empName.split(' ');
                        firstName = nameParts[0] || 'ไม่ระบุชื่อ';
                        lastName =
                          nameParts.length > 1
                            ? nameParts.slice(1).join(' ')
                            : '-';
                      }

                      const dept =
                        employee?.departmentName ||
                        leave.departmentName ||
                        leave.department ||
                        '-';
                      const leaveType =
                        leave.leaveTypeName || leave.type || '-';
                      const shortTypeName = leaveType.split(' ')[0];
                      const durationText = formatLeaveDuration(
                        leave,
                        holidaysData,
                      );

                      return (
                        <tr
                          key={leave.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="font-semibold text-blue-500 whitespace-nowrap">
                              {leave.requestCode || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{empId}</td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-800">
                              {firstName}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-800">
                              {lastName}
                            </span>
                          </td>
                          <td className="py-4 px-6">{dept}</td>
                          <td className="py-4 px-6">{shortTypeName}</td>
                          <td className="py-4 px-6">
                            {formatDateRange(
                              leave.startDate,
                              leave.endDate,
                              leave,
                            )}
                          </td>
                          <td className="py-4 px-6">{durationText}</td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center">
                              <span
                                className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap text-white ${getLeaveStatusBadgeColor(leave.status)}`}
                              >
                                {getLeaveStatusText(leave.status)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleViewDetails(leave, employee)}
                              className="p-2 bg-[#f8fafc] text-slate-500 rounded-full hover:bg-[#e0e7ff] hover:text-[#4f46e5] transition-colors"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredLeaves.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)}{' '}
                จาก {filteredLeaves.length} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ก่อนหน้า
                </button>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] md:max-w-none">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    // Show current page, first, last, and pages close to current
                    if (
                      idx === 0 ||
                      idx === totalPages - 1 ||
                      Math.abs(currentPage - 1 - idx) <= 1
                    ) {
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === idx + 1
                              ? 'bg-[#581c87] text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    } else if (
                      (idx === 1 && currentPage > 3) ||
                      (idx === totalPages - 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={idx} className="px-1 text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leave Details Modal */}
        {selectedRequest && (
          <CeoLeaveDetailModal
            leave={selectedRequest.leave}
            employee={selectedRequest.employee}
            holidaysData={holidaysData}
            onClose={() => setSelectedRequest(null)}
            onViewAttachment={(urlOrBase64) => {
              const win = window as typeof window & {
                handleViewCEOAttachment?: (url: string) => void;
              };
              win.handleViewCEOAttachment?.(urlOrBase64);
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
}
