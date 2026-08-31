"use client";

import { useState, useEffect } from "react";
import { useLeave } from "@/hooks/useLeave";
import { Calendar as CalendarIcon, X, Check, AlertTriangle } from "lucide-react";
import { LeaveDetailModal } from "@/components/LeaveDetailModal";

export default function HrCancelApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approverReason, setApproverReason] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ id: string } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  useEffect(() => {
    setApproverReason("");
  }, [selectedRequest]);

  const formatMonthYear = (yyyyMM: string) => {
    if (!yyyyMM) return "";
    const [year, month] = yyyyMM.split("-");
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

  const { usePendingCancellationQuery, useVerifyLeaveMutation } = useLeave();
  const { data: allCancellations = [], refetch: refetchCancellations } = usePendingCancellationQuery();
  const { mutateAsync: verifyLeave } = useVerifyLeaveMutation();

  useEffect(() => {
    const filtered = allCancellations.filter((r: any) => {
      if (!r.startDate) return false;
      const d = new Date(r.startDate);
      const yyyyMM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return yyyyMM === selectedMonthRaw;
    });
    const sorted = [...filtered].sort(
      (a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
    );

    setRequests(
      sorted.map((r: any) => {
        let dateRangeStr = getDayRange(r.startDate.split("T")[0], r.endDate.split("T")[0]);
        let daysStr = `${r.totalDays || 1} วัน`;

        if (r.startFormat === "hourly" || r.leaveMode === "hourly") {
          const startT = new Date(r.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
          const endT = new Date(r.endDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
          dateRangeStr = `${formatShortDate(r.startDate)} ${startT} - ${endT}`;
          const hours = r.leaveHours ? r.leaveHours : Number(((r.totalDays ?? 0) * 8).toFixed(1));
          daysStr = `${hours} ชั่วโมง`;
        } else if ((r.totalDays ?? r.daysCount) === 0.5) {
          if (r.startFormat === "morning") daysStr = "ครึ่งวันเช้า";
          else if (r.startFormat === "afternoon") daysStr = "ครึ่งวันบ่าย";
          else daysStr = "0.5 วัน";
        }

        return {
          ...r,
          displayName: r.employee
            ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim()
            : r.userId || "Unknown",
          firstName: r.employee?.firstName || r.user?.firstName || r.userId || "Unknown",
          lastName: r.employee?.lastName || r.user?.lastName || "",
          employeeCode: r.employee?.employeeCode || (r.employee?.id ? `EMP-${String(r.employee.id).substring(0, 5).toUpperCase()}` : `EMP-000`),
          department: r.employee?.department?.name || r.user?.department?.name || "-",
          position: r.employee?.position?.name || r.user?.position?.name || "-",
          type: r.leaveType?.name || r.type || "-",
          dateRange: `${dateRangeStr} (${daysStr})`,
          formattedDays: daysStr,
        };
      })
    );
  }, [selectedMonthRaw, allCancellations]);

  const handleMonthSelect = (monthIndex: number) => {
    const mm = (monthIndex + 1).toString().padStart(2, "0");
    setSelectedMonthRaw(`${tempYear}-${mm}`);
    setIsPickerOpen(false);
  };

  // ปุ่มอนุมัติการยกเลิก
  const handleApproveClick = (reqId: string) => {
    setConfirmData({ id: reqId });
    setShowApproveModal(true);
  };

  const executeApprove = async () => {
    if (!confirmData) return;
    await verifyLeave({ id: confirmData.id, action: "Approve", comment: approverReason.trim() || "อนุมัติการยกเลิกโดย HR" });
    refetchCancellations();
    if (selectedRequest?.id === confirmData.id) setSelectedRequest(null);
    setShowApproveModal(false);
    setConfirmData(null);
    setApproverReason("");
  };

  // ปุ่มปฏิเสธ (คงสภาพ)
  const handleRejectClick = (reqId: string) => {
    setConfirmData({ id: reqId });
    setRejectReasonInput("");
    setShowRejectModal(true);
  };

  const executeReject = async () => {
    if (!confirmData) return;
    if (!rejectReasonInput.trim()) {
      alert("การปฏิเสธคำขอยกเลิกจำเป็นต้องระบุเหตุผล");
      return;
    }
    await verifyLeave({ id: confirmData.id, action: "Reject", comment: rejectReasonInput.trim() });
    refetchCancellations();
    if (selectedRequest?.id === confirmData.id) setSelectedRequest(null);
    setShowRejectModal(false);
    setConfirmData(null);
    setRejectReasonInput("");
  };

  const onModalApprove = () => {
    if (!selectedRequest) return;
    handleApproveClick(selectedRequest.id);
  };

  const onModalReject = () => {
    if (!selectedRequest) return;
    if (!approverReason.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธคำขอยกเลิก");
      return;
    }
    setRejectReasonInput(approverReason);
    setConfirmData({ id: selectedRequest.id });
    setShowRejectModal(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 p-6 md:p-10 flex flex-col items-center">

      <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ตรวจสอบคำขอยกเลิกการลา</h1>
          </div>
          <p className="text-sm text-gray-400 font-medium pl-12">
            พิจารณาอนุมัติหรือปฏิเสธคำขอยกเลิกใบลาที่ได้รับการอนุมัติแล้ว
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="text-sm text-rose-700">
            <p className="font-bold mb-1">หมายเหตุ:</p>
            <ul className="space-y-0.5 text-rose-600">
              <li>• <span className="font-semibold">อนุมัติการยกเลิก</span> → ใบลาจะถูกยกเลิก และโควตาวันลาจะถูกคืนให้พนักงาน</li>
              <li>• <span className="font-semibold">ปฏิเสธ (คงสภาพ)</span> → ใบลายังคงมีผล สถานะกลับเป็น "อนุมัติแล้ว"</li>
            </ul>
          </div>
        </div>

        {/* Month Picker */}
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
                  <button onClick={() => setTempYear((y) => y - 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="font-bold text-lg text-black tracking-wide">{tempYear + 543}</span>
                  <button onClick={() => setTempYear((y) => y + 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."].map((m, i) => {
                    const isSelected = selectedMonthRaw === `${tempYear}-${(i + 1).toString().padStart(2, "0")}`;
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(i)}
                        className={`py-2.5 rounded-xl text-[14px] font-bold transition-all ${isSelected ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "text-gray-600 hover:bg-rose-50 hover:text-rose-700"}`}
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
                <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสพนักงาน</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ชื่อ</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">นามสกุล</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">ประเภทวันลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">วันเวลาที่ขอลา</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap">สถานะ</th>
                <th className="py-4 px-6 font-bold whitespace-nowrap rounded-r-md text-center pr-12">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Check className="w-7 h-7 text-gray-300" strokeWidth={2} />
                      </div>
                      <p className="font-semibold text-gray-500">ไม่มีคำขอยกเลิกการลาในเดือน {formatMonthYear(selectedMonthRaw)}</p>
                      <p className="text-sm text-gray-400">ไม่มีรายการที่รอการตรวจสอบ</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-rose-50/30 transition-colors">
                    <td className="py-6 px-6 text-[14px] text-rose-600 font-bold whitespace-nowrap">
                      {req.requestCode || "-"}
                    </td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 font-medium whitespace-nowrap">{req.employeeCode}</td>
                    <td className="py-6 px-6 text-[14px] text-gray-800 font-bold whitespace-nowrap">
                      {req.firstName}
                    </td>
                    <td className="py-6 px-6 text-[14px] text-gray-800 font-medium whitespace-nowrap">{req.lastName}</td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.type}</td>
                    <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.dateRange}</td>
                    <td className="py-6 px-6">
                      <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-[11px] font-bold px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        รอตรวจสอบการยกเลิก
                      </span>
                    </td>
                    <td className="py-6 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 pr-6">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="bg-[#FFA000] hover:bg-[#F57C00] text-black text-[11px] font-bold py-1.5 w-[105px] text-center rounded shadow-sm transition-colors"
                        >
                          รายละเอียด
                        </button>
                        <button
                          onClick={() => handleApproveClick(req.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold py-1.5 w-[105px] text-center rounded shadow-sm transition-colors"
                        >
                          อนุมัติการยกเลิก
                        </button>
                        <button
                          onClick={() => handleRejectClick(req.id)}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-[11px] font-bold py-1.5 w-[105px] text-center rounded shadow-sm transition-colors"
                        >
                          ปฏิเสธ (คงสภาพ)
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
        <LeaveDetailModal
          leave={selectedRequest.raw ?? selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="รายละเอียดคำขอยกเลิกวันลา"
          footerBar={
            <div className="bg-[#FAFAFA] border-t border-gray-200 px-6 py-5 shrink-0">
              <h3 className="font-bold text-black text-[14px] mb-3">
                พิจารณาคำขอยกเลิกการลา
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="หมายเหตุ / เหตุผลเพิ่มเติม..."
                  value={approverReason}
                  onChange={(e) => setApproverReason(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl p-3 text-[14px] outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-black"
                />
                <div className="flex gap-2">
                  <button
                    onClick={onModalApprove}
                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                    อนุมัติการยกเลิก
                  </button>
                  <button
                    onClick={onModalReject}
                    className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-[18px] h-[18px]" strokeWidth={3} />
                    ปฏิเสธ (คงสภาพ)
                  </button>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Confirm Approve Cancellation Modal */}
      {showApproveModal && confirmData && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ยืนยันการอนุมัติการยกเลิก
              </h3>
              <button onClick={() => { setShowApproveModal(false); setConfirmData(null); }} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5">
                <p className="text-rose-700 text-sm font-semibold mb-1">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                <ul className="text-rose-600 text-xs space-y-1 mt-2">
                  <li>• ใบลารหัส <strong>{requests.find((r) => r.id === confirmData.id)?.requestCode}</strong> จะถูกยกเลิก</li>
                  <li>• โควตาวันลาจะถูกคืนให้พนักงานอัตโนมัติ</li>
                  <li>• พนักงานจะได้รับ notification แจ้งผล</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowApproveModal(false); setConfirmData(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeApprove}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  ยืนยัน — อนุมัติการยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reject (Keep Leave) Modal */}
      {showRejectModal && confirmData && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">ปฏิเสธคำขอยกเลิก (คงสภาพ)</h3>
              <button onClick={() => { setShowRejectModal(false); setConfirmData(null); setRejectReasonInput(""); }} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm font-medium mb-1">คุณต้องการปฏิเสธคำขอยกเลิกนี้ ใช่หรือไม่?</p>
              <p className="text-[13px] text-gray-500 mb-4">ใบลาจะยังคงมีผลและสถานะกลับเป็น <strong>"อนุมัติแล้ว"</strong></p>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-black"
                  placeholder="ระบุเหตุผลที่ไม่อนุมัติการยกเลิก..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setConfirmData(null); setRejectReasonInput(""); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeReject}
                  className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  ยืนยันการปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
