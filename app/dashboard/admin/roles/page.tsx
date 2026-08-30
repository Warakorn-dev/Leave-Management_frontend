"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Key, Users } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/admin/roles');
        setRoles(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-600" /> จัดการสิทธิ์ผู้ใช้งาน
          </h1>
          <p className="text-slate-500">รายการสิทธิ์ทั้งหมดและจำนวนสมาชิกในระบบ</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-3 border-b font-medium">ชื่อสิทธิ์ (Role)</th>
                  <th className="p-3 border-b font-medium">คำอธิบาย</th>
                  <th className="p-3 border-b font-medium">จำนวนผู้ใช้</th>
                  <th className="p-3 border-b font-medium">สร้างเมื่อ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">กำลังโหลดข้อมูลสิทธิ์...</td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">ไม่พบสิทธิ์ในระบบ</td>
                  </tr>
                ) : (
                  roles.map(role => (
                    <tr key={role.id} className="hover:bg-slate-50 border-b last:border-0 text-sm">
                      <td className="p-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          {role.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {role.name === 'Admin' ? 'ผู้ดูแลระบบ (เข้าถึงสิทธิ์สูงสุด)' : 
                         role.name === 'CEO' ? 'ผู้บริหาร (ดูรายงานภาพรวมได้ทั้งหมด)' : 
                         role.name === 'HR' ? 'ฝ่ายบุคคล (จัดการพนักงานและวันลา)' :
                         role.name === 'Manager' ? 'ผู้จัดการแผนก (อนุมัติวันลาระดับ 1)' :
                         'พนักงานทั่วไป'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Users className="w-4 h-4 text-slate-400" /> {role.userCount}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(role.createdAt).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
