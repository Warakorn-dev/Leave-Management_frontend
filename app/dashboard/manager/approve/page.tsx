"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, X, User, Check, Clock, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

const getToken = () =>
  typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : "";

/** Fetch pending leave requests for the manager's department via dedicated endpoint */
async function fetchManagerPending(): Promise<any[]> {
  const res = await fetch("/api/manager/pending", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch pending requests");
  const json = await res.json();
  return json.data ?? json;
}

async function approveLeave(id: string, comment?: string) {
  const res = await fetch(`/api/manager/approve/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ comment: comment || "" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to approve");
  }
  return res.json();
}

async function rejectLeave(id: string, comment: string) {
  const res = await fetch(`/api/manager/reject/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to reject");
  }
  return res.json();
}

// ──────────────── helpers ────────────────

function formatShortDate(dateString: string) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayRange(start: string, end: string) {
  if (start.split("T")[0] === end.split("T")[0]) return formatShortDate(start);
  const d1 = new Date(start);
  const d2 = new Date(end);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear())
    return `${d1.getDate()}-${d2.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatMonthYear(yyyyMM: string) {
  if (!yyyyMM) return "";
  const [year, month] = yyyyMM.split("-");
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
}

function mapRequest(r: any) {
  let dateRangeStr = getDayRange(r.startDate, r.endDate);
  let daysStr = `${r.totalDays || 1} วัน`;

  if (r.startFormat === "hourly") {
    const startT = new Date(r.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const endT = new Date(r.endDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    dateRangeStr = `${formatShortDate(r.startDate)} ${startT} - ${endT}`;
    const hours = r.leaveHours ?? Number(((r.totalDays ?? 0) * 8).toFixed(1));
    daysStr = `${hours} ชั่วโมง`;
  } else if ((r.totalDays ?? 0) === 0.5) {
    daysStr = r.startFormat === "morning" ? "ครึ่งวันเช้า" : r.startFormat === "afternoon" ? "ครึ่งวันบ่าย" : "0.5 วัน";
  }

  const emp = r.employee ?? {};
  return {
    ...r,
    empCode: emp.employeeCode || (emp.id ? `EMP-${String(emp.id).substring(0, 5).toUpperCase()}` : "EMP-000"),
    firstName: emp.firstName || "ไม่ระบุ",
    lastName: emp.lastName || "",
    department: emp.department?.name || "-",
    position: emp.position?.name || "-",
    type: r.leaveType?.name || r.type || "-",
    dateRange: `${dateRangeStr} (${daysStr})`,
    formattedDays: daysStr,
  };
}

// ──────────────── component ────────────────

export default function ManagerApprovePage() {
  const [rawRequests, setRawRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approverReason, setApproverReason] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; isImage: boolean } | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchManagerPending();
      setRawRequests(data.map(mapRequest));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    setApproverReason("");
  }, [selectedRequest]);

  // Filter by selected month
  const requests = rawRequests.filter((r) => {
    if (!r.startDate) return false;
    const d = new Date(r.startDate);
    const yyyyMM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return yyyyMM === selectedMonthRaw;
  });

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonthRaw(`${tempYear}-${(monthIndex + 1).toString().padStart(2, "0")}`);
    setIsPickerOpen(false);
  };

  // ── approve ──
  const handleApproveClick = async (req: any, comment?: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการอนุมัติ",
      text: `อนุมัติคำขอลาของ ${req.firstName} ${req.lastName} (${req.formattedDays})?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00C853",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    try {
      await approveLeave(req.id, comment);
      setSelectedRequest(null);
      refetch();
      Swal.fire({ icon: "success", title: "อนุมัติสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  // ── reject ──
  const handleRejectClick = async (req: any, prefillReason?: string) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: "ยืนยันการปฏิเสธ",
      html: `<p class="text-sm text-gray-600 mb-3">ปฏิเสธคำขอลาของ <strong>${req.firstName} ${req.lastName}</strong></p>`,
      input: "textarea",
      inputValue: prefillReason || "",
      inputPlaceholder: "กรอกเหตุผลที่ปฏิเสธ (บังคับ)...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "ปฏิเสธคำขอ",
      cancelButtonText: "ยกเลิก",
      preConfirm: (text) => {
        if (!text?.trim()) {
          Swal.showValidationMessage("กรุณาระบุเหตุผลในการปฏิเสธ");
        }
        return text;
      },
    });
    if (!isConfirmed || !reason?.trim()) return;

    try {
      await rejectLeave(req.id, reason.trim());
      setSelectedRequest(null);
      refetch();
      Swal.fire({ icon: "success", title: "ปฏิเสธคำขอสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">รายการคำขอรออนุมัติ (Manager View)</h1>
          <p className="text-sm text-gray-400 font-medium">พิจารณาอนุมัติหรือปฏิเสธคำขอลาของพนักงานในแผนกของคุณ</p>
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
              <div className="fixed inset-0 z-40" onClick={() => setIsPickerOpen(false)} />
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
                      <button key={m} onClick={() => handleMonthSelect(i)} className={`py-2.5 rounded-xl text-[14px] font-bold transition-all ${isSelected ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"}`}>
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
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">กำลังโหลด...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F2F2] text-gray-500 text-[13px]">
                  <th className="py-4 px-6 font-bold whitespace-nowrap rounded-l-md">รหัสคำขอลา</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสพนักงาน</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">ชื่อ-นามสกุล</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">แผนก</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">ประเภทวันลา</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">วันเวลาที่ขอลา</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap">เอกสารแนบ</th>
                  <th className="py-4 px-6 font-bold whitespace-nowrap rounded-r-md text-right pr-8">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                      ไม่มีรายการคำขออนุมัติในเดือน {formatMonthYear(selectedMonthRaw)}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-6 px-6 text-[14px] text-blue-600 font-bold whitespace-nowrap">{req.requestCode || "-"}</td>
                      <td className="py-6 px-6 text-[14px] text-gray-500 font-medium whitespace-nowrap">{req.empCode}</td>
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">
                            {req.firstName?.charAt(0) || "U"}
                          </div>
                          <span className="text-[14px] font-bold text-gray-800 whitespace-nowrap">{req.firstName} {req.lastName}</span>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.department}</td>
                      <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.type}</td>
                      <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">{req.dateRange}</td>
                      <td className="py-6 px-6 text-[14px] text-gray-500 whitespace-nowrap">
                        {req.attachments?.length > 0 ? (
                          <span className="text-emerald-600 font-bold">มีเอกสารแนบ</span>
                        ) : "-"}
                      </td>
                      <td className="py-6 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 pr-2">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="bg-[#FFA000] hover:bg-[#F57C00] text-black text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                          >
                            รายละเอียด
                          </button>
                          <button
                            onClick={() => handleApproveClick(req)}
                            className="bg-[#00C853] hover:bg-[#00B04A] text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleRejectClick(req)}
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
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-[20px] font-bold text-black">รายละเอียดคำขอลา</h2>
              <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-4">

              {/* Employee Info */}
              <div className="border border-gray-200 rounded-xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] text-black mb-3">ข้อมูลพนักงาน</h3>
                  <div className="text-[14px] text-gray-700 space-y-1.5">
                    <p><span className="font-bold min-w-[90px] inline-block">ชื่อ-นามสกุล:</span>{selectedRequest.firstName} {selectedRequest.lastName}</p>
                    <p><span className="font-bold min-w-[90px] inline-block">รหัสพนักงาน:</span>{selectedRequest.empCode}</p>
                    <p><span className="font-bold min-w-[90px] inline-block">แผนก | ตำแหน่ง:</span>{selectedRequest.department} | {selectedRequest.position}</p>
                  </div>
                </div>
              </div>

              {/* Leave Info */}
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-[15px] text-black">รายละเอียดการลา</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px] text-gray-700 pl-[44px]">
                  <div className="space-y-2">
                    <p><span className="font-bold">รหัสการลา:</span> <span className="text-blue-500 font-semibold">{selectedRequest.requestCode || "-"}</span></p>
                    <p><span className="font-bold">ประเภทการลา:</span> {selectedRequest.type}</p>
                    <p><span className="font-bold">ช่วงเวลา:</span> {selectedRequest.dateRange}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-bold">รูปแบบ:</span>
                      {selectedRequest.startFormat === "hourly" ? `รายชั่วโมง (${selectedRequest.leaveHours} ชม.)` : selectedRequest.startFormat === "morning" ? "ครึ่งวันเช้า" : selectedRequest.startFormat === "afternoon" ? "ครึ่งวันบ่าย" : "เต็มวัน"}
                    </p>
                    {selectedRequest.leaveType?.isSpecial && (
                      <p className="flex items-center gap-2 text-purple-600">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-bold">ต้องผ่านการอนุมัติจาก CEO</span>
                      </p>
                    )}
                    <p>
                      <span className="font-bold">เอกสารแนบ:</span>{" "}
                      {selectedRequest.attachments?.length > 0 ? (
                        <button
                          onClick={() => {
                            const att = selectedRequest.attachments[0];
                            const isData = att.filePath.startsWith("data:");
                            const fileSrc = isData ? att.filePath : `/${att.filePath.replace(/^\/+/, '')}`;
                            const isImage = att.fileType?.includes("image") || att.filePath?.match(/\.(jpeg|jpg|gif|png)$/i);
                            setPreviewAttachment({ url: fileSrc, isImage: Boolean(isImage) });
                          }}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          ดูเอกสารแนบ
                        </button>
                      ) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="font-bold text-black text-[14px] mb-2">เหตุผลการลา</h3>
                <textarea
                  readOnly
                  value={selectedRequest.reason || "-"}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default resize-none"
                />
              </div>

              {/* Approver comment */}
              <div>
                <h3 className="font-bold text-black text-[14px] mb-2">
                  หมายเหตุผู้อนุมัติ <span className="text-gray-400 font-normal text-[13px]">(บังคับหากปฏิเสธ)</span>
                </h3>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ..."
                  value={approverReason}
                  onChange={(e) => setApproverReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
              <span className="text-[12px] text-gray-400">
                ยื่นเมื่อ: {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleApproveClick(selectedRequest, approverReason)}
                  className="bg-[#00E676] hover:bg-[#00C853] text-white text-[13px] font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleRejectClick(selectedRequest, approverReason)}
                  className="bg-[#FF0000] hover:bg-[#E50000] text-white text-[13px] font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewAttachment(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-blue-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
              <h2 className="text-[16px] font-bold text-black">ไฟล์เอกสารแนบ</h2>
              <button onClick={() => setPreviewAttachment(null)} className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors">
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
