'use client';

import { Upload, Check } from 'lucide-react';
import { DatePicker, compactDateFieldSx } from '@/components/DateAndTime';
import { LeaveTimePicker } from '@/components/LeaveTimePicker';
import { LeaveDayAvailabilityPreview } from '@/components/LeaveDayAvailabilityPreview';
import type { LeaveMode, DayPortion } from '@/lib/leavePortions';
import type { Leave } from '@/lib/api/types';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';

/** DatePicker onChange can hand back a dayjs-like object or a plain date string. */
export function formatPickerValue(val: unknown): string {
  if (val && typeof val === 'object') {
    const dayjsLike = val as { format?: (f: string) => string };
    if (typeof dayjsLike.format === 'function') {
      return dayjsLike.format('YYYY-MM-DD');
    }
  }
  if (typeof val === 'string') {
    return val.substring(0, 10);
  }
  return '';
}

export interface UserLeaveEditForm {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveMode: string;
  period: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
}

interface UserLeaveEditFormModalProps {
  username: string;
  balances: LeaveBalance[];
  editForm: UserLeaveEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<UserLeaveEditForm>>;
  isEditDateDisabled: (date: unknown) => boolean;
  allLeaves: Leave[];
  currentUserId: string | null;
  excludeRequestId?: string;
  onConflictChange: (hasConflict: boolean) => void;
  editAttachment: File | null;
  setEditAttachment: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
}

/** Fullscreen leave-request edit form used by the employee leave-history "แก้ไขข้อมูล" flow. */
export function UserLeaveEditFormModal({
  username,
  balances,
  editForm,
  setEditForm,
  isEditDateDisabled,
  allLeaves,
  currentUserId,
  excludeRequestId,
  onConflictChange,
  editAttachment,
  setEditAttachment,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
}: UserLeaveEditFormModalProps) {
  return (
    <div className="fixed inset-0 z-[120] bg-[#E2E4E9] overflow-y-auto">
      {/* Top Banner (Inside Edit) */}
      <div className="bg-white flex flex-col md:flex-row md:items-center justify-between px-8 py-5 shadow-sm sticky top-0 z-10 gap-4 border-2 border-blue-500">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            แก้ไขคำขอลา (Edit Leave Request)
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนส่งใหม่อีกครั้ง
          </p>
        </div>
        <div className="flex items-center gap-6 text-black self-end md:self-auto">
          <button
            onClick={onClose}
            className="ml-4 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={onSubmit} className="space-y-8 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F4F4F4] rounded-xl p-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <div className="font-bold text-black">{username}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ประเภทการลา
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    เลือกประเภทการลา
                  </option>
                  {balances.map((b) => (
                    <option key={b.leaveTypeId} value={b.leaveTypeId}>
                      {b.leaveType?.name || 'ไม่ระบุ'} (เหลือ {b.remainingDays}{' '}
                      วัน)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* รูปแบบการลา */}
              <div className="md:col-span-1">
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  รูปแบบการลา
                </label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="leaveMode"
                      checked={editForm.leaveMode === 'full_day'}
                      onChange={() => {
                        setEditForm({
                          ...editForm,
                          leaveMode: 'full_day',
                          period: 'full',
                        });
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      เต็มวัน
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="leaveMode"
                      checked={editForm.leaveMode === 'half_day'}
                      onChange={() => {
                        setEditForm({
                          ...editForm,
                          leaveMode: 'half_day',
                          period: 'morning',
                        });
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ครึ่งวัน
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="leaveMode"
                      checked={editForm.leaveMode === 'hourly'}
                      onChange={() =>
                        setEditForm({ ...editForm, leaveMode: 'hourly' })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ลารายชั่วโมง
                    </span>
                  </label>
                </div>
              </div>

              {editForm.leaveMode === 'hourly' ? (
                <>
                  <div className="md:col-span-2 md:w-[calc(50%-1.5rem)]">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      วันที่ลา
                    </label>
                    <DatePicker
                      value={editForm.leaveDate || null}
                      onChange={(val: unknown) => {
                        setEditForm({
                          ...editForm,
                          leaveDate: formatPickerValue(val),
                        });
                      }}
                      placeholderText="วว/ดด/ปปปป"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <LeaveTimePicker
                      startTime={editForm.startTime}
                      endTime={editForm.endTime}
                      onChangeStartTime={(time) =>
                        setEditForm({ ...editForm, startTime: time })
                      }
                      onChangeEndTime={(time) =>
                        setEditForm({ ...editForm, endTime: time })
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Mobile: start/end share one row; md+: `contents` lets them flow into the parent 2-col grid */}
                  <div className="grid grid-cols-2 gap-3 md:contents">
                  <div className="min-w-0">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      วันที่เริ่มต้น
                    </label>
                    <DatePicker
                      value={editForm.startDate || null}
                      onChange={(val: unknown) => {
                        setEditForm({
                          ...editForm,
                          startDate: formatPickerValue(val),
                        });
                      }}
                      shouldDisableDate={isEditDateDisabled}
                      placeholderText="วว/ดด/ปปปป"
                      sx={compactDateFieldSx}
                    />
                    {editForm.leaveMode === 'half_day' && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="period"
                            value="morning"
                            checked={editForm.period === 'morning'}
                            onChange={() =>
                              setEditForm({ ...editForm, period: 'morning' })
                            }
                            className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                          />
                          ครึ่งวันเช้า
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="period"
                            value="afternoon"
                            checked={editForm.period === 'afternoon'}
                            onChange={() =>
                              setEditForm({ ...editForm, period: 'afternoon' })
                            }
                            className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                          />
                          ครึ่งวันบ่าย
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      วันที่สิ้นสุด
                    </label>
                    <DatePicker
                      value={editForm.endDate || null}
                      onChange={(val: unknown) => {
                        setEditForm({
                          ...editForm,
                          endDate: formatPickerValue(val),
                        });
                      }}
                      shouldDisableDate={isEditDateDisabled}
                      placeholderText="วว/ดด/ปปปป"
                      sx={compactDateFieldSx}
                    />
                  </div>
                  </div>
                  <LeaveDayAvailabilityPreview
                    startDate={editForm.startDate}
                    endDate={editForm.endDate}
                    leaveMode={editForm.leaveMode as LeaveMode}
                    period={
                      editForm.leaveMode === 'half_day'
                        ? (editForm.period as DayPortion)
                        : 'full'
                    }
                    leaves={allLeaves}
                    currentUserId={currentUserId}
                    excludeRequestId={excludeRequestId}
                    onConflictChange={onConflictChange}
                  />
                </>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                เหตุผลการลา
              </label>
              <textarea
                value={editForm.reason}
                onChange={(e) =>
                  setEditForm({ ...editForm, reason: e.target.value })
                }
                rows={4}
                placeholder="ระบุเหตุผลที่ชัดเจน..."
                className="w-full border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              ></textarea>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                เอกสารแนบ (ถ้ามี)
              </label>
              <label
                htmlFor="edit-file-upload"
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 bg-[#FAFAFA] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-black mb-3" strokeWidth={2} />
                <p className="text-sm font-bold text-black mb-1">
                  {editAttachment ? (
                    editAttachment.name
                  ) : (
                    <>
                      <span className="text-blue-600">คลิกเพื่ออัปโหลด</span>{' '}
                      หรือเลือกไฟล์ใหม่
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  รองรับไฟล์ PDF, PNG, JPG ขนาดไม่เกิน 2 MB
                </p>
                <input
                  id="edit-file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditAttachment(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-[15px] shadow-md hover:shadow-lg active:scale-95"
              >
                ส่งคำขอลา
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmEdit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col items-center py-12 px-8 border-[3px] border-[#3B82F6] relative animate-in zoom-in-95 duration-200">
            <div className="w-[100px] h-[100px] bg-[#00C853] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Check className="w-12 h-12 text-white" strokeWidth={4} />
            </div>

            <h2 className="text-[26px] font-bold text-black mb-4 tracking-tight">
              ยืนยันการแก้ไขข้อมูล
            </h2>

            <p className="text-[#6B7280] text-[15px] text-center mb-10 leading-relaxed">
              คำขอลาของคุณจะถูกส่งไปยังระบบ
              <br />
              สามารถเช็คสถานะได้จากหน้าเช็คสถานะของคุณ
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowConfirmEdit(false)}
                className="bg-[#FF0000] hover:bg-red-600 text-white font-bold py-2.5 px-10 rounded-xl transition-colors shadow-sm text-[16px]"
              >
                ยกเลิก
              </button>
              <button
                onClick={onConfirmSave}
                className="bg-[#00C853] hover:bg-green-600 text-white font-bold py-2.5 px-10 rounded-xl transition-colors shadow-sm text-[16px]"
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
