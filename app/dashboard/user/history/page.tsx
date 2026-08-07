"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Mail, Bell, Settings, Calendar as CalendarIcon, X, User, Download, Edit3, Trash2, Upload, Check, Clock } from "lucide-react";
import { useLeave } from "@/hooks/useLeave";
import { useLeaveBalance } from "@/hooks/useLeaveBalance";
import Swal from "sweetalert2";
import { ThaiDatePicker, ThaiMonthPicker } from "@/components/ThaiCalendarPicker";
import { LeaveTimePicker } from "@/components/LeaveTimePicker";
import { uploadApi } from "@/api";

export default function LeaveHistoryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [username, setUsername] = useState("xxxxx xxxxxx");
  const [filterType, setFilterType] = useState<"daily" | "monthly">("monthly");
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const router = useRouter();
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editAttachment, setEditAttachment] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    leaveMode: "full_day",
    period: "full",
    leaveDate: "",
    startTime: "",
    endTime: ""
  });



  const formatMonthYear = (yyyyMM: string) => {
    if (!yyyyMM) return "";
    const [year, month] = yyyyMM.split('-');
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const { useLeavesQuery, useDeleteLeaveMutation, useUpdateLeaveMutation } = useLeave();
  const { data: allLeaves = [], refetch: refetchLeaves } = useLeavesQuery();
  const { mutateAsync: deleteLeave } = useDeleteLeaveMutation();
  const { mutateAsync: updateLeave } = useUpdateLeaveMutation();
  const { useLeaveBalancesQuery } = useLeaveBalance();
  const { data: allBalances = [] } = useLeaveBalancesQuery();

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername && storedUsername !== "User") {
      setUsername(sessionStorage.getItem("fullName") || storedUsername);
    }
  }, []);

  useEffect(() => {
    setBalances(allBalances);
  }, [allBalances]);

  useEffect(() => {
    const myId = sessionStorage.getItem("userId");
    const myLeaves = allLeaves.filter(l => String(l.userId) === myId);
    const filtered = myLeaves.filter((r: any) => {
      if (filterType === "monthly") {
        return r.startDate.startsWith(selectedMonthRaw);
      } else {
        if (!selectedDate) return true;
        const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const startStr = r.startDate.split('T')[0];
        const endStr = r.endDate ? r.endDate.split('T')[0] : startStr;
        return selectedStr >= startStr && selectedStr <= endStr;
      }
    });
    
    const sorted = [...filtered].sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
    
    setRequests(sorted.map((r: any) => {
      let dateStr = r.startDate.split('T')[0] === r.endDate.split('T')[0] ? formatDate(r.startDate) : `${formatDate(r.startDate)} - ${formatDate(r.endDate)}`;
      let daysStr = `${r.totalDays ?? r.daysCount ?? 1} วัน`;
      
      if (r.startFormat === 'hourly' || r.leaveMode === 'hourly') {
         const startT = new Date(r.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
         const endT = new Date(r.endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
         dateStr = `${formatDate(r.startDate)} ${startT} - ${endT}`;
         const hours = r.leaveHours ? r.leaveHours : Number(((r.totalDays ?? 0) * 8).toFixed(1));
         daysStr = `${hours} ชั่วโมง`;
      } else if ((r.totalDays ?? r.daysCount) === 0.5) {
         if (r.startFormat === 'morning') daysStr = 'ครึ่งวันเช้า';
         else if (r.startFormat === 'afternoon') daysStr = 'ครึ่งวันบ่าย';
         else daysStr = '0.5 วัน';
      }

      return {
        id: r.id,
        dateStr,
        type: r.leaveType?.name || r.type,
        days: daysStr,
        reason: r.reason || '-',
        status: r.status,
        raw: r
      };
    }));
  }, [allLeaves, filterType, selectedMonthRaw, selectedDate]);

  const handleDelete = async (isApprovedCancel = false) => {
    const result = await Swal.fire({
      title: isApprovedCancel ? 'ยืนยันการขอยกเลิกวันลา' : 'ยืนยันการยกเลิกคำขอ',
      text: isApprovedCancel ? 'คุณต้องการยกเลิกวันลาที่อนุมัติแล้วใช่หรือไม่? (ระบบจะคืนโควตาวันลาให้)' : 'คุณต้องการยกเลิกคำขอลาใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      try {
        await deleteLeave(selectedRequest.id);
        setSelectedRequest(null);
        refetchLeaves();
        Swal.fire({
          icon: 'success',
          title: isApprovedCancel ? 'ยกเลิกวันลาสำเร็จ' : 'ยกเลิกคำขอสำเร็จ',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (err: any) {
        Swal.fire('ข้อผิดพลาด', err.message || "Failed to cancel request", 'error');
      }
    }
  };

  const handleEditClick = () => {
    let mode = "full_day";
    let prd = "full";
    
    const rawLeaveMode = selectedRequest.raw?.leaveMode;
    const rawStartFormat = selectedRequest.raw?.startFormat;
    
    if (rawLeaveMode === 'hourly' || rawStartFormat === 'hourly') {
      mode = "hourly";
    } else if (rawLeaveMode === 'half_day' || rawStartFormat === 'morning' || rawStartFormat === 'afternoon') {
      mode = "half_day";
      prd = rawStartFormat === 'morning' ? 'morning' : rawStartFormat === 'afternoon' ? 'afternoon' : 'morning';
    } else {
      mode = "full_day";
      prd = "full";
    }

    const formatDateLocal = (dateString: string) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return localD.toISOString().split('T')[0];
    };

    setEditForm({
      type: selectedRequest.raw?.type || selectedRequest.raw?.leaveTypeId || "",
      startDate: formatDateLocal(selectedRequest.raw?.startDate),
      endDate: formatDateLocal(selectedRequest.raw?.endDate),
      reason: selectedRequest.raw?.reason || "",
      leaveMode: mode,
      period: prd,
      leaveDate: formatDateLocal(selectedRequest.raw?.startDate),
      startTime: selectedRequest.raw?.startFormat === 'hourly' ? new Date(selectedRequest.raw.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "",
      endTime: selectedRequest.raw?.endFormat === 'hourly' ? new Date(selectedRequest.raw.endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ""
    });
    setEditAttachment(null);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.leaveMode === 'hourly') {
      if (!editForm.type || !editForm.leaveDate || !editForm.startTime || !editForm.endTime || !editForm.reason) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
    } else {
      if (!editForm.type || !editForm.startDate || !editForm.endDate || !editForm.reason) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
    }

    setShowConfirmEdit(true);
  };

  const confirmAndSave = async () => {
    try {
      const payload: any = {
        leaveTypeId: editForm.type,
        reason: editForm.reason,
        leaveMode: editForm.leaveMode
      };
      
      if (editForm.leaveMode === 'hourly') {
        payload.leaveDate = editForm.leaveDate;
        payload.startTime = editForm.startTime;
        payload.endTime = editForm.endTime;
      } else {
        payload.startDate = editForm.startDate;
        payload.endDate = editForm.endDate;
        payload.period = editForm.period;
      }

      await updateLeave({
        id: selectedRequest.id,
        data: payload
      });

      if (editAttachment && selectedRequest.id) {
        const formData = new FormData();
        formData.append("file", editAttachment);
        formData.append("leaveRequestId", selectedRequest.id);

        try {
          await uploadApi.uploadFile(formData);
        } catch (err) {
          console.error("Failed to upload attachment", err);
        }
      }

      refetchLeaves();
    } catch (err) {
      alert("Failed to update request");
    }

    setShowConfirmEdit(false);
    setIsEditing(false);
    setSelectedRequest(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] font-sans text-slate-800 flex flex-col relative">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">ประวัติการลา (Leave History)</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">ดูประวัติและสถานะการลางานของคุณทั้งหมด</p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Custom Date Picker and View Toggle */}
          <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4 relative">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "daily" | "monthly")}
                className="bg-gray-50/50 pl-4 pr-2 py-3 text-[14px] font-bold text-blue-600 outline-none appearance-none border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors rounded-l-xl"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232563EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 55%', backgroundSize: '10px auto', paddingRight: '32px' }}
              >
                <option value="monthly">รายเดือน</option>
                <option value="daily">รายวัน</option>
              </select>

              <div className="relative inline-block w-[180px]">
                {filterType === "monthly" ? (
                  <ThaiMonthPicker 
                    value={selectedMonthRaw} 
                    onChange={(newMonth) => setSelectedMonthRaw(newMonth)} 
                    className="w-full h-full bg-transparent border-none text-black text-[15px] font-bold py-3 px-4 focus:outline-none cursor-pointer flex items-center justify-between rounded-r-xl"
                  />
                ) : (
                  <ThaiDatePicker 
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date)}
                    placeholderText="เลือกวันที่"
                    className="w-full h-full bg-transparent border-none text-black text-[15px] font-bold py-3 px-4 focus:outline-none cursor-pointer rounded-r-xl"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-5">
                    <CalendarIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">ไม่มีข้อมูลประวัติการลา</h3>
                  <p className="text-gray-500 font-medium">ไม่มีประวัติการยื่นคำขอลาใน{filterType === "monthly" ? `เดือน ${formatMonthYear(selectedMonthRaw)}` : `วันที่ ${selectedDate ? `${selectedDate.getDate()} ${["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][selectedDate.getMonth()]} ${selectedDate.getFullYear() + 543}` : "ที่เลือก"}`}</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#CDE4EB] text-gray-800 text-[15px]">
                    <tr>
                      <th className="px-6 py-4 font-bold whitespace-nowrap">วันที่ลา</th>
                      <th className="px-6 py-4 font-bold whitespace-nowrap">ประเภทการลา</th>
                      <th className="px-6 py-4 font-bold text-center whitespace-nowrap">จำนวนวันลา</th>
                      <th className="px-6 py-4 font-bold whitespace-nowrap">เหตุผล</th>
                      <th className="px-6 py-4 font-bold text-center whitespace-nowrap">สถานะ</th>
                      <th className="px-6 py-4 font-bold text-center whitespace-nowrap">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, idx) => (
                      <tr key={req.id || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 text-black font-medium whitespace-nowrap">{req.dateStr}</td>
                        <td className="px-6 py-5 text-black font-medium whitespace-nowrap">{req.type}</td>
                        <td className="px-6 py-5 text-black font-medium text-center whitespace-nowrap">{req.days}</td>
                        <td className="px-6 py-5 text-black font-medium">{req.reason}</td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          <span className={`inline-block px-5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm min-w-[80px] ${req.status.includes('Approved') ? 'bg-[#00E676]' :
                              req.status.includes('Rejected') ? 'bg-[#FF0000]' : 'bg-[#FFA000]'
                            }`}>
                            {req.status.includes('Approved') ? 'อนุมัติ' : req.status.includes('Rejected') ? 'ปฏิเสธ' : 'รออนุมัติ'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="text-gray-600 hover:text-blue-600 font-medium text-[13px] transition-colors underline underline-offset-2"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Leave Details Modal */}
      {(selectedRequest && !isEditing) && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
            <div className="px-6 pb-6 overflow-y-auto flex-1
             space-y-4">

              {/* Employee Info */}
              <div className="border border-gray-300 rounded-xl p-5 flex gap-4 bg-white">
                <div className="w-[38px] h-[38px] rounded-full bg-fuchsia-100/50 border border-fuchsia-200 text-fuchsia-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] text-black mb-3">ข้อมูลพนักงาน (Employee Info)</h3>
                  <div className="text-[14px] text-gray-800 space-y-2">
                    <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">ชื่อ:</span> {username}</p>
                    <p className="flex items-center gap-2"><span className="font-bold min-w-[90px]">แผนก|ตำแหน่ง:</span> {selectedRequest.raw?.user?.department?.name || sessionStorage.getItem("department") || "-"} | {selectedRequest.raw?.user?.position?.name || sessionStorage.getItem("positionName") || "-"}</p>
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
                    <p className="flex gap-2"><span className="font-bold min-w-[80px]">ประเภทการลา:</span> {selectedRequest.type}</p>
                    <p className="flex gap-2">
                      <span className="font-bold min-w-[80px]">ช่วงเวลา:</span> 
                      {(() => {
                        const raw = selectedRequest.raw || {};
                        const mode = raw.startFormat || raw.leaveMode;
                        const start = raw.startDate;
                        const end = raw.endDate;
                        let timeAddon = '';
                        if (mode === 'hourly' || (raw.leaveHours && raw.leaveHours < 8 && mode !== 'full' && mode !== 'full_day' && mode !== 'half_day' && mode !== 'morning' && mode !== 'afternoon')) {
                          let startT = raw.startTime;
                          if (!startT && start && start.includes('T')) {
                            startT = new Date(start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                          }
                          let endT = raw.endTime;
                          if (!endT && end && end.includes('T')) {
                            endT = new Date(end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                          }
                          if (startT && endT && startT !== endT) {
                            timeAddon = ` (${startT} - ${endT} น.)`;
                          }
                        }
                        return `${selectedRequest.dateStr}${timeAddon}`;
                      })()} ({selectedRequest.days.includes('ชั่วโมง') ? selectedRequest.days : `${selectedRequest.days.replace(' วัน', '')} วัน`})
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="flex items-center gap-2">
                      <span className="w-[26px] h-[26px] bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                        <Clock className="w-[14px] h-[14px]" strokeWidth={2.5} />
                      </span>
                      <span className="font-bold min-w-[80px]">รูปแบบการลา:</span> {selectedRequest.raw?.startFormat === 'hourly' ? `รายชั่วโมง (${selectedRequest.raw?.leaveHours || 1} ชม.)` : selectedRequest.raw?.startFormat === 'morning' ? 'ครึ่งวันเช้า' : selectedRequest.raw?.startFormat === 'afternoon' ? 'ครึ่งวันบ่าย' : 'เต็มวัน'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-[26px] h-[26px] bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                      </span>
                      <span className="font-bold min-w-[80px]">เอกสารแนบ:</span> -
                      <button className="ml-auto p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-black">
                        <Download className="w-[14px] h-[14px]" strokeWidth={2.5} />
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="font-bold text-black text-[14px] mb-2">เหตุผลการลา</h3>
                <textarea
                  readOnly
                  value={selectedRequest.reason}
                  className="w-full border border-gray-300 rounded-xl p-3 text-[14px] text-gray-500 bg-white outline-none cursor-default resize-none min-h-[60px]"
                  rows={2}
                />
              </div>

              {/* Approval */}
              <div className="mt-2">
                <h3 className={`font-bold flex items-center gap-2 text-[15px] mb-2 ${selectedRequest.status.includes('Approved') ? 'text-[#00A859]' : selectedRequest.status.includes('Rejected') ? 'text-red-500' : 'text-yellow-600'}`}>
                  <span className="font-extrabold text-black/50 tracking-tighter">NID</span> การอนุมัติ (Approval)
                </h3>
                <div className="flex flex-col md:flex-row items-start gap-4 bg-[#F8F9FA] border border-gray-200 rounded-xl p-4">
                  <div className="w-[120px] flex flex-col justify-start border-r border-gray-200 pr-4">
                    <span className="text-[12px] font-bold text-black mb-2">สถานะ:</span>
                      <span className={`inline-flex justify-center items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-white shadow-sm ${selectedRequest.status.includes('Approved') ? 'bg-[#00E676]' :
                        selectedRequest.status.includes('Rejected') ? 'bg-[#FF0000]' : selectedRequest.status === 'Cancelled' ? 'bg-gray-500' : 'bg-[#FFA000]'
                      }`}>
                      {selectedRequest.status.includes('Approved') ? 'อนุมัติ' : selectedRequest.status.includes('Rejected') ? 'ปฏิเสธ' : selectedRequest.status === 'Cancelled' ? 'ยกเลิกแล้ว' : 'รออนุมัติ'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-start w-full">
                    <span className="text-[12px] font-bold text-black mb-2">เหตุผลของผู้อนุมัติ</span>
                    <textarea
                      readOnly
                      value={selectedRequest.raw?.approverReason || selectedRequest.raw?.approvals?.[0]?.comment || (selectedRequest.status === 'Pending' ? 'รอการพิจารณา' : 'ไม่มีหมายเหตุเพิ่มเติม')}
                      className={`w-full border border-gray-300 rounded-xl p-2.5 text-[14px] outline-none cursor-default resize-none min-h-[50px] ${selectedRequest.status.includes('Rejected') ? 'text-red-600 bg-red-50/50' :
                          selectedRequest.status.includes('Approved') ? 'text-green-600 bg-green-50/50' : 'text-gray-500 bg-white'
                        }`}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            {(!selectedRequest.status.includes('Approved') && !selectedRequest.status.includes('Rejected') && selectedRequest.status !== 'Cancelled') && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto shrink-0">
                <span className="text-[13px] font-medium text-gray-300">วันที่ยื่นคำขอ : {selectedRequest.raw?.createdAt ? new Date(selectedRequest.raw.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : '-'}</span>
                <div className="flex items-center gap-5">
                  <button onClick={() => handleDelete()} className="text-gray-400 hover:text-red-500 font-bold text-[14px] flex items-center gap-1.5 transition-colors">
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    ยกเลิกคำขอลา
                  </button>
                  <button onClick={handleEditClick} className="text-blue-600 hover:text-blue-700 font-bold text-[14px] flex items-center gap-1.5 transition-colors">
                    <Edit3 className="w-4 h-4" strokeWidth={2.5} />
                    แก้ไขข้อมูล
                  </button>
                </div>
              </div>
            )}
            {(selectedRequest.status.includes('Approved') || selectedRequest.status.includes('Rejected') || selectedRequest.status === 'Cancelled') && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto shrink-0">
                <span className="text-[13px] font-medium text-gray-300">วันที่ยื่นคำขอ : {selectedRequest.raw?.createdAt ? new Date(selectedRequest.raw.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.' : '-'}</span>
                
                {selectedRequest.status.includes('Approved') && selectedRequest.raw?.startDate && (
                  new Date(selectedRequest.raw.startDate).setHours(0,0,0,0) > new Date().setHours(0,0,0,0)
                ) && (
                  <button 
                    onClick={() => handleDelete(true)} 
                    className="text-red-500 hover:text-red-600 font-bold text-[14px] flex items-center gap-1.5 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    ขอยกเลิกวันลา
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Edit Form Modal (Fullscreen) */}
      {isEditing && (
        <div className="fixed inset-0 z-[999] bg-[#E2E4E9] overflow-y-auto">
          {/* Top Banner (Inside Edit) */}
          <div className="bg-white flex flex-col md:flex-row md:items-center justify-between px-8 py-5 shadow-sm sticky top-0 z-10 gap-4 border-2 border-blue-500">
            <div>
              <h1 className="text-xl font-bold text-black tracking-tight">แก้ไขคำขอลา (Edit Leave Request)</h1>
              <p className="text-[13px] text-gray-500 mt-1 font-medium">กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนส่งใหม่อีกครั้ง</p>
            </div>
            <div className="flex items-center gap-6 text-black self-end md:self-auto">
              <button
                onClick={() => { setIsEditing(false); setSelectedRequest(null); }}
                className="ml-4 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSaveEdit} className="space-y-8 text-black">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F4F4F4] rounded-xl p-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                    <div className="font-bold text-black">{username}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทการลา</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>เลือกประเภทการลา</option>
                      {balances.map((b: any) => (
                        <option key={b.leaveTypeId} value={b.leaveTypeId}>
                          {b.leaveType?.name || 'ไม่ระบุ'} (เหลือ {b.remainingDays} วัน)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* รูปแบบการลา */}
                  <div className="md:col-span-1">
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">รูปแบบการลา</label>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                        <input type="radio" name="leaveMode" checked={editForm.leaveMode === 'full_day'} onChange={() => { setEditForm({ ...editForm, leaveMode: 'full_day', period: 'full' }); }} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-700">เต็มวัน</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                        <input type="radio" name="leaveMode" checked={editForm.leaveMode === 'half_day'} onChange={() => { setEditForm({ ...editForm, leaveMode: 'half_day', period: 'morning' }); }} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-700">ครึ่งวัน</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors">
                        <input type="radio" name="leaveMode" checked={editForm.leaveMode === 'hourly'} onChange={() => setEditForm({ ...editForm, leaveMode: 'hourly' })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-700">ลารายชั่วโมง</span>
                      </label>
                    </div>
                  </div>

                  {editForm.leaveMode === 'hourly' ? (
                    <>
                      <div className="md:col-span-2 md:w-[calc(50%-1.5rem)]">
                        <label className="block text-[13px] font-bold text-gray-800 mb-2">วันที่ลา</label>
                        <ThaiDatePicker 
                          selected={editForm.leaveDate ? new Date(editForm.leaveDate) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setEditForm({ ...editForm, leaveDate: d.toISOString().split('T')[0] });
                            } else {
                              setEditForm({ ...editForm, leaveDate: '' });
                            }
                          }}
                          placeholderText="วว/ดด/ปปปป"
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700 cursor-pointer"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <LeaveTimePicker 
                          startTime={editForm.startTime} 
                          endTime={editForm.endTime} 
                          onChangeStartTime={(time) => setEditForm({ ...editForm, startTime: time })}
                          onChangeEndTime={(time) => setEditForm({ ...editForm, endTime: time })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-1">
                        <label className="block text-[13px] font-bold text-gray-800 mb-2">วันที่เริ่มต้น</label>
                        <ThaiDatePicker 
                          selected={editForm.startDate ? new Date(editForm.startDate) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setEditForm({ ...editForm, startDate: d.toISOString().split('T')[0] });
                            } else {
                              setEditForm({ ...editForm, startDate: '' });
                            }
                          }}
                          placeholderText="วว/ดด/ปปปป"
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700 cursor-pointer"
                        />
                        {editForm.leaveMode === 'half_day' && (
                          <div className="flex items-center gap-4 mt-3">
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input type="radio" name="period" value="morning" checked={editForm.period === 'morning'} onChange={() => setEditForm({ ...editForm, period: 'morning' })} className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500" />
                              ครึ่งวันเช้า
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input type="radio" name="period" value="afternoon" checked={editForm.period === 'afternoon'} onChange={() => setEditForm({ ...editForm, period: 'afternoon' })} className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500" />
                              ครึ่งวันบ่าย
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[13px] font-bold text-gray-800 mb-2">วันที่สิ้นสุด</label>
                        <ThaiDatePicker 
                          selected={editForm.endDate ? new Date(editForm.endDate) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setEditForm({ ...editForm, endDate: d.toISOString().split('T')[0] });
                            } else {
                              setEditForm({ ...editForm, endDate: '' });
                            }
                          }}
                          placeholderText="วว/ดด/ปปปป"
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700 cursor-pointer"
                          // disabled={editForm.leaveMode === 'half_day'} // ThaiDatePicker ไม่รองรับ disabled ตอนนี้
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">เหตุผลการลา</label>
                  <textarea
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    rows={4}
                    placeholder="ระบุเหตุผลที่ชัดเจน..."
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  ></textarea>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">เอกสารแนบ (ถ้ามี)</label>
                  <label htmlFor="edit-file-upload" className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 bg-[#FAFAFA] hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-black mb-3" strokeWidth={2} />
                    <p className="text-sm font-bold text-black mb-1">
                      {editAttachment ? editAttachment.name : <><span className="text-blue-600">คลิกเพื่ออัปโหลด</span> หรือเลือกไฟล์ใหม่</>}
                    </p>
                    <p className="text-xs text-gray-400">รองรับ PDF, PNG ขนาดไม่เกิน 5MB</p>
                    <input 
                      id="edit-file-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditAttachment(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-[15px] shadow-md hover:shadow-lg active:scale-95"
                  >
                    ส่งคำขอลา
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Confirmation Modal */}
          {showConfirmEdit && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col items-center py-12 px-8 border-[3px] border-[#3B82F6] relative animate-in zoom-in-95 duration-200">
                <div className="w-[100px] h-[100px] bg-[#00C853] rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Check className="w-12 h-12 text-white" strokeWidth={4} />
                </div>

                <h2 className="text-[26px] font-bold text-black mb-4 tracking-tight">ยืนยันการแก้ไขข้อมูล</h2>

                <p className="text-[#6B7280] text-[15px] text-center mb-10 leading-relaxed">
                  คำลาของคุณจะถูกส่งไปยังระบบ<br />
                  สามารถเช็คสถานะได้จากหน้าเช็คสถานะของคุณ
                </p>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setShowConfirmEdit(false)}
                    className="bg-[#FF0000] hover:bg-red-600 text-white font-bold py-2.5 px-10 rounded-xl transition-colors shadow-sm text-[16px]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmAndSave}
                    className="bg-[#00C853] hover:bg-green-600 text-white font-bold py-2.5 px-10 rounded-xl transition-colors shadow-sm text-[16px]"
                  >
                    ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

