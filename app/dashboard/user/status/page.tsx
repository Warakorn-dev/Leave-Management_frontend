'use client';

import { useState, useEffect } from 'react';
import { useLeave } from '@/hooks/useLeave';
import { getLeaveStatusBadgeColor, getLeaveStatusText } from '@/lib/api/utils';

const getLeaveDetails = (req: any) => {
  if (req.startFormat === 'hourly' || req.leaveMode === 'hourly') {
    let startT = req.startTime;
    if (!startT && req.startDate) {
      startT = new Date(req.startDate).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    let endT = req.endTime;
    if (!endT && req.endDate) {
      endT = new Date(req.endDate).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const rawHours = req.leaveHours
      ? req.leaveHours
      : Number(((req.totalDays ?? 0) * 8).toFixed(2));
    const h = Math.floor(rawHours);
    const m = Math.round((rawHours - h) * 60);
    const formattedHours =
      m === 0 ? `${h}` : `${h}.${m.toString().padStart(2, '0')}`;

    return `(รายชั่วโมง) ${startT} - ${endT} (${formattedHours} ชั่วโมง)`;
  }
  const days = req.totalDays ?? req.daysCount ?? 0;
  if (days === 0.5) {
    if (req.startFormat === 'morning') return '(ครึ่งวันเช้า)';
    if (req.startFormat === 'afternoon') return '(ครึ่งวันบ่าย)';
    return '(0.5 วัน)';
  }
  return `(${days} วัน)`;
};

const getStageStatus = (
  currentStatus: string,
  stage: 'HR' | 'MANAGER' | 'CEO',
) => {
  if (currentStatus === 'CANCELLED' || currentStatus === 'Cancelled')
    return 'cancelled';
  if (currentStatus === 'REJECTED') return 'rejected';

  if (stage === 'HR') {
    if (
      currentStatus === 'PENDING_VERIFY' ||
      currentStatus === 'PENDING_CANCELLATION' ||
      currentStatus === 'REVIEWING_HR'
    )
      return 'pending';
    return 'approved';
  }

  if (stage === 'MANAGER') {
    if (currentStatus === 'PENDING_VERIFY') return 'waiting';
    if (currentStatus === 'PENDING_SUPERVISOR') return 'pending';
    return 'approved';
  }

  if (stage === 'CEO') {
    if (currentStatus === 'PENDING_EXECUTIVE') return 'pending';
    if (currentStatus === 'APPROVED') return 'approved';
    return 'waiting';
  }

  return 'waiting';
};

export default function LeaveStatusPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [username, setUsername] = useState('xxxxx xxxxxx');

  const { useLeavesQuery } = useLeave();
  const { data: allLeaves = [], isLoading } = useLeavesQuery();

  useEffect(() => {
    const storedUsername =
      sessionStorage.getItem('username') || sessionStorage.getItem('username');
    if (storedUsername && storedUsername !== 'User') {
      setUsername(sessionStorage.getItem('fullName') || storedUsername);
    }
  }, []);

  useEffect(() => {
    const myId = sessionStorage.getItem('userId');
    const myLeaves = allLeaves.filter((l: any) => String(l.userId) === myId);
    const sorted = [...myLeaves].sort(
      (a: any, b: any) =>
        new Date(b.createdAt || b.startDate).getTime() -
        new Date(a.createdAt || a.startDate).getTime(),
    );
    setRequests(sorted);
  }, [allLeaves]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            ตรวจสอบสถานะการลา
          </h1>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium">
                คุณยังไม่มีประวัติการยื่นคำขอลา
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => {
                const status = req.status || 'PENDING_VERIFY';
                const hrStage = getStageStatus(status, 'HR');
                const managerStage = getStageStatus(status, 'MANAGER');
                const ceoStage = getStageStatus(status, 'CEO');

                const typeName = req.leaveType?.name || req.type || '';
                const isNormalLeave =
                  typeName === 'ลาป่วย' || typeName.includes('ลากิจ');
                const showCEO = !isNormalLeave;
                const approverComment =
                  req.approverReason ||
                  req.approvals?.[req.approvals.length - 1]?.comment;

                const isFinalRejected = status === 'REJECTED';
                const isFinalApproved = status === 'APPROVED';
                const isCancelled = status === 'CANCELLED';
                const isCancellationPending = status === 'PENDING_CANCELLATION';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                  >
                    {/* Header Box */}
                    <div className="bg-[#F4F5F7] rounded-xl p-5 mb-10 flex justify-between items-start">
                      <div>
                        <h3 className="text-[17px] font-bold text-black">
                          {req.leaveType?.name || req.type}
                        </h3>
                        {req.requestCode && (
                          <p className="text-[13px] text-blue-500 mt-1 font-semibold">
                            รหัสคำขอ: {req.requestCode}
                          </p>
                        )}
                        {req.startFormat === 'hourly' ||
                        req.leaveMode === 'hourly' ? (
                          <p className="text-[13px] text-gray-500 mt-1 font-medium">
                            {new Date(req.startDate).toLocaleDateString(
                              'th-TH',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}{' '}
                            <span className="ml-1 text-blue-600 font-semibold">
                              {getLeaveDetails(req)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[13px] text-gray-500 mt-1 font-medium">
                            {new Date(req.startDate).toLocaleDateString(
                              'th-TH',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}{' '}
                            ถึง{' '}
                            {new Date(req.endDate).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            <span className="ml-1 text-blue-600 font-semibold">
                              {getLeaveDetails(req)}
                            </span>
                          </p>
                        )}
                      </div>
                      <div
                        className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm ${getLeaveStatusBadgeColor(status)}`}
                      >
                        {getLeaveStatusText(status)}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-7 md:pl-10">
                      {/* Vertical Line */}
                      <div className="absolute left-[15px] md:left-[27px] top-2 bottom-4 w-[2px] bg-gray-200 z-0"></div>

                      {/* Step 1: Submitted */}
                      <div className="relative mb-10">
                        <div className="absolute -left-[31px] md:-left-[43px] w-4 h-4 bg-[#00E676] rounded-full ring-[6px] ring-white z-10 top-0.5"></div>
                        <h4 className="font-bold text-black text-sm">
                          ส่งคำขอสำเร็จ
                        </h4>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                          {new Date(req.createdAt).toLocaleString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          น.
                        </p>
                        <div className="bg-[#F4F5F7] text-gray-600 text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl">
                          พนักงานยื่นคำขอลาผ่านระบบเรียบร้อยแล้ว
                        </div>
                      </div>

                      {/* Step 2: HR Verification */}
                      <div className="relative mb-10">
                        <div
                          className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${
                            hrStage === 'approved'
                              ? 'bg-[#00E676]'
                              : isFinalRejected && hrStage === 'pending'
                                ? 'bg-[#FF0000]'
                                : hrStage === 'pending'
                                  ? 'bg-[#29B6F6]'
                                  : 'bg-[#E0E0E0]'
                          }`}
                        ></div>
                        <h4
                          className={`font-bold text-sm ${
                            hrStage === 'approved'
                              ? 'text-green-700'
                              : isFinalRejected && hrStage === 'pending'
                                ? 'text-red-600'
                                : hrStage === 'pending'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                          }`}
                        >
                          {isCancellationPending
                            ? 'รอฝ่ายบุคคลตรวจสอบคำขอยกเลิก'
                            : hrStage === 'approved'
                              ? 'ฝ่ายบุคคลตรวจสอบแล้ว'
                              : isFinalRejected && hrStage === 'pending'
                                ? 'ฝ่ายบุคคลปฏิเสธคำขอ'
                                : status === 'REVIEWING_HR'
                                  ? 'ฝ่ายบุคคลกำลังตรวจสอบ'
                                  : 'รอฝ่ายบุคคลตรวจสอบ'}
                        </h4>
                        {isFinalRejected &&
                          hrStage === 'pending' &&
                          approverComment && (
                            <div className="text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl bg-red-50 text-red-700">
                              หมายเหตุ: {approverComment}
                            </div>
                          )}
                      </div>

                      {/* Step 3: Manager Approval */}
                      <div className="relative mb-10">
                        <div
                          className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${
                            managerStage === 'approved'
                              ? 'bg-[#00E676]'
                              : isFinalRejected && managerStage === 'pending'
                                ? 'bg-[#FF0000]'
                                : managerStage === 'pending'
                                  ? 'bg-[#29B6F6]'
                                  : 'bg-[#E0E0E0]'
                          }`}
                        ></div>
                        <h4
                          className={`font-bold text-sm ${
                            managerStage === 'approved'
                              ? 'text-green-700'
                              : isFinalRejected && managerStage === 'pending'
                                ? 'text-red-600'
                                : managerStage === 'pending'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                          }`}
                        >
                          {managerStage === 'approved'
                            ? 'หัวหน้างานอนุมัติแล้ว'
                            : isFinalRejected && managerStage === 'pending'
                              ? 'หัวหน้างานปฏิเสธคำขอ'
                              : 'รอหัวหน้างานอนุมัติ'}
                        </h4>
                        {isFinalRejected &&
                          managerStage === 'pending' &&
                          approverComment && (
                            <div className="text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl bg-red-50 text-red-700">
                              หมายเหตุ: {approverComment}
                            </div>
                          )}
                      </div>

                      {/* Step 4: CEO Approval (if applicable) */}
                      {showCEO && (
                        <div className="relative mb-10">
                          <div
                            className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${
                              ceoStage === 'approved'
                                ? 'bg-[#00E676]'
                                : isFinalRejected && ceoStage === 'pending'
                                  ? 'bg-[#FF0000]'
                                  : ceoStage === 'pending'
                                    ? 'bg-[#29B6F6]'
                                    : 'bg-[#E0E0E0]'
                            }`}
                          ></div>
                          <h4
                            className={`font-bold text-sm ${
                              ceoStage === 'approved'
                                ? 'text-green-700'
                                : isFinalRejected && ceoStage === 'pending'
                                  ? 'text-red-600'
                                  : ceoStage === 'pending'
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                            }`}
                          >
                            {ceoStage === 'approved'
                              ? 'CEO อนุมัติแล้ว'
                              : isFinalRejected && ceoStage === 'pending'
                                ? 'CEO ปฏิเสธคำขอ'
                                : 'รอ CEO อนุมัติ'}
                          </h4>
                          {isFinalRejected &&
                            ceoStage === 'pending' &&
                            approverComment && (
                              <div className="text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl bg-red-50 text-red-700">
                                หมายเหตุ: {approverComment}
                              </div>
                            )}
                        </div>
                      )}

                      {/* Final Step: Completed */}
                      <div className="relative">
                        <div
                          className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${
                            isFinalApproved || isFinalRejected || isCancelled
                              ? 'bg-[#00E676]'
                              : 'bg-[#E0E0E0]'
                          }`}
                        ></div>
                        <h4
                          className={`font-bold text-sm ${
                            isFinalApproved || isFinalRejected || isCancelled
                              ? 'text-black'
                              : 'text-[#D1D5DB]'
                          }`}
                        >
                          เสร็จสิ้น (Completed)
                        </h4>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
