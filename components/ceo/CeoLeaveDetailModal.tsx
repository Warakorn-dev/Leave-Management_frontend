'use client';

import { X, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { formatLeaveDateRange, formatLeaveDuration } from '@/lib/leaveDuration';
import type { Leave, Employee } from '@/lib/api/types';

interface CeoLeaveDetailModalProps {
  leave: Leave;
  employee?: Employee;
  holidaysData: { date?: string }[];
  onClose: () => void;
  onViewAttachment: (urlOrBase64: string) => void;
}

/** CEO report's inline "รายละเอียดคำขอลา" popup (not the shared LeaveDetailModal — this report renders its own). */
export function CeoLeaveDetailModal({
  leave,
  employee,
  holidaysData,
  onClose,
  onViewAttachment,
}: CeoLeaveDetailModalProps) {
  const empName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : leave.employeeName || leave.userId || 'ไม่ระบุชื่อ';
  const dept =
    employee?.departmentName || leave.departmentName || leave.department || '-';
  const dates = formatLeaveDateRange(leave.startDate, leave.endDate, leave);
  const durationText = formatLeaveDuration(leave, holidaysData);
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
          <h2 className="text-[20px] font-bold text-black">
            รายละเอียดคำขอลา (Leave Request Details)
          </h2>
          <button
            onClick={onClose}
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
              <h3 className="font-bold text-[15px] text-black mb-3">
                ข้อมูลพนักงาน (Employee Info)
              </h3>
              <div className="text-[14px] text-gray-800 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-bold min-w-[90px]">ชื่อ:</span>{' '}
                  {empName}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-bold min-w-[90px]">
                    แผนก|ตำแหน่ง:
                  </span>{' '}
                  {dept} | {employee?.position || employee?.positionName || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Leave Info */}
          <div className="border border-gray-300 rounded-xl p-5 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[32px] h-[32px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-[15px] text-black">
                รายละเอียดการลา (Leave Information)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-gray-800 pl-[44px]">
              <div className="space-y-3">
                <p className="flex gap-2">
                  <span className="font-bold min-w-[80px]">รหัสการลา:</span>{' '}
                  <span className="text-blue-500 font-semibold">
                    {leave.requestCode || '-'}
                  </span>
                </p>
                <p className="flex gap-2">
                  <span className="font-bold min-w-[80px]">
                    ประเภทการลา:
                  </span>{' '}
                  {leave.type || leave.leaveTypeName || '-'}
                </p>
                <p className="flex gap-2">
                  <span className="font-bold min-w-[80px]">ช่วงเวลา:</span>{' '}
                  {dates} ({durationText})
                </p>
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                    <Clock className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </span>
                  <span className="font-bold min-w-[80px]">
                    รูปแบบการลา:
                  </span>{' '}
                  {leave.startFormat === 'hourly'
                    ? `รายชั่วโมง (${leave.leaveHours || 1} ชม.)`
                    : leave.startFormat === 'morning'
                      ? 'ครึ่งวันเช้า'
                      : leave.startFormat === 'afternoon'
                        ? 'ครึ่งวันบ่าย'
                        : 'เต็มวัน'}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </span>
                  <span className="font-bold min-w-[80px]">เอกสารแนบ:</span>
                  {leave.attachmentUrl || leave.attachment ? (
                    <button
                      onClick={() => {
                        const base64 = leave.attachmentUrl || leave.attachment;
                        if (base64) onViewAttachment(base64);
                      }}
                      className="text-blue-600 font-bold hover:underline ml-2"
                    >
                      ดูเอกสารแนบ
                    </button>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="font-bold text-black text-[14px] mb-2">
              เหตุผลการลา
            </h3>
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
                <span className="font-bold min-w-[120px]">
                  วันที่ยื่นคำลา:
                </span>
                {leave.createdAt
                  ? new Date(leave.createdAt).toLocaleString('th-TH')
                  : '-'}
              </p>
              <p className="flex gap-2">
                <span className="font-bold min-w-[120px]">
                  อัปเดตล่าสุด:
                </span>
                {leave.updatedAt
                  ? new Date(leave.updatedAt).toLocaleString('th-TH')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Approval */}
          <div className="mt-2">
            <h3 className="font-bold text-[#00A859] flex items-center gap-2 text-[15px] mb-2">
              การอนุมัติ (Approval)
            </h3>
            <div className="flex flex-col md:flex-row items-stretch gap-4 bg-[#F8F9FA] border border-gray-200 rounded-xl p-4">
              <div className="w-[120px] flex flex-col justify-center border-r border-gray-200 pr-4">
                <span className="text-[12px] font-bold text-black mb-2">
                  สถานะ:
                </span>
                <span
                  className={`inline-flex justify-center items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-white shadow-sm ${statusColor}`}
                >
                  {statusText}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[12px] font-bold text-black mb-2">
                  เหตุผลของผู้อนุมัติ (CEO)
                </span>
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
            วันที่ยื่นคำขอ :{' '}
            {leave.createdAt
              ? new Date(leave.createdAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' น.'
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
