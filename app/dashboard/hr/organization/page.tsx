'use client';

import React, { useState, useMemo } from 'react';
import { Building2, Briefcase, Plus, Search, Edit } from 'lucide-react';
import {
  useDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '@/hooks/useDepartment';
import {
  usePositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} from '@/hooks/usePosition';
import { useEmployeesQuery } from '@/hooks/useEmployee';
import { useRolesQuery } from '@/hooks/useRoles';
import { Department } from '@/lib/api/types';
import { getDepartmentStyle, getPositionStyle } from '@/lib/orgStyles';
import { DepartmentEmployeesModal } from '@/components/hr/organization/DepartmentEmployeesModal';
import { AddDepartmentModal } from '@/components/hr/organization/AddDepartmentModal';
import { AddPositionModal } from '@/components/hr/organization/AddPositionModal';
import { EditDepartmentModal } from '@/components/hr/organization/EditDepartmentModal';
import { EditPositionModal } from '@/components/hr/organization/EditPositionModal';
import { DeleteConfirmModal } from '@/components/hr/organization/DeleteConfirmModal';

export default function OrganizationManagementPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'positions'>(
    'departments',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Modal states for adding
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);

  // Form states
  const [newDept, setNewDept] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [newPos, setNewPos] = useState({
    code: '',
    name: '',
    departmentId: '',
    roleId: '',
  });

  // Modal states for edit/delete
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [isEditPosModalOpen, setIsEditPosModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: 'department' | 'position';
  } | null>(null);

  const [editDept, setEditDept] = useState({
    id: '',
    name: '',
    code: '',
    description: '',
  });
  const [editPos, setEditPos] = useState({
    id: '',
    name: '',
    departmentId: '',
    code: '',
    roleId: '',
  });

  // Fetch real data
  const {
    data: departments = [],
    isLoading: isLoadingDept,
    refetch: refetchDept,
  } = useDepartmentsQuery();
  const {
    data: positions = [],
    isLoading: isLoadingPos,
    refetch: refetchPos,
  } = usePositionsQuery();
  const {
    data: employees = [],
    isLoading: isLoadingEmp,
    refetch: refetchEmp,
  } = useEmployeesQuery();
  const { data: roles = [] } = useRolesQuery();

  // Mutations
  const { mutateAsync: createDepartment } = useCreateDepartmentMutation();
  const { mutateAsync: createPosition } = useCreatePositionMutation();
  const { mutateAsync: updateDepartment } = useUpdateDepartmentMutation();
  const { mutateAsync: deleteDepartment } = useDeleteDepartmentMutation();
  const { mutateAsync: updatePosition } = useUpdatePositionMutation();
  const { mutateAsync: deletePosition } = useDeletePositionMutation();

  // Auto-generate Department Code
  React.useEffect(() => {
    if (isAddDeptModalOpen) {
      const maxCode = departments.reduce((max, d) => {
        const num = parseInt(d.code || '0', 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const nextCode = String(maxCode + 1).padStart(5, '0');
      setNewDept((prev) => ({ ...prev, code: nextCode }));
    } else {
      setNewDept({ code: '', name: '', description: '' });
    }
  }, [isAddDeptModalOpen, departments]);

  // Auto-generate Position Code based on selected Department
  React.useEffect(() => {
    if (isAddPosModalOpen && newPos.departmentId) {
      const dept = departments.find(
        (d) => String(d.id) === String(newPos.departmentId),
      );
      if (dept) {
        const deptNum = parseInt(dept.code || '0', 10);
        const deptPrefix = String(deptNum).padStart(2, '0').slice(-2);

        const deptPositions = positions.filter(
          (p) =>
            String(p.departmentId) === String(newPos.departmentId) ||
            (p.department &&
              String(p.department.id) === String(newPos.departmentId)),
        );

        let maxPosNum = 0;
        deptPositions.forEach((p) => {
          if (p.code && p.code.length >= 3) {
            const posNumStr = p.code.slice(-3);
            const posNum = parseInt(posNumStr, 10);
            if (!isNaN(posNum) && posNum > maxPosNum) {
              maxPosNum = posNum;
            }
          }
        });

        const nextPosNum = String(maxPosNum + 1).padStart(3, '0');
        setNewPos((prev) => ({ ...prev, code: `${deptPrefix}${nextPosNum}` }));
      }
    }
  }, [newPos.departmentId, isAddPosModalOpen, departments, positions]);

  const handleCreateDepartment = async () => {
    if (!newDept.name) return;
    try {
      await createDepartment({
        name: newDept.name,
        code: newDept.code || undefined,
      });
      setIsAddDeptModalOpen(false);
      setNewDept({ code: '', name: '', description: '' });
      refetchDept();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePosition = async () => {
    if (!newPos.name || !newPos.departmentId) return;

    try {
      const finalRoleId = checkHasManager(newPos.departmentId)
        ? undefined
        : newPos.roleId || undefined;
      await createPosition({
        name: newPos.name,
        departmentId: newPos.departmentId,
        code: newPos.code || undefined,
        roleId: finalRoleId,
      });
      setIsAddPosModalOpen(false);
      setNewPos({ code: '', name: '', departmentId: '', roleId: '' });
      refetchPos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editDept.name || !editDept.id) return;
    try {
      await updateDepartment({
        id: editDept.id,
        data: { name: editDept.name, code: editDept.code },
      });
      setIsEditDeptModalOpen(false);
      refetchDept();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePosition = async () => {
    if (!editPos.name || !editPos.id) return;
    try {
      const finalRoleId = checkHasManager(editPos.departmentId, editPos.id)
        ? undefined
        : editPos.roleId || undefined;
      await updatePosition({
        id: editPos.id,
        data: {
          name: editPos.name,
          departmentId: editPos.departmentId,
          code: editPos.code,
          roleId: finalRoleId,
        },
      });
      setIsEditPosModalOpen(false);
      refetchPos();
      refetchEmp();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'department') {
        await deleteDepartment(itemToDelete.id);
        refetchDept();
      } else {
        await deletePosition(itemToDelete.id);
        refetchPos();
      }
      refetchEmp();
      setIsDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Derived state for filtering
  const filteredDepartments = useMemo(() => {
    const result = departments.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase())),
    );
    return result.sort((a, b) => {
      const codeA = a.code ? parseInt(a.code, 10) : 999999;
      const codeB = b.code ? parseInt(b.code, 10) : 999999;
      return codeA - codeB;
    });
  }, [departments, searchTerm]);

  const filteredPositions = useMemo(() => {
    const result = positions.filter((p) => {
      const matchSearch =
        (p.name || p.title || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (p.departmentName || p.department?.name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchDept = true;
      if (departmentFilter !== 'all') {
        const selectedDept = departments.find((d) => d.id === departmentFilter);
        matchDept =
          p.departmentId === departmentFilter ||
          (selectedDept &&
            (p.departmentName || p.department?.name) === selectedDept.name) ||
          false;
      }

      return matchSearch && matchDept;
    });

    // Sort primarily by code (numerically)
    result.sort((a, b) => {
      const codeA = a.code ? parseInt(a.code, 10) : 999999;
      const codeB = b.code ? parseInt(b.code, 10) : 999999;

      if (codeA !== codeB) return codeA - codeB;

      // Secondary sort by name if code is the same
      return (a.name || a.title || '').localeCompare(b.name || b.title || '');
    });

    return result;
  }, [positions, searchTerm, departmentFilter, departments]);

  // Helper to get employees in a specific department
  const getEmployeesInDept = (deptName: string, deptId: string) => {
    return employees.filter(
      (emp) => emp.departmentId === deptId || emp.departmentName === deptName,
    );
  };

  // Helper to get positions in a specific department
  const getPositionsInDept = (deptName: string, deptId: string) => {
    return positions.filter(
      (pos) => pos.departmentId === deptId || pos.departmentName === deptName,
    );
  };

  // Helper to check if a department already has a Manager
  const checkHasManager = (deptId: string, excludePositionId?: string) => {
    if (!deptId) return false;
    const managerRole = roles.find((r) => r.name.toLowerCase() === 'manager');
    if (!managerRole) return false;

    return positions.some((p) => {
      const isSameDept =
        p.departmentId === deptId || p.department?.id === deptId;
      if (!isSameDept) return false;
      if (excludePositionId && p.id === excludePositionId) return false;
      return (
        p.roleId === managerRole.id ||
        (p.role as { name?: string } | undefined)?.name?.toLowerCase() === 'manager'
      );
    });
  };

  // Employee list for the selected department modal
  const selectedDeptEmployees = useMemo(() => {
    if (!selectedDept) return [];

    const emps = getEmployeesInDept(selectedDept.name, selectedDept.id);

    // Sort by rank: CEO > Leader/Manager > Senior > others
    return emps.sort((a, b) => {
      const getRank = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('ceo') || n.includes('chief')) return 1;
        if (
          n.includes('leader') ||
          n.includes('manager') ||
          n.includes('director') ||
          n.includes('head')
        )
          return 2;
        if (n.includes('senior') || n.includes('sr')) return 3;
        return 4;
      };

      const rankA = getRank(a.positionName || '');
      const rankB = getRank(b.positionName || '');

      if (rankA !== rankB) return rankA - rankB;

      // Secondary sort by first name
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getEmployeesInDept is a pure helper redefined each render, not a real dependency
  }, [selectedDept, employees]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            จัดการตำแหน่งและแผนก
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            เพิ่ม ลบ หรือแก้ไขข้อมูลแผนกและตำแหน่งงานภายในองค์กร
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="space-y-6 max-w-[1200px] mx-auto">

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'departments'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          แผนก
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'positions'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          ตำแหน่ง
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors outline-none"
            placeholder={`ค้นหา${activeTab === 'departments' ? 'แผนก' : 'ตำแหน่ง'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'positions' && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="block w-full sm:w-auto px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors outline-none cursor-pointer"
          >
            <option value="all">ทุกแผนก</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() =>
            activeTab === 'departments'
              ? setIsAddDeptModalOpen(true)
              : setIsAddPosModalOpen(true)
          }
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white font-medium transition-all shadow-sm shadow-opacity-20 hover:shadow-md hover:-translate-y-0.5 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30`}
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'departments' ? 'เพิ่มแผนกใหม่' : 'เพิ่มตำแหน่งใหม่'}
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
        {activeTab === 'departments' ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
              รายการแผนกทั้งหมด
            </h3>

            {isLoadingDept || isLoadingEmp || isLoadingPos ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                ไม่พบข้อมูลแผนก
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => {
                  const deptEmps = getEmployeesInDept(dept.name, dept.id);
                  const deptPos = getPositionsInDept(dept.name, dept.id);
                  const style = getDepartmentStyle(dept.name);
                  const DeptIcon = style.icon;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept)}
                      className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${style.bgClass} ${style.colorClass}`}
                        >
                          <DeptIcon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditDept({
                                id: dept.id,
                                name: dept.name,
                                code: dept.code || '',
                                description: dept.description || '',
                              });
                              setIsEditDeptModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                          รหัส: {dept.code || '-'}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {dept.name}
                      </h4>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-400">พนักงาน</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {deptEmps.length} คน
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">ตำแหน่ง</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {deptPos.length} ตำแหน่ง
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isLoadingPos ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">รหัส</th>
                    <th className="px-6 py-4">ชื่อตำแหน่ง</th>
                    <th className="px-6 py-4">แผนกต้นสังกัด</th>
                    <th className="px-6 py-4">สิทธิ์การใช้งาน</th>
                    <th className="px-6 py-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredPositions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        ไม่พบข้อมูลตำแหน่ง
                      </td>
                    </tr>
                  ) : (
                    filteredPositions.map((pos) => {
                      const style = getPositionStyle(
                        pos.name || pos.title || '',
                      );
                      const PosIcon = style.icon;

                      return (
                        <tr
                          key={pos.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono tracking-wider">
                              {pos.code || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bgClass} ${style.colorClass}`}
                              >
                                <PosIcon className="w-5 h-5" />
                              </div>
                              <div className="font-medium text-slate-700 dark:text-slate-200">
                                {pos.name || pos.title || 'Unknown Position'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                              {pos.departmentName ||
                                pos.department?.name ||
                                'ไม่ระบุแผนก'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {pos.role ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                {(pos.role as { name?: string } | undefined)?.name ||
                                  String(pos.role)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                ไม่มี
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditPos({
                                    id: pos.id,
                                    name: pos.name || pos.title || '',
                                    code: pos.code || '',
                                    departmentId:
                                      pos.departmentId ||
                                      pos.department?.id ||
                                      '',
                                    roleId:
                                      pos.roleId ||
                                      (pos.role as { id?: string } | undefined)?.id ||
                                      '',
                                  });
                                  setIsEditPosModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal / Popup สำหรับแสดงพนักงานในแผนก */}
      {selectedDept && (
        <DepartmentEmployeesModal
          department={selectedDept}
          employees={selectedDeptEmployees}
          onClose={() => setSelectedDept(null)}
        />
      )}

      {/* Modal / Popup สำหรับเพิ่มแผนกใหม่ */}
      {isAddDeptModalOpen && (
        <AddDepartmentModal
          form={newDept}
          setForm={setNewDept}
          onClose={() => setIsAddDeptModalOpen(false)}
          onSubmit={handleCreateDepartment}
        />
      )}

      {/* Modal / Popup สำหรับเพิ่มตำแหน่งใหม่ */}
      {isAddPosModalOpen && (
        <AddPositionModal
          form={newPos}
          setForm={setNewPos}
          departments={departments}
          roles={roles}
          hasManager={checkHasManager(newPos.departmentId)}
          onClose={() => setIsAddPosModalOpen(false)}
          onSubmit={handleCreatePosition}
        />
      )}

      {/* Modal / Popup สำหรับแก้ไขแผนก */}
      {isEditDeptModalOpen && (
        <EditDepartmentModal
          form={editDept}
          setForm={setEditDept}
          onClose={() => setIsEditDeptModalOpen(false)}
          onSubmit={handleUpdateDepartment}
        />
      )}

      {/* Modal / Popup สำหรับแก้ไขตำแหน่ง */}
      {isEditPosModalOpen && (
        <EditPositionModal
          form={editPos}
          setForm={setEditPos}
          departments={departments}
          roles={roles}
          hasManager={checkHasManager(editPos.departmentId, editPos.id)}
          onClose={() => setIsEditPosModalOpen(false)}
          onSubmit={handleUpdatePosition}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmModalOpen && itemToDelete && (
        <DeleteConfirmModal
          itemName={itemToDelete.name}
          onClose={() => setIsDeleteConfirmModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}
        </div>
      </div>
    </div>
  );
}
