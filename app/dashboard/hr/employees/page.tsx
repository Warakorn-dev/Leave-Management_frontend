'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { useDepartmentsQuery } from '@/hooks/useDepartment';
import { usePositionsQuery } from '@/hooks/usePosition';
import {
  Users,
  UserPlus,
  Search,
  ChevronDown,
  SquarePen,
  Trash2,
  Wallet,
  Power,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Link from 'next/link';
import { hrApi } from '@/lib/api';
import { ActionButton, IconButton } from '@/components/ui/action-button';

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    useEmployeesQuery,
    useDeleteEmployeeMutation,
    useCreateEmployeeMutation,
    useUpdateEmployeeStatusMutation,
  } = useEmployee();

  const { data: employees = [], isLoading, refetch } = useEmployeesQuery();
  const { mutate: deleteEmployee } = useDeleteEmployeeMutation();
  const { mutate: updateEmployeeStatus } = useUpdateEmployeeStatusMutation();

  const { data: departmentsData = [] } = useDepartmentsQuery();
  const { data: positionsData = [] } = usePositionsQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Leave Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedEmployeeBalances, setSelectedEmployeeBalances] =
    useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [editedRemainingBalances, setEditedRemainingBalances] = useState<{
    [id: string]: number;
  }>({});
  const [editedTotalBalances, setEditedTotalBalances] = useState<{
    [id: string]: number;
  }>({});

  const handleOpenBalanceModal = async (emp: any) => {
    setSelectedEmployeeBalances(emp);
    setIsBalanceModalOpen(true);
    setIsFetchingBalances(true);
    setEditedRemainingBalances({});
    setEditedTotalBalances({});
    try {
      const [resBalances, resTypes] = await Promise.all([
        hrApi.getEmployeeWithBalances(emp.id),
        hrApi.getLeaveTypes(),
      ]);

      const balancesData = resBalances.data;
      if (balancesData) {
        setLeaveBalances(balancesData.leaveBalances || []);
      }
      const typesData = resTypes.data;
      if (typesData) {
        setLeaveTypes(
          Array.isArray(typesData) ? typesData : (typesData as any).data || [],
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingBalances(false);
    }
  };

  const handleSaveAllBalances = async () => {
    try {
      const allIds = new Set([
        ...Object.keys(editedRemainingBalances),
        ...Object.keys(editedTotalBalances),
      ]);
      const updates = Array.from(allIds).map((id) => {
        const remainingDays = editedRemainingBalances[id];
        const totalDays = editedTotalBalances[id];
        return hrApi.updateLeaveBalance(id, remainingDays, totalDays);
      });
      if (updates.length > 0) {
        await Promise.all(updates);
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'ปรับปรุงยอดวันลาเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        handleOpenBalanceModal(selectedEmployeeBalances);
      } else {
        setIsBalanceModalOpen(false);
      }
    } catch (err) {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถปรับปรุงยอดวันลาได้', 'error');
    }
  };

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        (emp.employeeId || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (emp.firstName || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (emp.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || emp.username || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesDept =
        departmentFilter === 'all' || emp.departmentName === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  // Extract unique departments for the dropdown
  const departments = useMemo(() => {
    const depts = new Set(
      employees.map((e) => e.departmentName).filter(Boolean),
    );
    return Array.from(depts) as string[];
  }, [employees]);

  const handleDelete = (id: string, name: string, department: string) => {
    Swal.fire({
      html: `
        <div class="flex flex-col items-center pt-2 pb-2">
          <div class="w-[84px] h-[84px] bg-[#fff1f2] rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
          <h2 class="text-[24px] font-bold text-[#1e293b] mb-6">ยืนยันการลบข้อมูล</h2>
          <p class="text-[#64748b] text-[17px] mb-5">คุณต้องการลบข้อมูลของ</p>
          <p class="text-[22px] font-bold text-[#1e293b] mb-5">${name}</p>
          <p class="text-[#64748b] text-[17px]">แผนก ${department} ออกจากระบบใช่หรือไม่?</p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-[24px] p-6 pb-8 w-full max-w-[480px]',
        confirmButton:
          'bg-[#ff3b30] hover:bg-[#ff2d20] text-white px-10 py-3.5 rounded-[12px] font-medium text-[17px] transition-colors',
        cancelButton:
          'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] px-10 py-3.5 rounded-[12px] font-medium text-[17px] transition-colors mr-3',
        actions: 'w-full flex justify-center mt-8',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        deleteEmployee(id, {
          onSuccess: () => {
            Swal.fire(
              'ลบสำเร็จ!',
              'ข้อมูลพนักงานถูกลบออกจากระบบแล้ว',
              'success',
            );
            refetch();
          },
        });
      }
    });
  };

  const handleToggleStatus = (emp: any) => {
    const newStatus = emp.status !== 'active';
    const actionText = newStatus ? 'เปิด' : 'ระงับ';

    Swal.fire({
      title: `ยืนยันการ${actionText}การใช้งาน`,
      text: `คุณต้องการ${actionText}การใช้งานของพนักงาน ${emp.firstName} ${emp.lastName} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#22c55e' : '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `ยืนยันการ${actionText}`,
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        updateEmployeeStatus(
          { id: emp.id, isActive: newStatus },
          {
            onSuccess: () => {
              Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: `บันทึกสถานะเรียบร้อยแล้ว`,
                timer: 1500,
                showConfirmButton: false,
              });
              refetch();
            },
            onError: () => {
              Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
            },
          },
        );
      }
    });
  };

  const handleEditClick = (emp: any) => {
    router.push(`/dashboard/hr/employees/edit?id=${emp.id}`);
  };

  // Removed strict user check as DashboardShell already handles role-based routing
  if (!user) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="h-64 w-full bg-slate-200 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto min-h-screen pb-12 px-3 sm:px-5 md:px-8 pt-4 md:pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-1">
            <Users className="w-7 h-7 sm:w-10 sm:h-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-slate-700 leading-tight">
              จัดการข้อมูลพนักงาน
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              เพิ่ม ลบ แก้ไข ข้อมูลพนักงานและข้อมูลติดต่อในระบบ
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/hr/employees/add"
          className="flex items-center gap-2 sm:gap-3 bg-[#091136] hover:bg-[#152366] text-white px-4 sm:px-5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
        >
          <UserPlus
            className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
            strokeWidth={1.5}
          />
          <span className="text-sm sm:text-[17px] font-medium tracking-wide">
            เพิ่มพนักงานใหม่
          </span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อ,รหัสพนักงาน,อีเมล...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-300 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none w-full bg-slate-50 border-none px-4 py-2 pr-10 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-300 cursor-pointer"
            >
              <option value="all">ทุกแผนก</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none"
              strokeWidth={3}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="py-4 px-6 font-medium whitespace-nowrap">
                  รหัสพนักงาน
                </th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">
                  ชื่อ
                </th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">
                  นามสกุล
                </th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">
                  แผนก/ตำแหน่ง
                </th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">
                  อีเมล
                </th>
                <th className="py-4 px-8 font-medium whitespace-nowrap">
                  สถานะ
                </th>
                <th className="py-4 px-6 font-medium whitespace-nowrap text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6 text-slate-500">
                      {emp.employeeId}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 whitespace-nowrap">
                          {emp.firstName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-600 whitespace-nowrap">
                        {emp.lastName}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-600">
                          {emp.departmentName || '-'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {emp.positionName || '-'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <a
                        href={`mailto:${emp.email}`}
                        className="text-slate-400 hover:text-slate-600 hover:underline"
                      >
                        {emp.email}
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full whitespace-nowrap">
                          ทำงานปกติ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-500 text-xs font-bold rounded-full whitespace-nowrap">
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <IconButton action="view" icon={Power} label={emp.status === 'active' ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'} size="icon-sm" onClick={() => handleToggleStatus(emp)} />
                        <IconButton action="edit" icon={SquarePen} label="แก้ไขพนักงาน" size="icon-sm" onClick={() => handleEditClick(emp)} />
                        <IconButton action="view" icon={Wallet} label="ปรับปรุงยอดวันลา" size="icon-sm" onClick={() => handleOpenBalanceModal(emp)} />
                        <IconButton action="delete" icon={Trash2} label="ลบพนักงาน" size="icon-sm" onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`, emp.departmentName || '')} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Leave Balance Modal */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
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
                {selectedEmployeeBalances?.firstName}{' '}
                {selectedEmployeeBalances?.lastName}
              </p>
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {isFetchingBalances ? (
              <p className="text-center text-slate-500 py-8">
                กำลังโหลดข้อมูลวันลา...
              </p>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h3 className="font-bold text-slate-700">รายการสิทธิการลา</h3>
                  <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                    <button
                      onClick={async () => {
                        try {
                          await hrApi.initializeLeaveBalances(
                            selectedEmployeeBalances.id,
                          );
                          Swal.fire({
                            icon: 'success',
                            title: 'สร้างข้อมูลสำเร็จ',
                            text: 'โควตาวันลาถูกสร้าง/ซิงค์เรียบร้อยแล้ว',
                            timer: 1500,
                            showConfirmButton: false,
                          });
                          handleOpenBalanceModal(selectedEmployeeBalances);
                        } catch (e) {
                          Swal.fire(
                            'ข้อผิดพลาด',
                            'ไม่สามารถสร้างข้อมูลวันลาได้',
                            'error',
                          );
                        }
                      }}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                      สร้างข้อมูล/ซิงค์ (ปีปัจจุบัน)
                    </button>
                    <button
                      onClick={async () => {
                        const result = await Swal.fire({
                          title: 'ยืนยันการรีเซ็ต?',
                          text: 'คุณต้องการรีเซ็ตประวัติการใช้โควตาทั้งหมดกลับเป็น 0 สำหรับพนักงานคนนี้หรือไม่? (เริ่มต้นใหม่)',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          cancelButtonColor: '#94a3b8',
                          confirmButtonText: 'ใช่, รีเซ็ตเลย',
                          cancelButtonText: 'ยกเลิก',
                          reverseButtons: true,
                        });

                        if (result.isConfirmed) {
                          try {
                            await hrApi.resetLeaveBalances(
                              selectedEmployeeBalances.id,
                            );
                            Swal.fire({
                              icon: 'success',
                              title: 'สำเร็จ',
                              text: 'รีเซ็ตโควตาเรียบร้อยแล้ว',
                              timer: 1500,
                              showConfirmButton: false,
                            });
                            handleOpenBalanceModal(selectedEmployeeBalances);
                          } catch (e) {
                            Swal.fire(
                              'ข้อผิดพลาด',
                              'ไม่สามารถทำรายการได้',
                              'error',
                            );
                          }
                        }
                      }}
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
                                  สิทธิวันลา (ทั้งหมด):
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
                                          ? balance.totalDays
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
                                          ? balance.remainingDays
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
              <ActionButton action="cancel" onClick={() => setIsBalanceModalOpen(false)}>ยกเลิก</ActionButton>
              <ActionButton action="save" onClick={handleSaveAllBalances}>บันทึกการแก้ไข</ActionButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
