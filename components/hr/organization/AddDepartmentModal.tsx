'use client';

import { Building2, X } from 'lucide-react';

export interface NewDepartmentForm {
  code: string;
  name: string;
  description: string;
}

interface AddDepartmentModalProps {
  form: NewDepartmentForm;
  setForm: React.Dispatch<React.SetStateAction<NewDepartmentForm>>;
  onClose: () => void;
  onSubmit: () => void;
}

/** "เพิ่มแผนกใหม่" popup. The code field is auto-generated and read-only. */
export function AddDepartmentModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: AddDepartmentModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                เพิ่มแผนกใหม่
              </h2>
              <p className="text-sm text-slate-500">
                สร้างแผนกใหม่เพื่อจัดกลุ่มตำแหน่งงาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              รหัสแผนก (Code){' '}
              <span className="text-emerald-500 text-xs">(สร้างอัตโนมัติ)</span>
            </label>
            <input
              type="text"
              maxLength={5}
              value={form.code}
              readOnly
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all dark:text-white text-slate-500 cursor-not-allowed font-mono tracking-wider"
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
              placeholder="เช่น Information Technology"
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
            บันทึกแผนกใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
