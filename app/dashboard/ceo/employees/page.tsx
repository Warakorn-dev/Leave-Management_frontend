'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCeoEmployeesQuery } from '@/hooks/useEmployee';
import { 
  Users, 
  Search, 
  ChevronDown 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CEOEmployeesPage() {
  const { user } = useAuth();
  const { data: employees = [], isLoading } = useCeoEmployeesQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = 
        (emp.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || emp.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = departmentFilter === 'all' || emp.departmentName === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  // Extract unique departments for the dropdown
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.departmentName).filter(Boolean));
    return Array.from(depts) as string[];
  }, [employees]);

  if (isLoading || !user) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            ข้อมูลพนักงานทั้งหมด
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ดูรายชื่อและข้อมูลของพนักงานทั้งหมดในบริษัท
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full sm:w-96 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, อีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Department Filter */}
        <div className="relative w-full sm:w-64">
          <select
            className="block w-full appearance-none bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 pr-10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">ทุกแผนก (All Departments)</option>
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        <div className="sm:ml-auto bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold">
          พบ {filteredEmployees.length} รายการ
        </div>
      </div>

      {/* Employee List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">รหัสพนักงาน</th>
                <th className="px-6 py-4">ชื่อ</th>
                <th className="px-6 py-4">นามสกุล</th>
                <th className="px-6 py-4">แผนก (Department)</th>
                <th className="px-6 py-4">ตำแหน่ง (Position)</th>
                <th className="px-6 py-4">อีเมล</th>
                <th className="px-6 py-4">เบอร์ติดต่อ</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{emp.employeeId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {emp.firstName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {emp.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {emp.departmentName || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {emp.positionName || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {emp.email || emp.username || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {emp.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {emp.status === 'active' ? 'Active' : emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
