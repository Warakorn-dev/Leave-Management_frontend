'use client';

import { Edit, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DatePicker } from '@/components/DateAndTime';
import type { Department, Position } from '@/lib/api/types';

export interface EditEmployeeForm {
  id: string;
  employeeId: string;
  username: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  phone: string;
  email: string;
  address: string;
  roleName: string;
  joinDate: string;
  gender: string;
  firstNameEN: string;
  lastNameEN: string;
  idCardNumber: string;
  dateOfBirth: string;
  idCardAddress: string;
  currentAddress: string;
}

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmployee: EditEmployeeForm;
  setEditingEmployee: React.Dispatch<React.SetStateAction<EditEmployeeForm>>;
  departmentsData: Department[];
  availableEditPositions: Position[];
  onCancel: () => void;
  onSubmit: () => void;
}

/** "แก้ไขข้อมูลพนักงาน" dialog used on the HR employees list. */
export function EditEmployeeModal({
  open,
  onOpenChange,
  editingEmployee,
  setEditingEmployee,
  departmentsData,
  availableEditPositions,
  onCancel,
  onSubmit,
}: EditEmployeeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-y-auto max-h-[90vh] rounded-[24px]">
        {/* Header */}
        <div className="bg-[#091136] px-8 py-6 flex items-center gap-4 text-white">
          <Edit className="w-8 h-8" strokeWidth={1.5} />
          <h2 className="text-[26px] font-medium tracking-wide">
            แก้ไขข้อมูลพนักงาน
          </h2>
        </div>

        {/* Form Body */}
        <div className="p-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ชื่อ
              </label>
              <input
                type="text"
                placeholder="ชื่อ"
                value={editingEmployee.firstName}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    firstName: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                นามสกุล
              </label>
              <input
                type="text"
                placeholder="นามสกุล"
                value={editingEmployee.lastName}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    lastName: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ชื่อ (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={editingEmployee.firstNameEN}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    firstNameEN: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                นามสกุล (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={editingEmployee.lastNameEN}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    lastNameEN: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                รหัสพนักงาน
              </label>
              <input
                type="text"
                placeholder="เช่น EMP-002"
                value={editingEmployee.employeeId}
                readOnly
                className="w-full bg-slate-100 border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-500 cursor-not-allowed transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เลขบัตรประชาชน
              </label>
              <input
                type="text"
                placeholder="เลข 13 หลัก"
                value={editingEmployee.idCardNumber}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly.length <= 13) {
                    setEditingEmployee({
                      ...editingEmployee,
                      idCardNumber: digitsOnly,
                    });
                  }
                }}
                maxLength={13}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                วันเกิด
              </label>
              <DatePicker
                selected={
                  editingEmployee.dateOfBirth
                    ? new Date(editingEmployee.dateOfBirth)
                    : null
                }
                onChange={(date: Date | null) => {
                  setEditingEmployee({
                    ...editingEmployee,
                    dateOfBirth: date ? date.toLocaleDateString('en-CA') : '',
                  });
                }}
                placeholderText="เลือกวันเกิด"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                แผนก
              </label>
              <div className="relative">
                <select
                  value={editingEmployee.departmentId}
                  onChange={(e) => {
                    const selectedDept = departmentsData.find(
                      (d) => String(d.id) === e.target.value,
                    );
                    setEditingEmployee({
                      ...editingEmployee,
                      departmentId: e.target.value,
                      departmentName: selectedDept ? selectedDept.name : '',
                      positionId: '',
                      positionName: '',
                    });
                  }}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 cursor-pointer"
                >
                  <option value="" disabled>
                    -- กรุณาเลือกแผนก --
                  </option>
                  {departmentsData.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เพศ
              </label>
              <div className="relative">
                <select
                  value={editingEmployee.gender}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      gender: e.target.value,
                    })
                  }
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 cursor-pointer"
                >
                  <option value="Unspecified">ไม่ระบุ</option>
                  <option value="Male">ชาย</option>
                  <option value="Female">หญิง</option>
                </select>
                <ChevronDown
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ตำแหน่ง
              </label>
              <div className="relative">
                <select
                  value={editingEmployee.positionId}
                  onChange={(e) => {
                    const selectedPos = availableEditPositions.find(
                      (p) => String(p.id) === e.target.value,
                    );
                    const posName = selectedPos
                      ? selectedPos.title || selectedPos.name || ''
                      : '';
                    // Only a Leader position is a department head (business rule).
                    const isLeaderOrManager = posName
                      .toLowerCase()
                      .includes('leader');

                    const deptName =
                      selectedPos?.department?.name ||
                      editingEmployee.departmentName ||
                      '';
                    const isHRDept =
                      deptName.toLowerCase().includes('hr') ||
                      deptName.toLowerCase().includes('human resource');

                    let roleName = 'Employee';
                    if (isHRDept) {
                      roleName = 'HR';
                    } else if (editingEmployee.roleName === 'CEO') {
                      roleName = 'CEO';
                    } else if (isLeaderOrManager) {
                      roleName = 'Manager';
                    }

                    setEditingEmployee({
                      ...editingEmployee,
                      positionId: e.target.value,
                      positionName: posName,
                      roleName: roleName,
                      ...(selectedPos?.department &&
                      !editingEmployee.departmentId
                        ? {
                            departmentId: String(selectedPos.department.id),
                            departmentName: selectedPos.department.name || '',
                          }
                        : {}),
                    });
                  }}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 cursor-pointer"
                >
                  <option value="" disabled>
                    -- กรุณาเลือกตำแหน่ง --
                  </option>
                  {availableEditPositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title || pos.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                placeholder="098-456-7899"
                value={editingEmployee.phone}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    phone: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                อีเมล
              </label>
              <input
                type="email"
                placeholder="example@nid.co.th"
                value={editingEmployee.email}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    email: e.target.value,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ที่อยู่ตามบัตรประชาชน
              </label>
              <textarea
                placeholder="กรอกที่อยู่ตามบัตรประชาชน"
                value={editingEmployee.idCardAddress}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    idCardAddress: e.target.value,
                  })
                }
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 resize-none"
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ที่อยู่ปัจจุบัน
              </label>
              <textarea
                placeholder="กรอกที่อยู่ปัจจุบัน"
                value={editingEmployee.currentAddress}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    currentAddress: e.target.value,
                  })
                }
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 resize-none"
              ></textarea>
            </div>

            <div className="space-y-3 md:col-span-2 md:w-[calc(50%-1.5rem)]">
              <label className="block text-[#475569] font-medium text-[17px]">
                วันที่เริ่มทำงาน
              </label>
              <DatePicker
                selected={
                  editingEmployee.joinDate
                    ? new Date(editingEmployee.joinDate)
                    : null
                }
                onChange={(date: Date | null) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    joinDate: date ? date.toLocaleDateString('en-CA') : '',
                  })
                }
                placeholderText="YYYY-MM-DD"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end items-center gap-4 mt-10 pb-2">
            <button
              onClick={onCancel}
              className="px-8 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#0f172a] rounded-xl font-medium text-[17px] transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={onSubmit}
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
