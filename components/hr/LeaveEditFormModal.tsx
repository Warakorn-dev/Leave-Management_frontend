'use client';

import { Upload, Check } from 'lucide-react';
import { DatePicker } from '@/components/DateAndTime';
import { LeaveTimePicker } from '@/components/LeaveTimePicker';

export interface LeaveEditForm {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveMode: string;
  period: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
  attachment: string | null;
  attachmentName: string | null;
}

interface BalanceOption {
  leaveType?: { id?: string; name?: string };
  remainingDays?: number;
}

interface SelectedRequestInfo {
  name?: string;
  department?: string;
  positionName?: string;
  raw?: { userId?: string };
}

interface LeaveEditFormModalProps {
  selectedRequest: SelectedRequestInfo | null;
  username: string;
  editForm: LeaveEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<LeaveEditForm>>;
  balances: BalanceOption[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
}

/** Fullscreen leave-request edit form used by the HR leave-history "แก้ไขข้อมูล" flow. */
export function LeaveEditFormModal({
  selectedRequest,
  username,
  editForm,
  setEditForm,
  balances,
  onFileChange,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
}: LeaveEditFormModalProps) {
  return (
    <div className="fixed inset-0 z-[120] bg-[#E2E4E9] overflow-y-auto">
      {/* Top Banner (Inside Edit) */}
      <div className="bg-white flex flex-col md:flex-row md:items-center justify-between px-8 py-5 shadow-sm sticky top-0 z-10 gap-4 border-b border-gray-200">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            แบบฟอร์มยื่นลา (Leave Request)
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเข้าสู่กระบวนการพิจารณา
          </p>
        </div>
        <div className="flex items-center gap-6 text-black self-end md:self-auto">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={onSubmit} className="space-y-8 text-black">
            {/* User Info (Readonly) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F4F4F4] rounded-xl p-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <div className="font-bold text-black">
                  {selectedRequest?.name ||
                    selectedRequest?.raw?.userId ||
                    username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  แผนก/ ตำแหน่ง
                </label>
                <div className="font-bold text-black">
                  {selectedRequest?.department || '-'} |{' '}
                  {selectedRequest?.positionName || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ประเภทการลา
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="" disabled>
                    -- กรุณาเลือกประเภทการลา --
                  </option>
                  {balances.map((b) => (
                    <option
                      key={b.leaveType?.id}
                      value={b.leaveType?.id}
                      disabled={
                        (b.remainingDays ?? 0) <= 0 &&
                        editForm.type !== String(b.leaveType?.id)
                      }
                      className={
                        (b.remainingDays ?? 0) <= 0 &&
                        editForm.type !== String(b.leaveType?.id)
                          ? 'text-gray-400 bg-gray-50 font-medium'
                          : 'text-gray-800'
                      }
                    >
                      {b.leaveType?.name}{' '}
                      {(b.remainingDays ?? 0) <= 0 &&
                      editForm.type !== String(b.leaveType?.id)
                        ? '(หมดโควต้า)'
                        : `(เหลือ ${b.remainingDays} วัน)`}
                    </option>
                  ))}
                </select>
              </div>

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
                      selected={
                        editForm.leaveDate ? new Date(editForm.leaveDate) : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          const d = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000,
                          );
                          setEditForm({
                            ...editForm,
                            leaveDate: d.toISOString().split('T')[0],
                          });
                        } else {
                          setEditForm({ ...editForm, leaveDate: '' });
                        }
                      }}
                      placeholderText="วว/ดด/ปปปป"
                      className="w-full bg-transparent border-none text-black text-[15px] font-bold py-3 px-4 focus:outline-none cursor-pointer rounded-lg"
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
                  <div className="md:col-span-1">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      วันที่เริ่มต้น
                    </label>
                    <DatePicker
                      selected={
                        editForm.startDate ? new Date(editForm.startDate) : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          const d = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000,
                          );
                          setEditForm({
                            ...editForm,
                            startDate: d.toISOString().split('T')[0],
                          });
                        } else {
                          setEditForm({ ...editForm, startDate: '' });
                        }
                      }}
                      placeholderText="วว/ดด/ปปปป"
                      className="w-full bg-transparent border-none text-black text-[15px] font-bold py-3 px-4 focus:outline-none cursor-pointer rounded-lg"
                    />
                    {editForm.leaveMode === 'half_day' && (
                      <div className="flex items-center gap-4 mt-3">
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
                  <div className="md:col-span-1">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      วันที่สิ้นสุด
                    </label>

                    <DatePicker
                      selected={
                        editForm.endDate ? new Date(editForm.endDate) : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          const d = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000,
                          );
                          setEditForm({
                            ...editForm,
                            endDate: d.toISOString().split('T')[0],
                          });
                        } else {
                          setEditForm({ ...editForm, endDate: '' });
                        }
                      }}
                      placeholderText="วว/ดด/ปปปป"
                      className="w-full bg-transparent border-none text-black text-[15px] font-bold py-3 px-4 focus:outline-none cursor-pointer rounded-lg"
                    />
                  </div>
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
            <div className="mb-10">
              <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                เอกสารแนบ (ถ้ามี)
              </label>
              <div className="border border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm relative group overflow-hidden">
                <Upload
                  className="w-8 h-8 text-black mb-3 group-hover:-translate-y-1 transition-transform"
                  strokeWidth={2}
                />
                {editForm.attachmentName ? (
                  <div className="text-center z-10">
                    <p className="text-[14px] text-emerald-600 font-bold">
                      ✓ {editForm.attachmentName}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditForm((prev) => ({
                          ...prev,
                          attachment: null,
                          attachmentName: null,
                        }));
                      }}
                      className="text-red-500 text-xs font-semibold mt-2 underline hover:text-red-700"
                    >
                      ลบไฟล์
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-black font-semibold">
                      ลากไฟล์มาวางที่นี่ หรือ{' '}
                      <span className="text-blue-600">คลิกเพื่ออัปโหลด</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      รองรับ PDF,PNG ขนาดไม่เกิน 10MB
                    </p>
                  </>
                )}
                {/* Invisible file input */}
                <input
                  type="file"
                  accept="image/png, application/pdf"
                  onChange={onFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-[15px] shadow-md hover:shadow-lg active:scale-95"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmEdit && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col items-center py-12 px-8 border-[3px] border-[#3B82F6] relative animate-in zoom-in-95 duration-200">
            <div className="w-[100px] h-[100px] bg-[#00C853] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Check className="w-12 h-12 text-white" strokeWidth={4} />
            </div>

            <h2 className="text-[26px] font-bold text-black mb-4 tracking-tight">
              ยืนยันการแก้ไขข้อมูล
            </h2>

            <p className="text-[#6B7280] text-[15px] text-center mb-10 leading-relaxed">
              คำลาของคุณจะเข้าสู่กระบวนการพิจารณาตามลำดับขั้นตอน
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
