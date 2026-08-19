'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SkeletonTable } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import {
  CheckCircle2,
  Hourglass,
  ListOrdered,
  Clock4,
  CalendarDays,
  X,
  User,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getLeaveStatusText, resolveAssetUrl } from '@/lib/api/utils';
import { ActionButton } from '@/components/ui/action-button';

const getToken = () =>
  typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';

async function fetchPendingExecutive(): Promise<any[]> {
  const res = await fetch('/api/ceo/pending', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch pending executive requests');
  const json = await res.json();
  return json.data ?? json;
}

async function ceoApprove(id: string) {
  const res = await fetch(`/api/ceo/approve/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ comment: '' }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Approve failed');
  }
  return res.json();
}

async function ceoReject(id: string, comment: string) {
  const res = await fetch(`/api/ceo/reject/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Reject failed');
  }
  return res.json();
}

// ──────────────── helpers ────────────────

function formatDateRange(leave: any) {
  try {
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];

    let baseStr = '';
    if (leave.startDate.split('T')[0] === leave.endDate.split('T')[0]) {
      baseStr = `${startDay} ${startMonth}`;
    } else if (start.getMonth() === end.getMonth()) {
      baseStr = `${startDay}-${endDay} ${startMonth}`;
    } else {
      baseStr = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }

    if (leave.startFormat === 'hourly') {
      const startT = start.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endT = end.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const rawHours =
        leave.leaveHours ?? Number(((leave.totalDays ?? 0) * 8).toFixed(2));
      const h = Math.floor(rawHours);
      const m = Math.round((rawHours - h) * 60);
      const fmtHours =
        m === 0 ? `${h}` : `${h}.${m.toString().padStart(2, '0')}`;
      return `${baseStr} (${startT}-${endT} น.) (${fmtHours} ชม.)`;
    }
    return `${baseStr} (${leave.totalDays ?? 1} วัน)`;
  } catch {
    return leave.startDate;
  }
}

function mapLeave(r: any) {
  const emp = r.employee ?? {};
  return {
    ...r,
    employeeName:
      `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || 'ไม่ระบุ',
    empCode:
      emp.employeeCode ||
      (emp.id
        ? `EMP-${String(emp.id).substring(0, 5).toUpperCase()}`
        : 'EMP-000'),
    departmentName: emp.department?.name || '-',
    positionName: emp.position?.name || '-',
    leaveTypeName: r.leaveType?.name || '-',
    dateRangeStr: formatDateRange(r),
    approverReason: r.approvals?.[0]?.comment || null,
  };
}

// ──────────────── component ────────────────

export default function CEOApproval() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'thisMonth'>(
    'thisMonth',
  );
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingExecutive();
      setLeaves(data.map(mapLeave));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const displayedLeaves = React.useMemo(() => {
    if (filterMode === 'all') return leaves;
    const now = new Date();
    return leaves.filter((l) => {
      const d = new Date(l.createdAt || l.startDate);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
  }, [leaves, filterMode]);

  const latestApprovedText = React.useMemo(() => 'ยังไม่มีการอนุมัติ', []);

  const leaveTypesMap = React.useMemo(
    () =>
      leaves.reduce(
        (acc, l) => {
          const t = l.leaveTypeName.split(' ')[0];
          if (t) acc[t] = (acc[t] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [leaves],
  );
  const leaveTypesString =
    Object.entries(leaveTypesMap)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ') || 'ไม่มี';

  // ── approve ──
  const handleApprove = async (leave: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      text: `อนุมัติคำขอลา ${leave.leaveTypeName} ของ ${leave.employeeName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00C853',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;
    try {
      await ceoApprove(leave.id);
      setSelectedLeave(null);
      refetch();
      Swal.fire({
        icon: 'success',
        title: 'อนุมัติสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  };

  // ── reject ──
  const handleReject = async (leave: any) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'ยืนยันการปฏิเสธ',
      html: `<p class="text-sm text-gray-600 mb-3">ปฏิเสธคำขอ <strong>${leave.leaveTypeName}</strong> ของ <strong>${leave.employeeName}</strong></p>`,
      input: 'textarea',
      inputPlaceholder: 'ระบุเหตุผลที่ปฏิเสธ (บังคับ)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ปฏิเสธคำขอ',
      cancelButtonText: 'ยกเลิก',
      preConfirm: (text) => {
        if (!text?.trim()) {
          Swal.showValidationMessage('กรุณาระบุเหตุผลในการปฏิเสธ');
        }
        return text;
      },
    });
    if (!isConfirmed || !reason?.trim()) return;
    try {
      await ceoReject(leave.id, reason.trim());
      setSelectedLeave(null);
      refetch();
      Swal.fire({
        icon: 'success',
        title: 'ปฏิเสธสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            รายการคำขออนุมัติการลา (CEO)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            อนุมัติหรือปฏิเสธคำขอลาที่ต้องผ่านการพิจารณาจากผู้บริหาร
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Hourglass className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              รอการตรวจสอบ
            </h3>
          </div>
          <div className="text-sm font-medium text-slate-500 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white mr-2">
              {displayedLeaves.length}
            </span>{' '}
            รายการ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <ListOrdered className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              ประเภทการลา
            </h3>
          </div>
          <div className="text-sm font-medium text-slate-500 mt-2 truncate">
            {leaveTypesString}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <Clock4 className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              อนุมัติล่าสุด
            </h3>
          </div>
          <div className="text-sm font-medium text-slate-500 mt-2">
            {latestApprovedText}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            คำขอลาที่ค้างอยู่ (PENDING_EXECUTIVE)
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

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable cols={6} rows={3} />
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">รหัสการลา</th>
                  <th className="px-6 py-4">ชื่อ</th>
                  <th className="px-6 py-4">นามสกุล</th>
                  <th className="px-6 py-4">แผนก</th>
                  <th className="px-6 py-4">ประเภทการลา</th>
                  <th className="px-6 py-4">วันที่ลา</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {displayedLeaves.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      ไม่มีคำขอลาที่ค้างอยู่
                    </td>
                  </tr>
                ) : (
                  displayedLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-500">
                          {leave.requestCode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {leave.employee?.firstName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {leave.employee?.lastName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {leave.departmentName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {leave.leaveTypeName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {leave.dateRangeStr}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          รอดำเนินการ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <ActionButton action="approve" size="sm" icon={CheckCircle2} onClick={() => handleApprove(leave)}>อนุมัติ</ActionButton>
                          <ActionButton action="reject" size="sm" icon={X} onClick={() => handleReject(leave)}>ปฏิเสธ</ActionButton>
                          <ActionButton action="view" size="sm" onClick={() => setSelectedLeave(leave)}>รายละเอียด</ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLeave &&
        (() => {
          const leave = selectedLeave;
          const approvals = leave.approvals ?? [];
          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[24px] w-full max-w-[680px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h2 className="text-[20px] font-bold text-black">
                    รายละเอียดคำขอลา
                  </h2>
                  <button
                    onClick={() => setSelectedLeave(null)}
                    className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-4 pt-4">
                  {/* Employee */}
                  <div className="border border-gray-200 rounded-xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0 overflow-hidden">
                      {leave.employee?.user?.avatarUrl ? (
                        <img
                          src={resolveAssetUrl(leave.employee.user.avatarUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" strokeWidth={2} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[15px] text-black mb-3">
                        ข้อมูลพนักงาน
                      </h3>
                      <div className="text-[14px] text-gray-700 space-y-1.5">
                        <p>
                          <span className="font-bold min-w-[90px] inline-block">
                            ชื่อ-นามสกุล:
                          </span>
                          {leave.employeeName}
                        </p>
                        <p>
                          <span className="font-bold min-w-[90px] inline-block">
                            รหัสพนักงาน:
                          </span>
                          {leave.empCode}
                        </p>
                        <p>
                          <span className="font-bold min-w-[90px] inline-block">
                            แผนก | ตำแหน่ง:
                          </span>
                          {leave.departmentName} | {leave.positionName}
                        </p>
                        <p>
                          <span className="font-bold min-w-[90px] inline-block">
                            บทบาท:
                          </span>
                          {leave.employee?.user?.role?.name || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leave Info */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                        <CalendarIcon
                          className="w-[18px] h-[18px]"
                          strokeWidth={2.5}
                        />
                      </div>
                      <h3 className="font-bold text-[15px] text-black">
                        รายละเอียดการลา
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px] text-gray-700 pl-[44px]">
                      <div className="space-y-2">
                        <p>
                          <span className="font-bold">รหัสการลา:</span>{' '}
                          <span className="text-blue-500 font-semibold">
                            {leave.requestCode || '-'}
                          </span>
                        </p>
                        <p>
                          <span className="font-bold">ประเภทการลา:</span>{' '}
                          {leave.leaveTypeName}
                        </p>
                        <p>
                          <span className="font-bold">ช่วงเวลา:</span>{' '}
                          {leave.dateRangeStr}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="font-bold">รูปแบบ:</span>
                          {leave.startFormat === 'hourly'
                            ? `รายชั่วโมง`
                            : leave.startFormat === 'morning'
                              ? 'ครึ่งวันเช้า'
                              : leave.startFormat === 'afternoon'
                                ? 'ครึ่งวันบ่าย'
                                : 'เต็มวัน'}
                        </p>
                        {leave.leaveType?.isSpecial && (
                          <p className="flex items-center gap-2 text-purple-600">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-bold">คำขอประเภทพิเศษ</span>
                          </p>
                        )}
                        {leave.attachments?.length > 0 && (
                          <p>
                            <span className="font-bold">เอกสารแนบ:</span>{' '}
                            <span className="text-emerald-600 font-bold">
                              มีเอกสาร {leave.attachments.length} ไฟล์
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h3 className="font-bold text-black text-[14px] mb-2">
                      เหตุผลการลา
                    </h3>
                    <textarea
                      readOnly
                      value={leave.reason || '-'}
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default resize-none"
                    />
                  </div>

                  {/* Approval Timeline */}
                  {approvals.length > 0 && (
                    <div>
                      <h3 className="font-bold text-black text-[14px] mb-3">
                        ขั้นตอนการอนุมัติที่ผ่านมา
                      </h3>
                      <div className="space-y-3">
                        {approvals.map((ap: any, i: number) => (
                          <div
                            key={ap.id || i}
                            className="flex items-start gap-3"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 shrink-0 ${ap.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'}`}
                            />
                            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-[13px]">
                              <p className="font-bold text-gray-700">
                                {getLeaveStatusText(ap.status)}
                              </p>
                              {ap.comment && (
                                <p className="text-gray-500 mt-1">
                                  เหตุผล: {ap.comment}
                                </p>
                              )}
                              <p className="text-gray-400 text-[12px] mt-1">
                                {new Date(ap.createdAt).toLocaleString('th-TH')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
                  <span className="text-gray-400 text-[13px]">
                    ยื่นเมื่อ:{' '}
                    {leave.createdAt
                      ? new Date(leave.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                  <div className="flex items-center gap-3">
                    <ActionButton action="approve" icon={CheckCircle2} onClick={() => handleApprove(leave)}>อนุมัติ</ActionButton>
                    <ActionButton action="reject" icon={X} onClick={() => handleReject(leave)}>ปฏิเสธ</ActionButton>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
