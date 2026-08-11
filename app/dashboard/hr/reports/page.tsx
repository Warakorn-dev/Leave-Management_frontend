'use client';

import React, { useState } from 'react';
import { useLeave } from '@/hooks/useLeave';
import { useLeaveType } from '@/hooks/useLeaveType';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import {
  FileSpreadsheet,
  FileDown,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePicker } from '@/components/DateAndTime';

export default function HRReports() {
  const { useLeavesQuery } = useLeave();
  const { useLeaveTypesQuery } = useLeaveType();

  const { data: leaves = [], isLoading, refetch } = useLeavesQuery();
  const { data: leaveTypes = [] } = useLeaveTypesQuery();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Helper to format date display cleanly
  const formatDateDisplay = (startStr: string, endStr: string, leave: any) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const thaiDate = start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      const endDateThai = end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

      const mode = leave.startFormat || leave.leaveMode;
      const isFull = mode === 'full' || mode === 'full_day';

      if (!isFull && (mode === 'hourly' || leave.leaveHours)) {
        let startT = leave.startTime;
        if (!startT && startStr.includes('T')) {
          startT = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        }
        let endT = leave.endTime;
        if (!endT && endStr.includes('T')) {
          endT = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        }
        if (startT && endT && startT !== endT) {
          return `${thaiDate} (${startT} - ${endT} น.)`;
        }
      }

      if (thaiDate === endDateThai) return thaiDate;
      return `${thaiDate} - ${endDateThai}`;
    } catch {
      return startStr;
    }
  };

  // Helper to format duration text cleanly
  const formatDurationText = (l: any) => {
    const mode = l.startFormat || l.leaveMode;
    const days = Number(l.durationDays ?? l.totalDays ?? 0);
    const isFull = mode === 'full' || mode === 'full_day';

    if (!isFull && (mode === 'hourly' || (days > 0 && days < 0.5))) {
      const hours = l.leaveHours || Math.round(days * 8);
      return `${hours} ชม.`;
    }
    if (!isFull && (days === 0.5 || mode === 'half_day' || mode === 'morning' || mode === 'afternoon')) {
      return `0.5 วัน`;
    }
    return `${days} วัน`;
  };

  // Helper to fetch Sarabun Thai font as Base64 for jsPDF
  const loadThaiFontBase64 = async (): Promise<string | null> => {
    try {
      const response = await fetch('/fonts/Sarabun-Regular.ttf');
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error('Failed to load Sarabun Thai font:', error);
      return null;
    }
  };

  // Filter logic
  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      (l.employeeName || l.userId || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.departmentName || l.department || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || (l.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || l.leaveTypeId === typeFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(l.startDate) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(l.endDate) <= new Date(endDate);
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Handle excel export
  const handleExportExcel = () => {
    if (filteredLeaves.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก (No data to export)');
      return;
    }

    const formattedData = filteredLeaves.map((l, index) => ({
      '#': index + 1,
      'รหัสคำขอลา': l.requestCode || '-',
      'รหัสพนักงาน': l.employeeCode || l.employee?.employeeCode || (l.employeeId?.startsWith('EMP-') ? l.employeeId : `EMP-${String(l.employeeId || '').substring(0, 6).toUpperCase()}`),
      'ชื่อ-นามสกุล': l.employeeName || l.userId || 'ไม่ระบุชื่อ',
      'แผนกงาน': l.departmentName || l.department || '-',
      'ประเภทการลา': l.leaveTypeName || l.type || '-',
      'วันที่ยื่นลา': formatDateDisplay(l.startDate, l.endDate, l),
      'ระยะเวลา': formatDurationText(l),
      'เหตุผลการลา': l.reason || '-',
      'ผู้อนุมัติ': l.approverName || '-',
      'สถานะ': (l.status || '').toLowerCase().includes('approved') ? 'อนุมัติแล้ว' : (l.status || '').toLowerCase() === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ',
      'วันที่ยื่นคำขอ': new Date(l.createdAt || 0).toLocaleDateString('th-TH')
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Report');

    worksheet['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 },
      { wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
    ];

    const filename = `leave_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Handle PDF export with full Thai font support
  const handleExportPDF = async () => {
    if (filteredLeaves.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก (No data to export)');
      return;
    }

    const doc = new jsPDF('landscape');

    // Load & Register Thai Font in jsPDF
    const fontBase64 = await loadThaiFontBase64();
    if (fontBase64) {
      doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
      doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
      doc.setFont('Sarabun');
    }

    doc.setFontSize(18);
    doc.text('รายงานสรุปผลการลางานพนักงาน (Company Leave Report)', 14, 15);
    doc.setFontSize(10);
    doc.text(`สร้างเมื่อวันที่: ${new Date().toLocaleString('th-TH')}`, 14, 22);
    doc.text(`จำนวนรายการที่พบ: ${filteredLeaves.length} รายการ`, 14, 27);

    const headers = [
      ['#', 'รหัสคำขอลา', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนกงาน', 'ประเภทการลา', 'ช่วงเวลา', 'จำนวนวัน', 'สถานะ']
    ];
    const data = filteredLeaves.map((l, index) => [
      index + 1,
      l.requestCode || '-',
      l.employeeCode || l.employee?.employeeCode || (l.employeeId?.startsWith('EMP-') ? l.employeeId : `EMP-${String(l.employeeId || '').substring(0, 6).toUpperCase()}`),
      l.employeeName || l.userId || 'ไม่ระบุชื่อ',
      l.departmentName || l.department || '-',
      l.leaveTypeName || l.type || '-',
      formatDateDisplay(l.startDate, l.endDate, l),
      formatDurationText(l),
      (l.status || '').toLowerCase().includes('approved') ? 'อนุมัติแล้ว' : (l.status || '').toLowerCase() === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'striped',
      headStyles: {
        fillColor: [11, 15, 78],
        font: fontBase64 ? 'Sarabun' : undefined,
        fontStyle: 'normal'
      },
      styles: {
        font: fontBase64 ? 'Sarabun' : undefined,
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30 },
        6: { cellWidth: 45 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 },
      }
    });

    doc.save(`leave_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* Title Header & Action Buttons */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            รายงานการลางาน (Leave Reports)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            วิเคราะห์ สรุปผลยอดสถิติการลางานพนักงาน คัดกรองช่วงวัน และส่งออกข้อมูลเป็นไฟล์ Excel หรือ PDF
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#00C853] hover:bg-emerald-600 cursor-pointer shadow-sm transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel (XLSX)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0056b3] hover:bg-[#004494] cursor-pointer shadow-sm transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>ส่งออก PDF Report</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center space-x-2 text-slate-800">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>ตัวกรองรายงานขั้นสูง (Advanced Report Filter)</span>
          </CardTitle>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setTypeFilter('all');
              setStartDate('');
              setEndDate('');
              refetch();
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ล้างค่าทั้งหมด (Reset)</span>
          </button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Search Input */}
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ค้นหาพนักงาน</label>
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-4 h-4 my-auto" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ชื่อ, รหัสพนักงาน..."
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Leave Type Filter */}
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ประเภทการลา</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-800 py-2.5 px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">ทุกประเภทการลา</option>
                {leaveTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name.split(' ')[0]}</option>
                ))}
              </select>
            </div>

            {/* Leave Status Filter */}
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">สถานะใบลา</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-800 py-2.5 px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">ทุกสถานะใบลา</option>
                <option value="pending">รออนุมัติ (Pending)</option>
                <option value="approved">อนุมัติแล้ว (Approved)</option>
                <option value="rejected">ปฏิเสธ (Rejected)</option>
                <option value="cancelled">ยกเลิกแล้ว (Cancelled)</option>
              </select>
            </div>

            {/* Start Date Picker */}
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ตั้งแต่วันที่</label>
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                    setStartDate(d.toISOString().split('T')[0]);
                  } else {
                    setStartDate('');
                  }
                }}
                placeholderText="วว/ดด/ปปปป"
              />
            </div>

            {/* End Date Picker */}
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ถึงวันที่</label>
              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                    setEndDate(d.toISOString().split('T')[0]);
                  } else {
                    setEndDate('');
                  }
                }}
                placeholderText="วว/ดด/ปปปป"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Leave Request List Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable cols={7} rows={5} />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            ไม่พบคำขอยื่นใบลาตามเงื่อนไขการกรอง
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-sm">
              <thead className="bg-[#add8e6] text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">รหัสคำขอลา</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">รหัสพนักงาน</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-left">ชื่อ-นามสกุลพนักงาน</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">ประเภทการลา</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">วันที่เริ่ม - สิ้นสุด</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">รวมวันลา</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">ผู้อนุมัติ</th>
                  <th className="py-4 px-5 font-bold whitespace-nowrap text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((l) => {
                  const empCode = l.employeeCode || l.employee?.employeeCode || (l.employeeId?.startsWith('EMP-') ? l.employeeId : `EMP-${String(l.employeeId || '').substring(0, 6).toUpperCase()}`);
                  const empName = l.employeeName || l.userId || 'ไม่ระบุชื่อ';
                  const deptName = l.departmentName || l.department || '-';
                  const shortTypeName = (l.leaveTypeName || l.type || '').split(' ')[0];
                  const datesDisplay = formatDateDisplay(l.startDate, l.endDate, l);
                  const durationDisplay = formatDurationText(l);

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 text-sm text-blue-600 font-bold whitespace-nowrap text-center">
                        {l.requestCode || '-'}
                      </td>
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-500 whitespace-nowrap text-center">
                        {empCode}
                      </td>
                      <td className="py-4 px-5 text-left">
                        <div className="font-bold text-slate-900">{empName}</div>
                        <div className="text-xs text-slate-500">{deptName}</div>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-800 whitespace-nowrap text-center">
                        {shortTypeName}
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-medium text-xs whitespace-nowrap text-center">
                        {datesDisplay}
                      </td>
                      <td className="py-4 px-5 text-slate-800 font-bold whitespace-nowrap text-center">
                        {durationDisplay}
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs whitespace-nowrap text-center">
                        {l.approverName || '-'}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <Badge
                            variant={
                              (l.status || '').toLowerCase().includes('approved') ? 'success' :
                                (l.status || '').toLowerCase() === 'pending' ? 'warning' :
                                  (l.status || '').toLowerCase().includes('rejected') ? 'danger' : 'neutral'
                            }
                          >
                            {(l.status || '').toLowerCase().includes('approved') ? 'อนุมัติแล้ว' :
                              (l.status || '').toLowerCase() === 'pending' ? 'รออนุมัติ' :
                                (l.status || '').toLowerCase().includes('rejected') ? 'ปฏิเสธ' : l.status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
}
