'use client';

import { useState, type ReactNode } from 'react';
import {
  X,
  User,
  Calendar as CalendarIcon,
  Clock,
  Paperclip,
  Download,
} from 'lucide-react';
import { getLeaveStatusText, getLeaveStatusBadgeColor } from '@/lib/api/utils';

/**
 * The one leave-detail modal for the whole system.
 *
 * Every dashboard used to hand-roll this panel, so the layout drifted per page.
 * This component owns the markup; each page supplies the leave object and its
 * own action buttons through `footer`.
 *
 * `leave` accepts the shapes the various endpoints return:
 *   - Prisma rows           (employee.firstName, leaveType.name, approvals[])
 *   - /hr/leaves mapping    (employeeName, departmentName, leaveTypeName)
 *   - useLeavesQuery mapping(user.firstName, user.department.name)
 * `normalizeLeave` below reads whichever is present.
 */

const THAI_MONTHS = [
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

function formatThaiDate(value?: string | Date | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatThaiDateTime(value?: string | Date | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const time = d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543} ${time}`;
}

function formatTime(value?: string | Date | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export interface NormalizedLeave {
  employeeName: string;
  department: string;
  position: string;
  requestCode: string | null;
  leaveTypeName: string;
  periodText: string;
  durationText: string;
  formatText: string;
  reason: string;
  status: string;
  attachments: Array<{ filePath?: string; fileType?: string }>;
  approverComment: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

function pickName(leave: any, fallbackName?: string): string {
  const emp = leave?.employee;
  const usr = leave?.user;
  if (emp?.firstName)
    return [emp.title, emp.firstName, emp.lastName].filter(Boolean).join(' ');
  if (usr?.firstName)
    return [usr.title, usr.firstName, usr.lastName].filter(Boolean).join(' ');
  if (leave?.employeeName) return String(leave.employeeName);
  return fallbackName || '-';
}

function pickDepartment(leave: any, fallback?: string): string {
  const raw =
    leave?.employee?.department?.name ??
    leave?.user?.department?.name ??
    leave?.departmentName ??
    (typeof leave?.department === 'string'
      ? leave.department
      : leave?.department?.name);
  return raw || fallback || '-';
}

function pickPosition(leave: any, fallback?: string): string {
  const raw =
    leave?.employee?.position?.name ??
    leave?.user?.position?.name ??
    leave?.positionName ??
    (typeof leave?.position === 'string'
      ? leave.position
      : leave?.position?.name);
  return raw || fallback || '-';
}

export function normalizeLeave(
  leave: any,
  fallbacks?: { name?: string; department?: string; position?: string },
): NormalizedLeave {
  const startFormat: string = leave?.startFormat || 'full';
  const isHourly = startFormat === 'hourly' || leave?.leaveMode === 'hourly';
  const totalDays: number = leave?.totalDays ?? leave?.durationDays ?? 0;

  // ช่วงเวลา: single date, or a range; hourly adds the clock window.
  const startKey = String(leave?.startDate || '').split('T')[0];
  const endKey = String(leave?.endDate || '').split('T')[0];
  let periodText = formatThaiDate(leave?.startDate);
  if (isHourly) {
    const from = formatTime(leave?.startDate);
    const to = formatTime(leave?.endDate);
    if (from && to) periodText += ` ${from} - ${to} น.`;
  } else if (startKey && endKey && startKey !== endKey) {
    periodText += ` - ${formatThaiDate(leave?.endDate)}`;
  }

  let durationText: string;
  if (isHourly) {
    const hours =
      leave?.leaveHours ?? Number(((totalDays || 0) * 8).toFixed(2));
    durationText = `${hours} ชั่วโมง`;
  } else {
    durationText = `${totalDays} วัน`;
  }

  let formatText = 'เต็มวัน';
  if (isHourly) formatText = `รายชั่วโมง (${leave?.leaveHours ?? 1} ชม.)`;
  else if (startFormat === 'morning') formatText = 'ครึ่งวันเช้า';
  else if (startFormat === 'afternoon') formatText = 'ครึ่งวันบ่าย';

  // Attachments: either a relation array, or a single legacy url field.
  let attachments: Array<{ filePath?: string; fileType?: string }> = [];
  if (Array.isArray(leave?.attachments) && leave.attachments.length > 0) {
    attachments = leave.attachments;
  } else if (leave?.attachmentUrl) {
    attachments = [{ filePath: leave.attachmentUrl }];
  }

  const approvals: any[] = Array.isArray(leave?.approvals)
    ? leave.approvals
    : [];
  const latestApproval = approvals.length
    ? approvals[approvals.length - 1]
    : null;
  const approverComment: string | null =
    leave?.approverReason || latestApproval?.comment || null;

  return {
    employeeName: pickName(leave, fallbacks?.name),
    department: pickDepartment(leave, fallbacks?.department),
    position: pickPosition(leave, fallbacks?.position),
    requestCode: leave?.requestCode || null,
    leaveTypeName:
      leave?.leaveType?.name || leave?.leaveTypeName || leave?.type || '-',
    periodText,
    durationText,
    formatText,
    reason: leave?.reason || '-',
    status: leave?.status || '',
    attachments,
    approverComment,
    createdAt: leave?.createdAt,
    updatedAt: leave?.updatedAt,
  };
}

interface Props {
  /** raw leave object from any of the endpoints; pass `selectedRequest.raw ?? selectedRequest` */
  leave: any;
  open?: boolean;
  onClose: () => void;
  /** page-specific action buttons, right-aligned in the default footer bar */
  footer?: ReactNode;
  /** replaces the whole footer bar; use for full-width banners (e.g. "locked by another HR") */
  footerBar?: ReactNode;
  /** used when the leave payload carries no employee relation (e.g. own history) */
  fallbackName?: string;
  fallbackDepartment?: string;
  fallbackPosition?: string;
  /** hide the การอนุมัติ block on screens where a decision is still being made */
  showApproval?: boolean;
  /** extra content appended to the body, e.g. an approver-comment field */
  bodyExtra?: ReactNode;
  title?: string;
}

function resolveAttachmentSrc(filePath?: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('data:') || filePath.startsWith('http'))
    return filePath;
  return `/${filePath.replace(/^\/+/, '')}`;
}

export function LeaveDetailModal({
  leave,
  open = true,
  onClose,
  footer,
  footerBar,
  fallbackName,
  fallbackDepartment,
  fallbackPosition,
  showApproval = true,
  bodyExtra,
  title = 'รายละเอียดคำขอลา (Leave Request Details)',
}: Props) {
  const [preview, setPreview] = useState<{
    url: string;
    isImage: boolean;
  } | null>(null);

  if (!open || !leave) return null;

  const info = normalizeLeave(leave, {
    name: fallbackName,
    department: fallbackDepartment,
    position: fallbackPosition,
  });

  const statusUpper = (info.status || '').toUpperCase();
  const approvalHeadingColor =
    statusUpper === 'APPROVED'
      ? 'text-[#00A859]'
      : statusUpper === 'REJECTED'
        ? 'text-red-500'
        : 'text-yellow-600';
  const commentBoxTone =
    statusUpper === 'APPROVED'
      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
      : statusUpper === 'REJECTED'
        ? 'border-red-200 bg-red-50/60 text-red-700'
        : 'border-gray-200 bg-gray-50 text-gray-600';

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0">
            <h2 className="text-[20px] font-bold text-black">{title}</h2>
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm shrink-0"
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
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[15px] text-black mb-3">
                  ข้อมูลพนักงาน (Employee Info)
                </h3>
                <div className="text-[14px] text-gray-800 space-y-2">
                  <p className="flex gap-2">
                    <span className="font-bold min-w-[90px] shrink-0">
                      ชื่อ:
                    </span>
                    <span className="break-words">{info.employeeName}</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold min-w-[90px] shrink-0">
                      แผนก|ตำแหน่ง:
                    </span>
                    <span className="break-words">
                      {info.department} | {info.position}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Leave Information */}
            <div className="border border-gray-300 rounded-xl p-5 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-[32px] h-[32px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-[15px] text-black">
                  รายละเอียดการลา (Leave Information)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-gray-800 md:pl-[44px]">
                <div className="space-y-3">
                  {info.requestCode && (
                    <p className="flex gap-2">
                      <span className="font-bold min-w-[80px] shrink-0">
                        รหัสการลา:
                      </span>
                      <span className="font-semibold text-blue-600 break-all">
                        {info.requestCode}
                      </span>
                    </p>
                  )}
                  <p className="flex gap-2">
                    <span className="font-bold min-w-[80px] shrink-0">
                      ประเภทการลา:
                    </span>
                    <span className="break-words">{info.leaveTypeName}</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold min-w-[80px] shrink-0">
                      ช่วงเวลา:
                    </span>
                    <span className="break-words">
                      {info.periodText} ({info.durationText})
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                      <Clock className="w-[14px] h-[14px]" strokeWidth={2.5} />
                    </span>
                    <span className="font-bold shrink-0">รูปแบบการลา:</span>
                    <span className="break-words">{info.formatText}</span>
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="w-[26px] h-[26px] bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full shrink-0">
                      <Paperclip
                        className="w-[14px] h-[14px]"
                        strokeWidth={2.5}
                      />
                    </span>
                    <span className="font-bold shrink-0 mt-0.5">
                      เอกสารแนบ:
                    </span>
                    {info.attachments.length > 0 ? (
                      <div className="flex flex-col gap-2 min-w-0 flex-1">
                        {info.attachments.map((att, idx) => {
                          const src = resolveAttachmentSrc(att.filePath);
                          const isImage = Boolean(
                            att.fileType?.startsWith('image/') ||
                              att.filePath?.match(/\.(jpeg|jpg|gif|png)$/i),
                          );
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-blue-500 font-medium truncate text-[13px]">
                                {isImage ? 'รูปภาพแนบ' : 'ไฟล์แนบ'}
                                {info.attachments.length > 1
                                  ? ` (${idx + 1})`
                                  : ''}
                              </span>
                              <button
                                type="button"
                                aria-label="เปิดไฟล์แนบ"
                                className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-black shrink-0"
                                onClick={() => setPreview({ url: src, isImage })}
                              >
                                <Download
                                  className="w-[14px] h-[14px]"
                                  strokeWidth={2.5}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 mt-0.5">-</span>
                    )}
                  </div>
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
                value={info.reason}
                rows={2}
                className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default resize-none min-h-[60px]"
              />
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-gray-500">
              <p className="flex gap-2">
                <span className="font-medium text-gray-600">
                  วันที่ยื่นคำขอ:
                </span>
                {formatThaiDateTime(info.createdAt)}
              </p>
              <p className="flex gap-2">
                <span className="font-medium text-gray-600">อัปเดตล่าสุด:</span>
                {formatThaiDateTime(info.updatedAt)}
              </p>
            </div>

            {/* Approval */}
            {showApproval && (
              <div>
                <h3
                  className={`font-bold text-[15px] mb-3 ${approvalHeadingColor}`}
                >
                  การอนุมัติ (Approval)
                </h3>
                <div className="border border-gray-300 rounded-xl p-5 bg-white flex flex-col sm:flex-row gap-4">
                  <div className="shrink-0">
                    <p className="text-[13px] font-bold text-gray-700 mb-2">
                      สถานะ:
                    </p>
                    <span
                      className={`inline-block px-4 py-1.5 rounded-lg text-[13px] font-bold text-white shadow-sm ${getLeaveStatusBadgeColor(
                        info.status,
                      )}`}
                    >
                      {getLeaveStatusText(info.status)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-700 mb-2">
                      เหตุผลของผู้อนุมัติ
                    </p>
                    <div
                      className={`rounded-lg border px-3 py-2.5 text-[13px] min-h-[42px] break-words ${commentBoxTone}`}
                    >
                      {info.approverComment || 'ไม่มีหมายเหตุเพิ่มเติม'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bodyExtra}
          </div>

          {/* Footer */}
          {footerBar ?? (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
              <span className="text-[13px] font-medium text-gray-400">
                วันที่ยื่นคำขอ : {formatThaiDateTime(info.createdAt)} น.
              </span>
              {footer ? (
                <div className="flex items-center gap-4">{footer}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Attachment preview */}
      {preview && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] shrink-0">
              <h2 className="text-[16px] font-bold text-black">
                ไฟล์เอกสารแนบ (Attachment)
              </h2>
              <button
                onClick={() => setPreview(null)}
                aria-label="ปิด"
                className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-50/50">
              {preview.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200"
                />
              ) : (
                <iframe
                  src={preview.url}
                  title="Attachment preview"
                  className="w-full h-[75vh] bg-white rounded-lg shadow-sm border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LeaveDetailModal;
