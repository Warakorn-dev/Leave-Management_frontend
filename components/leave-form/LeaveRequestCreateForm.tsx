'use client';

/**
 * The "สร้างคำลา" page shared by employee, manager and HR
 * (app/dashboard/{user/request, manager/request, hr/leave-request}).
 * Behaviour and layout are those of the employee page, the reference design.
 * Only the subtitle and the page opened after sending differ per role.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FilePlus2 } from 'lucide-react';
import { useLeaveBalance } from '@/hooks/useLeaveBalance';
import { useLeave, type CreateLeavePayload } from '@/hooks/useLeave';
import { userApi, uploadApi } from '@/lib/api';
import { buildTakenMap, isDayUnavailable, type LeaveMode, type DayPortion } from '@/lib/leavePortions';
import { getErrorMessage } from '@/lib/api/utils';
import {
  EMPTY_LEAVE_FORM,
  LeaveFormFields,
  type LeaveFormValues,
} from './LeaveFormFields';
import { LeaveAttachmentField } from './LeaveAttachmentField';
import { RequesterInfoBox } from './RequesterInfoBox';

interface Props {
  /** Page opened after the request is sent, e.g. /dashboard/user/status. */
  statusPath: string;
  /** Line under the page title. */
  subtitle?: string;
}

export function LeaveRequestCreateForm({
  statusPath,
  subtitle = 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งให้หัวหน้าแผนกอนุมัติ',
}: Props) {
  const [form, setForm] = useState<LeaveFormValues>(EMPTY_LEAVE_FORM);
  const { type, leaveMode, period, startDate, endDate, leaveDate, startTime, endTime, reason } = form;
  const updateForm = (patch: Partial<LeaveFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const [username, setUsername] = useState('');
  const [hasRangeConflict, setHasRangeConflict] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [userProfile, setUserProfile] = useState<{
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
  } | null>(null);
  const router = useRouter();

  const { useLeaveBalancesQuery } = useLeaveBalance();
  const { data: balances = [] } = useLeaveBalancesQuery();
  const { useCreateLeaveMutation, useHolidaysQuery, useLeavesQuery } = useLeave();
  const { mutateAsync: createLeave } = useCreateLeaveMutation();
  const { data: holidaysData = [] } = useHolidaysQuery();
  const { data: myLeaves = [] } = useLeavesQuery();

  const currentUserId =
    typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '';

  // Half-day slots the current user has already booked, keyed by day.
  const takenMap = useMemo(
    () => buildTakenMap(Array.isArray(myLeaves) ? myLeaves : [], currentUserId),
    [myLeaves, currentUserId],
  );

  // Disable a day only when there is no room left for what the user is booking:
  // full day -> any existing half blocks it; half day -> only the chosen half.
  const isDateDisabled = (date: unknown) =>
    isDayUnavailable(date, leaveMode as LeaveMode, (period as DayPortion) ?? 'full', takenMap);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername && storedUsername !== 'User') {
      setUsername(sessionStorage.getItem('fullName') || storedUsername);
    }
    const fetchUserProfile = async () => {
      try {
        const res = await userApi.getProfile();
        const data = res.data;
        if (data) {
          setUserProfile({
            firstName: data.firstName || data.user?.firstName,
            lastName: data.lastName || data.user?.lastName,
            department: data.department?.name || '-',
            position: data.position?.name || '-',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile', error);
      }
    };
    fetchUserProfile();
  }, []);

  const showError = (message: string) => {
    setErrorMsg(message);
    setShowErrorModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return showError('กรุณาเลือกประเภทการลา');

    if (leaveMode === 'hourly') {
      if (!leaveDate) return showError('กรุณาเลือกวันที่ลา');
      if (!startTime) return showError('กรุณาเลือกเวลาเริ่มลา');
      if (!endTime) return showError('กรุณาเลือกเวลาสิ้นสุด');
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      if (endH * 60 + endM - (startH * 60 + startM) <= 0) {
        return showError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มลา');
      }
    } else {
      if (!startDate) return showError('กรุณาเลือกวันที่เริ่มต้น');
      if (!endDate) return showError('กรุณาเลือกวันที่สิ้นสุด');
      if (new Date(startDate) > new Date(endDate)) {
        return showError('วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น');
      }
      if (hasRangeConflict) {
        return showError(
          'บางวันในช่วงที่เลือกทับซ้อนกับการลาเดิมของคุณ กรุณาปรับช่วงวันที่ หรือเปลี่ยนรูปแบบการลาให้ตรงกับช่วงเวลาที่ยังว่าง (ดูรายละเอียดรายวันในแบบฟอร์ม)',
        );
      }
    }

    if (!reason) return showError('กรุณากรอกเหตุผลการลา');
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: CreateLeavePayload = {
        leaveTypeId: type,
        leaveMode: leaveMode as CreateLeavePayload['leaveMode'],
        reason,
      };
      if (leaveMode === 'hourly') {
        payload.leaveDate = leaveDate;
        payload.startTime = startTime;
        payload.endTime = endTime;
      } else {
        payload.startDate = startDate;
        payload.endDate = endDate;
        payload.period = (leaveMode === 'half_day' ? period : 'full') as CreateLeavePayload['period'];
      }

      const res = await createLeave(payload);
      const leaveRequestId = res?.data?.id || res?.id;

      if (leaveRequestId && attachmentFile) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          formData.append('leaveRequestId', leaveRequestId);
          await uploadApi.uploadFile(formData);
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          const uploadMsg = getErrorMessage(uploadErr, 'ไม่สามารถอัปโหลดไฟล์แนบได้');
          setShowConfirmModal(false);
          showError(`ส่งคำขอลาสำเร็จ แต่อัปโหลดไฟล์แนบไม่สำเร็จ: ${uploadMsg}`);
          setIsSubmitting(false);
          return;
        }
      }

      setShowConfirmModal(false);
      router.push(statusPath);
    } catch (err) {
      setShowConfirmModal(false);
      showError(getErrorMessage(err, 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <FilePlus2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            แบบฟอร์มคำขอลา (Leave Request)
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RequesterInfoBox
            name={
              userProfile
                ? `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim()
                : username
            }
            department={userProfile?.department}
            position={userProfile?.position}
            loading={!userProfile}
          />

          <form onSubmit={handleSubmit}>
            <LeaveFormFields
              values={form}
              onChange={updateForm}
              balances={balances}
              isDateDisabled={isDateDisabled}
              leaves={Array.isArray(myLeaves) ? myLeaves : []}
              currentUserId={currentUserId}
              holidays={holidaysData}
              onConflictChange={setHasRangeConflict}
            />

            <LeaveAttachmentField
              file={attachmentFile}
              onFileChange={setAttachmentFile}
              onError={showError}
            />

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
            <h2 className="text-2xl font-bold text-black mb-4">ยืนยันการส่งแบบฟอร์มยื่นคำขอลา</h2>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
              คำขอลาของคุณจะถูกส่งไปยังระบบ
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-[500px] w-full p-10 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-24 h-24 bg-[#FF4B4B] rounded-full mx-auto flex items-center justify-center mb-6 shadow-md">
              <X className="w-12 h-12 text-white" strokeWidth={4} />
            </div>
            <h2 className="text-2xl font-bold text-black mb-4">ไม่สามารถยื่นคำขอลาได้</h2>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
              {errorMsg}
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-12 rounded-lg transition-all text-sm shadow-md hover:shadow-lg active:scale-95"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveRequestCreateForm;
