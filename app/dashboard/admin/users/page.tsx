"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Users, Lock, Unlock, Key, Shield } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roles, setRoles] = useState<any[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=10${search ? `&search=${search}` : ''}`);
      setUsers(res.data.data.items);
      setTotalPages(res.data.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${currentStatus ? 'ระงับการใช้งาน (Deactivate)' : 'เปิดใช้งาน (Activate)'} ผู้ใช้รายนี้?`)) return;
    try {
      await api.patch(`/admin/users/${id}/toggle-status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert("ไม่สามารถเปลี่ยนสถานะผู้ใช้งานได้");
    }
  };

  const handleForceLogout = async (id: string) => {
    if (!confirm('ต้องการบังคับผู้ใช้รายนี้ออกจากระบบทันทีหรือไม่?')) return;
    try {
      await api.patch(`/admin/users/${id}/force-logout`);
      alert("ผู้ใช้ถูกบังคับออกจากระบบเรียบร้อยแล้ว");
    } catch (err) {
      alert("ไม่สามารถบังคับออกจากระบบได้");
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('ต้องการรีเซ็ตรหัสผ่านของผู้ใช้รายนี้หรือไม่? ระบบจะสร้างรหัสผ่านใหม่แบบสุ่มให้')) return;
    try {
      const res = await api.post(`/admin/users/${id}/reset-password`);
      alert(`รีเซ็ตรหัสผ่านสำเร็จ รหัสผ่านชั่วคราวคือ: ${res.data.tempPassword}`);
      fetchUsers(); // Refresh to clear lockouts
    } catch (err) {
      alert("ไม่สามารถรีเซ็ตรหัสผ่านได้");
    }
  };

  const handleChangeRole = async (id: string, roleId: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { roleId });
      alert("อัปเดตสิทธิ์สำเร็จ");
      fetchUsers();
    } catch (err) {
      alert("ไม่สามารถเปลี่ยนสิทธิ์ได้");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6" /> จัดการผู้ใช้งาน
            </h1>
            <p className="text-slate-500">จัดการข้อมูลและสิทธิ์ของผู้ใช้งานทั้งหมดในระบบ</p>
          </div>
          <div>
            <input 
              type="text" 
              placeholder="ค้นหาด้วยอีเมล หรือชื่อผู้ใช้..." 
              className="px-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-3 border-b font-medium">ผู้ใช้งาน</th>
                  <th className="p-3 border-b font-medium">สิทธิ์ (Role)</th>
                  <th className="p-3 border-b font-medium">สถานะ</th>
                  <th className="p-3 border-b font-medium">ความปลอดภัย</th>
                  <th className="p-3 border-b font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">ไม่พบผู้ใช้งาน</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 border-b last:border-0 text-sm">
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{user.email || user.username}</div>
                        <div className="text-xs text-slate-500">
                          {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'ไม่มีข้อมูลพนักงาน'}
                        </div>
                      </td>
                      <td className="p-3">
                        <select 
                          className="bg-slate-100 border-none text-xs rounded px-2 py-1"
                          value={user.role.id}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {user.isActive ? 'ปกติ' : 'ถูกระงับ'}
                        </button>
                      </td>
                      <td className="p-3 text-xs">
                        {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                          <span className="text-red-500 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> บัญชีถูกล็อค
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            ล็อกอินผิด: {user.failedLoginAttempts || 0} ครั้ง
                          </span>
                        )}
                        {user.lastLoginAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            เข้าสู่ระบบล่าสุด: {new Date(user.lastLoginAt).toLocaleString('th-TH')}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleForceLogout(user.id)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded" 
                            title="บังคับออกจากระบบ (Force Logout)"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded" 
                            title="รีเซ็ตรหัสผ่าน (Reset Password)"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
    </RoleGuard>
  );
}
