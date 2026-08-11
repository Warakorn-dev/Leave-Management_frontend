'use client';

import React from 'react';
import { useLeave } from '@/hooks/useLeave';
import { useEmployee } from '@/hooks/useEmployee';
import { calculateLeaveDays } from '@/lib/store';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useDepartment } from '@/hooks/useDepartment';
import Swal from 'sweetalert2';
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar, FileDown, Eye, X, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { leaveApi, employeeApi, ceoApi } from '@/api';
import { DatePicker } from '@/components/DateAndTime';

export default function CEOReport() {
  const { useDepartmentsQuery } = useDepartment();
  const { data: departments = [], isLoading: isDeptsLoading } = useDepartmentsQuery();

  const [leaves, setLeaves] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const { useHolidaysQuery } = useLeave();
  const { data: holidaysData = [] } = useHolidaysQuery();
  const [isLeavesLoading, setIsLeavesLoading] = React.useState(true);
  const [isEmployeesLoading, setIsEmployeesLoading] = React.useState(true);

  const [selectedDept, setSelectedDept] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState<{ leave: any; employee: any } | null>(null);
  const [statsData, setStatsData] = React.useState<any>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesRes, empRes] = await Promise.all([
          leaveApi.getAllLeaves('HR'),
          employeeApi.getAll()
        ]);

        if (leavesRes.success || leavesRes.data || leavesRes) {
          const leavesData = (leavesRes as any).data ?? leavesRes;
          setLeaves((leavesData as any).data ?? leavesData);
        }

        if (empRes.success || empRes.data || empRes) {
          const empData = (empRes as any).data ?? empRes;
          setEmployees((empData as any).data ?? empData);
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
    (window as any).handleViewCEOAttachment = (urlOrBase64: string) => {
      if (urlOrBase64.startsWith("data:")) {
        const win = window.open();
        if (win) {
          if (urlOrBase64.startsWith("data:application/pdf")) {
            win.document.write(`<iframe src="${urlOrBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
          } else {
            win.document.write(`<img src="${urlOrBase64}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
          }
        }
      } else {
        const fileUrl = urlOrBase64.startsWith('/') ? urlOrBase64 : '/' + urlOrBase64.replace(/\\/g, '/');
        window.open(fileUrl, '_blank');
      }
    };
    return () => {
      delete (window as any).handleViewCEOAttachment;
    };
  }, []);

  const isLoading = isLeavesLoading || isEmployeesLoading || isDeptsLoading;

  // Format dates
  const formatDateRange = (startDateStr: string, endDateStr: string, leave?: any) => {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const startDay = format(start, 'd');
      const startMonth = format(start, 'MMM', { locale: th });
      const endDay = format(end, 'd');
      const endMonth = format(end, 'MMM', { locale: th });

      let baseStr = '';
      if (startDateStr.split('T')[0] === endDateStr.split('T')[0]) {
        baseStr = `${startDay} ${startMonth}.`;
      } else if (startMonth === endMonth) {
        baseStr = `${startDay} - ${endDay} ${startMonth}.`;
      } else {
        baseStr = `${startDay} ${startMonth}. - ${endDay} ${endMonth}.`;
      }

      if (leave) {
        const mode = leave.startFormat || leave.leaveMode;
        if (mode === 'hourly' || (leave.leaveHours && leave.leaveHours < 8 && mode !== 'full' && mode !== 'full_day' && mode !== 'half_day' && mode !== 'morning' && mode !== 'afternoon')) {
          let startT = leave.startTime;
          if (!startT && startDateStr.includes('T')) {
            startT = format(start, 'HH:mm');
          }
          let endT = leave.endTime;
          if (!endT && endDateStr.includes('T')) {
            endT = format(end, 'HH:mm');
          }

          if (startT && endT && startT !== endT) {
            return `${baseStr} (${startT} - ${endT} น.)`;
          }
        }
      }

      return baseStr;
    } catch {
      return startDateStr;
    }
  };

  // Calculate Dynamic Data for Charts
  const totalEmployees = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthLeaves = leaves.filter(l => (l.status || '').toLowerCase() === 'approved' && l.startDate.startsWith(todayStr.substring(0, 7)));
  const leavesToday = currentMonthLeaves.filter(l => l.startDate <= todayStr && l.endDate >= todayStr).length;

  const defaultWorkStatusData = [
    { name: 'มาทำงาน', value: Math.max(0, totalEmployees - leavesToday), color: '#16a34a' },
    { name: 'ลางาน', value: leavesToday, color: '#ef4444' }
  ];

  let sick = 0, personal = 0, vacation = 0;
  leaves.forEach(l => {
    const t = l.type || l.leaveTypeName || '';
    if (t.includes('ป่วย')) sick++;
    else if (t.includes('กิจ')) personal++;
    else if (t.includes('พักร้อน')) vacation++;
  });
  const totalLeaveTypes = sick + personal + vacation || 1;

  const defaultLeaveTypesData = [
    { name: 'ลาป่วย', percent: Math.round((sick / totalLeaveTypes) * 100), color: '#f59e0b' },
    { name: 'ลากิจ', percent: Math.round((personal / totalLeaveTypes) * 100), color: '#16a34a' },
    { name: 'ลาพักร้อน', percent: Math.round((vacation / totalLeaveTypes) * 100), color: '#2563eb' }
  ];

  const defaultTrendData = [
    { day: '1', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() <= 5).length },
    { day: '5', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() > 5 && new Date(l.startDate).getDate() <= 10).length },
    { day: '10', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() > 10 && new Date(l.startDate).getDate() <= 15).length },
    { day: '15', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() > 15 && new Date(l.startDate).getDate() <= 20).length },
    { day: '20', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() > 20 && new Date(l.startDate).getDate() <= 25).length },
    { day: '25', value: currentMonthLeaves.filter(l => new Date(l.startDate).getDate() > 25).length }
  ];

  const workStatusData = statsData?.workStatusData || defaultWorkStatusData;
  const leaveTypesData = statsData?.leaveTypesData || defaultLeaveTypesData;
  const trendData = statsData?.trendData || defaultTrendData;

  const totalStatEmployees = workStatusData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const workingPercent = totalStatEmployees > 0 ? Math.round((workStatusData[0].value / totalStatEmployees) * 100) : 0;

  const filteredLeaves = React.useMemo(() => {
    return leaves.filter(leave => {
      let match = true;
      if (selectedDate) {
        const leaveStart = leave.startDate.split('T')[0];
        const leaveEnd = leave.endDate.split('T')[0];
        match = match && (leaveStart <= selectedDate && leaveEnd >= selectedDate);
      }
      if (selectedDept) {
        const employee = employees.find(e => e.id === leave.employeeId || e.employeeId === leave.employeeId || e.username === leave.userId || (e.firstName + ' ' + e.lastName) === leave.userId);
        const dept = employee?.departmentName || leave.departmentName || leave.department || '';
        match = match && (dept === selectedDept);
      }
      return match;
    });
  }, [leaves, selectedDate, selectedDept, employees]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE));
  const currentLeaves = filteredLeaves.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- HANDLERS ---
  const handleExportCSV = () => {
    if (leaves.length === 0) {
      Swal.fire({ icon: 'warning', title: 'ไม่มีข้อมูล', text: 'ไม่พบข้อมูลสำหรับ Export' });
      return;
    }

    // CSV Header
    let csvContent = 'รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,เหตุผลการลา,วันที่การลา,จำนวนวัน,สถานะ\n';

    leaves.forEach(l => {
      const employee = employees.find(e => e.id === l.employeeId || e.employeeId === l.employeeId || e.username === l.userId || (e.firstName + ' ' + e.lastName) === l.userId);
      const empId = employee?.employeeId || l.employee?.employeeCode || l.employeeId || '-';
      const empName = employee ? `${employee.firstName} ${employee.lastName}` : l.employeeName || l.userId || 'ไม่ระบุชื่อ';
      const deptName = employee?.departmentName || l.departmentName || l.department || '-';
      const dates = formatDateRange(l.startDate, l.endDate, l);
      // Escape commas for CSV
      const reason = `"${(l.reason || '').replace(/"/g, '""')}"`;
      const shortTypeName = (l.leaveTypeName || l.type || '').split(' ')[0];
      const statusText = (l.status || '').toLowerCase() === 'approved' ? 'อนุมัติ' : (l.status || '').toLowerCase() === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ';
      const durationText = (() => {
        const days = Number(l.totalDays || l.durationDays || 0);
        const mode = l.startFormat || l.leaveMode;
        if (mode === 'hourly' || l.leaveHours || (days > 0 && days < 0.5)) {
          const hours = l.leaveHours ? Number(l.leaveHours) : Number((days * 8).toFixed(2));
          const h = Math.floor(hours);
          const m = Math.round((hours - h) * 60);
          return m === 0 ? `${h} ชม.` : `${h}.${m.toString().padStart(2, '0')} ชม.`;
        }
        if (mode === 'half_day' || mode === 'morning' || mode === 'afternoon' || days === 0.5) {
          return `0.5 วัน`;
        }
        const finalDays = days > 0 ? days : calculateLeaveDays(l.startDate, l.endDate, l.startFormat, l.endFormat, holidaysData);
        return `${finalDays} วัน`;
      })();

      csvContent += `${empId},${empName},${deptName},${shortTypeName},${dates},${durationText},${statusText}\n`;
    });

    // Create a Blob and Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'ดาวน์โหลดสำเร็จ',
      text: 'ไฟล์ CSV ถูกดาวน์โหลดไปยังเครื่องของคุณเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleViewDetails = (leave: any, employee: any) => {
    setSelectedRequest({ leave, employee });
  };

  return (
    <div className="p-6 md:p-8 w-full min-h-full bg-[#F8F9FA]">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 bg-white inline-block px-8 py-3 rounded-t-xl rounded-br-3xl shadow-sm">
            รายงานการลา (CEO Insights)
          </h1>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Card 1: Today's Work Status (Donut Chart) */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-lg text-slate-800 self-start mb-4">สถานะการปฏิบัติงานวันนี้</h3>
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
                    {workStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} คน`, 'จำนวน']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text for Donut */}
              <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                  {workingPercent}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">มาทำงาน</span>
              </div>

              {/* Legend */}
              <div className="absolute flex flex-col gap-3 right-2 top-1/2 -translate-y-1/2">
                {workStatusData.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                    <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: entry.color }}></div>
                    <span className="w-16">{entry.name}</span>
                    <span className="text-slate-400 font-medium">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Common Leave Types */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-6">ประเภทการลาที่พบบ่อย (เดือนนี้)</h3>
            <div className="space-y-5 flex-1 justify-center flex flex-col">
              {leaveTypesData.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="font-bold text-slate-700 w-16 text-sm">{item.name}</span>
                  <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                  <span className="font-bold text-slate-800 w-10 text-right text-sm">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Leave Trends */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-4">แนวโน้มการลาของเดือนนี้</h3>
            <div className="flex-1 w-full h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
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
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border-2 border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 outline-none focus:border-[#581c87]"
              >
                <option value="">ทุกแผนก (All Departments)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <div className="w-[180px]">
                <DatePicker
                  selected={selectedDate ? new Date(selectedDate) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
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
                  onClick={() => { setSelectedDate(''); setSelectedDept(''); setCurrentPage(1); }}
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
                    <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสการลา</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสพนักงาน</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">ชื่อ</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">นามสกุล</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">แผนก</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">ประเภทการลา</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">วันที่การลา</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">จำนวนวัน</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">สถานะ</th>
                    <th className="py-4 px-6 font-bold whitespace-nowrap">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {currentLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                        ไม่มีข้อมูลการลา
                      </td>
                    </tr>
                  ) : (
                    currentLeaves.map((leave) => {
                      const employee = employees.find(e => e.id === leave.employeeId || e.employeeId === leave.employeeId || e.username === leave.userId || (e.firstName + ' ' + e.lastName) === leave.userId);
                      const rawEmpId = employee?.employeeId || leave.employee?.employeeCode || leave.employeeId || '-';
                      const empId = rawEmpId.startsWith('EMP-') ? rawEmpId : (rawEmpId === '-' ? '-' : `EMP-${String(rawEmpId).substring(0, 6).toUpperCase()}`);
                      const empName = employee ? `${employee.firstName} ${employee.lastName}` : leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';

                      let firstName = '-';
                      let lastName = '-';
                      if (employee && employee.firstName) {
                        firstName = employee.firstName;
                        lastName = employee.lastName || '-';
                      } else {
                        const nameParts = empName.split(' ');
                        firstName = nameParts[0] || 'ไม่ระบุชื่อ';
                        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';
                      }

                      const dept = employee?.departmentName || leave.departmentName || leave.department || '-';
                      const leaveType = leave.leaveTypeName || leave.type || '-';
                      const shortTypeName = leaveType.split(' ')[0];
                      const durationText = (() => {
                        const days = Number(leave.totalDays || leave.durationDays || 0);
                        const mode = leave.startFormat || leave.leaveMode;
                        if (mode === 'hourly' || leave.leaveHours || (days > 0 && days < 0.5)) {
                          const hours = leave.leaveHours ? Number(leave.leaveHours) : Number((days * 8).toFixed(2));
                          const h = Math.floor(hours);
                          const m = Math.round((hours - h) * 60);
                          return m === 0 ? `${h} ชม.` : `${h}.${m.toString().padStart(2, '0')} ชม.`;
                        }
                        if (mode === 'half_day' || mode === 'morning' || mode === 'afternoon' || days === 0.5) {
                          return `0.5 วัน`;
                        }
                        const finalDays = days > 0 ? days : calculateLeaveDays(leave.startDate, leave.endDate, leave.startFormat, leave.endFormat, holidaysData);
                        return `${finalDays} วัน`;
                      })();

                      return (
                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-semibold text-blue-500 whitespace-nowrap">{leave.requestCode || '-'}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{empId}</td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-800">{firstName}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-800">{lastName}</span>
                          </td>
                          <td className="py-4 px-6">{dept}</td>
                          <td className="py-4 px-6">{shortTypeName}</td>
                          <td className="py-4 px-6">{formatDateRange(leave.startDate, leave.endDate, leave)}</td>
                          <td className="py-4 px-6">{durationText}</td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center">
                              {(leave.status || '').toLowerCase().includes('approved') && (
                                <span className="bg-[#16a34a] text-white px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap">อนุมัติ</span>
                              )}
                              {(leave.status || '').toLowerCase().includes('rejected') && (
                                <span className="bg-[#ef4444] text-white px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap">ปฏิเสธ</span>
                              )}
                              {(leave.status || '').toLowerCase() === 'pending' && (
                                <span className="bg-[#f59e0b] text-white px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap">รออนุมัติ</span>
                              )}
                              {(leave.status || '').toLowerCase() === 'waiting ceo' && (
                                <span className="bg-[#6366f1] text-white px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap">รอ CEO อนุมัติ</span>
                              )}
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
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)} จาก {filteredLeaves.length} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === idx + 1
                              ? 'bg-[#581c87] text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    } else if (
                      idx === 1 && currentPage > 3 ||
                      idx === totalPages - 2 && currentPage < totalPages - 2
                    ) {
                      return <span key={idx} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        {selectedRequest && (() => {
          const leave = selectedRequest.leave;
          const employee = selectedRequest.employee;
          const empId = employee?.employeeId || leave.employeeId || '-';
          const empName = employee ? `${employee.firstName} ${employee.lastName}` : leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';
          const dept = employee?.departmentName || leave.departmentName || leave.department || '-';
          const dates = formatDateRange(leave.startDate, leave.endDate, leave);
          const durationText = (() => {
            const days = Number(leave.totalDays || leave.durationDays || 0);
            const mode = leave.startFormat || leave.leaveMode;
            if (mode === 'hourly' || leave.leaveHours || (days > 0 && days < 0.5)) {
              const hours = leave.leaveHours ? Number(leave.leaveHours) : Number((days * 8).toFixed(2));
              const h = Math.floor(hours);
              const m = Math.round((hours - h) * 60);
              return m === 0 ? `${h} ชม.` : `${h}.${m.toString().padStart(2, '0')} ชม.`;
            }
            if (mode === 'half_day' || mode === 'morning' || mode === 'afternoon' || days === 0.5) {
              return `0.5 วัน`;
            }
            const finalDays = days > 0 ? days : calculateLeaveDays(leave.startDate, leave.endDate, leave.startFormat, leave.endFormat, holidaysData);
            return `${finalDays} วัน`;
          })();
          const reason = leave.reason || '-';
          const statusLower = (leave.status || '').toLowerCase();

          let statusText = 'รออนุมัติ';
          let statusColor = 'bg-[#FFA000]';
          let reasonColor = 'border-gray-300 text-gray-500 bg-white';
          if (statusLower === 'approved' || statusLower.includes('approved')) {
            statusText = 'อนุมัติ';
            statusColor = 'bg-[#00E676]';
            reasonColor = 'border-[#D1F2DF] text-green-600 bg-[#F4FDF8]';
          } else if (statusLower === 'rejected' || statusLower.includes('rejected')) {
            statusText = 'ปฏิเสธ';
            statusColor = 'bg-[#FF0000]';
            reasonColor = 'border-red-200 text-red-600 bg-red-50';
          }

          const approverReason = leave.approverReason || 'ไม่มีหมายเหตุเพิ่มเติม';

          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5">
                  <h2 className="text-[20px] font-bold text-black">รายละเอียดคำขอลา (Leave Request Details)</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">

                  {/* Employee Info */}
                  <div className="border border-gray-300 rounded-xl p-5 flex gap-4 bg-white">
                    <div className="w-[38px] h-[38px] rounded-full bg-fuchsia-100/50 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[15px] text-black mb-3">ข้อมูลพนักงาน (Employee Info)</h3>
                      <div className="text-[14px] text-gray-800 space-y-2">
                        <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">ชื่อ:</span> {empName}</p>
                        <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">แผนก|ตำแหน่ง:</span> {dept} | {employee?.position?.name || employee?.positionName || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Leave Info */}
                  <div className="border border-gray-300 rounded-xl p-5 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-[32px] h-[32px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                        <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      </div>
                      <h3 className="font-bold text-[15px] text-black">รายละเอียดการลา (Leave Information)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-gray-800 pl-[44px]">
                      <div className="space-y-3">
                        <p className="flex gap-2"><span className="font-bold min-w-[80px]">รหัสการลา:</span> <span className="text-blue-500 font-semibold">{leave.requestCode || '-'}</span></p>
                        <p className="flex gap-2"><span className="font-bold min-w-[80px]">ประเภทการลา:</span> {leave.type || leave.leaveTypeName || '-'}</p>
                        <p className="flex gap-2"><span className="font-bold min-w-[80px]">ช่วงเวลา:</span> {dates} ({durationText})</p>
                      </div>
                      <div className="space-y-3">
                        <p className="flex items-center gap-2">
                          <span className="w-[26px] h-[26px] bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                            <Clock className="w-[14px] h-[14px]" strokeWidth={2.5} />
                          </span>
                          <span className="font-bold min-w-[80px]">รูปแบบการลา:</span> {leave.startFormat === 'hourly' ? `รายชั่วโมง (${leave.leaveHours || 1} ชม.)` : leave.startFormat === 'morning' ? 'ครึ่งวันเช้า' : leave.startFormat === 'afternoon' ? 'ครึ่งวันบ่าย' : 'เต็มวัน'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-[26px] h-[26px] bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                          </span>
                          <span className="font-bold min-w-[80px]">เอกสารแนบ:</span>
                          {(leave as any).attachmentUrl || leave.attachment ? (
                            <button
                              onClick={() => {
                                const base64 = (leave as any).attachmentUrl || leave.attachment;
                                if (base64 && (window as any).handleViewCEOAttachment) {
                                  (window as any).handleViewCEOAttachment(base64);
                                }
                              }}
                              className="text-blue-600 font-bold hover:underline ml-2"
                            >
                              ดูเอกสารแนบ
                            </button>
                          ) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h3 className="font-bold text-black text-[14px] mb-2">เหตุผลการลา</h3>
                    <input
                      type="text"
                      readOnly
                      value={reason}
                      className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default"
                    />
                  </div>

                  {/* Timestamps */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-gray-500">
                      <p className="flex gap-2">
                        <span className="font-bold min-w-[120px]">วันที่ยื่นคำลา:</span>
                        {leave.createdAt ? new Date(leave.createdAt).toLocaleString('th-TH') : '-'}
                      </p>
                      <p className="flex gap-2">
                        <span className="font-bold min-w-[120px]">อัปเดตล่าสุด:</span>
                        {leave.updatedAt ? new Date(leave.updatedAt).toLocaleString('th-TH') : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Approval */}
                  <div className="mt-2">
                    <h3 className="font-bold text-[#00A859] flex items-center gap-2 text-[15px] mb-2">
                      <span className="font-extrabold text-black/50 tracking-tighter">NID</span> การอนุมัติ (Approval)
                    </h3>
                    <div className="flex flex-col md:flex-row items-stretch gap-4 bg-[#F8F9FA] border border-gray-200 rounded-xl p-4">
                      <div className="w-[120px] flex flex-col justify-center border-r border-gray-200 pr-4">
                        <span className="text-[12px] font-bold text-black mb-2">สถานะ:</span>
                        <span className={`inline-flex justify-center items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-white shadow-sm ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[12px] font-bold text-black mb-2">เหตุผลของผู้อนุมัติ (CEO)</span>
                        <input
                          type="text"
                          readOnly
                          value={approverReason}
                          className={`w-full border rounded-xl p-2.5 text-[14px] outline-none cursor-default ${reasonColor}`}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-[24px]">
                  <span className="text-[13px] font-medium text-gray-300">
                    วันที่ยื่นคำขอ : {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}


