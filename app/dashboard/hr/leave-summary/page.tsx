'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/api/axios';
import {
  FileSpreadsheet,
  Filter,
  FileDown,
  RefreshCw,
  Loader2,
  Search,
  Download,
  ChevronDown,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import { DatePicker } from '@/components/DateAndTime';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- TypeScript Interfaces ---
interface LeaveType {
  id: string;
  name: string;
  defaultDays: number;
}

interface LeaveSummaryRecord {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  leaveData: Record<string, number>;
  remainingData?: Record<string, number>;
  totalUsedDays: number;
  totalRemainingDays: number;
  leaveDates?: string[]; // Array of formatted date strings
}

export default function LeaveSummaryView() {
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Data States
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [summaryData, setSummaryData] = useState<LeaveSummaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloadModalOpen, setIsDownloadModalOpen] =
    useState<boolean>(false);

  // Other states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch Data from API
  const fetchSummaryData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      let url = '/hr/leave-summary?';

      if (searchQuery) url += `searchQuery=${encodeURIComponent(searchQuery)}&`;
      if (fromDate) url += `startDate=${fromDate.toISOString()}&`;
      if (toDate) url += `endDate=${toDate.toISOString()}&`;
      if (filterType !== 'all')
        url += `leaveTypeId=${encodeURIComponent(filterType)}&`;
      if (filterStatus !== 'all')
        url += `status=${encodeURIComponent(filterStatus)}&`;

      const response = await axiosInstance.get(url);

      if (response.data && response.data.data) {
        const apiLeaveTypes = response.data.data.leaveTypes || [];
        const apiSummary = response.data.data.summary || [];

        const customOrder: Record<string, number> = {
          ลาป่วย: 1,
          ลากิจ: 2,
          'ลาพักผ่อนประจำปี (พักร้อน)': 3,
          ลาพักผ่อนประจำปี: 3,
          ลาเพื่อคลอดบุตร: 4,
          ลาเพื่อช่วยเหลือภริยาคลอดบุตร: 5,
          ลาเพื่อทำหมัน: 6,
          ลาเพื่อรับราชการทหาร: 7,
        };

        const sortedApiLeaveTypes = apiLeaveTypes
          .map((lt: any) => ({
            ...lt,
            name:
              lt.name === 'ลาพักผ่อนประจำปี (พักร้อน)'
                ? 'ลาพักผ่อนประจำปี'
                : lt.name,
          }))
          .sort((a: any, b: any) => {
            const orderA = customOrder[a.name] || 99;
            const orderB = customOrder[b.name] || 99;
            return orderA - orderB;
          });

        setLeaveTypes(sortedApiLeaveTypes);

        // Map summary data keys if name was changed
        const mappedSummary = apiSummary.map((row: any) => {
          if (
            row.leaveData &&
            row.leaveData['ลาพักผ่อนประจำปี (พักร้อน)'] !== undefined
          ) {
            row.leaveData['ลาพักผ่อนประจำปี'] =
              row.leaveData['ลาพักผ่อนประจำปี (พักร้อน)'];
          }
          if (
            row.remainingData &&
            row.remainingData['ลาพักผ่อนประจำปี (พักร้อน)'] !== undefined
          ) {
            row.remainingData['ลาพักผ่อนประจำปี'] =
              row.remainingData['ลาพักผ่อนประจำปี (พักร้อน)'];
          }

          return row;
        });

        setSummaryData(mappedSummary);
      }
    } catch (error) {
      console.error('Failed to fetch leave summary:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount or filter change
    fetchSummaryData();

    // Setup background polling (Auto-refresh every 15 seconds)
    const intervalId = setInterval(() => {
      fetchSummaryData(false); // Fetch silently without showing loading spinner
    }, 15000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [searchQuery, fromDate, toDate, filterType, filterStatus]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setFromDate(null);
    setToDate(null);
    setCurrentPage(1);
  };

  const formatThaiDate = (date: Date | null) => {
    if (!date) return '-';
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
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getPeriodString = () => {
    if (fromDate && toDate)
      return `${formatThaiDate(fromDate)} ถึง ${formatThaiDate(toDate)}`;
    if (fromDate) return `ตั้งแต่ ${formatThaiDate(fromDate)}`;
    if (toDate) return `จนถึง ${formatThaiDate(toDate)}`;
    return `1 ม.ค. - 31 ธ.ค. ${new Date().getFullYear()}`;
  };

  const displayedLeaveTypes =
    filterType === 'all'
      ? leaveTypes
      : leaveTypes.filter((lt) => lt.id === filterType);

  // Pagination logic
  const totalItems = summaryData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = summaryData.slice(startIndex, endIndex);

  // Download Handlers

  // Helper to load Sarabun Thai font as Base64 for jsPDF
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

  const handleDownloadPDF = async () => {
    let textContent = '==== รายงานสรุปการลางาน (Simulated PDF) ====\n\n';
    textContent += `วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}\n`;
    textContent += `ช่วงเวลา: ${getPeriodString()}\n\n`;

    const doc = new jsPDF('landscape');

    // Load & Register Thai Font in jsPDF
    const fontBase64 = await loadThaiFontBase64();
    if (fontBase64) {
      doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
      doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
      doc.setFont('Sarabun');
    }

    doc.setFontSize(18);
    doc.text('รายงานสรุปผลการลางาน (Leave Summary Report)', 14, 15);
    doc.setFontSize(10);
    doc.text(`วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}`, 14, 22);
    doc.text(`ช่วงเวลา: ${getPeriodString()}`, 14, 27);

    summaryData.forEach((row, index) => {
      textContent += `ลำดับที่ ${index + 1} | พนักงาน: ${row.employeeCode} - ${row.firstName} ${row.lastName} (${row.department})\n`;
      displayedLeaveTypes.forEach((lt) => {
        const days = row.leaveData[lt.name] || 0;
        if (days > 0) textContent += `- ${lt.name}: ${days} วัน\n`;
      });

      const rowTotalUsed = displayedLeaveTypes.reduce(
        (sum, lt) => sum + (row.leaveData[lt.name] || 0),
        0,
      );
      const rowTotalRemaining = displayedLeaveTypes.reduce(
        (sum, lt) =>
          sum + ((lt.defaultDays || 0) - (row.leaveData[lt.name] || 0)),
        0,
      );

      textContent += `-> รวมการลาทั้งหมด: ${rowTotalUsed} วัน (คงเหลือรวม: ${rowTotalRemaining} วัน)\n`;
      textContent += '--------------------------------------------------\n';
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leave_summary_report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloadModalOpen(false);
  };

  const handleDownloadExcel = () => {
    const exportData = summaryData.map((row, index) => {
      const baseData: any = {
        ลำดับ: index + 1,
        รหัสพนักงาน: row.employeeCode,
        ชื่อ: row.firstName,
        นามสกุล: row.lastName,
        แผนก: row.department,
      };

      displayedLeaveTypes.forEach((lt) => {
        baseData[lt.name] = row.leaveData[lt.name] || 0;
      });

      baseData['รวมการลาทั้งหมด (วัน)'] = displayedLeaveTypes.reduce(
        (sum, lt) => sum + (row.leaveData[lt.name] || 0),
        0,
      );
      baseData['ยอดคงเหลือรวม (วัน)'] = displayedLeaveTypes.reduce(
        (sum, lt) =>
          sum + ((lt.defaultDays || 0) - (row.leaveData[lt.name] || 0)),
        0,
      );

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Summary');

    XLSX.writeFile(wb, 'leave_summary_report.xlsx');

    setIsDownloadModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header Area for Summary */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/4"></div>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mt-1">
              <FileSpreadsheet size={28} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                สรุปการลา (Leave Summary)
              </h1>
              <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                ดูภาพรวมสถิติการลางานของพนักงานในองค์กรแบบรวมกลุ่ม
                สามารถดูจำนวนวันที่ลาไปของแต่ละประเภทในแต่ละช่วงเวลาได้
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Filter and Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 z-50 relative overflow-visible">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600">
              <Filter size={18} />
              <span className="font-semibold text-sm sm:text-base">
                ตัวกรองรายงานขั้นสูง (Advanced Report Filter)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                <RefreshCw size={14} />
                ล้างค่าทั้งหมด (Reset)
              </button>
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="hidden md:flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow group"
              >
                <Download size={16} className="group-hover:animate-bounce" />
                ดาวน์โหลดรายงาน
              </button>
            </div>
          </div>
          {/* Filter Fields */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* 1. ค้นหาพนักงาน */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                ค้นหาพนักงาน
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ชื่อ, รหัสพนักงาน..."
                className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* 2. ประเภทการลา */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                ประเภทการลา
              </label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                >
                  <option value="all">ทุกประเภทการลา</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* 4. ตั้งแต่วันที่ */}
            <div>
              <label className="block  text-xs font-medium text-slate-500 mb-1.5">
                ตั้งแต่วันที่
              </label>
              <div className="relative">
                <DatePicker
                  selected={fromDate}
                  onChange={(date: Date | null) => {
                    let newDate = date;
                    const today = new Date();
                    // ป้องกันเลือกวันล่วงหน้า (เด้งกลับเป็นวันนี้)
                    if (newDate && newDate > today) newDate = today;

                    setFromDate(newDate);
                    // ถ้า "ถึงวันที่" ดันน้อยกว่า "ตั้งแต่วันที่" ให้ดัน "ถึงวันที่" ให้เท่ากัน
                    if (newDate && toDate && toDate < newDate) {
                      setToDate(newDate);
                    }
                    setCurrentPage(1);
                  }}
                  maxDate={new Date()}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* 5. ถึงวันที่ */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                ถึงวันที่
              </label>
              <div className="relative">
                <DatePicker
                  selected={toDate}
                  onChange={(date: Date | null) => {
                    let newDate = date;
                    const today = new Date();
                    // ป้องกันเลือกวันล่วงหน้า
                    if (newDate && newDate > today) newDate = today;
                    // ป้องกัน "ถึงวันที่" น้อยกว่า "ตั้งแต่วันที่" (เด้งกลับ)
                    if (newDate && fromDate && newDate < fromDate)
                      newDate = fromDate;

                    setToDate(newDate);
                    setCurrentPage(1);
                  }}
                  minDate={fromDate || undefined}
                  maxDate={new Date()}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
          {/* Mobile Download Button */}
          <div className="px-6 pb-6 md:hidden">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm"
            >
              <Download size={16} />
              ดาวน์โหลดรายงาน
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/95 backdrop-blur z-10 w-[80px] min-w-[80px] border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9] text-center">
                    ลำดับ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-[80px] bg-slate-50/95 backdrop-blur z-10 w-[150px] min-w-[150px] border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]">
                    รหัสพนักงาน
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-[230px] bg-slate-50/95 backdrop-blur z-10 w-[200px] min-w-[200px] border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]">
                    ชื่อ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-[430px] bg-slate-50/95 backdrop-blur z-10 w-[150px] min-w-[150px] border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]">
                    นามสกุล
                  </th>
                  {displayedLeaveTypes.map((lt) => (
                    <th
                      key={lt.id}
                      className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap"
                    >
                      {lt.name}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center bg-indigo-50/50 whitespace-nowrap">
                    รวม
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center bg-amber-50/50 whitespace-nowrap">
                    ยอดคงเหลือรวม
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 relative">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={displayedLeaveTypes.length + 6}
                      className="px-6 py-20 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-indigo-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <span className="text-sm font-medium text-slate-500">
                          กำลังโหลดข้อมูล...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors z-10 shadow-[1px_0_0_0_#f1f5f9] text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {startIndex + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky left-[80px] bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors z-10 shadow-[1px_0_0_0_#f1f5f9]">
                        <span className="text-sm text-slate-700 font-medium">
                          {row.employeeCode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky left-[230px] bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors z-10 shadow-[1px_0_0_0_#f1f5f9]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {row.firstName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {row.firstName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 sticky left-[430px] bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors z-10 shadow-[1px_0_0_0_#f1f5f9]">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate">
                            {row.lastName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {row.department}
                          </div>
                        </div>
                      </td>

                      {displayedLeaveTypes.map((lt) => {
                        const days = row.leaveData[lt.name] || 0;
                        return (
                          <td key={lt.id} className="px-6 py-4 text-center">
                            <span
                              className={`text-sm font-medium ${days > 0 ? 'text-indigo-600' : 'text-slate-300'}`}
                            >
                              {days > 0 ? `${days} วัน` : '-'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center bg-indigo-50/30">
                        <span className="text-sm font-bold text-indigo-700">
                          {displayedLeaveTypes.reduce(
                            (sum, lt) => sum + (row.leaveData[lt.name] || 0),
                            0,
                          )}{' '}
                          วัน
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center bg-amber-50/30">
                        <span className="text-sm font-bold text-amber-700">
                          {displayedLeaveTypes.reduce(
                            (sum, lt) =>
                              sum +
                              ((lt.defaultDays || 0) -
                                (row.leaveData[lt.name] || 0)),
                            0,
                          )}{' '}
                          วัน
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={displayedLeaveTypes.length + 6}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      ไม่พบข้อมูลสรุปการลา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 bg-slate-50/50">
            <span>
              แสดง {totalItems > 0 ? startIndex + 1 : 0} ถึง {endIndex} จาก{' '}
              {totalItems} รายการ
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal Popup */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsDownloadModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                เลือกรูปแบบไฟล์
              </h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-red-700">
                    ดาวน์โหลด PDF
                  </div>
                </div>
              </button>

              <button
                onClick={handleDownloadExcel}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-700">
                    ดาวน์โหลด Excel
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
