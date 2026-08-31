'use client';

import React, { useState, useEffect } from 'react';
import { User, Calendar as CalendarIcon, Eye, Check, X } from 'lucide-react';
import { useLeave } from '@/hooks/useLeave';
import { useAuth } from '@/context/AuthContext';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';

export default function HrApprovePage() {
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempYear, setTempYear] = useState(() => new Date().getFullYear());

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    id: string;
    reason: string;
  } | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState<{
    id: string;
    reason: string;
  } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const formatMonthYear = (yyyyMM: string) => {
    const [y, m] = yyyyMM.split('-');
    const months = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getDayRange = (start: string, end: string) => {
    if (!start || !end) return '-';
    if (start === end) return formatShortDate(start);
    const d1 = new Date(start);
    const d2 = new Date(end);
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    if (
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    ) {
      return `${d1.getDate()}-${d2.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
    }
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  };

  const {
    useHrPendingVerifyQuery,
    useVerifyLeaveMutation,
    useMarkLeaveViewedMutation,
  } = useLeave();
  const { user } = useAuth();
  const { data: allLeaves = [], refetch: refetchLeaves } =
    useHrPendingVerifyQuery();
  const { mutateAsync: verifyLeave } = useVerifyLeaveMutation();
  const { mutateAsync: markLeaveViewed } = useMarkLeaveViewedMutation();

  useEffect(() => {
    const filtered = allLeaves.filter((r: any) => {
      if (!r.startDate) return false;
      const d = new Date(r.startDate);
      const yyyyMM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return yyyyMM === selectedMonthRaw;
    });
    const sorted = [...filtered].sort(
      (a: any, b: any) =>
        new Date(b.createdAt || b.startDate).getTime() -
        new Date(a.createdAt || a.startDate).getTime(),
    );

    setRequests(
      sorted.map((r: any) => {
        let dateRangeStr = getDayRange(
          r.startDate.split('T')[0],
          r.endDate.split('T')[0],
        );
        let daysStr = `${r.totalDays || 1} วัน`;

        if (r.startFormat === 'hourly' || r.leaveMode === 'hourly') {
          const startT = new Date(r.startDate).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const endT = new Date(r.endDate).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });
          dateRangeStr = `${formatShortDate(r.startDate)} ${startT} - ${endT}`;
          const hours = r.leaveHours
            ? r.leaveHours
            : Number(((r.totalDays ?? 0) * 8).toFixed(1));
          daysStr = `${hours} ชั่วโมง`;
        } else if ((r.totalDays ?? r.daysCount) === 0.5) {
          if (r.startFormat === 'morning') daysStr = 'ครึ่งวันเช้า';
          else if (r.startFormat === 'afternoon') daysStr = 'ครึ่งวันบ่าย';
          else daysStr = '0.5 วัน';
        }

        return {
          ...r,
          empId:
            r.employee?.employeeCode ||
            (r.employee?.id
              ? `EMP-${String(r.employee.id).substring(0, 5).toUpperCase()}`
              : `EMP-000`),
          userId: r.user?.firstName
            ? `${r.user.firstName} ${r.user.lastName}`
            : r.userId || 'Unknown',
          firstName:
            r.user?.firstName || r.employee?.firstName || r.userId || 'Unknown',
          lastName: r.user?.lastName || r.employee?.lastName || '',
          department: r.user?.department?.name || r.department,
          position: r.user?.position?.name || r.position,
          type: r.leaveType?.name || r.type,
          dateRange: `${dateRangeStr} (${daysStr})`,
          formattedDays: daysStr,
        };
      }),
    );
  }, [selectedMonthRaw, allLeaves]);

  // Auto-refresh (Polling) ทุกๆ 5 วินาที เพื่อให้หน้าจออัปเดตสถานะการล็อคทันที
  useEffect(() => {
    const interval = setInterval(() => {
      refetchLeaves();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchLeaves]);

  const handleMonthSelect = (monthIndex: number) => {
    const mm = (monthIndex + 1).toString().padStart(2, '0');
    setSelectedMonthRaw(`${tempYear}-${mm}`);
    setIsPickerOpen(false);
  };

  const handleApproveClick = (reqId: string, reason: string = '') => {
    setConfirmData({ id: reqId, reason });
    setShowConfirmModal(true);
  };

  const handlePullRequest = async (req: any) => {
    try {
      await markLeaveViewed({ id: req.id, lock: true });
      refetchLeaves(); // อัปเดตตารางให้แสดงสถานะว่าเราล็อคแล้ว
    } catch (error: any) {
      console.error('Failed to pull request', error);
      alert(
        error.message ||
          'ไม่สามารถดึงคำขอนี้ได้ เนื่องจากกำลังถูกตรวจสอบโดย HR คนอื่น',
      );
      refetchLeaves();
    }
  };

  const handleViewDetails = async (req: any) => {
    // แค่เปิดดูรายละเอียดเฉยๆ ไม่ได้จะดึงมาตรวจสอบ
    if (!req.isViewedByHr) {
      try {
        await markLeaveViewed({ id: req.id, lock: false });
        req.isViewedByHr = true;
        // ไม่ต้องล็อคเป็นของเรา (ไม่ต้องเซ็ต currentHrReviewerId)
      } catch (error: any) {
        console.error('Failed to mark leave as viewed', error);
      }
    }
    setSelectedRequest(req);
  };

  const executeApprove = async () => {
    if (!confirmData) return;
    try {
      await verifyLeave({
        id: confirmData.id,
        action: 'Approve',
        comment: confirmData.reason,
      });
      if (selectedRequest && selectedRequest.id === confirmData.id)
        setSelectedRequest(null);
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอ');
    } finally {
      refetchLeaves();
      setShowConfirmModal(false);
      setConfirmData(null);
    }
  };

  const handleRejectClick = (reqId: string, reason: string = '') => {
    setRejectData({ id: reqId, reason });
    setRejectReasonInput(reason);
    setShowRejectModal(true);
  };

  const executeReject = async () => {
    if (!rejectData) return;
    if (rejectReasonInput.trim() === '') {
      alert('การปฏิเสธคำขอลาจำเป็นต้องระบุเหตุผล');
      return;
    }
    try {
      await verifyLeave({
        id: rejectData.id,
        action: 'Reject',
        comment: rejectReasonInput.trim(),
      });
      if (selectedRequest && selectedRequest.id === rejectData.id)
        setSelectedRequest(null);
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    } finally {
      refetchLeaves();
      setShowRejectModal(false);
      setRejectData(null);
      setRejectReasonInput('');
    }
  };



  const onModalApprove = () => {
    handleApproveClick(selectedRequest.id);
  };

  const onModalReject = () => {
    handleRejectClick(selectedRequest.id);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">
            รายการคำขอรอตรวจสอบ (HR View)
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            พิจารณาตรวจสอบเบื้องต้น หรือปฏิเสธคำขอลาของพนักงาน
          </p>
        </div>

        {/* Month Picker Button */}
        <div className="mb-8 relative inline-block">
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="border border-gray-300 text-gray-700 text-sm font-bold py-2 px-5 rounded-full shadow-sm flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
          >
            {formatMonthYear(selectedMonthRaw)}
            <CalendarIcon className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
          </button>

          {isPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPickerOpen(false)}
              ></div>
              <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 px-1">
                  <button
                    onClick={() => setTempYear((y) => y - 1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <span className="font-bold text-lg text-black tracking-wide">
                    {tempYear + 543}
                  </span>
                  <button
                    onClick={() => setTempYear((y) => y + 1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'ม.ค.',
                    'ก.พ.',
                    'มี.ค.',
                    'เม.ย.',
                    'พ.ค.',
                    'มิ.ย.',
                    'ก.ค.',
                    'ส.ค.',
                    'ก.ย.',
                    'ต.ค.',
                    'พ.ย.',
                    'ธ.ค.',
                  ].map((m, i) => {
                    const isSelected =
                      selectedMonthRaw ===
                      `${tempYear}-${(i + 1).toString().padStart(2, '0')}`;
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(i)}
                        className={`py-2.5 rounded-xl text-[14px] font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 text-[13px]">
                <th className="py-4 px-6 font-bold whitespace-nowrap">
                  รหัสคำขอ
                </th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">
                  ชื่อ-นามสกุล
                </th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">แผนก</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">
                  ประเภทการลา
                </th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">
                  วันที่ลา
                </th>
                <th className="py-4 px-6 font-bold whitespace-nowrap text-center">
                  สถานะ
                </th>
                <th className="py-4 px-6 font-bold whitespace-nowrap text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-500 font-medium bg-white"
                  >
                    ไม่มีรายการคำขอรอตรวจสอบในเดือน{' '}
                    {formatMonthYear(selectedMonthRaw)}
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const isLockedByOther =
                    req.currentHrReviewerId &&
                    req.currentHrReviewerId !== user?.id;
                  const isLockedByMe = req.currentHrReviewerId === user?.id;

                  return (
                    <tr
                      key={req.id}
                      className="border-b border-gray-100 bg-white last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-5 px-6 text-[14px] text-blue-600 font-bold whitespace-nowrap">
                        {req.requestCode || '-'}
                      </td>
                      <td className="py-5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-gray-800 font-bold">
                              {req.firstName} {req.lastName}
                            </span>
                            <span className="text-[12px] text-gray-400">
                              {req.user?.role || req.position || 'Employee'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">
                        {req.department || '-'}
                      </td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">
                        {req.type}
                      </td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">
                        {req.dateRange}
                      </td>
                      <td className="py-5 px-6 whitespace-nowrap text-center">
                        {isLockedByOther ||
                        isLockedByMe ||
                        req.status === 'REVIEWING_HR' ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-500 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{' '}
                              HR กำลังตรวจสอบ
                            </span>
                            {isLockedByOther && (
                              <span className="text-[11px] text-orange-500 mt-1 font-medium">
                                ตรวจสอบโดย ผู้อื่น
                              </span>
                            )}
                            {isLockedByMe && (
                              <span className="text-[11px] text-blue-500 mt-1 font-medium">
                                ตรวจสอบโดย คุณ
                              </span>
                            )}
                          </div>
                        ) : req.status === 'PENDING_CANCELLATION' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-rose-50 text-rose-500 border border-rose-100">
                            รอยกเลิก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-500 border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{' '}
                            รอ HR ตรวจสอบ
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-center whitespace-nowrap">
                        {isLockedByOther ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[12px] text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                              ตรวจสอบโดย{' '}
                              {req.currentReviewer?.employee
                                ? `${req.currentReviewer.employee.firstName} ${req.currentReviewer.employee.lastName}`
                                : req.currentReviewer?.username || 'ผู้อื่น'}
                            </span>
                            <button
                              onClick={() => handleViewDetails(req)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                              title="ดูรายละเอียด"
                            >
                              <Eye
                                className="w-[14px] h-[14px]"
                                strokeWidth={2.5}
                              />
                            </button>
                          </div>
                        ) : isLockedByMe ? (
                          <button
                            onClick={() => handleViewDetails(req)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12h4l3-9 5 18 3-9h5" />
                            </svg>
                            ตรวจสอบเอกสาร
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePullRequest(req)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              ดึงมาตรวจสอบ
                            </button>
                            <button
                              onClick={() => handleViewDetails(req)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                              title="ดูรายละเอียด"
                            >
                              <Eye
                                className="w-[14px] h-[14px]"
                                strokeWidth={2.5}
                              />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Details Modal */}
      {selectedRequest && (
        <LeaveDetailModal
          leave={selectedRequest.raw ?? selectedRequest}
          onClose={() => setSelectedRequest(null)}
          fallbackName={selectedRequest.userId || selectedRequest.raw?.userId}
          fallbackDepartment={selectedRequest.department}
          fallbackPosition={
            selectedRequest.position || selectedRequest.raw?.positionName
          }
          footerBar={
            selectedRequest.currentHrReviewerId &&
            selectedRequest.currentHrReviewerId !== user?.id ? (
              <div className="bg-[#FFF8E1] border-t border-[#FFC107] px-6 py-5 shrink-0 flex flex-col items-center justify-center">
                <p className="font-bold text-[#FF8F00] text-[15px] mb-1">
                  คำขอนี้กำลังถูกตรวจสอบโดย{' '}
                  {selectedRequest.currentReviewer?.employee
                    ? `${selectedRequest.currentReviewer.employee.firstName} ${selectedRequest.currentReviewer.employee.lastName}`
                    : selectedRequest.currentReviewer?.username ||
                      selectedRequest.currentReviewer?.email ||
                      'HR คนอื่น'}
                </p>
                <p className="text-[13px] text-[#FFA000] font-medium">
                  เริ่มตรวจสอบ:{' '}
                  {selectedRequest.hrReviewStartedAt
                    ? new Date(
                        selectedRequest.hrReviewStartedAt,
                      ).toLocaleString('th-TH')
                    : '-'}
                </p>
              </div>
            ) : undefined
          }
          footer={
            selectedRequest.currentHrReviewerId === user?.id ? (
              <>
                <button
                  onClick={onModalApprove}
                  className="bg-[#00C853] hover:bg-[#00B04A] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                  อนุมัติ
                </button>
                <button
                  onClick={onModalReject}
                  className="bg-[#FF0000] hover:bg-[#E50000] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-[18px] h-[18px]" strokeWidth={3} />
                  ปฏิเสธ
                </button>
              </>
            ) : null
          }
        />
      )}

      {/* Confirm Approve Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#00C853] flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6" strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-center text-black mb-2">
                ยืนยันการอนุมัติ
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                คุณแน่ใจหรือไม่ที่จะอนุมัติคำขอลาขั้นต้นนี้?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeApprove}
                  className="flex-1 px-4 py-2 bg-[#00C853] hover:bg-[#00B04A] text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  ยืนยันอนุมัติ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[#FFEBEE]">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-[#FFEBEE] text-[#FF0000] flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-center text-[#FF0000] mb-2">
                ปฏิเสธคำขอลา
              </h3>
              <p className="text-[13px] text-gray-500 text-center mb-4">
                กรุณาระบุเหตุผลในการปฏิเสธคำขอนี้ให้พนักงานทราบ
              </p>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="พิมพ์เหตุผลที่นี่..."
                className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-black outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] mb-5 min-h-[80px]"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeReject}
                  className="px-4 py-2 bg-[#FF0000] hover:bg-[#E50000] text-white rounded-lg text-sm font-bold transition-colors"
                >
                  ยืนยันปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
