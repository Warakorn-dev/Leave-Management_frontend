'use client';

import { Edit, X } from 'lucide-react';

export interface EditDepartmentForm {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface EditDepartmentModalProps {
  form: EditDepartmentForm;
  setForm: React.Dispatch<React.SetStateAction<EditDepartmentForm>>;
  onClose: () => void;
  onSubmit: () => void;
}

/** "แก้ไขแผนก" popup. */
export function EditDepartmentModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: EditDepartmentModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Edit className="w-5 h-5 text-indigo-600" />
            แก้ไขแผนก
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              รหัสแผนก (Code)
            </label>
            <input
              type="text"
              maxLength={5}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.replace(/\D/g, '') })
              }
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="เช่น 12345 (เว้นว่างไว้ระบบจะสุ่มให้)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              ชื่อแผนก (Department Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.name}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm shadow-indigo-500/30 transition-all"
          >
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}
