'use client';

import { Users, User, X } from 'lucide-react';
import { getPositionStyle } from '@/lib/orgStyles';
import type { Department, Employee } from '@/lib/api/types';

interface DepartmentEmployeesModalProps {
  department: Department;
  employees: Employee[];
  onClose: () => void;
}

/** Popup listing every employee in a department, ranked CEO/Manager/Senior/other. */
export function DepartmentEmployeesModal({
  department,
  employees,
  onClose,
}: DepartmentEmployeesModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                พนักงานในแผนก {department.name}
              </h2>
              <p className="text-sm text-slate-500">
                จำนวนทั้งหมด {employees.length} คน
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {employees.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <User className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">
                ยังไม่มีพนักงานในแผนกนี้
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                    {emp.firstName?.charAt(0) || ''}
                    {emp.lastName?.charAt(0) || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {emp.firstName} {emp.lastName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const posStyle = getPositionStyle(
                          emp.positionName || '',
                        );
                        const isLeader =
                          (emp.positionName || '')
                            .toLowerCase()
                            .includes('leader') ||
                          (emp.positionName || '')
                            .toLowerCase()
                            .includes('ceo') ||
                          (emp.positionName || '')
                            .toLowerCase()
                            .includes('manager');
                        return (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium border ${isLeader ? 'border-amber-200 dark:border-amber-800' : 'border-transparent'} ${posStyle.colorClass} ${posStyle.bgClass} truncate`}
                          >
                            {emp.positionName || 'ไม่ระบุตำแหน่ง'}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-slate-400 truncate ml-1">
                        {emp.employeeId}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
