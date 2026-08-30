"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { HardDrive, Server, Clock, Activity } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await api.get('/admin/system-health');
      setHealth(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Refresh every 10 seconds
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const dDisplay = d > 0 ? d + (d == 1 ? " วัน, " : " วัน, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " ชั่วโมง, " : " ชั่วโมง, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " นาที, " : " นาที, ") : "";
    const sDisplay = s > 0 ? s + " วินาที" : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-slate-700" /> สถานะระบบ (System Health)
          </h1>
          <p className="text-slate-500">ข้อมูลการทำงานของเซิร์ฟเวอร์ Backend (Node.js) แบบเรียลไทม์</p>
        </div>

        {loading && !health ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-slate-200 rounded-xl"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${health?.status === 'OK' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Server className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">สถานะ API ของระบบ</h2>
                <p className={`text-lg font-medium mt-1 ${health?.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                  {health?.status === 'OK' ? 'ออนไลน์ (OK)' : 'ออฟไลน์ (OFFLINE)'}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">ระยะเวลาที่เซิร์ฟเวอร์เปิดทำงานต่อเนื่อง (Uptime)</p>
                  <p className="text-xl font-bold text-slate-800">{formatUptime(health?.uptime)}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="w-full">
                  <p className="text-sm text-slate-500 font-medium mb-2">การใช้หน่วยความจำ (RSS)</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-slate-800">{health?.memory?.rss || '0 MB'}</span>
                  </div>
                  {/* Fake progress bar to look cool */}
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">หน่วยความจำจำลอง (Heap Total)</p>
                  <p className="text-lg font-bold text-slate-800">{health?.memory?.heapTotal || '0 MB'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">หน่วยความจำที่ใช้งานจริง (Heap Used)</p>
                  <p className="text-lg font-bold text-slate-800">{health?.memory?.heapUsed || '0 MB'}</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </RoleGuard>
  );
}
