'use client';

/**
 * Fullscreen "แก้ไขคำขอลา" form shared by employee, manager and HR
 * (components/{user/UserLeaveEditFormModal, manager/ManagerLeaveEditFormModal,
 * hr/LeaveEditFormModal} are thin wrappers around it). Same fields and layout
 * as the create page (LeaveRequestCreateForm), so all leave forms look alike.
 * Saving stays in each history page; this component only collects the input.
 */

import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Check, FilePen } from 'lucide-react';
import { useLeave } from '@/hooks/useLeave';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';
import type { ExistingAttachment } from '@/lib/leaveAttachment';
import {
  buildTakenMap,
  isDayUnavailable,
  type DayPortion,
  type LeaveLike,
  type LeaveMode,
} from '@/lib/leavePortions';
import { LeaveFormFields, type LeaveFormValues } from './LeaveFormFields';
import { LeaveAttachmentField } from './LeaveAttachmentField';
import { RequesterInfoBox } from './RequesterInfoBox';

export interface LeaveEditFormLayoutProps {
  requester: { name: string; department?: string | null; position?: string | null };
  values: LeaveFormValues;
  onChange: (patch: Partial<LeaveFormValues>) => void;
  balances: LeaveBalance[];
  /** The leave's type when the form opened; it stays selectable. */
  originalTypeId?: string;
  /** All leaves the page has loaded; only the requester's own are used. */
  leaves: LeaveLike[];
  /** userId of the leave's owner (defaults to the signed-in user). */
  ownerUserId?: string | null;
  /** The request being edited, so it does not clash with itself. */
  excludeRequestId?: string;
  onConflictChange?: (hasConflict: boolean) => void;
  attachmentFile: File | null;
  onAttachmentChange: (file: File | null) => void;
  existingAttachment?: ExistingAttachment | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
}

export function LeaveEditFormLayout({
  requester,
  values,
  onChange,
  balances,
  originalTypeId,
  leaves,
  ownerUserId,
  excludeRequestId,
  onConflictChange,
  attachmentFile,
  onAttachmentChange,
  existingAttachment = null,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
}: LeaveEditFormLayoutProps) {
  const { useHolidaysQuery } = useLeave();
  const { data: holidays = [] } = useHolidaysQuery();
  const [hasConflict, setHasConflict] = useState(false);

  const userId =
    ownerUserId ??
    (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '');

  // Half-day slots the owner has booked, excluding the request being edited.
  const takenMap = useMemo(
    () => buildTakenMap(Array.isArray(leaves) ? leaves : [], userId, excludeRequestId),
    [leaves, userId, excludeRequestId],
  );
  const isDateDisabled = (date: unknown) =>
    isDayUnavailable(
      date,
      values.leaveMode as LeaveMode,
      (values.period as DayPortion) ?? 'full',
      takenMap,
    );

  const handleConflictChange = (conflict: boolean) => {
    setHasConflict(conflict);
    onConflictChange?.(conflict);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (values.leaveMode !== 'hourly' && hasConflict) {
      Swal.fire({
        icon: 'warning',
        title: 'ช่วงวันที่ทับซ้อนกับการลาอื่น',
        text: 'บางวันในช่วงที่เลือกทับซ้อนกับการลาอื่นของคุณ กรุณาปรับช่วงวันที่ หรือเปลี่ยนรูปแบบการลาให้ตรงกับช่วงเวลาที่ยังว่าง',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#F8F9FA] overflow-y-auto font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FilePen className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
              แก้ไขคำขอลา (Edit Leave Request)
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors"
        >
          ยกเลิก
        </button>
      </div>

      {/* Main Content Container */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <RequesterInfoBox
            name={requester.name}
            department={requester.department}
            position={requester.position}
          />

          <form onSubmit={handleSubmit}>
            <LeaveFormFields
              values={values}
              onChange={onChange}
              balances={balances}
              keepEnabledTypeId={originalTypeId}
              isDateDisabled={isDateDisabled}
              leaves={Array.isArray(leaves) ? leaves : []}
              currentUserId={userId}
              excludeRequestId={excludeRequestId}
              holidays={holidays}
              onConflictChange={handleConflictChange}
            />

            <LeaveAttachmentField
              file={attachmentFile}
              onFileChange={onAttachmentChange}
              existing={existingAttachment}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-lg active:scale-95"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmEdit && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[500px] w-full p-10 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-24 h-24 bg-[#4CAF50] rounded-full mx-auto flex items-center justify-center mb-6 shadow-md">
              <Check className="w-12 h-12 text-white" strokeWidth={4} />
            </div>
            <h2 className="text-2xl font-bold text-black mb-4">ยืนยันการแก้ไขข้อมูล</h2>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
              คำขอลาที่แก้ไขจะถูกส่งเข้าระบบอีกครั้ง
              <br />
              สามารถเช็คสถานะได้จากหน้าเช็คสถานะของคุณ
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmEdit(false)}
                className="bg-[#FF0000] hover:bg-red-600 text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onConfirmSave}
                className="bg-[#00B050] hover:bg-[#009040] text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveEditFormLayout;
