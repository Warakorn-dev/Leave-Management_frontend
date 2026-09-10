"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Users, Lock, Unlock, Key, Shield, Power } from "lucide-react";
import api from "@/lib/api/axios";
import Swal from 'sweetalert2';

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

  const handleToggleStatus = (user: any) => {
    const newStatus = !user.isActive;
    const actionText = newStatus ? 'เปิด' : 'ระงับ';

    Swal.fire({
      title: `ยืนยันการ${actionText}การใช้งาน`,
      text: `คุณต้องการ${actionText}การใช้งานของผู้ใช้ ${user.email || user.username} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#22c55e' : '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `ยืนยันการ${actionText}`,
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.patch(`/admin/users/${user.id}/toggle-status`, { isActive: newStatus });
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: `บันทึกสถานะเรียบร้อยแล้ว`,
            timer: 1500,
            showConfirmButton: false,
          });
          fetchUsers();
        } catch (err) {
          Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
        }
      }
    });
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-4 px-8 py-5 shadow-sm z-10 shrink-0">
          <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              จัดการข้อมูลและสิทธิ์ของผู้ใช้งานทั้งหมดในระบบ
            </p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <input
                type="text"
                placeholder="ค้นหาด้วยอีเมล หรือชื่อผู้ใช้..."
                className="px-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 bg-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
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
                            <div className="flex flex-col gap-2 items-start">
                              {user.isActive ? (
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full whitespace-nowrap">
                                  ปกติ
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-500 text-xs font-bold rounded-full whitespace-nowrap">
                                  ถูกระงับ
                                </span>
                              )}
                            </div>
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
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => handleToggleStatus(user)}
                                title={user.isActive ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  user.isActive
                                    ? 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'
                                    : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600'
                                }`}
                              >
                                <Power className="w-4 h-4" strokeWidth={2} />
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
        </div>
      </div>
    </RoleGuard>
  );
}
