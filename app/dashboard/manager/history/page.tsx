'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  BookOpen,
  User,
  Users,
  Edit3,
  Trash2,
  Search,
} from 'lucide-react';
import { useLeave } from '@/hooks/useLeave';
import { useLeaveBalance } from '@/hooks/useLeaveBalance';
import Swal from 'sweetalert2';
import { DatePicker } from '@/components/DateAndTime';
import {
  getLeaveStatusBadgeColor,
  getLeaveStatusText,
  getErrorMessage,
} from '@/lib/api/utils';
import type { Leave } from '@/lib/api/types';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';
import { ManagerLeaveEditFormModal } from '@/components/manager/ManagerLeaveEditFormModal';
import { uploadApi } from '@/lib/api';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function LeaveHistoryPage() {
  interface MappedRequest {
    id?: string;
    empId?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    positionName?: string;
    name?: string;
    dateStr?: string;
    days?: string;
    reason?: string;
    requestCode?: string;
    status?: string;
    type?: string;
    raw?: Leave & { attachment?: string; attachmentName?: string };
    [key: string]: unknown;
  }

  const [requests, setRequests] = useState<MappedRequest[]>([]);
  const [username, setUsername] = useState('xxxxx xxxxxx');
  const [filterType, setFilterType] = useState<'daily' | 'monthly'>('monthly');
  const [selectedMonthRaw, setSelectedMonthRaw] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedRequest, setSelectedRequest] = useState<MappedRequest | null>(null);
  const [viewMode, setViewMode] = useState<'department' | 'personal'>(
    'department',
  );
  const [searchCode, setSearchCode] = useState('');

  const router = useRouter();
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    leaveMode: 'full_day',
    period: 'full',
    leaveDate: '',
    startTime: '',
    endTime: '',
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }
      setAttachmentName(file.name);
      setAttachmentFile(file);
    }
  };

  const { useLeaveBalancesQuery } = useLeaveBalance();
  const { data: balances = [] } = useLeaveBalancesQuery();

  const formatMonthYear = (yyyyMM: string) => {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
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
    return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const { useLeavesQuery, useDeleteLeaveMutation, useUpdateLeaveMutation } =
    useLeave();
  const { data: allLeaves = [], refetch: refetchLeaves } = useLeavesQuery();
  const { mutateAsync: deleteLeave } = useDeleteLeaveMutation();
  const { mutateAsync: updateLeave } = useUpdateLeaveMutation();

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername && storedUsername !== 'Manager') {
      setUsername(sessionStorage.getItem('fullName') || storedUsername);
    }
  }, []);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId') || '';
    const storedDept = sessionStorage.getItem('department') || '';

    let targetRequests: Leave[] = [];
    if (searchCode.trim() !== '') {
      targetRequests = allLeaves.filter(
        (r) =>
          String(r.userId) === storedUserId ||
          r.user?.department?.name === storedDept ||
          r.department === storedDept,
      );
    } else if (viewMode === 'personal') {
      targetRequests = allLeaves.filter(
        (r) => String(r.userId) === storedUserId,
      );
    } else {
      targetRequests = allLeaves.filter(
        (r) =>
          String(r.userId) !== storedUserId &&
          (r.user?.department?.name === storedDept ||
            r.department === storedDept),
      );
    }

    const filtered = targetRequests.filter((r) => {
      if (searchCode.trim() !== '') {
        return r.requestCode
          ?.toLowerCase()
          .includes(searchCode.toLowerCase().trim());
      }

      if (filterType === 'monthly') {
        if (!r.startDate) return false;
        const d = new Date(r.startDate);
        const yyyyMM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return yyyyMM === selectedMonthRaw;
      } else {
        if (!selectedDate) return true;
        const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const startStr = r.startDate.split('T')[0];
        const endStr = r.endDate ? r.endDate.split('T')[0] : startStr;
        return selectedStr >= startStr && selectedStr <= endStr;
      }
    });
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt || b.startDate).getTime() -
        new Date(a.createdAt || a.startDate).getTime(),
    );

    setRequests(
      sorted.map((r) => ({
        id: r.id,
        empId:
          r.employee?.employeeCode ||
          (r.employee?.id
            ? `EMP-${String(r.employee.id).substring(0, 5).toUpperCase()}`
            : `EMP-000`),
        name: r.user?.firstName
          ? `${r.user.firstName} ${r.user.lastName}`
          : r.userId || 'Unknown',
        firstName:
          r.user?.firstName || r.employee?.firstName || r.userId || 'Unknown',
        lastName: r.user?.lastName || r.employee?.lastName || '',
        dateStr:
          r.startDate.split('T')[0] === r.endDate.split('T')[0]
            ? formatDate(r.startDate)
            : `${formatDate(r.startDate)} - ${formatDate(r.endDate)}`,
        type: (typeof r.leaveType === 'object' ? r.leaveType?.name : r.leaveType) || r.type,
        requestCode: r.requestCode,
        days: `${r.totalDays || 1} วัน`,
        reason: r.reason || '-',
        status: r.status,
        raw: r,
        department: r.user?.department?.name || r.department,
        positionName: r.user?.position?.name || r.position,
      })),
    );
  }, [
    filterType,
    selectedMonthRaw,
    selectedDate,
    viewMode,
    allLeaves,
    searchCode,
  ]);

  // Auto-refresh (Polling) ทุกๆ 5 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      refetchLeaves();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchLeaves]);

  // ตรวจสอบว่าคำขอที่กำลังเปิดดู หรือ กำลังแก้ไขอยู่ ถูก HR กดดูรายละเอียดหรือดึงไปแล้วหรือไม่
  useEffect(() => {
    if (selectedRequest) {
      const updatedReq = requests.find((r) => r.id === selectedRequest.id);
      if (updatedReq) {
        const wasHRPhase = ['PENDING_VERIFY', 'REVIEWING_HR'].includes(
          selectedRequest.status || '',
        );
        const isNowHRPhase = ['PENDING_VERIFY', 'REVIEWING_HR'].includes(
          updatedReq.status || '',
        );

        if (wasHRPhase && !isNowHRPhase) {
          Swal.fire({
            icon: 'warning',
            title: 'ไม่สามารถแก้ไขคำขอได้',
            text: 'คำขอลานี้ผ่านการตรวจสอบหรืออนุมัติจาก HR เรียบร้อยแล้ว ระบบจะยกเลิกการแก้ไขข้อมูลของคุณ',
            confirmButtonColor: '#3085d6',
          });

          if (isEditing) {
            setIsEditing(false); // เด้งออกจากหน้าแก้ไข
          }
          setSelectedRequest(null); // ปิดหน้าต่าง Modal เพื่อให้ข้อมูลรีเฟรช
        } else if (
          updatedReq.status !== selectedRequest.status &&
          !isNowHRPhase
        ) {
          if (
            updatedReq.status === 'APPROVED' ||
            updatedReq.status === 'REJECTED'
          ) {
            Swal.fire({
              icon: 'info',
              title: 'สถานะคำขอมีการเปลี่ยนแปลง',
              text: `คำขอลานี้ได้ถูก ${updatedReq.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'} แล้ว`,
              confirmButtonColor: '#3085d6',
            });
            setIsEditing(false);
            setSelectedRequest(null);
          }
        } else if (
          updatedReq.raw?.isViewedByHr &&
          !selectedRequest.raw?.isViewedByHr
        ) {
          Swal.fire({
            icon: 'warning',
            title: 'ไม่สามารถแก้ไขคำขอได้',
            text: 'คำขอลานี้กำลังถูกเปิดดูหรือตรวจสอบโดย HR',
            confirmButtonColor: '#3085d6',
          });
          if (isEditing) setIsEditing(false);
          setSelectedRequest(null);
        }
      }
    }
  }, [requests, selectedRequest, isEditing]);

  const handleDelete = async () => {
    const isApprovedCancel = selectedRequest?.status?.toLowerCase().includes('approved');
    const result = await Swal.fire({
      title: isApprovedCancel
        ? 'ยืนยันการขอยกเลิกวันลา'
        : 'ยืนยันการยกเลิกคำขอ',
      text: isApprovedCancel
        ? 'คุณต้องการยกเลิกวันลาที่อนุมัติแล้วใช่หรือไม่? (ระบบจะคืนโควตาวันลาให้)'
        : 'คุณต้องการยกเลิกคำขอลาใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      try {
        await deleteLeave(selectedRequest?.id || '');
        setSelectedRequest(null);
        refetchLeaves();
        Swal.fire({
          icon: 'success',
          title: 'ยกเลิกสำเร็จ',
          text: 'ยกเลิกคำขอลาเรียบร้อยแล้ว',
          confirmButtonColor: '#3b82f6',
        });
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถยกเลิกคำขอลาได้',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const handleEditClick = () => {
    let mode = 'full_day';
    let prd = 'full';

    const rawLeaveMode = selectedRequest?.raw?.leaveMode;
    const rawStartFormat = selectedRequest?.raw?.startFormat;

    if (rawLeaveMode === 'hourly' || rawStartFormat === 'hourly') {
      mode = 'hourly';
    } else if (
      rawLeaveMode === 'half_day' ||
      rawStartFormat === 'morning' ||
      rawStartFormat === 'afternoon'
    ) {
      mode = 'half_day';
      prd =
        rawStartFormat === 'morning'
          ? 'morning'
          : rawStartFormat === 'afternoon'
            ? 'afternoon'
            : 'morning';
    } else {
      mode = 'full_day';
      prd = 'full';
    }

    const formatDateLocal = (dateString: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return localD.toISOString().split('T')[0];
    };

    setEditForm({
      type:
        selectedRequest?.raw?.type || selectedRequest?.raw?.leaveTypeId || '',
      startDate: formatDateLocal(selectedRequest?.raw?.startDate || ''),
      endDate: formatDateLocal(selectedRequest?.raw?.endDate || ''),
      reason: selectedRequest?.raw?.reason || '',
      leaveMode: mode,
      period: prd,
      leaveDate: formatDateLocal(selectedRequest?.raw?.startDate || ''),
      startTime:
        selectedRequest?.raw?.startFormat === 'hourly'
          ? new Date(selectedRequest.raw.startDate).toLocaleTimeString(
            'th-TH',
            { hour: '2-digit', minute: '2-digit' },
          )
          : '',
      endTime:
        selectedRequest?.raw?.endFormat === 'hourly'
          ? new Date(selectedRequest.raw.endDate).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          })
          : '',
    });
    setAttachmentFile(null);
    setAttachmentName(null);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.leaveMode === 'hourly') {
      if (
        !editForm.type ||
        !editForm.leaveDate ||
        !editForm.startTime ||
        !editForm.endTime ||
        !editForm.reason
      ) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
    } else {
      if (
        !editForm.type ||
        !editForm.startDate ||
        !editForm.endDate ||
        !editForm.reason
      ) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
    }

    setShowConfirmEdit(true);
  };

  const confirmAndSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        leaveTypeId: editForm.type,
        reason: editForm.reason,
        leaveMode: editForm.leaveMode,
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
        id: selectedRequest?.id || '',
        data: payload,
      });

      if (attachmentFile && selectedRequest?.id) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          formData.append('leaveRequestId', selectedRequest.id);
          await uploadApi.uploadFile(formData);
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          alert(
            `บันทึกคำขอลาสำเร็จ แต่อัปโหลดไฟล์แนบไม่สำเร็จ: ${getErrorMessage(
              uploadErr,
              'ไม่สามารถอัปโหลดไฟล์แนบได้',
            )}`,
          );
        }
      }

      refetchLeaves();
    } catch {
      alert('Failed to update request');
    }

    setShowConfirmEdit(false);
    setIsEditing(false);
    setSelectedRequest(null);

    // Navigate to status page for Manager
    router.push('/dashboard/manager/status');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col relative">
      {/* Top Banner */}
      <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
            ประวัติการลา (Leave History) - Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {viewMode === 'department'
              ? 'ดูประวัติและสถานะการลางานของแผนก'
              : 'ดูประวัติและสถานะการลางานของคุณทั้งหมดที่ส่งให้ CEO'}
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Custom Date Picker and View Toggle */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 relative">
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all h-[42px]">
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as 'daily' | 'monthly')
                }
                className="h-full bg-gray-50/70 pl-3.5 pr-8 text-[13px] font-bold text-blue-600 outline-none appearance-none border-r border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors rounded-l-xl shrink-0"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232563EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '9px auto',
                }}
              >
                <option value="monthly">รายเดือน</option>
                <option value="daily">รายวัน</option>
              </select>

              <div className="relative flex items-center w-[165px] h-full [&_.MuiInputBase-root]:h-full [&_.MuiInputBase-input]:text-[13px] [&_.MuiInputBase-input]:font-semibold [&_.MuiInputBase-input]:text-slate-800 [&_.MuiInputBase-input]:py-0 [&_.MuiInputBase-input]:pl-3.5 [&_.MuiIconButton-root]:p-1.5 [&_.MuiIconButton-root]:mr-1.5 [&_.MuiIconButton-root]:text-slate-500">
                {filterType === 'monthly' ? (
                  <DatePicker
                    borderless
                    value={selectedMonthRaw}
                    onChange={(newMonth: string) => setSelectedMonthRaw(newMonth)}
                    views={['year', 'month']}
                    format="MM/BBBB"
                  />
                ) : (
                  <DatePicker
                    borderless
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date)}
                    placeholderText="เลือกวันที่"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหารหัสการลา..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() =>
                setViewMode(
                  viewMode === 'department' ? 'personal' : 'department',
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95"
            >
              {viewMode === 'department' ? (
                <>
                  <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  สลับไปดูประวัติส่วนตัว
                </>
              ) : (
                <>
                  <Users className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  สลับไปดูประวัติของแผนก
                </>
              )}
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-5">
                    <CalendarIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ไม่มีข้อมูลประวัติการลา
                  </h3>
                  <p className="text-gray-500 font-medium">
                    ไม่มีประวัติการยื่นคำขอลาใน
                    {filterType === 'monthly'
                      ? `เดือน ${formatMonthYear(selectedMonthRaw)}`
                      : `วันที่ ${selectedDate ? `${selectedDate.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][selectedDate.getMonth()]} ${selectedDate.getFullYear() + 543}` : 'ที่เลือก'}`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#CDE4EB] text-gray-800 text-[15px]">
                    <tr>
                      <th
                        className={`px-6 py-4 font-bold whitespace-nowrap ${viewMode === 'department' ? 'w-[12%]' : 'w-[15%]'}`}
                      >
                        รหัสการลา
                      </th>
                      {viewMode === 'department' && (
                        <>
                          <th className="px-6 py-4 font-bold whitespace-nowrap w-[12%]">
                            รหัสพนักงาน
                          </th>
                          <th className="px-6 py-4 font-bold whitespace-nowrap w-[18%]">
                            ชื่อ
                          </th>
                          <th className="px-6 py-4 font-bold whitespace-nowrap w-[18%]">
                            นามสกุล
                          </th>
                        </>
                      )}
                      <th
                        className={`px-6 py-4 font-bold whitespace-nowrap ${viewMode === 'department' ? 'w-[16%]' : 'w-[15%]'}`}
                      >
                        วันที่ลา
                      </th>
                      <th
                        className={`px-6 py-4 font-bold whitespace-nowrap ${viewMode === 'department' ? 'w-[15%]' : 'w-[15%]'}`}
                      >
                        ประเภทการลา
                      </th>
                      <th
                        className={`px-6 py-4 font-bold text-center whitespace-nowrap ${viewMode === 'department' ? 'w-[12%]' : 'w-[15%]'}`}
                      >
                        จำนวนวันลา
                      </th>
                      {viewMode === 'personal' && (
                        <th className="px-6 py-4 font-bold whitespace-nowrap w-[20%]">
                          เหตุผล
                        </th>
                      )}
                      <th
                        className={`px-6 py-4 font-bold text-center whitespace-nowrap ${viewMode === 'department' ? 'w-[15%]' : 'w-[10%]'}`}
                      >
                        สถานะ
                      </th>
                      {viewMode === 'personal' && (
                        <th className="px-6 py-4 font-bold text-center whitespace-nowrap w-[10%]">
                          จัดการ
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, idx) => (
                      <tr
                        key={req.id || idx}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-5 text-blue-500 font-semibold whitespace-nowrap">
                          {req.requestCode || '-'}
                        </td>
                        {viewMode === 'department' && (
                          <>
                            <td className="px-6 py-5 text-gray-500 font-medium whitespace-nowrap">
                              {req.empId}
                            </td>
                            <td className="px-6 py-5 text-black font-medium whitespace-nowrap">
                              {req.firstName}
                            </td>
                            <td className="px-6 py-5 text-black font-medium whitespace-nowrap">
                              {req.lastName}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-5 text-black font-medium whitespace-nowrap">
                          {req.dateStr}
                        </td>
                        <td className="px-6 py-5 text-black font-medium whitespace-nowrap">
                          {req.type}
                        </td>
                        <td className="px-6 py-5 text-black font-medium text-center whitespace-nowrap">
                          {req.days}
                        </td>
                        {viewMode === 'personal' && (
                          <td className="px-6 py-5 text-black font-medium">
                            {req.reason}
                          </td>
                        )}

                        {viewMode === 'department' ? (
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1.5">
                              <span
                                className={`inline-block px-5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm min-w-[80px] text-center ${getLeaveStatusBadgeColor(req.status || '')}`}
                              >
                                {getLeaveStatusText(req.status || '')}
                              </span>
                              <button
                                onClick={() => setSelectedRequest(req)}
                                className="text-gray-600 hover:text-blue-600 font-medium text-[12px] flex items-center gap-1 transition-colors"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                ดูรายละเอียด
                              </button>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-5 py-1.5 rounded-full text-[13px] font-bold text-white shadow-sm min-w-[120px] text-center ${getLeaveStatusBadgeColor(req.status || '')}`}
                              >
                                {getLeaveStatusText(req.status || '')}
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
                          </>
                        )}
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
      {selectedRequest && !isEditing && (
        <LeaveDetailModal
          leave={selectedRequest.raw ?? selectedRequest}
          onClose={() => setSelectedRequest(null)}
          fallbackName={selectedRequest.name || username}
          footer={
            (viewMode === 'personal' || selectedRequest.name === username) &&
              !['cancelled', 'pending_cancellation'].includes(
                (selectedRequest.status || '').toLowerCase(),
              ) &&
              selectedRequest.raw?.startDate &&
              new Date(selectedRequest.raw.startDate).setHours(0, 0, 0, 0) >
              new Date().setHours(0, 0, 0, 0) ? (
              <>
                <button
                  onClick={handleDelete}
                  className={`font-bold text-[14px] flex items-center gap-1.5 transition-colors ${(selectedRequest.status || '').toLowerCase().includes('approved')
                      ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg'
                      : 'text-gray-400 hover:text-red-500'
                    }`}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  {(selectedRequest.status || '').toLowerCase().includes('approved')
                    ? 'ขอยกเลิกวันลา'
                    : 'ยกเลิกการลา'}
                </button>
                {!(selectedRequest.status || '').toLowerCase().includes('approved') &&
                  ['pending_verify'].includes(
                    (selectedRequest.status || '').toLowerCase(),
                  ) &&
                  !selectedRequest.raw?.isViewedByHr && (
                    <button
                      onClick={handleEditClick}
                      className="text-blue-600 hover:text-blue-700 font-bold text-[14px] flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" strokeWidth={2.5} />
                      แก้ไขข้อมูล
                    </button>
                  )}
              </>
            ) : null
          }
        />
      )}

      {/* Edit Form Modal (Fullscreen) */}
      {isEditing && (
        <ManagerLeaveEditFormModal
          username={username}
          department={selectedRequest?.department}
          positionName={selectedRequest?.positionName}
          editForm={editForm}
          setEditForm={setEditForm}
          balances={balances}
          onSubmit={handleSaveEdit}
          onClose={() => {
            setIsEditing(false);
            setSelectedRequest(null);
            setAttachmentFile(null);
            setAttachmentName(null);
          }}
          showConfirmEdit={showConfirmEdit}
          setShowConfirmEdit={setShowConfirmEdit}
          onConfirmSave={confirmAndSave}
          attachmentName={attachmentName}
          onFileChange={handleFileChange}
          onRemoveFile={() => {
            setAttachmentFile(null);
            setAttachmentName(null);
          }}
        />
      )}
    </div>
  );
}
