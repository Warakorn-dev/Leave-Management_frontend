'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { useDepartmentsQuery } from '@/hooks/useDepartment';
import { usePositionsQuery } from '@/hooks/usePosition';
import { UserPlus, ArrowLeft, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { Employee } from '@/lib/api/types';
import { DatePicker } from '@/components/DateAndTime';

export default function AddEmployeePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { useCreateEmployeeMutation, useEmployeesQuery } = useEmployee();
  const { mutate: createEmployee } = useCreateEmployeeMutation();
  const [isLoading, setIsLoading] = useState(false);

  const { data: employees = [] } = useEmployeesQuery();
  const [employeeIdError, setEmployeeIdError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: positions = [] } = usePositionsQuery();

  console.log('RENDER AddEmployeePage', { departments, positions });

  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    firstName: '',
    lastName: '',
    firstNameEN: '',
    lastNameEN: '',
    idCardNumber: '',
    dateOfBirth: '',
    idCardAddress: '',
    currentAddress: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    departmentId: '',
    departmentName: '',
    positionId: '',
    positionName: '',
    roleName: 'Employee',
    joinDate: '',
    gender: 'Unspecified',
  });

  const availablePositions = formData.departmentId
    ? positions.filter(
        (p) =>
          !p.department?.id ||
          String(p.department?.id) === String(formData.departmentId),
      )
    : positions;

  useEffect(() => {
    const checkEmployeeId = () => {
      const trimmedId = formData.employeeId.trim().toLowerCase();
      if (!trimmedId) {
        setEmployeeIdError('');
        return;
      }

      try {
        const isDuplicate = employees.some(
          (emp) => emp.employeeId?.trim().toLowerCase() === trimmedId,
        );

        if (isDuplicate) {
          setEmployeeIdError(
            'รหัสพนักงานนี้มีอยู่ในระบบแล้ว กรุณาระบุรหัสพนักงานใหม่',
          );
        } else {
          setEmployeeIdError('');
        }
      } catch (error) {
        setEmployeeIdError(
          'ไม่สามารถตรวจสอบรหัสพนักงานได้ กรุณาลองใหม่อีกครั้ง',
        );
      }
    };

    checkEmployeeId();
  }, [formData.employeeId, employees]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // เบอร์โทร: ตัวเลขเท่านั้น สูงสุด 10 ตัว
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 10) return;
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }

    if (name === 'idCardNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 13) return;
      setFormData((prev) => ({ ...prev, idCardNumber: digitsOnly }));
      return;
    }

    // ชื่อ/นามสกุล: เฉพาะภาษาไทยและเว้นวรรค
    if (name === 'firstName' || name === 'lastName') {
      const thaiOnly = /^[ก-๙\s]*$/;
      if (!thaiOnly.test(value)) return;
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // ชื่อภาษาอังกฤษ/นามสกุลภาษาอังกฤษ: เฉพาะภาษาอังกฤษและเว้นวรรค
    if (name === 'firstNameEN' || name === 'lastNameEN') {
      const englishOnly = /^[A-Za-z\s]*$/;
      if (!englishOnly.test(value)) return;
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'departmentId') {
      const selectedDept = departments.find((d) => String(d.id) === value);
      setFormData((prev) => ({
        ...prev,
        departmentId: value,
        departmentName: selectedDept ? selectedDept.name : '',
        positionId: '',
        positionName: '',
      }));
    } else if (name === 'positionId') {
      const selectedPos = positions.find((p) => String(p.id) === value);
      const posName = selectedPos
        ? selectedPos.title || selectedPos.name || ''
        : '';

      const isLeaderOrManager =
        posName.toLowerCase().includes('leader') ||
        posName.toLowerCase().includes('manager');

      const deptName =
        selectedPos?.department?.name || formData.departmentName || '';
      const isHRDept =
        deptName.toLowerCase().includes('hr') ||
        deptName.toLowerCase().includes('human resource');

      let roleName = 'Employee';
      if (isHRDept) {
        roleName = 'HR';
      } else if (isLeaderOrManager) {
        roleName = 'Manager';
      }

      setFormData((prev) => ({
        ...prev,
        positionId: value,
        positionName: posName,
        roleName: roleName,
        ...(selectedPos?.department && !prev.departmentId
          ? {
              departmentId: String(selectedPos.department.id),
              departmentName: selectedPos.department.name || '',
            }
          : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (employeeIdError) {
      Swal.fire(
        'ข้อผิดพลาด',
        'กรุณาแก้ไขรหัสพนักงานให้ถูกต้องก่อนบันทึก',
        'error',
      );
      return;
    }

    if (
      !formData.employeeId ||
      !formData.title ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.password ||
      !formData.email ||
      !formData.departmentId ||
      !formData.positionId
    ) {
      Swal.fire(
        'ข้อมูลไม่ครบถ้วน',
        'กรุณากรอกข้อมูลที่จำเป็นให้ครบ (รวมถึงแผนกและตำแหน่ง)',
        'error',
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านให้ถูกต้อง', 'error');
      return;
    }

    const empData = {
      employeeCode: formData.employeeId,
      username: formData.username,
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      firstNameEN: formData.firstNameEN,
      lastNameEN: formData.lastNameEN,
      idCardNumber: formData.idCardNumber,
      dateOfBirth: formData.dateOfBirth
        ? new Date(formData.dateOfBirth).toISOString()
        : undefined,
      idCardAddress: formData.idCardAddress,
      currentAddress: formData.currentAddress,
      email: formData.email,
      departmentId: formData.departmentId,
      positionId: formData.positionId,
      roleName: formData.roleName,
      password: formData.password,
      phone: formData.phone,
      hireDate: formData.joinDate,
      gender: formData.gender,
    };

    setIsLoading(true);
    createEmployee(empData as any, {
      onSuccess: () => {
        setIsLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'เพิ่มพนักงานใหม่เรียบร้อยแล้ว',
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          router.push('/dashboard/hr/employees');
        });
      },
      onError: (err: any) => {
        setIsLoading(false);
        let errorMsg = err.response?.data?.message;
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg[0]; // take the first validation error
        } else if (!errorMsg) {
          errorMsg =
            err.response?.data?.error ||
            err.message ||
            'ไม่สามารถเพิ่มพนักงานได้';
        }
        Swal.fire('เกิดข้อผิดพลาด', errorMsg, 'error');
      },
    });
  };

  if (!user || user.role.toLowerCase() !== 'hr') return null;

  return (
    <div className="max-w-[1000px] mx-auto min-h-screen pb-12 px-3 sm:px-5 md:px-8 pt-4 md:pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/hr/employees"
            className="mt-1.5 text-slate-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-slate-700 leading-tight flex items-center gap-2 sm:gap-3">
              <UserPlus
                className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500"
                strokeWidth={2}
              />
              เพิ่มพนักงานใหม่
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ลงทะเบียนข้อมูลพนักงานและสร้างบัญชีผู้ใช้งานระบบ
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-5 sm:p-8 md:p-10">
        <form onSubmit={handleSubmit}>
          <div className="mb-6 md:mb-8 border-b border-slate-100 pb-3 md:pb-4">
            <h2 className="text-base md:text-lg font-semibold text-slate-700">
              ข้อมูลผู้ใช้งาน (Account Information)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-5 md:gap-y-6 mb-8 md:mb-10">
            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="เช่น user123"
                value={formData.username}
                onChange={handleChange}
                autoComplete="off"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                รหัสพนักงาน (Employee ID){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                placeholder="เช่น EMP-002"
                value={formData.employeeId}
                onChange={handleChange}
                className={`w-full bg-[#f8fafc] border ${employeeIdError ? 'border-red-500 focus:ring-red-100' : 'border-[#e2e8f0] focus:ring-blue-100'} px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-[#94a3b8]`}
                required
              />
              {employeeIdError && (
                <p className="text-red-500 text-sm mt-1">{employeeIdError}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                รหัสผ่าน (Password) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="รหัสผ่าน"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 pr-12 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ยืนยันรหัสผ่าน (Confirm Password){' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`w-full bg-[#f8fafc] border ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:ring-red-100' : 'border-[#e2e8f0] focus:ring-blue-100'} px-5 py-3.5 pr-12 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-[#94a3b8]`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">รหัสผ่านไม่ตรงกัน</p>
                )}
            </div>
          </div>

          <div className="mb-6 md:mb-8 border-b border-slate-100 pb-3 md:pb-4">
            <h2 className="text-base md:text-lg font-semibold text-slate-700">
              ข้อมูลส่วนตัว (Personal Information)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-5 md:gap-y-6">
            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เพศ (Gender)
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="Unspecified">ไม่ระบุ (Unspecified)</option>
                  <option value="Male">ชาย (Male)</option>
                  <option value="Female">หญิง (Female)</option>
                </select>
                <ChevronDown
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                คำนำหน้าชื่อ (Title) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- เลือกคำนำหน้า --
                  </option>
                  <option value="นาย ">นาย</option>
                  <option value="นาง ">นาง</option>
                  <option value="นางสาว ">นางสาว</option>
                </select>
                <ChevronDown
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ชื่อจริง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="ชื่อจริง"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="นามสกุล"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ชื่อภาษาอังกฤษ (First Name)
              </label>
              <input
                type="text"
                name="firstNameEN"
                placeholder="First Name"
                value={formData.firstNameEN}
                onChange={handleChange}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                นามสกุลภาษาอังกฤษ (Last Name)
              </label>
              <input
                type="text"
                name="lastNameEN"
                placeholder="Last Name"
                value={formData.lastNameEN}
                onChange={handleChange}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เลขบัตรประชาชน (ID Card Number)
              </label>
              <input
                type="text"
                name="idCardNumber"
                placeholder="เลข 13 หลัก"
                value={formData.idCardNumber}
                onChange={handleChange}
                maxLength={13}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                วันเกิด (Date of Birth)
              </label>
              <DatePicker
                selected={
                  formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
                }
                onChange={(date: Date | null) => {
                  handleChange({
                    target: {
                      name: 'dateOfBirth',
                      value: date ? date.toLocaleDateString('en-CA') : '',
                    },
                  } as any);
                }}
                placeholderText="วว/ดด/ปปปป"
                minYear={1990}
                maxYear={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ที่อยู่ตามบัตรประชาชน (ID Card Address)
              </label>
              <textarea
                name="idCardAddress"
                placeholder="กรอกที่อยู่ตามบัตรประชาชน"
                value={formData.idCardAddress}
                onChange={handleChange as any}
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8] resize-none"
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                ที่อยู่ปัจจุบัน (Current Address)
              </label>
              <textarea
                name="currentAddress"
                placeholder="กรอกที่อยู่ปัจจุบัน"
                value={formData.currentAddress}
                onChange={handleChange as any}
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8] resize-none"
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                แผนก (Department)
              </label>
              <div className="relative">
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- กรุณาเลือกแผนก --
                  </option>
                  {departments.map((dept: any) => (
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
                ตำแหน่ง (Position)
              </label>
              <div className="relative">
                <select
                  name="positionId"
                  value={formData.positionId}
                  onChange={handleChange}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- กรุณาเลือกตำแหน่ง --
                  </option>
                  {availablePositions.map((pos: any) => (
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
                อีเมล (Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="example@nid.co.th"
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[#94a3b8]"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[#475569] font-medium text-[17px]">
                เบอร์โทรศัพท์ (Phone Number)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  placeholder="0xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`w-full bg-[#f8fafc] border px-5 py-3.5 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-[#94a3b8] pr-16 ${
                    formData.phone && formData.phone.length < 10
                      ? 'border-red-400 focus:ring-red-100'
                      : formData.phone.length === 10
                        ? 'border-green-400 focus:ring-green-100'
                        : 'border-[#e2e8f0] focus:ring-blue-100'
                  }`}
                />
                {formData.phone.length > 0 && (
                  <span
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                      formData.phone.length === 10
                        ? 'text-green-600 bg-green-50'
                        : 'text-red-500 bg-red-50'
                    }`}
                  >
                    {formData.phone.length}/10
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2 md:w-1/2 md:pr-4">
              <label className="block text-[#475569] font-medium text-[17px]">
                วันที่เริ่มทำงาน (Start Date)
              </label>
              <DatePicker
                selected={
                  formData.joinDate ? new Date(formData.joinDate) : null
                }
                onChange={(date: Date | null) => {
                  handleChange({
                    target: {
                      name: 'joinDate',
                      value: date ? date.toLocaleDateString('en-CA') : '',
                    },
                  } as any);
                }}
                placeholderText="วว/ดด/ปปปป"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 mt-10 md:mt-12 pt-5 md:pt-6 border-t border-slate-100">
            <Link
              href="/dashboard/hr/employees"
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#0f172a] rounded-xl font-medium text-base md:text-[17px] transition-colors cursor-pointer text-center"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isLoading || !!employeeIdError}
              className={`px-8 sm:px-10 py-3 sm:py-3.5 ${employeeIdError ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer'} text-white rounded-xl font-medium text-base md:text-[17px] shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2`}
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
