"use client";

import { useState, useEffect } from "react";
import { useLeave } from "@/hooks/useLeave";
import { Mail, Bell, Settings, ChevronLeft, ChevronRight, X, User } from "lucide-react";



const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to July 2026
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<any[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: string, events: any[] } | null>(null);
  const [viewMode, setViewMode] = useState<'company' | 'department'>('company');
  const [department, setDepartment] = useState("");

  const { useLeavesQuery, useHolidaysQuery } = useLeave();
  const { data: leavesData = [], isLoading: isLeavesLoading } = useLeavesQuery(true);
  const { data: holidaysData = [], isLoading: isHolidaysLoading } = useHolidaysQuery();

  useEffect(() => {
    const currentUserId = sessionStorage.getItem("userId");
    setDepartment(sessionStorage.getItem("department") || "");

    const apiLeaves = leavesData
      .filter((leave: any) => {
        return leave.status.includes('Approved');
      })
      .map((leave: any) => ({
        startDate: leave.startDate.split('T')[0],
        endDate: leave.endDate.split('T')[0],
        type: leave.leaveType?.name || leave.type,
        status: leave.status,
        name: leave.user?.firstName ? `${leave.user.title || ''}${leave.user.firstName} ${leave.user.lastName || ''}`.trim() : (leave.employee?.firstName ? `${leave.employee.title || ''}${leave.employee.firstName} ${leave.employee.lastName || ''}`.trim() : (leave.userId || 'User')),
        departmentName: leave.user?.department?.name || leave.employee?.department?.name || leave.departmentName,
        isMine: String(leave.employeeId) === String(currentUserId) || String(leave.userId) === String(currentUserId),
        position: leave.user?.position?.name || leave.employee?.position?.name || leave.employee?.positionName || 'พนักงาน',
        avatarUrl: leave.user?.avatarUrl || leave.employee?.user?.avatarUrl || null,
        startFormat: leave.startFormat,
        startTime: leave.startTime,
        endTime: leave.endTime,
        leaveHours: leave.leaveHours
      }));
    setAllLeaves(apiLeaves);

    setPublicHolidays(holidaysData.map((h: any) => ({
      date: h.date.split('T')[0],
      title: h.name,
      type: 'holiday'
    })));
  }, [leavesData, holidaysData]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Build calendar cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const events: any[] = [];

    // Check holidays
    const holiday = publicHolidays.find(h => h.date === dateStr);
    if (holiday) events.push(holiday);

    const currentDayOfWeek = new Date(dateStr).getDay();
    const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;

    if (isWeekend || holiday) {
      return events;
    }

    const filteredLeaves = allLeaves.filter(leave => viewMode === 'company' || leave.departmentName === department);

    filteredLeaves.forEach(leave => {
      const startD = new Date(leave.startDate);
      const endD = new Date(leave.endDate);
      const startStr = `${startD.getFullYear()}-${(startD.getMonth() + 1).toString().padStart(2, '0')}-${startD.getDate().toString().padStart(2, '0')}`;
      const endStr = `${endD.getFullYear()}-${(endD.getMonth() + 1).toString().padStart(2, '0')}-${endD.getDate().toString().padStart(2, '0')}`;

      const start = new Date(startStr);
      const end = new Date(endStr);
      const current = new Date(dateStr);
      if (current >= start && current <= end) {
        // Only show text if it's the start date
        events.push({
          title: `${leave.name} - ${leave.type}`,
          type: 'leave',
          isStart: startStr === dateStr,
          isMine: leave.isMine,
          raw: leave
        });
      }
    });

    return events;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] font-sans text-slate-800 flex flex-col relative pb-8">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">ปฏิทินวันลา (Leave Calendar)</h1>
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
            <div className="flex flex-wrap items-center gap-6 text-[13px] font-bold text-gray-700 mb-4 md:mb-0">
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
                    onChange={(e) => setCurrentDate(new Date(currentYear, Number(e.target.value), 1))}
                    className="appearance-none bg-transparent hover:bg-blue-50/50 pl-4 pr-10 py-2 rounded-xl font-extrabold text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
                  >
                    {thaiMonths.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                
                <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                <div className="relative">
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentMonth, 1))}
                    className="appearance-none bg-transparent hover:bg-blue-50/50 pl-4 pr-10 py-2 rounded-xl font-extrabold text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
                  >
                    {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(y => (
                      <option key={y} value={y}>{y + 543}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="grid grid-cols-7 w-full border-collapse">

              {/* Days Header */}
              {daysOfWeek.map((d) => (
                <div key={d} className="bg-white text-gray-500 font-bold text-center py-4 border-b border-r border-gray-200 text-[13px] tracking-wide last:border-r-0">
                  {d}
                </div>
              ))}

              {/* Empty Cells */}
              {blanks.map((b) => (
                <div key={`blank-${b}`} className="min-h-[140px] bg-white border-b border-r border-gray-200 p-2 last:border-r-0"></div>
              ))}

              {/* Day Cells */}
              {days.map((d) => {
                const events = getEventsForDate(d);
                const today = new Date();
                const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && d === today.getDate();
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

                return (
                  <div
                    key={d}
                    onClick={() => {
                      if (events.length > 0) {
                        setSelectedDateEvents({ date: dateStr, events });
                      }
                    }}
                    className={`min-h-[140px] border-b border-r border-gray-200 p-2 bg-white flex flex-col gap-1.5 transition-colors last:border-r-0 ${events.length > 0 ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-end mb-1 px-1 pt-1">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-bold ${isToday ? 'bg-[#1877F2] text-white shadow-md shadow-blue-500/30' : 'text-gray-700'}`}>
                        {d}
                      </div>
                    </div>

                    {/* Event Pills */}
                    <div className="flex flex-col gap-1.5 px-1">
                      {events.slice(0, 2).map((evt, idx) => {
                        if (evt.type === 'holiday') {
                          return (
                            <div key={idx} className="bg-[#FFF0F0] text-[#FF0000] font-bold text-[11px] px-2.5 py-1.5 rounded-md truncate">
                              {evt.title}
                            </div>
                          );
                        }
                        if (evt.type === 'leave') {
                          if (evt.isMine) {
                            return (
                              <div key={idx} className="bg-[#E6F7F8] text-[#12B8B8] font-bold text-[11px] px-2.5 py-1.5 rounded-md truncate border border-[#B2DFDB]">
                                {evt.title.includes(' - ') ? (
                                  <>
                                    <span className="font-medium">{evt.title.split(' - ')[0]}</span>
                                    <span> - </span>
                                    <span className="font-extrabold">{evt.title.split(' - ').slice(1).join(' - ')}</span>
                                  </>
                                ) : evt.title}
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="bg-[#F0F5FF] text-[#3B82F6] font-bold text-[11px] px-2.5 py-1.5 rounded-md truncate">
                              {evt.title.includes(' - ') ? (
                                <>
                                  <span className="font-medium">{evt.title.split(' - ')[0]}</span>
                                  <span> - </span>
                                  <span className="font-extrabold">{evt.title.split(' - ').slice(1).join(' - ')}</span>
                                </>
                              ) : evt.title}
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

              {/* Fill remaining empty cells to complete the grid visually */}
              {Array.from({ length: (7 - ((blanks.length + days.length) % 7)) % 7 }).map((_, i) => (
                <div key={`end-blank-${i}`} className="min-h-[140px] bg-white border-b border-r border-gray-200 p-2 last:border-r-0"></div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Event Details Modal */}
      {selectedDateEvents && (() => {
        const leaveEvents = selectedDateEvents.events.filter(e => e.type === 'leave');
        const holidayEvents = selectedDateEvents.events.filter(e => e.type === 'holiday');

        const getInitials = (name: string) => {
          if (!name) return 'U';
          const parts = name.replace(/^(นาย|นาง|นางสาว|Mr\.|Ms\.|Mrs\.)/g, '').trim().split(' ');
          if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
          return name.substring(0, 2).toUpperCase();
        };

        const getBadgeStyle = (type: string) => {
          if (type.includes('ลากิจ')) return 'bg-yellow-100 text-yellow-700';
          if (type.includes('ลาป่วย')) return 'bg-blue-100 text-blue-700';
          if (type.includes('พักร้อน') || type.includes('พักผ่อน')) return 'bg-green-100 text-green-700';
          if (type.includes('WFH') || type.includes('Work From Home')) return 'bg-purple-100 text-purple-700';
          if (type.includes('อบรม')) return 'bg-orange-100 text-orange-700';
          return 'bg-slate-100 text-slate-700';
        };

        const getTimeDisplay = (leave: any) => {
          if (leave.startFormat === 'hourly' && leave.startTime && leave.endTime) {
            return `${leave.startTime} - ${leave.endTime}`;
          }
          if (leave.startFormat === 'morning') return 'ครึ่งวันเช้า (09:00 - 12:00)';
          if (leave.startFormat === 'afternoon') return 'ครึ่งวันบ่าย (13:00 - 17:00)';
          return 'เต็มวัน';
        };

        const formattedDate = new Date(selectedDateEvents.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        const dayOfWeek = new Date(selectedDateEvents.date).toLocaleDateString('th-TH', { weekday: 'long' });

        return (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelectedDateEvents(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    วัน{dayOfWeek}ที่ {formattedDate}
                  </h3>
                  {leaveEvents.length > 0 && (
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                      คนในแผนกลา {leaveEvents.length} คน
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedDateEvents(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 overflow-y-auto max-h-[600px] flex flex-col gap-3 bg-white">

                {/* Holiday section */}
                {holidayEvents.map((evt: any, idx: number) => (
                  <div key={`holiday-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                      🎉
                    </div>
                    <div>
                      <p className="font-bold text-red-700 text-sm">{evt.title}</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5">วันหยุดนักขัตฤกษ์</p>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {leaveEvents.length === 0 && holidayEvents.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="font-bold text-slate-700">ไม่มีพนักงานลางานในวันนี้</p>
                    <p className="text-sm text-slate-500 mt-1">ทุกคนพร้อมปฏิบัติงาน</p>
                  </div>
                )}

                {/* Leave List */}
                {leaveEvents.map((evt: any, idx: number) => {
                  const leave = evt.raw;
                  return (
                    <div key={`leave-${idx}`} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white group">

                      {/* Avatar */}
                      <div className="w-[42px] h-[42px] rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                        <span className="absolute inset-0 flex items-center justify-center">{getInitials(leave.name)}</span>
                        {leave.avatarUrl && (
                          <img
                            src={leave.avatarUrl.startsWith('http') ? leave.avatarUrl : `http://localhost:8000${leave.avatarUrl}`}
                            alt={leave.name}
                            className="absolute inset-0 w-full h-full object-cover z-10 bg-indigo-50"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-bold text-slate-800 text-[14px] truncate">{leave.name}</p>
                          <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">
                            {getTimeDisplay(leave)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-slate-500 truncate max-w-[120px] md:max-w-[150px]">{leave.position}</p>
                          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${getBadgeStyle(leave.type)}`}>
                            {leave.type}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

