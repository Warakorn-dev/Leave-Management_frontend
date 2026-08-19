"use client";

import { useState, useEffect } from "react";
import { useLeave } from "@/hooks/useLeave";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarIcon, X, User, Check, Clock, Eye } from "lucide-react";
import { isSameYearMonth } from "@/lib/api/utils";

export default function HrApprovePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approverReason, setApproverReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ id: string, reason: string } | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState<{ id: string, reason: string } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string, isImage: boolean } | null>(null);

  useEffect(() => {
    setApproverReason("");
  }, [selectedRequest]);

  const formatMonthYear = (yyyyMM: string) => {
    if (!yyyyMM) return "";
    const [year, month] = yyyyMM.split('-');
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const formatShortDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getDayRange = (start: string, end: string) => {
    if (start === end) return formatShortDate(start);
    const d1 = new Date(start);
    const d2 = new Date(end);
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
      return `${d1.getDate()}-${d2.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
    }
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  };

  const { useHrPendingVerifyQuery, useVerifyLeaveMutation, useMarkLeaveViewedMutation } = useLeave();
  const { user } = useAuth();
  const { data: allLeaves = [], refetch: refetchLeaves } = useHrPendingVerifyQuery();
  const { mutateAsync: verifyLeave } = useVerifyLeaveMutation();
  const { mutateAsync: markLeaveViewed } = useMarkLeaveViewedMutation();

  useEffect(() => {
    const filtered = allLeaves.filter((r: any) => isSameYearMonth(r.startDate, selectedMonthRaw));
    const sorted = [...filtered].sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());

    setRequests(sorted.map((r: any) => {
      let dateRangeStr = getDayRange(r.startDate.split('T')[0], r.endDate.split('T')[0]);
      let daysStr = `${r.totalDays || 1} วัน`;

      if (r.startFormat === 'hourly' || r.leaveMode === 'hourly') {
        const startT = new Date(r.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const endT = new Date(r.endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        dateRangeStr = `${formatShortDate(r.startDate)} ${startT} - ${endT}`;
        const hours = r.leaveHours ? r.leaveHours : Number(((r.totalDays ?? 0) * 8).toFixed(1));
        daysStr = `${hours} ชั่วโมง`;
      } else if ((r.totalDays ?? r.daysCount) === 0.5) {
        if (r.startFormat === 'morning') daysStr = 'ครึ่งวันเช้า';
        else if (r.startFormat === 'afternoon') daysStr = 'ครึ่งวันบ่าย';
        else daysStr = '0.5 วัน';
      }

      return {
        ...r,
        empId: r.employee?.employeeCode || (r.employee?.id ? `EMP-${String(r.employee.id).substring(0, 5).toUpperCase()}` : `EMP-000`),
        userId: r.user?.firstName ? `${r.user.firstName} ${r.user.lastName}` : (r.userId || 'Unknown'),
        firstName: r.user?.firstName || r.employee?.firstName || r.userId || 'Unknown',
        lastName: r.user?.lastName || r.employee?.lastName || '',
        department: r.user?.department?.name || r.department,
        position: r.user?.position?.name || r.position,
        type: r.leaveType?.name || r.type,
        dateRange: `${dateRangeStr} (${daysStr})`,
        formattedDays: daysStr
      };
    }));
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

  const handleApproveClick = (reqId: string, reason: string = "") => {
    setConfirmData({ id: reqId, reason });
    setShowConfirmModal(true);
  };

  const handlePullRequest = async (req: any) => {
    try {
      await markLeaveViewed({ id: req.id, lock: true });
      refetchLeaves(); // อัปเดตตารางให้แสดงสถานะว่าเราล็อคแล้ว
    } catch (error: any) {
      console.error("Failed to pull request", error);
      alert(error.message || 'ไม่สามารถดึงคำขอนี้ได้ เนื่องจากกำลังถูกตรวจสอบโดย HR คนอื่น');
      refetchLeaves();
    }
  };

  const handleViewDetails = async (req: any) => {
    if (req.currentHrReviewerId && req.currentHrReviewerId !== user?.id) {
      alert("คำขอนี้กำลังถูกตรวจสอบโดย HR คนอื่น คุณไม่สามารถดูรายละเอียดได้");
      return;
    }
    // แค่เปิดดูรายละเอียดเฉยๆ ไม่ได้จะดึงมาตรวจสอบ
    if (!req.isViewedByHr) {
      try {
        await markLeaveViewed({ id: req.id, lock: false });
        req.isViewedByHr = true;
        // ไม่ต้องล็อคเป็นของเรา (ไม่ต้องเซ็ต currentHrReviewerId)
      } catch (error: any) {
        console.error("Failed to mark leave as viewed", error);
      }
    }
    setSelectedRequest(req);
  };

  const executeApprove = async () => {
    if (!confirmData) return;
    try {
      await verifyLeave({ id: confirmData.id, action: 'Approve', comment: confirmData.reason });
      if (selectedRequest && selectedRequest.id === confirmData.id) setSelectedRequest(null);
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอ');
    } finally {
      refetchLeaves();
      setShowConfirmModal(false);
      setConfirmData(null);
    }
  };

  const handleRejectClick = (reqId: string, reason: string = "") => {
    setRejectData({ id: reqId, reason });
    setRejectReasonInput(reason);
    setShowRejectModal(true);
  };

  const executeReject = async () => {
    if (!rejectData) return;
    if (rejectReasonInput.trim() === "") {
      alert("การปฏิเสธคำขอลาจำเป็นต้องระบุเหตุผล");
      return;
    }
    try {
      await verifyLeave({ id: rejectData.id, action: 'Reject', comment: rejectReasonInput.trim() });
      if (selectedRequest && selectedRequest.id === rejectData.id) setSelectedRequest(null);
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    } finally {
      refetchLeaves();
      setShowRejectModal(false);
      setRejectData(null);
      setRejectReasonInput("");
    }
  };

  const onModalApprove = () => {
    handleApproveClick(selectedRequest.id, approverReason);
  };

  const onModalReject = () => {
    if (!approverReason.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธคำขอลา");
      return;
    }
    handleRejectClick(selectedRequest.id, approverReason);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 p-6 md:p-10 flex flex-col items-center">

      <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">รายการคำขอรอตรวจสอบ (HR View)</h1>
          <p className="text-sm text-gray-400 font-medium">พิจารณาตรวจสอบเบื้องต้น หรือปฏิเสธคำขอลาของพนักงาน</p>
        </div>

        {/* Month Picker Button */}
        <div className="mb-8 relative inline-block">
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-sm font-bold py-2 px-5 rounded-full shadow-sm flex items-center gap-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-all active:scale-95"
          >
            {formatMonthYear(selectedMonthRaw)}
            <CalendarIcon className="w-4 h-4 text-gray-700 dark:text-slate-200" strokeWidth={2.5} />
          </button>

          {isPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPickerOpen(false)}></div>
              <div className="absolute top-full left-0 mt-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 px-1">
                  <button onClick={() => setTempYear(y => y - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="font-bold text-lg text-black dark:text-white tracking-wide">{tempYear + 543}</span>
                  <button onClick={() => setTempYear(y => y + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."].map((m, i) => {
                    const isSelected = selectedMonthRaw === `${tempYear}-${(i + 1).toString().padStart(2, '0')}`;
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(i)}
                        className={`py-2.5 rounded-xl text-[14px] font-bold transition-all ${isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300'
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
                <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสคำขอ</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ชื่อ-นามสกุล</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">แผนก</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ประเภทการลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">วันที่ลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap text-center">สถานะ</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium bg-white">
                    ไม่มีรายการคำขอรอตรวจสอบในเดือน {formatMonthYear(selectedMonthRaw)}
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const isLockedByOther = req.currentHrReviewerId && req.currentHrReviewerId !== user?.id;
                  const isLockedByMe = req.currentHrReviewerId === user?.id;

                  return (
                    <tr key={req.id} className="border-b border-gray-100 bg-white last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-6 text-[14px] text-blue-600 font-bold whitespace-nowrap">{req.requestCode || '-'}</td>
                      <td className="py-5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-gray-800 font-bold">{req.firstName} {req.lastName}</span>
                            <span className="text-[12px] text-gray-400">{req.user?.role || req.position || 'Employee'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">{req.department || '-'}</td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">{req.type}</td>
                      <td className="py-5 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">{req.dateRange}</td>
                      <td className="py-5 px-6 whitespace-nowrap text-center">
                        {isLockedByOther || isLockedByMe || req.status === 'REVIEWING_HR' ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-500 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> HR กำลังตรวจสอบ
                            </span>
                            {isLockedByOther && (
                              <span className="text-[11px] text-orange-500 mt-1 font-medium">ล็อกโดย ผู้อื่น</span>
                            )}
                            {isLockedByMe && (
                              <span className="text-[11px] text-blue-500 mt-1 font-medium">ล็อกโดย คุณ</span>
                            )}
                          </div>
                        ) : req.status === 'PENDING_CANCELLATION' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-rose-50 text-rose-500 border border-rose-100">
                            รอยกเลิก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-500 border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> รอ HR ตรวจสอบ
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-center whitespace-nowrap">
                        {isLockedByOther ? (
                          <span className="text-[13px] text-gray-400 font-medium">Locked</span>
                        ) : isLockedByMe ? (
                          <button
                            onClick={() => handleViewDetails(req)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                            ตรวจสอบเอกสาร
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePullRequest(req)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                              ดึงมาตรวจสอบ
                            </button>
                            <button
                              onClick={() => handleViewDetails(req)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-[14px] h-[14px]" strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden relative">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-[20px] font-bold text-black">รายละเอียดคำขอลา (Leave Request Details)</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">

              {/* Employee Info */}
              <div className="border border-gray-300 rounded-xl p-5 flex gap-4 bg-white">
                <div className="w-[38px] h-[38px] rounded-full bg-fuchsia-100/50 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] text-black mb-3">ข้อมูลพนักงาน (Employee Info)</h3>
                  <div className="text-[14px] text-gray-800 space-y-2">
                    <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">ชื่อ:</span> {selectedRequest.userId || selectedRequest.raw?.userId}</p>
                    <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">แผนก|ตำแหน่ง:</span> {selectedRequest.department || "-"} | {selectedRequest.position || selectedRequest.raw?.positionName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Leave Info */}
              <div className="border border-gray-300 rounded-xl p-5 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-[32px] h-[32px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-[15px] text-black">รายละเอียดการลา (Leave Information)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-gray-800 pl-[44px]">
                  <div className="space-y-3">
                    <p className="flex gap-2 items-center"><span className="font-bold min-w-[80px]">รหัสการลา:</span> <span className="text-blue-500 font-semibold">{selectedRequest.requestCode || '-'}</span></p>
                    <p className="flex gap-2"><span className="font-bold min-w-[80px]">ประเภทการลา:</span> {selectedRequest.type}</p>
                    <p className="flex gap-2"><span className="font-bold min-w-[80px]">ช่วงเวลา:</span> {selectedRequest.dateRange}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="flex items-center gap-2">
                      <Clock className="w-[14px] h-[14px] text-gray-400" />
                      <span className="font-bold min-w-[60px]">จำนวน:</span> <span className="font-semibold text-blue-600">{selectedRequest.formattedDays}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <h3 className="font-bold text-black text-[14px] mb-2">เอกสารแนบ</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedRequest.attachments.map((att: any, i: number) => {
                      const isData = att.filePath?.startsWith('data:');
                      const fileSrc = isData ? att.filePath : (att.filePath?.startsWith('http') ? att.filePath : `/${att.filePath?.replace(/^\/+/, '')}`);
                      const isImage = att.fileType?.includes('image') || (att.filePath && !isData && att.filePath.match(/\.(jpeg|jpg|gif|png)$/i));

                      return (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm relative group cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => {
                            setPreviewAttachment({ url: fileSrc, isImage });
                          }}
                        >
                          {isImage ? (
                            <img src={fileSrc} alt="Attachment" className="w-full h-24 object-cover" />
                          ) : (
                            <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-50 text-blue-500">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" /><path d="m18 22 4-4" /><path d="m14 18 4-4" /><path d="M4 14V4a2 2 0 0 1 2-2h8l6 6v3" /></svg>
                              <span className="text-xs font-bold mt-2">ไฟล์เอกสาร</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded-md">คลิกเพื่อดูไฟล์</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <h3 className="font-bold text-black text-[14px] mb-2">เหตุผลการลา</h3>
                <input
                  type="text"
                  readOnly
                  value={selectedRequest.reason || '-'}
                  className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default"
                />
              </div>

            </div>

            {/* Approver Footer Form */}
            {selectedRequest.currentHrReviewerId && selectedRequest.currentHrReviewerId !== user?.id ? (
              <div className="bg-[#FFF8E1] border-t border-[#FFC107] px-6 py-5 shrink-0 flex flex-col items-center justify-center">
                <p className="font-bold text-[#FF8F00] text-[15px] mb-1">
                  คำขอนี้กำลังถูกตรวจสอบโดย {selectedRequest.currentReviewer?.username || selectedRequest.currentReviewer?.email || 'HR คนอื่น'}
                </p>
                <p className="text-[13px] text-[#FFA000] font-medium">
                  เริ่มตรวจสอบ: {selectedRequest.hrReviewStartedAt ? new Date(selectedRequest.hrReviewStartedAt).toLocaleString('th-TH') : '-'}
                </p>
                <p className="text-[13px] text-[#FFA000] mt-2 bg-[#FFECB3] px-3 py-1.5 rounded-md font-bold">
                  คุณสามารถดูรายละเอียดได้ แต่ไม่สามารถอนุมัติหรือปฏิเสธคำขอนี้ได้
                </p>
              </div>
            ) : selectedRequest.currentHrReviewerId === user?.id ? (
              <div className="bg-[#FAFAFA] border-t border-gray-200 px-6 py-5 shrink-0">
                <h3 className="font-bold text-black text-[14px] mb-3">ตรวจสอบเอกสารและข้อมูลการลา</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."
                    value={approverReason}
                    onChange={(e) => setApproverReason(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl p-3 text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                  />
                  <div className="flex gap-2">
                    <button onClick={onModalApprove} className="flex-1 sm:flex-none bg-[#00C853] hover:bg-[#00B04A] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5">
                      <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      ผ่านการตรวจสอบ
                    </button>
                    <button onClick={onModalReject} className="flex-1 sm:flex-none bg-[#FF0000] hover:bg-[#E50000] text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5">
                      <X className="w-[18px] h-[18px]" strokeWidth={3} />
                      ปฏิเสธคำขอ
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* Confirm Approve Modal (Small) */}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#00C853] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">ยืนยันการตรวจสอบ</h3>
              <button onClick={() => { setShowConfirmModal(false); setConfirmData(null); }} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm font-medium mb-1">คุณต้องการให้คำขอลานี้ผ่านการตรวจสอบเบื้องต้น ใช่หรือไม่?</p>
              <p className="text-[13px] text-gray-500 mb-6">รหัสคำขอ: {requests.find(r => r.id === confirmData.id)?.requestCode}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowConfirmModal(false); setConfirmData(null); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">
                  ยกเลิก
                </button>
                <button onClick={executeApprove} className="px-4 py-2 bg-[#00C853] hover:bg-[#00B04A] text-white rounded-lg text-sm font-bold transition-colors">
                  ยืนยันการทำรายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reject Modal (Small) */}
      {showRejectModal && rejectData && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#FF0000] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">ยืนยันการปฏิเสธคำขอ</h3>
              <button onClick={() => { setShowRejectModal(false); setRejectData(null); setRejectReasonInput(""); }} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm font-medium mb-1">คุณต้องการปฏิเสธคำขอลานี้ ใช่หรือไม่?</p>
              <p className="text-[13px] text-gray-500 mb-4">รหัสคำขอ: {requests.find(r => r.id === rejectData.id)?.requestCode}</p>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-black"
                  placeholder="ระบุเหตุผล..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowRejectModal(false); setRejectData(null); setRejectReasonInput(""); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">
                  ยกเลิก
                </button>
                <button onClick={executeReject} className="px-4 py-2 bg-[#FF0000] hover:bg-[#E50000] text-white rounded-lg text-sm font-bold transition-colors">
                  ยืนยันปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Attachment Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewAttachment(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
              <h2 className="text-[16px] font-bold text-black">ไฟล์เอกสารแนบ (Attachment)</h2>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-50/50">
              {previewAttachment.isImage ? (
                <img src={previewAttachment.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200" />
              ) : (
                <iframe src={previewAttachment.url} className="w-full h-[75vh] bg-white rounded-lg shadow-sm border border-gray-200" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
