"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Users, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/overview');
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ภาพรวมผู้ดูแลระบบ</h1>
          <p className="text-slate-500">สรุปข้อมูลระบบและการเฝ้าระวังความปลอดภัย</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">ผู้ใช้งานทั้งหมด</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.totalUsers || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">กำลังใช้งาน</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.activeUsers || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">ล็อกอินผิดพลาด (24ชม.)</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.failedLogins24h || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">จำนวนสิทธิ์ (Roles)</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.usersByRole?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-lg font-bold text-slate-800 mb-4">ประวัติการใช้งานล่าสุด</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm">
                      <th className="p-3 border-b font-medium">เวลา</th>
                      <th className="p-3 border-b font-medium">ผู้ใช้งาน</th>
                      <th className="p-3 border-b font-medium">การกระทำ</th>
                      <th className="p-3 border-b font-medium">ไอพีแอดเดรส</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentLogs?.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 text-sm">
                        <td className="p-3 border-b text-slate-600">
                          {new Date(log.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td className="p-3 border-b font-medium text-slate-800">
                          {log.user?.email || log.user?.username || 'ระบบ'}
                        </td>
                        <td className="p-3 border-b">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.action.includes('FAILED') ? 'bg-red-100 text-red-700' : 
                            log.action.includes('LOGIN') ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 border-b text-slate-500 font-mono text-xs">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                    {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          ไม่พบประวัติการใช้งานล่าสุด
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
