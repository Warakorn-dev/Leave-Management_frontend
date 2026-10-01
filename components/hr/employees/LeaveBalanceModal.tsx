'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Employee } from '@/lib/api/types';

export interface LeaveBalanceRow {
  id: string;
  leaveTypeId?: string;
  year?: number;
  usedDays?: number;
  remainingDays?: number;
  totalDays?: number;
}

export interface LeaveTypeRow {
  id: string;
  name?: string;
  defaultDays?: number;
  isConfirmed?: boolean;
}

interface LeaveBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  isFetching: boolean;
  leaveTypes: LeaveTypeRow[];
  leaveBalances: LeaveBalanceRow[];
  editedTotalBalances: Record<string, number>;
  setEditedTotalBalances: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  editedRemainingBalances: Record<string, number>;
  setEditedRemainingBalances: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  onInitialize: () => void;
  onResetUsage: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/** "โควตาวันลาของพนักงาน" dialog: view/edit each leave type's total and remaining days. */
export function LeaveBalanceModal({
  open,
  onOpenChange,
  employee,
  isFetching,
  leaveTypes,
  leaveBalances,
  editedTotalBalances,
  setEditedTotalBalances,
  editedRemainingBalances,
  setEditedRemainingBalances,
  onInitialize,
  onResetUsage,
  onCancel,
  onSave,
}: LeaveBalanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[800px] w-[90vw] p-0 overflow-hidden bg-white rounded-3xl"
        style={{ maxWidth: '800px' }}
      >
        <div className="bg-[#1e40af] px-10 py-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              โควตาวันลาของพนักงาน
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {employee?.firstName} {employee?.lastName}
            </p>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {isFetching ? (
            <p className="text-center text-slate-500 py-8">
              กำลังโหลดข้อมูลวันลา...
            </p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="font-bold text-slate-700">รายการสิทธิ์การลา</h3>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  <button
                    onClick={onInitialize}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                  >
                    สร้างข้อมูล/ซิงค์ (ปีปัจจุบัน)
                  </button>
                  <button
                    onClick={onResetUsage}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors text-xs font-medium whitespace-nowrap"
                  >
                    รีเซ็ตวันลาที่ใช้ไป (เริ่มใหม่)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveTypes.map((type) => {
                  const balance = leaveBalances.find(
                    (b) =>
                      b.leaveTypeId === type.id &&
                      b.year === new Date().getFullYear(),
                  );
                  return (
                    <div
                      key={type.id}
                      className="flex flex-col justify-between p-5 border border-slate-200 rounded-xl bg-slate-50 gap-4 hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-[17px]">
                          {type.name}
                        </h4>
                        {balance ? (
                          <p className="text-[14px] text-slate-500 mt-1">
                            ปี: {balance.year} | ใช้ไป: {balance.usedDays} วัน
                          </p>
                        ) : (
                          <p className="text-[14px] text-amber-500 mt-1">
                            ยังไม่ได้สร้าง (เริ่มต้น {type.defaultDays} วัน)
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 mt-1">
                        {balance ? (
                          <div className="w-full flex flex-col gap-3">
                            {/* Row 1: Total Days */}
                            <div className="flex items-center justify-between">
                              <label className="text-[14px] font-bold text-slate-600">
                                สิทธิ์วันลา (ทั้งหมด):
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={
                                    editedTotalBalances[balance.id] ??
                                    balance.totalDays
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const numVal =
                                      val === ''
                                        ? (balance.totalDays ?? 0)
                                        : Number(val);
                                    setEditedTotalBalances((prev) => ({
                                      ...prev,
                                      [balance.id]: numVal,
                                    }));
                                  }}
                                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 animate-transition"
                                />
                                <span className="text-xs text-slate-500 font-bold">
                                  วัน
                                </span>
                              </div>
                            </div>

                            {/* Row 2: Remaining Days */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                              <label className="text-[14px] font-bold text-slate-600">
                                วันลาคงเหลือ:
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={
                                    editedRemainingBalances[balance.id] ??
                                    balance.remainingDays
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const numVal =
                                      val === ''
                                        ? (balance.remainingDays ?? 0)
                                        : Number(val);
                                    setEditedRemainingBalances((prev) => ({
                                      ...prev,
                                      [balance.id]: numVal,
                                    }));
                                  }}
                                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700 animate-transition"
                                />
                                <span className="text-xs text-slate-500 font-bold">
                                  วัน
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            รอสร้างข้อมูล
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end items-center gap-4 mt-8 pb-2">
            <button
              onClick={onCancel}
              className="px-8 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#0f172a] rounded-xl font-medium text-[17px] transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={onSave}
              className="px-8 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium text-[17px] shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
