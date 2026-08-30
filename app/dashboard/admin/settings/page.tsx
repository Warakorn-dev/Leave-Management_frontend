"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Settings, Save, Lock } from "lucide-react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    // Read from sessionStorage directly to avoid 403 on /leave/me which is restricted to Employees
    setProfile({
      username: sessionStorage.getItem("username") || "Super Admin",
      email: sessionStorage.getItem("email") || "admin@admin.com"
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน!");
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-600" /> โปรไฟล์ผู้ดูแลระบบ
          </h1>
          <p className="text-slate-500">จัดการข้อมูลบัญชีผู้ดูแลระบบของคุณ</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{profile?.username || 'Super Admin'}</h2>
              <p className="text-slate-500">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                ผู้ดูแลระบบสูงสุด (SYSTEM ADMINISTRATOR)
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" /> เปลี่ยนรหัสผ่าน
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านปัจจุบัน</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  
                />

                
              </div>

            
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านใหม่</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {loading ? "กำลังอัปเดต..." : "อัปเดตรหัสผ่าน"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </RoleGuard>
  );
}
