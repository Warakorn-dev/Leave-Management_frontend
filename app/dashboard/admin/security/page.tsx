"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Shield, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api/axios";
import idleState from "@/lib/idleState";
import Swal from "sweetalert2";

interface SettingForm {
  MAX_FAILED_LOGINS: string;
  LOCKOUT_DURATION_MINUTES: string;
  JWT_EXPIRATION: string;
  IDLE_TIMEOUT_MINUTES: string;
}

const DEFAULT_FORM: SettingForm = {
  MAX_FAILED_LOGINS: "5",
  LOCKOUT_DURATION_MINUTES: "15",
  JWT_EXPIRATION: "15m",
  IDLE_TIMEOUT_MINUTES: "60",
};

export default function AdminSecuritySettingsPage() {
  const [form, setForm] = useState<SettingForm>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<SettingForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const mapSettings = (data: { key: string; value: string }[]): SettingForm => {
    const result = { ...DEFAULT_FORM };
    data.forEach((s) => {
      if (s.key in result) {
        (result as any)[s.key] = s.value;
      }
    });
    return result;
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings");
      const data: { key: string; value: string }[] = res.data?.data ?? res.data ?? [];
      const mapped = mapSettings(data);
      setForm(mapped);
      setSavedForm(mapped);

      // Sync idle timeout to the frontend singleton
      const minutes = parseInt(mapped.IDLE_TIMEOUT_MINUTES, 10);
      if (!isNaN(minutes) && minutes > 0) {
        idleState.timeoutMs = minutes * 60 * 1000;
      }
    } catch (err) {
      console.error("Failed to load settings", err);
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
      const payload = {
        settings: (Object.keys(form) as (keyof SettingForm)[]).map((key) => ({
          key,
          value: form[key],
        })),
      };
      const res = await api.patch("/admin/settings", payload);

      // Re-map from the response so UI and singleton stay in sync
      const updatedData: { key: string; value: string }[] =
        res.data?.data ?? [];
      const mapped = updatedData.length > 0 ? mapSettings(updatedData) : form;
      setForm(mapped);
      setSavedForm(mapped);

      // ✅ Update idle timeout singleton so new value takes effect immediately
      const newMinutes = parseInt(mapped.IDLE_TIMEOUT_MINUTES, 10);
      if (!isNaN(newMinutes) && newMinutes > 0) {
        idleState.timeoutMs = newMinutes * 60 * 1000;
        idleState.resetActivity(); // reset the idle clock so nobody gets kicked right after saving
      }

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        html: `
          <p style="color:#555; font-size:14px; margin:0">
            การตั้งค่าความปลอดภัยถูกบันทึกแล้ว<br/>
            <strong>Idle timeout ใหม่: ${newMinutes} นาที</strong>
          </p>
        `,
        confirmButtonColor: "#3b82f6",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: "ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof SettingForm,
    label: string,
    description: string,
    type: "number" | "text" = "number",
    extra?: { min?: number; max?: number }
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white transition-colors"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-4 px-8 py-5 shadow-sm z-10 shrink-0">
          <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              ตั้งค่าความปลอดภัย
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              กำหนดพารามิเตอร์ด้านความปลอดภัยสำหรับทั้งระบบ
            </p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">กำลังโหลดการตั้งค่า...</p>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
              >
                {/* Section: Auth Security */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    ความปลอดภัยในการยืนยันตัวตน
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {field(
                      "MAX_FAILED_LOGINS",
                      "จำนวนครั้งที่ล็อกอินผิดได้สูงสุด",
                      "จำนวนครั้งที่อนุญาตให้ใส่รหัสผิดก่อนบัญชีจะถูกล็อค",
                      "number",
                      { min: 1, max: 10 }
                    )}

                    {field(
                      "LOCKOUT_DURATION_MINUTES",
                      "ระยะเวลาการระงับบัญชี (นาที)",
                      "ระยะเวลาที่บัญชีจะถูกระงับการใช้งานชั่วคราว",
                      "number",
                      { min: 1 }
                    )}

                    {field(
                      "JWT_EXPIRATION",
                      "อายุของ Token (JWT Expiration)",
                      "เช่น '15m', '1h', '7d' (หากเปลี่ยนในระบบฐานข้อมูลนี้จะทับซ้อนการตั้งค่าใน .env)",
                      "text"
                    )}

                    {field(
                      "IDLE_TIMEOUT_MINUTES",
                      "เวลาที่ไม่มีการใช้งานก่อนถูกเตะออก (นาที)",
                      "ระยะเวลา (นาที) ที่ไม่มีการขยับเมาส์หรือพิมพ์ก่อนจะถูกบังคับออกจากระบบ",
                      "number",
                      { min: 1 }
                    )}
                  </div>
                </div>

                {/* Current idle timeout indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-blue-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Idle timeout ที่กำลังใช้งานอยู่:{" "}
                    <strong>{Math.round(idleState.timeoutMs / 60000)} นาที</strong>
                    {isDirty && (
                      <span className="ml-2 text-amber-600 font-medium">
                        (กด &quot;บันทึก&quot; เพื่อใช้ค่าใหม่ {form.IDLE_TIMEOUT_MINUTES} นาที)
                      </span>
                    )}
                  </span>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t flex items-center justify-between">
                  {isDirty && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                    </p>
                  )}
                  <div className="ml-auto">
                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          บันทึกการตั้งค่า
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
