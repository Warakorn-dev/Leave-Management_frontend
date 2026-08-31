"use client";

import { useEffect, useMemo, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Users } from "lucide-react";
import api from "@/lib/api/axios";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { name: string } | null;
  employee: {
    firstName: string;
    lastName: string;
    department: { name: string } | null;
    position: { name: string } | null;
  } | null;
}

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/users/all");
        setUsers(res.data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const fullName = (u: UserRow) =>
    u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.email, fullName(u)]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6" /> รายชื่อผู้ใช้งานทั้งหมด
            </h1>
            <p className="text-slate-500">
              ดูรายชื่อผู้ใช้งานทุกบัญชีในระบบ (แสดงเฉพาะข้อมูล ไม่สามารถแก้ไข)
            </p>
          </div>
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อผู้ใช้ อีเมล หรือชื่อ-สกุล..."
            className="px-4 py-2 border border-slate-300 rounded-lg w-full sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-3 border-b font-medium">ชื่อผู้ใช้ (Username)</th>
                  <th className="p-3 border-b font-medium">ชื่อ-สกุล</th>
                  <th className="p-3 border-b font-medium">อีเมล</th>
                  <th className="p-3 border-b font-medium">สิทธิ์ (Role)</th>
                  <th className="p-3 border-b font-medium">แผนก</th>
                  <th className="p-3 border-b font-medium">ตำแหน่ง</th>
                  <th className="p-3 border-b font-medium">สถานะ</th>
                  <th className="p-3 border-b font-medium">เข้าสู่ระบบล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      ไม่พบผู้ใช้งาน
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 border-b last:border-0 text-sm"
                    >
                      <td className="p-3 font-medium text-slate-800">
                        {u.username || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        {u.employee ? fullName(u) : "ไม่มีข้อมูลพนักงาน"}
                      </td>
                      <td className="p-3 text-slate-600">{u.email || "-"}</td>
                      <td className="p-3 text-slate-600">{u.role?.name || "-"}</td>
                      <td className="p-3 text-slate-600">
                        {u.employee?.department?.name || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        {u.employee?.position?.name || "-"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            u.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.isActive ? "ปกติ" : "ถูกระงับ"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("th-TH")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t text-sm text-slate-500">
            ทั้งหมด {loading ? "-" : filtered.length} รายชื่อ
            {!loading && search && ` (จากทั้งหมด ${users.length})`}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
