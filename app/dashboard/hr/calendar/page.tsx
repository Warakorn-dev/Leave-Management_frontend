'use client';

import { useState, useEffect } from 'react';
import { useLeave } from '@/hooks/useLeave';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { holidayApi } from '@/lib/api';

// mockLeaves removed

const thaiMonths = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const daysOfWeek = [
  'อาทิตย์',
  'จันทร์',
  'อังคาร',
  'พุธ',
  'พฤหัสบดี',
  'ศุกร์',
  'เสาร์',
];

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to July 2026
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [username, setUsername] = useState('Manager');
  const [department, setDepartment] = useState('');
  const [actualUserId, setActualUserId] = useState('');
  const [selectedDateLeaves, setSelectedDateLeaves] = useState<any[] | null>(
    null,
  );
  const [selectedDateString, setSelectedDateString] = useState('');
  const [viewMode, setViewMode] = useState<'company' | 'department'>('company');
  const router = useRouter();

  const { useLeavesQuery, useHolidaysQuery } = useLeave();
  const { data: leavesData = [], refetch: refetchLeaves } =
    useLeavesQuery(true);
  const { data: holidaysData = [], refetch: refetchHolidays } =
    useHolidaysQuery();

  useEffect(() => {
    const role = sessionStorage.getItem('role')?.toLowerCase();
    if (role !== 'hr') {
      router.push('/login');
      return;
    }
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername)
      setUsername(sessionStorage.getItem('fullName') || storedUsername);
    const storedDept = sessionStorage.getItem('department') || '';
    setDepartment(storedDept);
    setActualUserId(sessionStorage.getItem('userId') || '');

    const approvedLeaves = leavesData.filter((r: any) => {
      const s = (r.status || '').toUpperCase();
      return s === 'APPROVED' || s.includes('APPROVED');
    });
    setAllLeaves(approvedLeaves);
  }, [router, leavesData]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const publicHolidays = holidaysData.map((h: any) => ({
    id: h.id,
    date: h.date.split('T')[0],
    title: h.name,
    type: 'holiday',
  }));

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Build calendar cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const events: any[] = [];

    // Check holidays
    const holiday = publicHolidays.find((h) => h.date === dateStr);
    if (holiday) events.push(holiday);

    const currentDayOfWeek = new Date(dateStr).getDay();
    const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;

    if (isWeekend || holiday) {
      return events;
    }

    const filteredLeaves = allLeaves.filter((leave) => {
      const deptName =
        leave.employee?.department?.name ||
        leave.user?.department?.name ||
        leave.departmentName;
      return viewMode === 'company' || deptName === department;
    });

    filteredLeaves.forEach((leave) => {
      const startD = new Date(leave.startDate);
      const endD = new Date(leave.endDate);
      const startStr = `${startD.getFullYear()}-${(startD.getMonth() + 1).toString().padStart(2, '0')}-${startD.getDate().toString().padStart(2, '0')}`;
      const endStr = `${endD.getFullYear()}-${(endD.getMonth() + 1).toString().padStart(2, '0')}-${endD.getDate().toString().padStart(2, '0')}`;

      const start = new Date(startStr);
      const end = new Date(endStr);
      const current = new Date(dateStr);
      if (current >= start && current <= end) {
        const isMine =
          String(leave.userId) === String(actualUserId) ||
          String(leave.employeeId) === String(actualUserId);
        events.push({
          title: leave.user?.firstName
            ? `${leave.user.firstName} - ${leave.leaveType?.name || leave.type}`
            : leave.type,
          type: isMine ? 'my-leave' : 'leave',
          isStart: startStr === dateStr,
          raw: leave,
        });
      }
    });

    return events;
  };

  const handleAddHoliday = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'เพิ่มวันหยุดนักขัตฤกษ์',
      html:
        '<input id="swal-input-name" class="swal2-input" placeholder="ชื่อวันหยุด">' +
        '<input id="swal-input-date" type="date" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const name = (
          document.getElementById('swal-input-name') as HTMLInputElement
        ).value;
        const date = (
          document.getElementById('swal-input-date') as HTMLInputElement
        ).value;
        if (!name || !date) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
        }
        return { name, date };
      },
    });

    if (formValues) {
      try {
        const res = await holidayApi.create(formValues);
        const data = res.data;
        if ((data as any).success || data) {
          Swal.fire('สำเร็จ', 'เพิ่มวันหยุดเรียบร้อยแล้ว', 'success');
          refetchHolidays();
        } else {
          Swal.fire('ผิดพลาด', 'ไม่สามารถเพิ่มวันหยุดได้', 'error');
        }
      } catch (err) {
        Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      }
    }
  };

  const handleDeleteHoliday = (id: string) => {
    Swal.fire({
      title: 'ลบวันหยุด?',
      text: 'คุณต้องการลบวันหยุดนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await holidayApi.delete(id);
          const data = res.data;
          if ((data as any).success || data) {
            Swal.fire('สำเร็จ', 'ลบวันหยุดเรียบร้อยแล้ว', 'success');
            refetchHolidays();
          }
        } catch (err) {
          Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col relative pb-8">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            ปฏิทินวันลา{' '}
          </h1>
        </div>
        <div>
          <button
            onClick={handleAddHoliday}
            className="bg-[#28305c] hover:bg-[#1e2447] text-white font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow transition-all text-sm"
          >
            + เพิ่มวันหยุดนักขัตฤกษ์
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto bg-[#D9D9D9] p-4 rounded-xl shadow-md animate-in fade-in zoom-in-95 duration-300">
          {/* Calendar Header Control */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 bg-transparent px-2">
            {/* View Toggle */}
            <div className="flex bg-gray-200 p-1 rounded-xl items-center mb-4 md:mb-0 mr-0 md:mr-4">
              <button
                onClick={() => setViewMode('company')}
                className={`px-6 py-2 rounded-lg font-bold text-[13px] transition-all ${viewMode === 'company' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                บริษัท
              </button>
              <button
                onClick={() => setViewMode('department')}
                className={`px-6 py-2 rounded-lg font-bold text-[13px] transition-all ${viewMode === 'department' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                แผนก
              </button>
            </div>

            {/* Legends */}
            <div className="flex flex-wrap items-center gap-6 text-[13px] font-bold text-black mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#12B8B8]"></span>
                <span>วันลาของคุณ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6]"></span>
                <span>การลาของพนักงาน</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF0000]"></span>
                <span>วันหยุดนักขัตฤกษ์</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center">
              <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm p-1 hover:shadow-md transition-shadow">
                <div className="relative">
                  <select
                    value={currentMonth}
                    onChange={(e) =>
                      setCurrentDate(
                        new Date(currentYear, Number(e.target.value), 1),
                      )
                    }
                    className="appearance-none bg-transparent hover:bg-blue-50/50 pl-4 pr-10 py-2 rounded-xl font-extrabold text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
                  >
                    {thaiMonths.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-600">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                <div className="relative">
                  <select
                    value={currentYear}
                    onChange={(e) =>
                      setCurrentDate(
                        new Date(Number(e.target.value), currentMonth, 1),
                      )
                    }
                    className="appearance-none bg-transparent hover:bg-blue-50/50 pl-4 pr-10 py-2 rounded-xl font-extrabold text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
                  >
                    {Array.from(
                      { length: 21 },
                      (_, i) => new Date().getFullYear() - 10 + i,
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y + 543}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-600">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 w-full border-b border-gray-200 bg-gray-50/80">
              {/* Days Header */}
              {daysOfWeek.map((d) => (
                <div
                  key={d}
                  className="text-gray-500 font-bold text-center py-4 text-[13px] uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 w-full">
              {/* Empty Cells */}
              {blanks.map((b) => (
                <div
                  key={`blank-${b}`}
                  className="min-h-[120px] bg-gray-50/50 border-r border-b border-gray-200 p-2"
                ></div>
              ))}

              {/* Day Cells */}
              {days.map((d) => {
                const events = getEventsForDate(d);
                const isToday =
                  new Date().getDate() === d &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getFullYear() === currentYear;

                return (
                  <div
                    key={d}
                    className={`min-h-[130px] border-r border-b border-gray-200 p-2 bg-white relative group transition-colors ${events.some((e) => e.type === 'leave' || e.type === 'my-leave') ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                    onClick={() => {
                      const leavesOnDay = events
                        .filter(
                          (e) => e.type === 'leave' || e.type === 'my-leave',
                        )
                        .map((e) => e.raw);
                      if (leavesOnDay.length > 0) {
                        const formattedDate = `${d} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][currentMonth]} ${currentYear + 543}`;
                        setSelectedDateLeaves(leavesOnDay);
                        setSelectedDateString(formattedDate);
                      }
                    }}
                  >
                    <div className="flex justify-end mb-1">
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-[15px] font-bold ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-700'}`}
                      >
                        {d}
                      </div>
                    </div>

                    {/* Event Bars */}
                    <div className="flex flex-col gap-1.5 px-1 pb-1">
                      {events.slice(0, 2).map((evt, idx) => {
                        if (evt.type === 'holiday') {
                          return (
                            <div
                              key={idx}
                              className="bg-[#FFF0F0] text-[#FF0000] font-bold text-[11px] px-2 py-1.5 rounded-md flex justify-between items-center border border-red-100 shadow-sm transition-all hover:shadow hover:-translate-y-px"
                            >
                              <span className="truncate">{evt.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHoliday(evt.id);
                                }}
                                className="text-red-400 hover:text-red-600 ml-1 shrink-0 text-sm font-black leading-none"
                              >
                                &times;
                              </button>
                            </div>
                          );
                        }

                        if (evt.type === 'my-leave') {
                          return (
                            <div
                              key={idx}
                              className="bg-[#E6F7F8] text-[#12B8B8] font-bold text-[11px] px-2 py-1.5 rounded-md truncate border border-[#B2DFDB] shadow-sm transition-all hover:shadow hover:-translate-y-px"
                            >
                              {evt.title.includes(' - ') ? (
                                <>
                                  <span className="font-medium">
                                    {evt.title.split(' - ')[0]}
                                  </span>
                                  <span> - </span>
                                  <span className="font-extrabold">
                                    {evt.title
                                      .split(' - ')
                                      .slice(1)
                                      .join(' - ')}
                                  </span>
                                </>
                              ) : (
                                evt.title
                              )}
                            </div>
                          );
                        }

                        if (evt.type === 'leave') {
                          return (
                            <div
                              key={idx}
                              className="bg-[#F0F5FF] text-[#3B82F6] font-bold text-[11px] px-2 py-1.5 rounded-md truncate border border-blue-100 shadow-sm transition-all hover:shadow hover:-translate-y-px"
                            >
                              {evt.title.includes(' - ') ? (
                                <>
                                  <span className="font-medium">
                                    {evt.title.split(' - ')[0]}
                                  </span>
                                  <span> - </span>
                                  <span className="font-extrabold">
                                    {evt.title
                                      .split(' - ')
                                      .slice(1)
                                      .join(' - ')}
                                  </span>
                                </>
                              ) : (
                                evt.title
                              )}
                            </div>
                          );
                        }
                      })}
                      {events.length > 2 && (
                        <div className="text-gray-400 text-[11px] font-semibold text-center mt-0.5 cursor-pointer hover:text-gray-600 transition-colors">
                          ... อีก {events.length - 2} รายการ
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Details Modal */}
      {selectedDateLeaves && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#1f1a4e] dark:bg-slate-950 px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center border border-[#ffaa00]/30 text-[#ffaa00]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h2 className="text-white text-[17px] font-bold tracking-wide flex items-center gap-2">
                  รายชื่อผู้ลางาน (วันที่ {selectedDateString})
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[13px]">
                    {selectedDateLeaves.length} คน
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setSelectedDateLeaves(null)}
                className="w-7 h-7 bg-[#ff4d4f] hover:bg-[#ff7875] text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#f9fafb] dark:bg-[#0B1120]">
              <div className="space-y-4">
                {selectedDateLeaves.map((leave, idx) => {
                  const empName =
                    leave.employeeName ||
                    (leave.user?.firstName
                      ? `${leave.user.firstName} ${leave.user.lastName || ''}`.trim()
                      : null) ||
                    leave.userId ||
                    'ไม่ระบุชื่อ';
                  const initial = empName.charAt(0);
                  const deptName =
                    leave.departmentName ||
                    (typeof leave.department === 'string'
                      ? leave.department
                      : leave.department?.name) ||
                    leave.user?.department?.name ||
                    leave.employee?.department?.name ||
                    '-';
                  const positionName =
                    leave.positionName ||
                    (typeof leave.position === 'string'
                      ? leave.position
                      : leave.position?.name) ||
                    leave.user?.position?.name ||
                    leave.employee?.position?.name ||
                    '-';
                  const leaveType = leave.type || leave.leaveTypeName || '-';
                  const profilePic =
                    leave.user?.avatarUrl ||
                    leave.user?.profilePic ||
                    leave.employee?.user?.avatarUrl ||
                    leave.avatarUrl ||
                    null;

                  // Format Date Range
                  const startDateStr = new Date(
                    leave.startDate,
                  ).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const endDateStr = new Date(leave.endDate).toLocaleDateString(
                    'th-TH',
                    { day: 'numeric', month: 'short', year: 'numeric' },
                  );
                  const dateDisplay =
                    leave.startDate === leave.endDate
                      ? startDateStr
                      : `${startDateStr} - ${endDateStr}`;

                  // Determine badge colors based on leave type
                  let badgeBg = 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
                  let badgeText = 'text-blue-700 dark:text-blue-300';
                  if (leaveType.includes('ป่วย')) {
                    badgeBg = 'bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800';
                    badgeText = 'text-orange-700 dark:text-orange-300';
                  } else if (leaveType.includes('กิจ')) {
                    badgeBg = 'bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800';
                    badgeText = 'text-cyan-700 dark:text-cyan-300';
                  }

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      {/* Top Row: User Info & Badge */}
                      <div className="flex items-center gap-4">
                        <div className="w-[42px] h-[42px] rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0 overflow-hidden relative group">
                          {profilePic ? (
                            <img
                              src={
                                profilePic.startsWith('http') ||
                                profilePic.startsWith('data:')
                                  ? profilePic
                                  : `/${profilePic.replace(/^\/+/, '')}`
                              }
                              alt={empName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  'hidden',
                                );
                              }}
                            />
                          ) : null}
                          <span
                            className={`text-[18px] font-bold text-indigo-700 dark:text-indigo-300 ${profilePic ? 'hidden' : ''}`}
                          >
                            {initial}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[15px] text-gray-900 dark:text-slate-100 truncate">
                            {empName}
                          </h3>
                          <p className="text-[12px] text-gray-400 dark:text-slate-400 font-medium truncate">
                            {deptName} • {positionName}
                          </p>
                        </div>
                        <div
                          className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap ${badgeBg} ${badgeText}`}
                        >
                          {leaveType}
                        </div>
                      </div>

                      {/* Bottom Row: Additional Details */}
                      <div className="bg-gray-50/80 dark:bg-slate-800/80 rounded-lg p-3 space-y-2 text-[13px] border border-gray-100 dark:border-slate-700/60">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-slate-400 font-bold min-w-[70px]">
                            วันที่ลา:
                          </span>
                          <span className="text-gray-800 dark:text-slate-200 text-right">
                            {dateDisplay}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-slate-400 font-bold min-w-[70px]">
                            รูปแบบ:
                          </span>
                          <span className="text-gray-800 dark:text-slate-200 text-right">
                            {leave.startDate === leave.endDate
                              ? leave.startFormat === 'morning'
                                ? 'ครึ่งวันเช้า'
                                : leave.startFormat === 'afternoon'
                                  ? 'ครึ่งวันบ่าย'
                                  : 'เต็มวัน'
                              : 'หลายวัน'}
                            <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">
                              ({leave.totalDays || leave.durationDays || 0} วัน)
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-slate-400 font-bold min-w-[70px]">
                            เหตุผล:
                          </span>
                          <span className="text-gray-800 dark:text-slate-200 text-right line-clamp-2">
                            {leave.reason || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
