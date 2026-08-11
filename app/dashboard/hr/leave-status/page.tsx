"use client";

import { useState, useEffect } from "react";
import { getLeaveRequests, LeaveRequest, calculateLeaveDays } from "@/lib/store";
import { Mail, Bell, Settings } from "lucide-react";

const getLeaveDetails = (req: any) => {
  if (req.startFormat === 'hourly' || req.leaveMode === 'hourly') {
    let startT = req.startTime;
    if (!startT && req.startDate) {
      startT = new Date(req.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    let endT = req.endTime;
    if (!endT && req.endDate) {
      endT = new Date(req.endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Format hours: 2.5 decimal -> 2.30 (2 hours 30 mins)
    const rawHours = req.leaveHours ? req.leaveHours : Number(((req.totalDays ?? 0) * 8).toFixed(2));
    const h = Math.floor(rawHours);
    const m = Math.round((rawHours - h) * 60);
    const formattedHours = m === 0 ? `${h}` : `${h}.${m.toString().padStart(2, '0')}`;
    
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

import { useLeave } from "@/hooks/useLeave";

export default function LeaveStatusPage() {
  const { useLeavesQuery } = useLeave();
  const { data: allLeaves = [] } = useLeavesQuery();
  const [requests, setRequests] = useState<any[]>([]);
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername && storedUsername !== "User") {
      setUsername(sessionStorage.getItem("fullName") || storedUsername);
    }
    const storedUserId = sessionStorage.getItem("userId");
    
    const myLeaves = allLeaves.filter((r: any) => String(r.userId) === storedUserId);
    const sorted = [...myLeaves].sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
    
    setRequests(
      sorted.map((r: any) => ({
        ...r,
        type: r.leaveType?.name || r.type,
        startDate: r.startDate,
        endDate: r.endDate
      }))
    );
  }, [allLeaves]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
      {/* Top Banner */}
      <div className="bg-white flex items-center justify-between px-8 py-5 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">ตรวจสอบสถานะการลา</h1>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

          {requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium">คุณยังไม่มีประวัติการยื่นคำขอลา</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                  {/* Header Box */}
                  <div className="bg-[#F4F5F7] rounded-xl p-5 mb-10">
                    <h3 className="text-[17px] font-bold text-black">{req.type}</h3>
                    <p className="text-[14px] text-blue-500 font-semibold mt-1">{req.requestCode || '-'}</p>
                    {req.startFormat === 'hourly' || req.leaveMode === 'hourly' ? (
                      <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        {new Date(req.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="ml-1 text-blue-600 font-semibold">{getLeaveDetails(req)}</span>
                      </p>
                    ) : (
                      <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        {new Date(req.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ถึง {new Date(req.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="ml-1 text-blue-600 font-semibold">{getLeaveDetails(req)}</span>
                      </p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="relative pl-7 md:pl-10">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] md:left-[27px] top-2 bottom-4 w-[2px] bg-gray-200 z-0"></div>

                    {/* Step 1: Submitted */}
                    <div className="relative mb-10">
                      <div className="absolute -left-[31px] md:-left-[43px] w-4 h-4 bg-[#00E676] rounded-full ring-[6px] ring-white z-10 top-0.5"></div>
                      <h4 className="font-bold text-black text-sm">ส่งคำขอสำเร็จ</h4>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleString('th-TH', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })} น.
                      </p>
                      <div className="bg-[#F4F5F7] text-gray-600 text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl">
                        พนักงานยื่นคำขอลาผ่านระบบเรียบร้อยแล้ว
                      </div>
                    </div>

                    {/* Step 2: CEO Approval */}
                    <div className="relative mb-10">
                      <div className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${req.status === 'Approved' ? 'bg-[#00E676]' :
                          req.status === 'Rejected' ? 'bg-[#FF0000]' : 'bg-[#29B6F6]'
                        }`}></div>
                      <h4 className={`font-bold text-sm ${req.status === 'Pending' ? 'text-black' :
                          req.status === 'Rejected' ? 'text-red-600' : 'text-gray-800'
                        }`}>
                        {req.status === 'Approved' ? 'CEO อนุมัติแล้ว' :
                          req.status === 'Rejected' ? 'CEO ปฏิเสธคำขอ' : 'รอพิจารณาอนุมัติ'}
                      </h4>
                      {req.approverReason && req.status !== 'Pending' && (
                        <div className={`text-xs font-medium p-3 rounded-lg mt-3 w-full max-w-3xl ${req.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                          หมายเหตุ: {req.approverReason}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Completed */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] md:-left-[43px] w-4 h-4 rounded-full ring-[6px] ring-white z-10 top-0.5 ${(req.status === 'Approved' || req.status === 'Rejected') ? 'bg-[#00E676]' : 'bg-[#E0E0E0]'
                        }`}></div>
                      <h4 className={`font-bold text-sm ${(req.status === 'Approved' || req.status === 'Rejected') ? 'text-black' : 'text-[#D1D5DB]'}`}>
                        เสร็จสิ้น (Completed)
                      </h4>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

