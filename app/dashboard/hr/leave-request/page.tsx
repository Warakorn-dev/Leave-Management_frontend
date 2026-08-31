'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLeave } from '@/hooks/useLeave';
import { useLeaveBalance } from '@/hooks/useLeaveBalance';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Bell,
  Settings,
  Search,
  Check,
  X,
  Building,
  User,
  Upload,
} from 'lucide-react';
import { DatePicker } from '@/components/DateAndTime';
import { calculateLeaveDays } from '@/lib/api/store';
import { LeaveTimePicker } from '@/components/LeaveTimePicker';
import { userApi, uploadApi } from '@/lib/api';
import { useLeaveType } from '@/hooks/useLeaveType';
import { LeaveDayAvailabilityPreview } from '@/components/LeaveDayAvailabilityPreview';
import { buildTakenMap, isDayUnavailable } from '@/lib/leavePortions';

export default function RequestLeavePage() {
  const [type, setType] = useState('');
  const [leaveMode, setLeaveMode] = useState<
    'full_day' | 'half_day' | 'hourly'
  >('full_day');
  // For full_day / half_day
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState<'full' | 'morning' | 'afternoon'>(
    'full',
  );
  // For hourly
  const [leaveDate, setLeaveDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [reason, setReason] = useState('');
  const [username, setUsername] = useState('User');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [hasRangeConflict, setHasRangeConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { useLeaveBalancesQuery } = useLeaveBalance();
  const { data: balances = [] } = useLeaveBalancesQuery();
  const { useLeaveTypesQuery } = useLeaveType();
  const { data: allLeaveTypes = [] } = useLeaveTypesQuery();
  const { useCreateLeaveMutation, useHolidaysQuery, useLeavesQuery } =
    useLeave();
  const { mutateAsync: createLeave } = useCreateLeaveMutation();
  const { data: holidaysData = [] } = useHolidaysQuery();
  const { data: myLeaves = [] } = useLeavesQuery();

  const combinedLeaveTypes = allLeaveTypes.map((lt: any) => {
    const balance = balances.find(
      (b: any) => b.leaveTypeId === lt.id || b.leaveType?.id === lt.id,
    );
    if (balance) {
      return balance;
    }
    return {
      leaveType: lt,
      remainingDays: lt.defaultDays || 0,
      effectiveRemainingDays: lt.defaultDays || 0,
      pendingDays: 0,
      employeeHireDate:
        balances.length > 0 ? balances[0].employeeHireDate : null,
    };
  });

  const currentUserId =
    typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '';

  const takenMap = useMemo(
    () => buildTakenMap(Array.isArray(myLeaves) ? myLeaves : [], currentUserId),
    [myLeaves, currentUserId],
  );

  // Disable a day only when there is no room left for the chosen mode/period.
  const isDateDisabled = (date: any) =>
    isDayUnavailable(date, leaveMode, period, takenMap);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await userApi.getProfile();
        const data = res.data;
        if (data) {
          const user = data;
          const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(' ');
          if (fullName) {
            setUsername(fullName);
            sessionStorage.setItem('fullName', fullName);
          }

          const deptName = user.department?.name || user.departmentName || '-';
          setDepartment(deptName);
          sessionStorage.setItem('department', deptName);

          const posName = user.positionName || user.position?.name || '-';
          setPosition(posName);
          sessionStorage.setItem('position', posName);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Intentionally not setting default type to force user selection
  }, [balances]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }
      setAttachmentFile(file);
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachment(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setErrorMsg('กรุณาเลือกประเภทการลา');
      setShowErrorModal(true);
      return;
    }

    if (leaveMode === 'hourly') {
      if (!leaveDate) {
        setErrorMsg('กรุณาเลือกวันที่ลา');
        setShowErrorModal(true);
        return;
      }
      if (!startTime) {
        setErrorMsg('กรุณาเลือกเวลาเริ่มลา');
        setShowErrorModal(true);
        return;
      }
      if (!endTime) {
        setErrorMsg('กรุณาเลือกเวลาสิ้นสุด');
        setShowErrorModal(true);
        return;
      }

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes <= 0) {
        setErrorMsg('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มลา');
        setShowErrorModal(true);
        return;
      }
    } else {
      if (!startDate) {
        setErrorMsg('กรุณาเลือกวันที่เริ่มต้น');
        setShowErrorModal(true);
        return;
      }
      if (!endDate) {
        setErrorMsg('กรุณาเลือกวันที่สิ้นสุด');
        setShowErrorModal(true);
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setErrorMsg('วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น');
        setShowErrorModal(true);
        return;
      }
      if (hasRangeConflict) {
        setErrorMsg(
          'บางวันในช่วงที่เลือกทับซ้อนกับการลาเดิมของคุณ กรุณาปรับช่วงวันที่ หรือเปลี่ยนรูปแบบการลาให้ตรงกับช่วงเวลาที่ยังว่าง (ดูรายละเอียดรายวันในแบบฟอร์ม)',
        );
        setShowErrorModal(true);
        return;
      }

      const p = leaveMode === 'half_day' ? period : 'full';
      const calculatedDays = calculateLeaveDays(
        startDate,
        endDate,
        p,
        'full',
        holidaysData,
      );
      if (calculatedDays <= 0) {
        setErrorMsg(
          'จำนวนวันลาเป็น 0 (อาจตรงกับวันหยุดหรือเสาร์-อาทิตย์) กรุณาเลือกวันใหม่อีกครั้ง',
        );
        setShowErrorModal(true);
        return;
      }
    }

    if (!reason) {
      setErrorMsg('กรุณากรอกเหตุผลการลา');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        leaveTypeId: type,
        leaveMode,
        reason,
      };

      if (leaveMode === 'hourly') {
        payload.leaveDate = leaveDate;
        payload.startTime = startTime;
        payload.endTime = endTime;
      } else {
        payload.startDate = startDate;
        payload.endDate = endDate;
        if (leaveMode === 'half_day') {
          payload.period = period;
        } else {
          payload.period = 'full';
        }

        const p = leaveMode === 'half_day' ? period : 'full';
        payload.totalDays = calculateLeaveDays(
          startDate,
          endDate,
          p,
          'full',
          holidaysData,
        );
      }

      const res = await createLeave(payload);
      const leaveRequestId = res?.data?.id || res?.id;

      if (leaveRequestId && attachmentFile) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          formData.append('leaveRequestId', leaveRequestId);
          await uploadApi.uploadFile(formData);
        } catch (uploadErr: any) {
          console.error('File upload failed:', uploadErr);
          const uploadMsg =
            uploadErr?.response?.data?.message ||
            uploadErr?.message ||
            'ไม่สามารถอัปโหลดไฟล์แนบได้';
          setShowConfirmModal(false);
          setErrorMsg(
            `ส่งคำขอลาสำเร็จ แต่อัปโหลดไฟล์แนบไม่สำเร็จ: ${uploadMsg}`,
          );
          setShowErrorModal(true);
          setIsSubmitting(false);
          return;
        }
      }

      setShowConfirmModal(false);
      router.push('/dashboard/hr/leave-status');
    } catch (err: any) {
      setShowConfirmModal(false);
      setErrorMsg(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            แบบฟอร์มยื่นลา (Leave Request)
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            กรุณากรอกข้อมูลให้ครบถ้วน
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-6 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* User Info Box */}
          <div className="bg-[#F4F5F7] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-[13px] font-semibold text-gray-700 mb-1.5">
                ชื่อ-นามสกุล
              </p>
              <p className="text-[17px] font-bold text-black">{username}</p>
            </div>
            <div className="md:text-left">
              <p className="text-[13px] font-semibold text-gray-700 mb-1.5">
                แผนก/ ตำแหน่ง
              </p>
              <p className="text-[17px] font-bold text-black">
                {department} | {position}
              </p>
            </div>
            {/* Added an empty div to push things to left and right just in case, but justify-between handles it */}
            <div className="hidden md:block flex-1"></div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
              {/* Leave Type */}
              <div className="md:col-span-1">
                <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                  ประเภทการลา
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700"
                >
                  <option value="" disabled>
                    -- กรุณาเลือกประเภทการลา --
                  </option>
                  {[...combinedLeaveTypes]
                    .sort((a: any, b: any) => {
                      const getOrder = (name: string) => {
                        if (name.includes('ลาป่วย')) return 1;
                        if (name.includes('ลากิจ')) return 2;
                        if (name.includes('พักผ่อน')) return 3;
                        return 99;
                      };
                      const orderA = getOrder(a.leaveType.name);
                      const orderB = getOrder(b.leaveType.name);
                      if (orderA !== orderB) return orderA - orderB;
                      return a.leaveType.name.localeCompare(
                        b.leaveType.name,
                        'th',
                      );
                    })
                    .map((b: any) => {
                      const isOutOfQuota = b.effectiveRemainingDays <= 0;

                      let isTenureNotMet = false;
                      const requiredTenure =
                        b.leaveType.name.includes('พักร้อน') ||
                        b.leaveType.name.includes('พักผ่อน')
                          ? 365
                          : b.leaveType.minTenureDays;

                      if (requiredTenure > 0 && b.employeeHireDate) {
                        const hireDate = new Date(b.employeeHireDate);
                        const diffMs =
                          new Date().getTime() - hireDate.getTime();
                        const diffDays = diffMs / (1000 * 60 * 60 * 24);
                        if (diffDays < requiredTenure) {
                          isTenureNotMet = true;
                        }
                      }

                      const isDisabled = isOutOfQuota || isTenureNotMet;
                      let label = `${b.leaveType.name} `;
                      if (isTenureNotMet) {
                        label += `(อายุงานไม่ครบ ${requiredTenure >= 365 ? (requiredTenure / 365).toFixed(0) + ' ปี' : requiredTenure + ' วัน'})`;
                      } else if (isOutOfQuota) {
                        label += `(หมดโควต้า)`;
                      } else {
                        const pendingStr =
                          b.pendingDays > 0
                            ? ` + รออนุมัติ ${b.pendingDays} วัน`
                            : '';
                        label += `(เหลือ ${b.effectiveRemainingDays} วัน${pendingStr})`;
                      }

                      return (
                        <option
                          key={b.leaveType.id}
                          value={b.leaveType.id}
                          disabled={isOutOfQuota}
                          className={
                            isOutOfQuota
                              ? 'text-gray-400 bg-gray-50 font-medium'
                              : 'text-gray-800'
                          }
                        >
                          {b.leaveType.name}{' '}
                          {isOutOfQuota
                            ? '(หมดโควต้า)'
                            : b.remainingDays <= 0
                              ? '(ใช้เกินโควต้า)'
                              : `(เหลือ ${b.remainingDays} วัน)`}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* รูปแบบการลา */}
              <div className="md:col-span-1">
                <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                  รูปแบบการลา
                </label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="leaveMode"
                      checked={leaveMode === 'full_day'}
                      onChange={() => {
                        setLeaveMode('full_day');
                        setPeriod('full');
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      เต็มวัน
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="leaveMode"
                      checked={leaveMode === 'half_day'}
                      onChange={() => {
                        setLeaveMode('half_day');
                        setPeriod('morning');
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ครึ่งวัน
                    </span>
                  </label>
                  {/* <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                    <input type="radio" name="leaveMode" checked={leaveMode === 'hourly'} onChange={() => setLeaveMode('hourly')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-700">ลารายชั่วโมง</span>
                  </label> */}
                </div>
              </div>

              {leaveMode === 'hourly' ? (
                <>
                  <div className="md:col-span-2 md:w-[calc(50%-1.5rem)]">
                    <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                      วันที่ลา
                    </label>
                    <DatePicker
                      value={leaveDate || null}
                      onChange={(val: any) => {
                        if (
                          val &&
                          typeof val === 'object' &&
                          typeof val.format === 'function'
                        ) {
                          setLeaveDate(val.format('YYYY-MM-DD'));
                        } else if (typeof val === 'string') {
                          setLeaveDate(val.substring(0, 10));
                        } else {
                          setLeaveDate('');
                        }
                      }}
                      shouldDisableDate={isDateDisabled}
                      placeholderText="วว/ดด/ปปปป"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <LeaveTimePicker
                      startTime={startTime}
                      endTime={endTime}
                      onChangeStartTime={setStartTime}
                      onChangeEndTime={setEndTime}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                      วันที่เริ่มต้น
                    </label>
                    <DatePicker
                      value={startDate || null}
                      onChange={(val: any) => {
                        if (
                          val &&
                          typeof val === 'object' &&
                          typeof val.format === 'function'
                        ) {
                          setStartDate(val.format('YYYY-MM-DD'));
                        } else if (typeof val === 'string') {
                          setStartDate(val.substring(0, 10));
                        } else {
                          setStartDate('');
                        }
                      }}
                      shouldDisableDate={isDateDisabled}
                      placeholderText="วว/ดด/ปปปป"
                    />
                    {leaveMode === 'half_day' && (
                      <div className="flex items-center gap-4 mt-3">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="period"
                            value="morning"
                            checked={period === 'morning'}
                            onChange={() => setPeriod('morning')}
                            className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                          />
                          ครึ่งวันเช้า
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="period"
                            value="afternoon"
                            checked={period === 'afternoon'}
                            onChange={() => setPeriod('afternoon')}
                            className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                          />
                          ครึ่งวันบ่าย
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                      วันที่สิ้นสุด
                    </label>
                    <DatePicker
                      value={endDate || null}
                      minDate={startDate ? startDate : undefined}
                      onChange={(val: any) => {
                        if (
                          val &&
                          typeof val === 'object' &&
                          typeof val.format === 'function'
                        ) {
                          setEndDate(val.format('YYYY-MM-DD'));
                        } else if (typeof val === 'string') {
                          setEndDate(val.substring(0, 10));
                        } else {
                          setEndDate('');
                        }
                      }}
                      shouldDisableDate={isDateDisabled}
                      placeholderText="วว/ดด/ปปปป"
                    />
                  </div>
                  <LeaveDayAvailabilityPreview
                    startDate={startDate}
                    endDate={endDate}
                    leaveMode={leaveMode}
                    period={leaveMode === 'half_day' ? period : 'full'}
                    leaves={Array.isArray(myLeaves) ? myLeaves : []}
                    currentUserId={currentUserId}
                    holidays={holidaysData}
                    onConflictChange={setHasRangeConflict}
                  />
                </>
              )}
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                เหตุผลการลา
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 shadow-sm transition-all resize-none text-gray-700"
                placeholder="ระบุเหตุผลที่ชัดเจน..."
              />
            </div>

            <div className="mb-10">
              <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                เอกสารแนบ (ถ้ามี)
              </label>
              <div className="border border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm relative group overflow-hidden">
                <Upload
                  className="w-8 h-8 text-black mb-3 group-hover:-translate-y-1 transition-transform"
                  strokeWidth={2}
                />
                {attachmentName ? (
                  <div className="text-center z-10">
                    <p className="text-[14px] text-emerald-600 font-bold">
                      ✓ {attachmentName}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachment(null);
                        setAttachmentName(null);
                        setAttachmentFile(null);
                      }}
                      className="text-red-500 text-xs font-semibold mt-2 underline hover:text-red-700"
                    >
                      ลบไฟล์
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-black font-semibold">
                      ลากไฟล์มาวางที่นี่ หรือ{' '}
                      <span className="text-blue-600">คลิกเพื่ออัปโหลด</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      รองรับ PDF,PNG ขนาดไม่เกิน 10MB
                    </p>
                  </>
                )}
                {/* Invisible file input */}
                <input
                  type="file"
                  accept="image/png, application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-lg active:scale-95"
              >
                ส่งคำขอลา
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[500px] w-full p-10 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-24 h-24 bg-[#4CAF50] rounded-full mx-auto flex items-center justify-center mb-6 shadow-md">
              <Check className="w-12 h-12 text-white" strokeWidth={4} />
            </div>
            <h2 className="text-2xl font-bold text-black mb-4">
              ยืนยันการส่งแบบฟอร์มยื่นคำขอลา
            </h2>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
              คำลาของคุณจะถูกส่งไปยังระบบ
              <br />
              สามารถเช็คสถานะได้จากหน้าเช็คสถานะของคุณ
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-[#FF0000] hover:bg-red-600 text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className={`${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00B050] hover:bg-[#009040]'} text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-2`}
              >
                {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[400px] w-full p-8 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <X className="w-10 h-10 text-red-500" strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold text-black mb-3">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 text-sm mb-8">{errorMsg}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-8 rounded-lg transition-colors text-sm w-full"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
