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
  Check,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api/utils';
import type { Leave } from '@/lib/api/types';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';
import { escapeHtml } from '@/lib/escapeHtml';

const getToken = () =>
  typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : '';

async function fetchPendingExecutive(): Promise<Leave[]> {
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

function formatDateRange(leave: Leave) {
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

function mapLeave(r: Leave) {
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
    leaveTypeName: (typeof r.leaveType === 'object' ? r.leaveType?.name : r.leaveType) || '-',
    dateRangeStr: formatDateRange(r),
    approverReason: r.approvals?.[0]?.comment || undefined,
  };
}

// ──────────────── component ────────────────

export default function CEOApproval() {
  useAuth();
  const [leaves, setLeaves] = useState<ReturnType<typeof mapLeave>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'thisMonth'>(
    'thisMonth',
  );
  const [selectedLeave, setSelectedLeave] = useState<ReturnType<typeof mapLeave> | null>(null);

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
          const t = (l.leaveTypeName || '').split(' ')[0];
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
  const handleApprove = async (leave: ReturnType<typeof mapLeave>) => {
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
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: getErrorMessage(err) });
    }
  };

  // ── reject ──
  const handleReject = async (leave: ReturnType<typeof mapLeave>) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'ยืนยันไม่อนุมัติ',
      html: `<p class="text-sm text-gray-600 mb-3">ไม่อนุมัติคำขอ <strong>${escapeHtml(leave.leaveTypeName)}</strong> ของ <strong>${escapeHtml(leave.employeeName)}</strong></p>`,
      input: 'textarea',
      inputPlaceholder: 'ระบุเหตุผลที่ไม่อนุมัติ (บังคับ)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ไม่อนุมัติคำขอ',
      cancelButtonText: 'ยกเลิก',
      preConfirm: (text) => {
        if (!text?.trim()) {
          Swal.showValidationMessage('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
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
        title: 'ไม่อนุมัติคำขอสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            รายการคำขออนุมัติการลา (CEO)
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            อนุมัติหรือไม่อนุมัติคำขอลาที่ต้องผ่านการพิจารณาจากผู้บริหาร
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="space-y-6 max-w-[1200px] mx-auto pb-4">

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
            คำขอลาที่รอผู้บริหารอนุมัติ
          </h2>
          <div className="relative">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'thisMonth')}
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
                          <button
                            onClick={() => handleApprove(leave)}
                            className="bg-[#00C853] hover:bg-[#00B04A] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleReject(leave)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all"
                          >
                            ไม่อนุมัติ
                          </button>
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-xs font-semibold transition-colors bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl"
                          >
                            รายละเอียด
                          </button>
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
      {selectedLeave && (
        <LeaveDetailModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          fallbackName={selectedLeave.employeeName}
          fallbackDepartment={selectedLeave.departmentName}
          fallbackPosition={selectedLeave.positionName}
          footer={
            <>
              <button
                onClick={() => handleApprove(selectedLeave)}
                className="bg-[#00C853] hover:bg-[#00B04A] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                อนุมัติ
              </button>
              <button
                onClick={() => handleReject(selectedLeave)}
                className="bg-[#FF0000] hover:bg-[#E50000] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={3} />
                ไม่อนุมัติ
              </button>
            </>
          }
        />
      )}
        </div>
      </div>
    </div>
  );
}
