'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Users,
  User,
  Calculator,
  Shield,
  Megaphone,
  Headset,
  Monitor,
  FolderKanban,
  Crown,
  Code,
  PenTool,
  Award,
  Star,
} from 'lucide-react';
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
import { Department, Position, Employee } from '@/lib/api/types';

// Helper functions for dynamic icons and colors based on name
const getDepartmentStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('human') || n.includes('hr') || n.includes('personnel'))
    return {
      icon: Users,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/60 shadow-xs',
    };
  if (n.includes('account') || n.includes('finance'))
    return {
      icon: Calculator,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/60 shadow-xs',
    };
  if (n.includes('admin'))
    return {
      icon: Shield,
      colorClass: 'text-slate-600 dark:text-slate-200',
      bgClass: 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xs',
    };
  if (n.includes('sale') || n.includes('market'))
    return {
      icon: Megaphone,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/60 shadow-xs',
    };
  if (n.includes('support') || n.includes('service'))
    return {
      icon: Headset,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700/60 shadow-xs',
    };
  if (n.includes('it') || n.includes('information') || n.includes('tech'))
    return {
      icon: Monitor,
      colorClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/60 shadow-xs',
    };
  if (n.includes('project'))
    return {
      icon: FolderKanban,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/60 shadow-xs',
    };
  return {
    icon: Building2,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/60 shadow-xs',
  };
};

const getPositionStyle = (name: string) => {
  const n = name.toLowerCase();
  if (
    n.includes('ceo') ||
    n.includes('director') ||
    n.includes('chief') ||
    n.includes('leader') ||
    n.includes('manager') ||
    n.includes('head')
  )
    return {
      icon: Crown,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/60 shadow-xs',
    };
  if (n.includes('senior') || n.includes('sr'))
    return {
      icon: Star,
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/60 shadow-xs',
    };
  if (n.includes('dev') || n.includes('program') || n.includes('engineer'))
    return {
      icon: Code,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/60 shadow-xs',
    };
  if (n.includes('design') || n.includes('graphic'))
    return {
      icon: PenTool,
      colorClass: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgClass: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-700/60 shadow-xs',
    };
  if (n.includes('account') || n.includes('finance'))
    return {
      icon: Calculator,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/60 shadow-xs',
    };
  if (
    n.includes('support') ||
    n.includes('service') ||
    n.includes('operator') ||
    n.includes('sso')
  )
    return {
      icon: Headset,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700/60 shadow-xs',
    };
  if (n.includes('hr') || n.includes('human') || n.includes('personnel'))
    return {
      icon: Users,
      colorClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/60 shadow-xs',
    };
  return {
    icon: Briefcase,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/60 shadow-xs',
  };
};

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
    let result = departments.filter(
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
    let result = positions.filter((p) => {
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
  }, [positions, searchTerm, departmentFilter]);

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
        (p.role as any)?.name?.toLowerCase() === 'manager'
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
  }, [selectedDept, employees]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 px-4 sm:px-6 md:px-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            จัดการตำแหน่งและแผนก
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            เพิ่ม ลบ หรือแก้ไขข้อมูลแผนกและตำแหน่งงานภายในองค์กร
          </p>
        </div>
      </div>

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
          แผนก (Departments)
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
          ตำแหน่ง (Positions)
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
                    <th className="px-6 py-4">รหัส (Code)</th>
                    <th className="px-6 py-4">ชื่อตำแหน่ง (Position)</th>
                    <th className="px-6 py-4">แผนกต้นสังกัด (Department)</th>
                    <th className="px-6 py-4">สิทธิ์การใช้งาน (Role)</th>
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
                      // count how many employees hold this position
                      const empsInPos = employees.filter(
                        (e) =>
                          e.positionId === pos.id ||
                          e.positionName === pos.name,
                      );
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
                                {(pos.role as any).name || pos.role}
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
                                      pos.roleId || (pos.role as any)?.id || '',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDept(null)}
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
                    พนักงานในแผนก {selectedDept.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    จำนวนทั้งหมด {selectedDeptEmployees.length} คน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {selectedDeptEmployees.length === 0 ? (
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
                  {selectedDeptEmployees.map((emp) => (
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
      )}

      {/* Modal / Popup สำหรับเพิ่มแผนกใหม่ */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddDeptModalOpen(false)}
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
                onClick={() => setIsAddDeptModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  รหัสแผนก (Code){' '}
                  <span className="text-emerald-500 text-xs">
                    (สร้างอัตโนมัติ)
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={newDept.code}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all dark:text-white text-slate-500 cursor-not-allowed font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อแผนก (Department Name){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDept.name}
                  onChange={(e) =>
                    setNewDept({ ...newDept, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="เช่น Information Technology"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
              <button
                onClick={() => setIsAddDeptModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateDepartment}
                disabled={!newDept.name}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm shadow-indigo-500/30 transition-all"
              >
                บันทึกแผนกใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup สำหรับเพิ่มตำแหน่งใหม่ */}
      {isAddPosModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddPosModalOpen(false)}
          ></div>

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    เพิ่มตำแหน่งใหม่
                  </h2>
                  <p className="text-sm text-slate-500">
                    สร้างตำแหน่งงานใหม่พร้อมระบุแผนกต้นสังกัด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPosModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อตำแหน่ง (Position Name){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPos.name}
                  onChange={(e) =>
                    setNewPos({ ...newPos, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="เช่น Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  แผนกต้นสังกัด (Department){' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPos.departmentId}
                  onChange={(e) =>
                    setNewPos({ ...newPos, departmentId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer dark:text-white"
                >
                  <option value="" disabled>
                    -- เลือกแผนกต้นสังกัด --
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  สิทธิ์การใช้งาน (Role)
                </label>
                {newPos.departmentId && checkHasManager(newPos.departmentId) ? (
                  <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400">
                    แผนกนี้มี Manager แล้ว (สิทธิ์ User จะถูกใช้เป็นค่าเริ่มต้น)
                  </div>
                ) : (
                  <select
                    value={newPos.roleId}
                    onChange={(e) =>
                      setNewPos({ ...newPos, roleId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer dark:text-white"
                  >
                    <option value="">
                      -- ไม่ระบุ (ใช้ค่าเริ่มต้น: User) --
                    </option>
                    {roles
                      .filter((r) => r.name.toLowerCase() === 'manager')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  รหัสตำแหน่ง (Code){' '}
                  <span className="text-emerald-500 text-xs">
                    (สร้างอัตโนมัติ)
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={newPos.code}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all dark:text-white text-slate-500 cursor-not-allowed font-mono tracking-wider"
                />
                <p className="text-xs text-slate-400 mt-1">
                  รหัสจะถูกสร้างจากรหัสแผนก 2 หลักหน้า + ลำดับตำแหน่ง 3 หลักหลัง
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
              <button
                onClick={() => setIsAddPosModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreatePosition}
                disabled={!newPos.name || !newPos.departmentId}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm shadow-indigo-500/30 transition-all"
              >
                บันทึกตำแหน่งใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup สำหรับแก้ไขแผนก */}
      {isEditDeptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditDeptModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                แก้ไขแผนก
              </h3>
              <button
                onClick={() => setIsEditDeptModalOpen(false)}
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
                  value={editDept.code}
                  onChange={(e) =>
                    setEditDept({
                      ...editDept,
                      code: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="เช่น 12345 (เว้นว่างไว้ระบบจะสุ่มให้)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อแผนก (Department Name){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDept.name}
                  onChange={(e) =>
                    setEditDept({ ...editDept, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
              <button
                onClick={() => setIsEditDeptModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateDepartment}
                disabled={!editDept.name}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm shadow-indigo-500/30 transition-all"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup สำหรับแก้ไขตำแหน่ง */}
      {isEditPosModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditPosModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                แก้ไขตำแหน่ง
              </h3>
              <button
                onClick={() => setIsEditPosModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  รหัสตำแหน่ง (Code)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={editPos.code}
                  onChange={(e) =>
                    setEditPos({
                      ...editPos,
                      code: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="เช่น 12345 (เว้นว่างไว้ระบบจะสุ่มให้)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อตำแหน่ง (Position Title){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPos.name}
                  onChange={(e) =>
                    setEditPos({ ...editPos, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  แผนกต้นสังกัด <span className="text-red-500">*</span>
                </label>
                <select
                  value={editPos.departmentId}
                  onChange={(e) =>
                    setEditPos({ ...editPos, departmentId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer dark:text-white"
                >
                  <option value="" disabled>
                    -- เลือกแผนกต้นสังกัด --
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  สิทธิ์การใช้งาน (Role)
                </label>
                {editPos.departmentId &&
                checkHasManager(editPos.departmentId, editPos.id) ? (
                  <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400">
                    แผนกนี้มี Manager แล้ว (สิทธิ์ User จะถูกใช้เป็นค่าเริ่มต้น)
                  </div>
                ) : (
                  <select
                    value={editPos.roleId}
                    onChange={(e) =>
                      setEditPos({ ...editPos, roleId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer dark:text-white"
                  >
                    <option value="">
                      -- ไม่ระบุ (ใช้ค่าเริ่มต้น: User) --
                    </option>
                    {roles
                      .filter((r) => r.name.toLowerCase() === 'manager')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
              <button
                onClick={() => setIsEditPosModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdatePosition}
                disabled={!editPos.name || !editPos.departmentId}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm shadow-indigo-500/30 transition-all"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteConfirmModalOpen(false)}
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
                  {itemToDelete.name}
                </span>{' '}
                ?
                <br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
              <button
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-500/30 transition-all"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
