'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Employee } from '@/lib/api/types';
import Link from 'next/link';
import { hrApi } from '@/lib/api';
import { EditEmployeeModal } from '@/components/hr/employees/EditEmployeeModal';
import { LeaveBalanceModal } from '@/components/hr/employees/LeaveBalanceModal';
import { escapeHtml } from '@/lib/escapeHtml';
import { roleForPosition } from '@/lib/roleForPosition';

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const {
    useEmployeesQuery,
    useDeleteEmployeeMutation,
    useUpdateEmployeeMutation,
    useUpdateEmployeeStatusMutation,
  } = useEmployee();

  const { data: employees = [], isLoading, refetch } = useEmployeesQuery();
  const { mutate: deleteEmployee } = useDeleteEmployeeMutation();
  const { mutate: updateEmployee } = useUpdateEmployeeMutation();
  const { mutate: updateEmployeeStatus } = useUpdateEmployeeStatusMutation();

  const { data: departmentsData = [] } = useDepartmentsQuery();
  const { data: positionsData = [] } = usePositionsQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Employee Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Position and role when the modal opened (the modal updates roleName as soon
  // as another position is picked, so compare against these).
  const [originalPositionId, setOriginalPositionId] = useState('');
  const [originalRoleName, setOriginalRoleName] = useState('');
  const [editingEmployee, setEditingEmployee] = useState({
    id: '',
    employeeId: '',
    username: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    departmentName: '',
    positionId: '',
    positionName: '',
    phone: '',
    email: '',
    address: '',
    roleName: '',
    joinDate: '',
    gender: 'Unspecified',
    firstNameEN: '',
    lastNameEN: '',
    idCardNumber: '',
    dateOfBirth: '',
    idCardAddress: '',
    currentAddress: '',
  });

  const availableEditPositions = editingEmployee?.departmentId
    ? positionsData.filter(
        (p) =>
          !p.department?.id ||
          String(p.department?.id) === String(editingEmployee.departmentId),
      )
    : positionsData;

  // Leave Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedEmployeeBalances, setSelectedEmployeeBalances] =
    useState<Employee | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<{
    id: string;
    leaveTypeId?: string;
    year?: number;
    usedDays?: number;
    remainingDays?: number;
    totalDays?: number;
  }[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{
    id: string;
    name?: string;
    defaultDays?: number;
    isConfirmed?: boolean;
  }[]>([]);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [editedRemainingBalances, setEditedRemainingBalances] = useState<{
    [id: string]: number;
  }>({});
  const [editedTotalBalances, setEditedTotalBalances] = useState<{
    [id: string]: number;
  }>({});

  const handleOpenBalanceModal = async (emp: Employee) => {
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
          Array.isArray(typesData)
            ? typesData
            : (typesData as { data?: typeof leaveTypes }).data || [],
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
        handleOpenBalanceModal(selectedEmployeeBalances!);
      } else {
        setIsBalanceModalOpen(false);
      }
    } catch {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถปรับปรุงยอดวันลาได้', 'error');
    }
  };

  const handleInitializeBalances = async () => {
    try {
      await hrApi.initializeLeaveBalances(selectedEmployeeBalances!.id);
      Swal.fire({
        icon: 'success',
        title: 'สร้างข้อมูลสำเร็จ',
        text: 'โควตาวันลาถูกสร้าง/ซิงค์เรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      handleOpenBalanceModal(selectedEmployeeBalances!);
    } catch {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถสร้างข้อมูลวันลาได้', 'error');
    }
  };

  const handleResetBalanceUsage = async () => {
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
        await hrApi.resetLeaveBalances(selectedEmployeeBalances!.id);
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'รีเซ็ตโควตาเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        handleOpenBalanceModal(selectedEmployeeBalances!);
      } catch {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถทำรายการได้', 'error');
      }
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = filteredEmployees.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

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
          <p class="text-[22px] font-bold text-[#1e293b] mb-5">${escapeHtml(name)}</p>
          <p class="text-[#64748b] text-[17px]">แผนก ${escapeHtml(department)} ออกจากระบบใช่หรือไม่?</p>
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

  const handleToggleStatus = (emp: Employee) => {
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

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee({
      id: emp.id,
      employeeId: emp.employeeId,
      username: emp.username || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      departmentId: emp.departmentId || '',
      departmentName: emp.departmentName || '',
      positionId: emp.positionId || '',
      positionName: emp.positionName || '',
      phone: emp.phone || '',
      email: emp.email || '',
      address: emp.address || '',
      roleName:
        emp.role && typeof emp.role === 'string'
          ? emp.role.toLowerCase() === 'hr'
            ? 'HR'
            : emp.role.toLowerCase() === 'ceo'
              ? 'CEO'
              : emp.role.charAt(0).toUpperCase() + emp.role.slice(1)
          : 'User',
      joinDate: emp.hireDate ? emp.hireDate.split('T')[0] : emp.joinDate || '',
      gender: emp.gender || 'Unspecified',
      firstNameEN: emp.firstNameEN || '',
      lastNameEN: emp.lastNameEN || '',
      idCardNumber: emp.idCardNumber || '',
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
      idCardAddress: emp.idCardAddress || '',
      currentAddress: emp.currentAddress || '',
    });
    setOriginalPositionId(emp.positionId || '');
    setOriginalRoleName(
      emp.role && typeof emp.role === 'string'
        ? emp.role.toLowerCase() === 'hr'
          ? 'HR'
          : emp.role.toLowerCase() === 'ceo'
            ? 'CEO'
            : emp.role.charAt(0).toUpperCase() + emp.role.slice(1)
        : 'User',
    );
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (
      !editingEmployee.employeeId ||
      !editingEmployee.firstName ||
      !editingEmployee.lastName ||
      !editingEmployee.email
    ) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error');
      return;
    }

    // Moving to another position changes the role (server rule), which signs
    // the employee out. Warn HR before saving.
    if (
      editingEmployee.positionId &&
      editingEmployee.positionId !== originalPositionId
    ) {
      const pos = positionsData.find(
        (p) => String(p.id) === String(editingEmployee.positionId),
      );
      const currentRole = originalRoleName;
      const nextRole =
        (pos?.role as { name?: string } | undefined)?.name ||
        roleForPosition(
          pos?.name || pos?.title,
          pos?.department?.name || pos?.departmentName || editingEmployee.departmentName,
          currentRole,
        );
      if (pos && nextRole !== currentRole) {
        const { isConfirmed } = await Swal.fire({
          icon: 'warning',
          title: 'ยืนยันการเปลี่ยนตำแหน่ง',
          text: `ตำแหน่งใหม่ "${pos.name || pos.title}" จะเปลี่ยนสิทธิ์ของ ${editingEmployee.firstName} ${editingEmployee.lastName} จาก ${currentRole} เป็น ${nextRole} พนักงานจะถูกออกจากระบบ และต้องเข้าสู่ระบบใหม่เพื่อใช้งานด้วยสิทธิ์ใหม่`,
          showCancelButton: true,
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#94a3b8',
          confirmButtonText: 'ยืนยันและบันทึก',
          cancelButtonText: 'ยกเลิก',
        });
        if (!isConfirmed) return;
      }
    }

    const empData: Partial<Employee> & {
      username?: string;
      employeeCode?: string;
      hireDate?: string;
      gender?: string;
      phone?: string;
      roleName?: string;
    } = {
      employeeCode: editingEmployee.employeeId,
      username: editingEmployee.username,
      firstName: editingEmployee.firstName,
      lastName: editingEmployee.lastName,
      email: editingEmployee.email,
      phone: editingEmployee.phone,
      departmentId: editingEmployee.departmentId,
      positionId: editingEmployee.positionId,
      roleName: editingEmployee.roleName,
      hireDate: editingEmployee.joinDate,
      gender: editingEmployee.gender,
    };

    updateEmployee(
      { id: editingEmployee.id, data: empData },
      {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว',
            showConfirmButton: false,
            timer: 1500,
          });
          setIsEditModalOpen(false);
          refetch();
        },
        onError: (err) => {
          console.error('Update failed:', err);
          Swal.fire(
            'ข้อผิดพลาด',
            (err as { message?: string })?.message || 'ไม่สามารถอัปเดตข้อมูลได้',
            'error',
          );
        },
      },
    );
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            จัดการข้อมูลพนักงาน
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            เพิ่ม ลบ แก้ไข ข้อมูลพนักงานและข้อมูลติดต่อในระบบ
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto">
      {/* Header Action */}
      <div className="flex justify-end mb-6">
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
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, อีเมล..."
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
                  แผนก / ตำแหน่ง
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
                paginatedEmployees.map((emp) => (
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
                          ปิดการใช้งาน
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          title={
                            emp.status === 'active'
                              ? 'ระงับการใช้งาน'
                              : 'เปิดการใช้งาน'
                          }
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            emp.status === 'active'
                              ? 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'
                              : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600'
                          }`}
                        >
                          <Power className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleEditClick(emp)}
                          title="แก้ไข"
                          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <SquarePen className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleOpenBalanceModal(emp)}
                          title="ปรับปรุงยอดวันลา"
                          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                        >
                          <Wallet className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              emp.id,
                              `${emp.firstName} ${emp.lastName}`,
                              emp.departmentName || '',
                            )
                          }
                          title="ลบพนักงาน"
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer border border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredEmployees.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500">
              แสดง {(safePage - 1) * itemsPerPage + 1}
              {' - '}
              {Math.min(safePage * itemsPerPage, filteredEmployees.length)}
              {' จากทั้งหมด '}
              {filteredEmployees.length} คน
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                ก่อนหน้า
              </button>
              <span className="text-sm font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ถัดไป
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingEmployee={editingEmployee}
        setEditingEmployee={setEditingEmployee}
        departmentsData={departmentsData}
        availableEditPositions={availableEditPositions}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateEmployee}
      />

      {/* Leave Balance Modal */}
      <LeaveBalanceModal
        open={isBalanceModalOpen}
        onOpenChange={setIsBalanceModalOpen}
        employee={selectedEmployeeBalances}
        isFetching={isFetchingBalances}
        leaveTypes={leaveTypes}
        leaveBalances={leaveBalances}
        editedTotalBalances={editedTotalBalances}
        setEditedTotalBalances={setEditedTotalBalances}
        editedRemainingBalances={editedRemainingBalances}
        setEditedRemainingBalances={setEditedRemainingBalances}
        onInitialize={handleInitializeBalances}
        onResetUsage={handleResetBalanceUsage}
        onCancel={() => setIsBalanceModalOpen(false)}
        onSave={handleSaveAllBalances}
      />
        </div>
      </div>
    </div>
  );
}
