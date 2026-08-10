"use client";

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axios';
import {
    FileSpreadsheet,
    Filter,
    FileDown,
    RefreshCw,
    Loader2,
    Search
} from 'lucide-react';
import { ThaiDatePicker } from '@/components/ThaiCalendarPicker';
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
            if (filterType !== 'all') url += `leaveTypeId=${encodeURIComponent(filterType)}&`;
            if (filterStatus !== 'all') url += `status=${encodeURIComponent(filterStatus)}&`;

            const response = await axiosInstance.get(url);

            if (response.data && response.data.data) {
                const apiLeaveTypes = response.data.data.leaveTypes || [];
                const apiSummary = response.data.data.summary || [];

                const customOrder: Record<string, number> = {
                    'ลาป่วย': 1,
                    'ลากิจ': 2,
                    'ลาพักผ่อนประจำปี (พักร้อน)': 3,
                    'ลาพักผ่อนประจำปี': 3,
                    'ลาเพื่อคลอดบุตร': 4,
                    'ลาเพื่อช่วยเหลือภริยาคลอดบุตร': 5,
                    'ลาเพื่อทำหมัน': 6,
                    'ลาเพื่อรับราชการทหาร': 7
                };

                const sortedApiLeaveTypes = apiLeaveTypes.map((lt: any) => ({
                    ...lt,
                    name: lt.name === 'ลาพักผ่อนประจำปี (พักร้อน)' ? 'ลาพักผ่อนประจำปี' : lt.name
                })).sort((a: any, b: any) => {
                    const orderA = customOrder[a.name] || 99;
                    const orderB = customOrder[b.name] || 99;
                    return orderA - orderB;
                });

                setLeaveTypes(sortedApiLeaveTypes);

                // Map summary data keys if name was changed
                const mappedSummary = apiSummary.map((row: any) => {
                    if (row.leaveData && row.leaveData['ลาพักผ่อนประจำปี (พักร้อน)'] !== undefined) {
                        row.leaveData['ลาพักผ่อนประจำปี'] = row.leaveData['ลาพักผ่อนประจำปี (พักร้อน)'];
                    }
                    if (row.remainingData && row.remainingData['ลาพักผ่อนประจำปี (พักร้อน)'] !== undefined) {
                        row.remainingData['ลาพักผ่อนประจำปี'] = row.remainingData['ลาพักผ่อนประจำปี (พักร้อน)'];
                    }

                    return row;
                });

                setSummaryData(mappedSummary);
            }
        } catch (error) {
            console.error("Failed to fetch leave summary:", error);
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
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getPeriodString = () => {
        if (fromDate && toDate) return `${formatThaiDate(fromDate)} ถึง ${formatThaiDate(toDate)}`;
        if (fromDate) return `ตั้งแต่ ${formatThaiDate(fromDate)}`;
        if (toDate) return `จนถึง ${formatThaiDate(toDate)}`;
        return `1 ม.ค. - 31 ธ.ค. ${new Date().getFullYear()}`;
    };

    const displayedLeaveTypes = filterType === 'all'
        ? leaveTypes
        : leaveTypes.filter(lt => lt.id === filterType);

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

    const handleDownloadExcel = () => {
        const formattedData = summaryData.map((row, index) => {
            const leaveValues: Record<string, number> = {};
            displayedLeaveTypes.forEach(lt => {
                leaveValues[lt.name] = row.leaveData[lt.name] || 0;
            });
            const rowTotalUsed = displayedLeaveTypes.reduce((sum, lt) => sum + (row.leaveData[lt.name] || 0), 0);
            const rowTotalRemaining = displayedLeaveTypes.reduce((sum, lt) => sum + ((lt.defaultDays || 0) - (row.leaveData[lt.name] || 0)), 0);

            return {
                '#': index + 1,
                'รหัสพนักงาน': row.employeeCode || '-',
                'ชื่อ': row.firstName,
                'นามสกุล': row.lastName,
                'แผนก': row.department,
                ...leaveValues,
                'รวม (วัน)': rowTotalUsed,
                'ยอดคงเหลือรวม (วัน)': rowTotalRemaining,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Summary');

        // Column widths
        worksheet['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
            ...displayedLeaveTypes.map(() => ({ wch: 18 })),
            { wch: 12 }, { wch: 18 }
        ];

        const filename = `leave_summary_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };

    const handleDownloadPDF = async () => {
        const doc = new jsPDF('landscape');

        // Load & Register Thai Font in jsPDF
        const fontBase64 = await loadThaiFontBase64();
        if (fontBase64) {
            doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
            doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
            doc.setFont('Sarabun');
        }

        // Title
        doc.setFontSize(18);
        doc.text('รายงานสรุปการลางานพนักงาน (Leave Summary Report)', 14, 15);
        doc.setFontSize(10);
        doc.text(`วันที่พิมพ์: ${new Date().toLocaleString('th-TH')}`, 14, 22);
        doc.text(`ช่วงเวลา: ${getPeriodString()}`, 14, 27);
        doc.text(`จำนวนพนักงาน: ${summaryData.length} คน`, 14, 32);

        // Build table headers and data
        const leaveTypeHeaders = displayedLeaveTypes.map(lt => lt.name);
        const headers = [['#', 'รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'แผนก', ...leaveTypeHeaders, 'รวม (วัน)', 'คงเหลือรวม (วัน)']];

        const data = summaryData.map((row, index) => {
            const leaveValues = displayedLeaveTypes.map(lt => {
                const days = row.leaveData[lt.name] || 0;
                return days > 0 ? `${days}` : '-';
            });
            const rowTotalUsed = displayedLeaveTypes.reduce((sum, lt) => sum + (row.leaveData[lt.name] || 0), 0);
            const rowTotalRemaining = displayedLeaveTypes.reduce((sum, lt) => sum + ((lt.defaultDays || 0) - (row.leaveData[lt.name] || 0)), 0);
            return [
                index + 1,
                row.employeeCode || '-',
                row.firstName,
                row.lastName,
                row.department,
                ...leaveValues,
                rowTotalUsed,
                rowTotalRemaining
            ];
        });

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 37,
            theme: 'striped',
            headStyles: {
                fillColor: [79, 70, 229],
                font: fontBase64 ? 'Sarabun' : undefined,
                fontStyle: 'normal',
                fontSize: 8
            },
            styles: {
                font: fontBase64 ? 'Sarabun' : undefined,
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 22 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 },
            }
        });

        doc.save(`leave_summary_report_${new Date().toISOString().split('T')[0]}.pdf`);
        
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">

            {/* Title Header & Action Buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        สรุปการลา (Leave Summary)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        ดูภาพรวมสถิติการลางานของพนักงานในองค์กรแบบรวมกลุ่ม สามารถดูจำนวนวันที่ลาไปของแต่ละประเภทในแต่ละช่วงเวลาได้
                    </p>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={handleDownloadExcel}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#00C853] hover:bg-emerald-600 cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>ส่งออก Excel (.xlsx)</span>
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0056b3] hover:bg-[#004494] cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>ส่งออก PDF Report</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filter Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
                <div className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
                    <div className="text-sm font-bold flex items-center space-x-2 text-slate-800">
                        <Filter className="w-4 h-4 text-blue-600" />
                        <span>ตัวกรองรายงานขั้นสูง (Advanced Report Filter)</span>
                    </div>
                    <button
                        onClick={resetFilters}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ล้างค่าทั้งหมด (Reset)</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Search Input */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ค้นหาพนักงาน</label>
                            <div className="relative">
                                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-4 h-4 my-auto" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder="ชื่อ, รหัสพนักงาน..."
                                    className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Leave Type Filter */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ประเภทการลา</label>
                            <select
                                value={filterType}
                                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-800 py-2.5 px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="all">ทุกประเภทการลา</option>
                                {leaveTypes.map(lt => (
                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ตั้งแต่วันที่</label>
                            <ThaiDatePicker
                                selected={fromDate}
                                onChange={(date: Date | null) => {
                                    let newDate = date;
                                    const today = new Date();
                                    if (newDate && newDate > today) newDate = today;
                                    setFromDate(newDate);
                                    if (newDate && toDate && toDate < newDate) setToDate(newDate);
                                    setCurrentPage(1);
                                }}
                                maxDate={new Date()}
                                placeholderText="วว-ดด-ปปปป"
                                isPlain={true}
                                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-800 py-2.5 pl-3 pr-9 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1.5">ถึงวันที่</label>
                            <ThaiDatePicker
                                selected={toDate}
                                onChange={(date: Date | null) => {
                                    let newDate = date;
                                    const today = new Date();
                                    if (newDate && newDate > today) newDate = today;
                                    if (newDate && fromDate && newDate < fromDate) newDate = fromDate;
                                    setToDate(newDate);
                                    setCurrentPage(1);
                                }}
                                minDate={fromDate || undefined}
                                maxDate={new Date()}
                                placeholderText="วว-ดด-ปปปป"
                                isPlain={true}
                                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-800 py-2.5 pl-3 pr-9 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <span className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : summaryData.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-medium">
                        ไม่พบข้อมูลสรุปการลา
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse text-sm min-w-[1000px]">
                            <thead className="bg-[#add8e6] text-slate-800 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-center">ลำดับ</th>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-center">รหัสพนักงาน</th>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-left">ชื่อ</th>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-left">นามสกุล</th>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-center">แผนก</th>
                                    {displayedLeaveTypes.map(lt => (
                                        <th key={lt.id} className="py-4 px-5 font-bold whitespace-nowrap text-center">
                                            {lt.name}
                                        </th>
                                    ))}
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-center bg-indigo-100">รวม (วัน)</th>
                                    <th className="py-4 px-5 font-bold whitespace-nowrap text-center bg-amber-100">คงเหลือรวม (วัน)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {paginatedData.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-500 whitespace-nowrap text-center">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-500 whitespace-nowrap text-center">
                                            {row.employeeCode || '-'}
                                        </td>
                                        <td className="py-4 px-5 text-left whitespace-nowrap">
                                            <div className="font-bold text-slate-900">{row.firstName}</div>
                                        </td>
                                        <td className="py-4 px-5 text-left whitespace-nowrap">
                                            <div className="font-bold text-slate-900">{row.lastName}</div>
                                        </td>
                                        <td className="py-4 px-5 text-slate-600 text-xs whitespace-nowrap text-center">
                                            {row.department}
                                        </td>
                                        {displayedLeaveTypes.map(lt => {
                                            const days = row.leaveData[lt.name] || 0;
                                            return (
                                                <td key={lt.id} className="py-4 px-5 text-center font-medium">
                                                    <span className={days > 0 ? 'text-indigo-600 font-bold' : 'text-slate-300'}>
                                                        {days > 0 ? `${days} วัน` : '-'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="py-4 px-5 text-center bg-indigo-50/40">
                                            <span className="font-bold text-indigo-700">
                                                {displayedLeaveTypes.reduce((sum, lt) => sum + (row.leaveData[lt.name] || 0), 0)} วัน
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-center bg-amber-50/40">
                                            <span className="font-bold text-amber-700">
                                                {displayedLeaveTypes.reduce((sum, lt) => sum + ((lt.defaultDays || 0) - (row.leaveData[lt.name] || 0)), 0)} วัน
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && summaryData.length > 0 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 bg-slate-50/50">
                        <span>แสดง {totalItems > 0 ? startIndex + 1 : 0} ถึง {endIndex} จาก {totalItems} รายการ</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
