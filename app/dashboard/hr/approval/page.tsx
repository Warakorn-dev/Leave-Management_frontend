"use client";

import { useState, useEffect } from "react";
import { useLeave } from "@/hooks/useLeave";
import { Calendar as CalendarIcon, X, User, Check, Clock } from "lucide-react";

export default function HrApprovePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approverReason, setApproverReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{id: string, reason: string} | null>(null);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState<{id: string, reason: string} | null>(null);
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

  const { useHrPendingVerifyQuery, useVerifyLeaveMutation } = useLeave();
  const { data: allLeaves = [], refetch: refetchLeaves } = useHrPendingVerifyQuery();
  const { mutateAsync: verifyLeave } = useVerifyLeaveMutation();

  useEffect(() => {
    const filtered = allLeaves.filter((r: any) => r.startDate.startsWith(selectedMonthRaw));
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
        userId: r.user?.firstName ? `${r.user.firstName} ${r.user.lastName}` : (r.userId || 'Unknown'),
        department: r.user?.department?.name || r.department,
        position: r.user?.position?.name || r.position,
        type: r.leaveType?.name || r.type,
        dateRange: `${dateRangeStr} (${daysStr})`,
        formattedDays: daysStr
      };
    }));
  }, [selectedMonthRaw, allLeaves]);

  const handleMonthSelect = (monthIndex: number) => {
    const mm = (monthIndex + 1).toString().padStart(2, '0');
    setSelectedMonthRaw(`${tempYear}-${mm}`);
    setIsPickerOpen(false);
  };

  const handleApproveClick = (reqId: string, reason: string = "") => {
    setConfirmData({ id: reqId, reason });
    setShowConfirmModal(true);
  };

  const executeApprove = async () => {
    if (!confirmData) return;
    await verifyLeave({ id: confirmData.id, action: 'Approve', comment: confirmData.reason });
    refetchLeaves();
    if (selectedRequest && selectedRequest.id === confirmData.id) setSelectedRequest(null);
    setShowConfirmModal(false);
    setConfirmData(null);
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
    await verifyLeave({ id: rejectData.id, action: 'Reject', comment: rejectReasonInput.trim() });
    refetchLeaves();
    if (selectedRequest && selectedRequest.id === rejectData.id) setSelectedRequest(null);
    setShowRejectModal(false);
    setRejectData(null);
    setRejectReasonInput("");
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
            className="border border-gray-300 text-gray-700 text-sm font-bold py-2 px-5 rounded-full shadow-sm flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
          >
            {formatMonthYear(selectedMonthRaw)}
            <CalendarIcon className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
          </button>

          {isPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPickerOpen(false)}></div>
              <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 px-1">
                  <button onClick={() => setTempYear(y => y - 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="font-bold text-lg text-black tracking-wide">{tempYear + 543}</span>
                  <button onClick={() => setTempYear(y => y + 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2F2F2] text-gray-500 text-[13px]">
                <th className="py-4 px-6 font-bold whitespace-nowrap rounded-l-md">รหัสคำขอลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ชื่อพนักงาน</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ประเภทวันลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">วันเวลาที่ขอลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">เอกสารแนบ</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap rounded-r-md text-right pr-12">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                    ไม่มีรายการคำขอรอตรวจสอบในเดือน {formatMonthYear(selectedMonthRaw)}
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => (
                  <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-6 text-[14px] text-blue-600 font-bold whitespace-nowrap">{req.requestCode || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                          {req.userId?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col min-w-[180px] shrink-0">
                          <span className="text-[14px] font-bold text-gray-800">{req.userId}</span>
                          <span className="text-[12px] text-gray-500">{req.employee?.employeeCode || (req.employee?.id ? `EMP-${String(req.employee.id).substring(0, 5).toUpperCase()}` : `EMP-000`)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.type}</td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.dateRange}</td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">
                      {req.attachments && req.attachments.length > 0 ? (
                        <span className="text-emerald-600 font-bold">มีเอกสารแนบ</span>
                      ) : '-'}
                    </td>
                    <td className="py-6 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 pr-6">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="bg-[#FFA000] hover:bg-[#F57C00] text-black text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                        >
                          รายละเอียด
                        </button>
                        <button 
                          onClick={() => handleApproveClick(req.id)}
                          className="bg-[#00C853] hover:bg-[#00B04A] text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                        >
                          ผ่านการตรวจสอบ
                        </button>
                        <button 
                          onClick={() => handleRejectClick(req.id)}
                          className="bg-[#FF0000] hover:bg-[#E50000] text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                      const fileSrc = isData ? att.filePath : (att.filePath?.startsWith('http') ? att.filePath : `http://localhost:8000${att.filePath?.startsWith('/') ? '' : '/'}${att.filePath}`);
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
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="m18 22 4-4"/><path d="m14 18 4-4"/><path d="M4 14V4a2 2 0 0 1 2-2h8l6 6v3"/></svg>
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
