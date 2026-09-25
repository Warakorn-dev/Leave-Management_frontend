"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Users, Lock, Power } from "lucide-react";
import api from "@/lib/api/axios";
import Swal from 'sweetalert2';
import { getErrorMessage } from "@/lib/api/utils";

interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  isActive?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  role: { id: string; name?: string };
  employee?: { firstName?: string; lastName?: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roles, setRoles] = useState<{ id: string; name?: string }[]>([]);
  // The signed-in admin's own row cannot be demoted or suspended (server rule).
  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    setMyUserId(sessionStorage.getItem('userId'));
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUsers is redefined each render; only page/search should retrigger the fetch
  }, [page, search]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggleStatus = (user: AdminUser) => {
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
          // e.g. "cannot suspend yourself" / "last active Admin" from the server
          Swal.fire('ไม่สามารถเปลี่ยนสถานะได้', getErrorMessage(err, 'เกิดข้อผิดพลาด'), 'error');
        }
      }
    });
  };

  const handleChangeRole = async (user: AdminUser, roleId: string) => {
    const roleName = roles.find((r) => r.id === roleId)?.name || '';
    // A role change signs the user out everywhere (server rule), so confirm first.
    const { isConfirmed } = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสิทธิ์',
      text: `เปลี่ยนสิทธิ์ของ ${user.email || user.username} เป็น ${roleName} ใช่หรือไม่? ผู้ใช้จะถูกออกจากระบบ และต้องเข้าสู่ระบบใหม่เพื่อใช้งานด้วยสิทธิ์ใหม่`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { roleId });
      Swal.fire({ icon: 'success', title: 'อัปเดตสิทธิ์สำเร็จ', timer: 1500, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      // e.g. "cannot change your own role" / "last active Admin" from the server
      Swal.fire('ไม่สามารถเปลี่ยนสิทธิ์ได้', getErrorMessage(err, 'เกิดข้อผิดพลาด'), 'error');
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#E2E4E9] font-sans text-slate-800 flex flex-col">
        {/* Top Banner */}
        <div className="bg-white flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 shadow-sm z-10 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-black tracking-tight">
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              จัดการข้อมูลและสิทธิ์ของผู้ใช้งานทั้งหมดในระบบ
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6">
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
                      <th className="p-3 border-b font-medium">สิทธิ์การใช้งาน</th>
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
                              className="bg-slate-100 border-none text-xs rounded px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              value={user.role.id}
                              disabled={user.id === myUserId}
                              title={user.id === myUserId ? 'ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้' : undefined}
                              onChange={(e) => handleChangeRole(user, e.target.value)}
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
                                  ระงับการใช้งาน
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-xs">
                            {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                              <span className="text-red-500 font-medium flex items-center gap-1">
                                <Lock className="w-3 h-3" /> บัญชีถูกล็อก
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
                                disabled={user.id === myUserId}
                                title={
                                  user.id === myUserId
                                    ? 'ไม่สามารถระงับบัญชีของตัวเองได้'
                                    : user.isActive ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'
                                }
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
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
