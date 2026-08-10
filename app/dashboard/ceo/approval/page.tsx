'use client';

import React, { useMemo } from 'react';
import { useLeave } from '@/hooks/useLeave';
import { useEmployee } from '@/hooks/useEmployee';
import { useAuth } from '@/context/AuthContext';
import { SkeletonTable } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import { Calendar as CalendarIcon, X, User, Download, Check, Clock, Eye, Hourglass, ListOrdered, Clock4, CalendarDays, CheckCircle2 } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Leave } from '@/lib/types';
import { leaveApi, employeeApi, ceoApi } from '@/api';

export default function CEOApproval() {
  const { user } = useAuth();
  
  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<'all' | 'thisMonth'>('thisMonth');
  const [selectedRequest, setSelectedRequest] = React.useState<{ leave: Leave; employee: any } | null>(null);

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
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const refetchLeaves = async () => {
    try {
      const res = await leaveApi.getAllLeaves('HR');
      if (res.success || res.data || res) {
        const data = (res as any).data ?? res;
        setLeaves((data as any).data ?? data);
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  // Filter leaves: CEO sees leaves from managers OR leaves explicitly directed to CEO
  const managerLeaves = useMemo(() => {
    return leaves.filter(l => {
      if ((l as any).approver === 'CEO') return true;
      const employee = employees.find(e => e.id === l.employeeId || e.username === l.userId || (e.firstName + ' ' + e.lastName) === l.userId);
      const role = employee?.user?.role?.name?.toLowerCase() || employee?.role?.toLowerCase();
      return role === 'manager' || role === 'hr';
    });
  }, [leaves, employees]);

  // Summaries
  const pendingCEOLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (l.status === 'Waiting CEO') return true;
      if (l.status === 'Pending') {
        const employee = employees.find(e => e.id === l.employeeId || e.username === l.userId || (e.firstName + ' ' + e.lastName) === l.userId);
        const role = employee?.user?.role?.name?.toLowerCase() || employee?.role?.toLowerCase();
        return role === 'manager' || role === 'hr';
      }
      return false;
    });
  }, [leaves, employees]);
  
  const displayedLeaves = useMemo(() => {
    let filtered = pendingCEOLeaves;
    if (filterMode === 'thisMonth') {
      const now = new Date();
      filtered = filtered.filter(l => {
        const d = new Date(l.createdAt || l.startDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    return filtered;
  }, [pendingCEOLeaves, filterMode]);

  const pendingCount = displayedLeaves.length;
  
  const leaveTypesMap = pendingCEOLeaves.reduce((acc, leave) => {
    const typeName = (leave.leaveTypeName || leave.type || '').split(' ')[0]; // get short name like ลาพักร้อน
    if (typeName) {
      acc[typeName] = (acc[typeName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const leaveTypesString = Object.entries(leaveTypesMap)
    .map(([key, val]) => `${key}(${val})`)
    .join(', ') || 'ไม่มี';

  const latestApprovedText = useMemo(() => {
    const approvedLeaves = leaves.filter(l => (l.status || '').toLowerCase() === 'approved');
    if (approvedLeaves.length === 0) return 'ยังไม่มีการอนุมัติ';
    
    const latest = [...approvedLeaves].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })[0];
    
    const date = new Date(latest.updatedAt || latest.createdAt || new Date());
    if (isNaN(date.getTime())) return 'ไม่ทราบเวลา';
    
    return formatDistanceToNow(date, { addSuffix: true, locale: th });
  }, [leaves]);

  const formatDateRange = (leave: any) => {
    try {
      const startDateStr = leave.startDate;
      const endDateStr = leave.endDate;
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
        baseStr = `${startDay}-${endDay} ${startMonth}.`;
      } else {
        baseStr = `${startDay} ${startMonth}. - ${endDay} ${endMonth}.`;
      }

      if (leave.startFormat === 'hourly' || leave.leaveMode === 'hourly') {
         let startT = leave.startTime;
         if (!startT && leave.startDate) {
           startT = new Date(leave.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
         }
         let endT = leave.endTime;
         if (!endT && leave.endDate) {
           endT = new Date(leave.endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
         }
         
         const rawHours = leave.leaveHours ? leave.leaveHours : Number(((leave.totalDays ?? 0) * 8).toFixed(2));
         const h = Math.floor(rawHours);
         const m = Math.round((rawHours - h) * 60);
         const formattedHours = m === 0 ? `${h}` : `${h}.${m.toString().padStart(2, '0')}`;
         
         return `${baseStr} (${startT} - ${endT} น.) (${formattedHours} ชม.)`;
      }
      return `${baseStr} (${leave.totalDays || leave.durationDays || 1} วัน)`;
    } catch {
      return leave.startDate;
    }
  };

  const getDurationText = (leave: any) => {
    if (leave.startFormat === 'hourly' || leave.leaveMode === 'hourly') {
      const rawHours = leave.leaveHours ? leave.leaveHours : Number(((leave.totalDays || leave.durationDays || 0) * 8).toFixed(2));
      const h = Math.floor(rawHours);
      const m = Math.round((rawHours - h) * 60);
      const formattedHours = m === 0 ? `${h}` : `${h}.${m.toString().padStart(2, '0')}`;
      return `${formattedHours} ชม.`;
    }
    return `${leave.totalDays || leave.durationDays || 0} วัน`;
  };

  const handleApprove = (leave: Leave) => {
    const durationText = getDurationText(leave);
    Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      text: `ต้องการอนุมัติการลาของ ${leave.employeeName || leave.userId || 'ไม่ระบุชื่อ'} (${durationText}) หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00C853',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await ceoApi.approveLeave(leave.id);
          if (res.success === false) throw new Error('Approve failed');
          await refetchLeaves();
          Swal.fire({ icon: 'success', title: 'อนุมัติการลาสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดำเนินการอนุมัติได้' });
        }
      }
    });
  };

  const handleReject = (leave: Leave) => {
    Swal.fire({
      title: 'ยืนยันการปฏิเสธ',
      text: `ระบุเหตุผลที่ปฏิเสธการลาของ ${leave.employeeName || leave.userId || 'ไม่ระบุชื่อ'}`,
      input: 'textarea',
      inputPlaceholder: 'กรอกเหตุผลที่นี่...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ปฏิเสธคำขอ',
      cancelButtonText: 'ยกเลิก',
      preConfirm: (text) => {
        if (!text) {
          Swal.showValidationMessage('กรุณาระบุเหตุผลในการปฏิเสธ');
        }
        return text;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await ceoApi.rejectLeave(leave.id, result.value || 'Rejected by CEO');
          if (res.success === false) throw new Error('Reject failed');
          await refetchLeaves();
          Swal.fire({ icon: 'success', title: 'ปฏิเสธการลาสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดำเนินการปฏิเสธได้' });
        }
      }
    });
  };

  const handleViewDetails = (leave: Leave, employee: any) => {
    setSelectedRequest({ leave, employee });
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            รายการคำขออนุมัติการลา
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            อนุมัติหรือปฏิเสธคำขอลาของผู้จัดการและ HR
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Hourglass className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">รอการตรวจสอบ</h3>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white mr-2">{pendingCount}</span> รายการ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ListOrdered className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">ประเภทการลา</h3>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 truncate">
            {leaveTypesString}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock4 className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">อนุมัติล่าสุด</h3>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            {latestApprovedText}
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Table Header Section */}
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            คำขอลาที่ค้างอยู่
          </h2>
          
          <div className="relative">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border-none px-4 py-2.5 pr-10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="thisMonth">เดือนนี้</option>
              <option value="all">ทั้งหมด</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable cols={6} rows={3} />
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">พนักงาน</th>
                  <th className="px-6 py-4">แผนก</th>
                  <th className="px-6 py-4">ประเภทการลา</th>
                  <th className="px-6 py-4">วันที่</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {displayedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      ไม่มีคำขอลาที่ค้างอยู่
                    </td>
                  </tr>
                ) : (
                  [...displayedLeaves].reverse().map((leave) => {
                    const employee = employees.find(e => e.username === leave.userId || (e.firstName + ' ' + e.lastName) === leave.userId);
                    const dept = employee?.departmentName || leave.departmentName || leave.department || '';
                    const shortDept = dept ? dept.substring(0, 3).toUpperCase() : '-';
                    const empName = leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';
                    const leaveType = leave.leaveTypeName || leave.type || '-';
                    
                    return (
                      <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{empName}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dept}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{leaveType.split(' ')[0]}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDateRange(leave)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            รอดำเนินการ
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleApprove(leave)}
                              className="bg-[#00C853] hover:bg-[#00B04A] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                            >
                              อนุมัติ
                            </button>
                            <button 
                              onClick={() => handleReject(leave)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all"
                            >
                              ปฏิเสธ
                            </button>
                            <button 
                              onClick={() => handleViewDetails(leave, employee)}
                              className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              รายละเอียด
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Leave Details Modal */}
      {selectedRequest && (() => {
        const leave = selectedRequest.leave;
        const employee = selectedRequest.employee;
        const empName = employee ? `${employee.firstName} ${employee.lastName}` : leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';
        const dept = employee?.departmentName || leave.departmentName || leave.department || '-';
        const dates = formatDateRange(leave);
        const duration = leave.totalDays || leave.durationDays || 0;
        const reason = leave.reason || '-';
        const statusLower = (leave.status || '').toLowerCase();
        
        let statusText = 'รออนุมัติ';
        let statusBadgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        let reasonColor = 'border-slate-200 text-slate-500 bg-slate-50';
        if (statusLower === 'approved' || statusLower.includes('approved')) {
          statusText = 'อนุมัติ';
          statusBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
          reasonColor = 'border-emerald-200 text-emerald-700 bg-emerald-50';
        } else if (statusLower === 'rejected' || statusLower.includes('rejected')) {
          statusText = 'ปฏิเสธ';
          statusBadgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
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
                  <div className="w-[38px] h-[38px] rounded-full bg-fuchsia-100/50 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {employee?.user?.avatarUrl ? (
                      <img src={`http://localhost:8000${employee.user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[15px] text-black mb-3">ข้อมูลพนักงาน (Employee Info)</h3>
                    <div className="text-[14px] text-gray-800 space-y-2">
                      <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">ชื่อ:</span> {empName}</p>
                      <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">แผนก|ตำแหน่ง:</span> {dept} | {employee?.position?.name || employee?.positionName || (leave as any)?.employee?.position?.name || '-'}</p>
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
                      <p className="flex gap-2"><span className="font-bold min-w-[80px]">ประเภทการลา:</span> {leave.type || leave.leaveTypeName || '-'}</p>
                      <p className="flex gap-2"><span className="font-bold min-w-[80px]">ช่วงเวลา:</span> {dates}</p>
                    </div>
                    <div className="space-y-3">
                      <p className="flex items-center gap-2">
                        <span className="w-[26px] h-[26px] bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </span>
                        <span className="font-bold min-w-[80px]">รูปแบบการลา:</span> {leave.startFormat === 'hourly' ? `รายชั่วโมง (${leave.leaveHours || 1} ชม.)` : leave.startFormat === 'morning' ? 'ครึ่งวันเช้า' : leave.startFormat === 'afternoon' ? 'ครึ่งวันบ่าย' : 'เต็มวัน'}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-[26px] h-[26px] bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        </span>
                        <span className="font-bold min-w-[80px]">เอกสารแนบ:</span>
                        {leave.attachmentUrl || (leave as any).attachments?.length > 0 || (leave as any).attachment ? (
                          <button 
                            onClick={() => {
                              const rawPath = leave.attachmentUrl || (leave as any).attachments?.[0]?.filePath || (leave as any).attachment;
                              if (rawPath) {
                                if (rawPath.startsWith("data:")) {
                                  (window as any).handleViewCEOAttachment?.(rawPath);
                                } else {
                                  const filePath = rawPath.replace(/\\/g, '/');
                                  const url = filePath.startsWith('/') ? filePath : `/${filePath}`;
                                  window.open(url, '_blank');
                                }
                              }
                            }}
                            className="text-blue-600 font-bold hover:underline"
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
                    <div className="w-[120px] flex flex-col justify-center border-r border-gray-200 pr-4 shrink-0">
                      <span className="font-bold text-[14px] text-black mb-2">สถานะ:</span>
                      <span className={`inline-flex justify-center items-center px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm ${statusLower === 'approved' || statusLower.includes('approved') ? 'bg-[#00D06C] text-white' : statusLower === 'rejected' || statusLower.includes('rejected') ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="font-bold text-[14px] text-black mb-2">เหตุผลของผู้อนุมัติ (CEO)</span>
                      <input
                        type="text"
                        readOnly
                        value={approverReason}
                        className={`w-full border rounded-xl p-3 text-[14px] outline-none cursor-default bg-[#F0FDF4] border-green-200 text-green-700`}
                      />
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Footer text */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center bg-white rounded-b-[24px]">
                <span className="text-gray-400 text-[13px]">
                  วันที่ยื่นคำขอ : {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : '-'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}