"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Activity, Trash2, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminCaptchaPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/captcha/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePurge = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่ต้องการล้างข้อมูลแคปช่า (CAPTCHA) ที่ใช้งานแล้วหรือหมดอายุทิ้งทั้งหมด?')) return;
    setPurging(true);
    try {
      const res = await api.delete('/admin/captcha/purge');
      alert('ล้างข้อมูลเรียบร้อยแล้ว');
      fetchStats();
    } catch (err) {
      alert('ไม่สามารถล้างข้อมูลแคปช่าได้');
    } finally {
      setPurging(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-4 px-8 py-5 shadow-sm z-10 shrink-0">
          <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              ตรวจสอบระบบ CAPTCHA
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              ติดตามและเคลียร์พื้นที่ฐานข้อมูลแคปช่า (CAPTCHA)
            </p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end">
            <button
              onClick={handlePurge}
              disabled={purging || loading}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> {purging ? "กำลังล้างข้อมูล..." : "ล้างข้อมูลที่หมดอายุแล้ว"}
            </button>
        </div>

        {loading ? (
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">สร้างทั้งหมด</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.total || 0}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> ใช้งานสำเร็จ
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.used || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" /> หมดอายุ (ไม่ได้ใช้)
              </p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats?.expired || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                <Activity className="w-4 h-4 text-blue-500" /> กำลังรอใช้งาน
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.active || 0}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <strong>คำแนะนำ:</strong> ภาพแคปช่า (CAPTCHAs) จะถูกตรวจสอบและทำเครื่องหมายว่าถูกใช้งานแล้วเมื่อผู้ใช้ล็อกอินสำเร็จ อย่างไรก็ตามแคปช่าที่ถูกสร้างขึ้นแต่ผู้ใช้ไม่ได้กดล็อกอินจะสะสมในฐานข้อมูลและหมดอายุไปเอง ควรใช้ปุ่ม "ล้างข้อมูล" เป็นครั้งคราวเพื่อคืนพื้นที่และทำให้ฐานข้อมูลทำงานได้เร็วขึ้น
        </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
