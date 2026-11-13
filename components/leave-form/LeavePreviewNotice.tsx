'use client';

import type { LeavePreview } from '@/hooks/useLeavePreview';

/** Result of the server's dry run, shown under the date fields of the create form. */
export function LeavePreviewNotice({ preview }: { preview: LeavePreview | null }) {
  if (!preview) return null;

  if (!preview.ok) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 whitespace-pre-line"
      >
        {preview.message || 'ไม่สามารถยื่นคำขอลาตามที่เลือกได้'}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
      การลาครั้งนี้ใช้สิทธิ์ {preview.totalDays} วัน
    </div>
  );
}

export default LeavePreviewNotice;
