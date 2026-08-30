"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Shield, Save } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminSecuritySettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default security settings we expect
  const [form, setForm] = useState({
    MAX_FAILED_LOGINS: "5",
    LOCKOUT_DURATION_MINUTES: "15",
    JWT_EXPIRATION: "7d"
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data);
      
      // Map DB settings to form state
      const newForm = { ...form };
      res.data.data.forEach((s: any) => {
        if (s.key in newForm) {
          (newForm as any)[s.key] = s.value;
        }
      });
      setForm(newForm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        settings: Object.keys(form).map(key => ({
          key,
          value: (form as any)[key]
        }))
      };
      await api.patch('/admin/settings', updateData);
      alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      fetchSettings();
    } catch (err) {
      alert("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> ตั้งค่าความปลอดภัย
          </h1>
          <p className="text-slate-500">กำหนดพารามิเตอร์ด้านความปลอดภัยสำหรับทั้งระบบ</p>
        </div>

        {loading ? (
          <div className="animate-pulse h-64 bg-slate-200 rounded-xl"></div>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">ความปลอดภัยในการยืนยันตัวตน</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">จำนวนครั้งที่ล็อกอินผิดได้สูงสุด</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={form.MAX_FAILED_LOGINS}
                    onChange={(e) => setForm({...form, MAX_FAILED_LOGINS: e.target.value})}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-slate-500">จำนวนครั้งที่อนุญาตให้ใส่รหัสผิดก่อนบัญชีจะถูกล็อค</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">ระยะเวลาการระงับบัญชี (นาที)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={form.LOCKOUT_DURATION_MINUTES}
                    onChange={(e) => setForm({...form, LOCKOUT_DURATION_MINUTES: e.target.value})}
                    min="1"
                  />
                  <p className="text-xs text-slate-500">ระยะเวลาที่บัญชีจะถูกระงับการใช้งานชั่วคราว</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">อายุของ Token (JWT Expiration)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={form.JWT_EXPIRATION}
                    onChange={(e) => setForm({...form, JWT_EXPIRATION: e.target.value})}
                  />
                  <p className="text-xs text-slate-500">เช่น '15m', '1h', '7d' (หากเปลี่ยนในระบบฐานข้อมูลนี้จะทับซ้อนการตั้งค่าใน .env)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>

          </form>
        )}
      </div>
    </RoleGuard>
  );
}
