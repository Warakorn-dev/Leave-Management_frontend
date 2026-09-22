'use client';

import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Generic "ยืนยันการลบ" confirmation popup for a department or position. */
export function DeleteConfirmModal({
  itemName,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            ยืนยันการลบ?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            คุณแน่ใจหรือไม่ว่าต้องการลบ{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {itemName}
            </span>{' '}
            ?
            <br />
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-500/30 transition-all"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
}
