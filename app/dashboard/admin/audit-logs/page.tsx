"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { ClipboardList, Download } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=20`);
      setLogs(res.data.data.items);
      setTotalPages(res.data.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getUserDisplay = (log: any) => {
    if (log.user) return log.user.username || log.user.email || 'ระบบ';
    
    if (log.details && log.details.includes('Username: ')) {
       const parts = log.details.split('Username: ');
       if (parts.length > 1) {
          return parts[1].trim();
       }
    }
    
    return 'ระบบ';
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/admin/audit-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('ไม่สามารถส่งออกไฟล์ CSV ได้');
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-4 px-8 py-5 shadow-sm z-10 shrink-0">
          <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              ประวัติการใช้งานระบบ (Audit Logs)
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              ติดตามและตรวจสอบการกระทำทั้งหมดภายในระบบ
            </p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> ดาวน์โหลด CSV
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm">
                      <th className="p-3 border-b font-medium">วันและเวลา</th>
                      <th className="p-3 border-b font-medium">ผู้ใช้งาน</th>
                      <th className="p-3 border-b font-medium">การกระทำ (Action)</th>
                      <th className="p-3 border-b font-medium">ส่วนที่เกี่ยวข้อง (Entity)</th>
                      <th className="p-3 border-b font-medium">ไอพีแอดเดรส</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">ไม่พบประวัติการใช้งาน</td>
                      </tr>
                    ) : (
                      logs.map(log => {
                        const userName = getUserDisplay(log);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 border-b last:border-0 text-sm">
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('th-TH')}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {userName}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${log.action.includes('FAILED') ? 'bg-red-100 text-red-700' :
                                log.action.includes('LOGIN') ? 'bg-green-100 text-green-700' :
                                  !log.user ? 'bg-slate-200 text-slate-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              {log.entity}
                            </td>
                            <td className="p-3 font-mono text-xs text-slate-500">
                              {log.ipAddress || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t flex justify-between items-center text-sm">
                <span className="text-slate-500">
                  หน้า {page} จาก {totalPages || 1}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
