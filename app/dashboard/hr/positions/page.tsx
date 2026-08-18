'use client';

import React, { useState } from 'react';
import { usePosition } from '@/hooks/usePosition';
import { useDepartment } from '@/hooks/useDepartment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Swal from 'sweetalert2';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { Position } from '@/lib/api/types';

const positionSchema = z.object({
  code: z
    .string()
    .min(2, 'รหัสตำแหน่งต้องมีอย่างน้อย 2 ตัวอักษร (Code must be 2+ chars)')
    .toUpperCase(),
  title: z
    .string()
    .min(2, 'ชื่อตำแหน่งต้องมีอย่างน้อย 2 ตัวอักษร (Title must be 2+ chars)'),
  departmentId: z.string().min(1, 'กรุณาเลือกแผนกงาน'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  role: z.enum(['user', 'manager', 'ceo']),
});

type PositionFormValues = z.infer<typeof positionSchema>;

export default function HRPositions() {
  const {
    usePositionsQuery,
    useCreatePositionMutation,
    useUpdatePositionMutation,
    useDeletePositionMutation,
  } = usePosition();
  const { useDepartmentsQuery } = useDepartment();

  const { data: positions = [], isLoading } = usePositionsQuery();
  const { data: departments = [] } = useDepartmentsQuery();

  const createMutation = useCreatePositionMutation();
  const updateMutation = useUpdatePositionMutation();
  const deleteMutation = useDeletePositionMutation();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
  });

  const handleAddOpen = () => {
    setEditingPos(null);
    reset({
      code: '',
      title: '',
      departmentId: '',
      description: '',
      status: 'active',
      role: 'user',
    });
    setDialogOpen(true);
  };

  const handleEditOpen = (pos: Position) => {
    setEditingPos(pos);
    reset({
      code: pos.code || '',
      title: pos.title || pos.name || '',
      departmentId: pos.departmentId || pos.department?.id || '',
      description: pos.description || '',
      status: (pos.status as 'active' | 'inactive') || 'active',
      role: (pos.role as 'user' | 'manager' | 'ceo') || 'user',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: PositionFormValues) => {
    try {
      const selectedDept = departments.find(
        (d) => d.id === values.departmentId,
      );
      const positionData = {
        ...values,
        name: values.title,
        departmentName: selectedDept?.name,
      };

      if (editingPos) {
        await updateMutation.mutateAsync({
          id: editingPos.id,
          data: positionData,
        });
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตตำแหน่งสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createMutation.mutateAsync(positionData);
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มตำแหน่งสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setDialogOpen(false);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    }
  };

  const handleDelete = (pos: Position) => {
    Swal.fire({
      title: 'ยืนยันการลบตำแหน่ง?',
      text: `คุณต้องการลบตำแหน่ง ${pos.title} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      background: document.documentElement.classList.contains('dark')
        ? '#1e293b'
        : '#fff',
      color: document.documentElement.classList.contains('dark')
        ? '#fff'
        : '#000',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteMutation.mutateAsync(pos.id);
          Swal.fire({
            icon: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถลบตำแหน่งได้',
          });
        }
      }
    });
  };

  const filteredPositions = positions.filter(
    (p) =>
      (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.departmentName || p.department?.name || '')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const currentPositions = filteredPositions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ตำแหน่งงาน (Positions)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            บริหารจัดการตำแหน่งหน้าที่และเกรดโครงสร้างองค์กร
            เชื่อมต่อรายชื่อตามฝ่ายแผนกงาน
          </p>
        </div>
        <button
          onClick={handleAddOpen}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>เพิ่มตำแหน่ง (Add Position)</span>
        </button>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-5 h-5 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาตำแหน่งงานด้วย ชื่อตำแหน่ง, รหัสตำแหน่ง หรือ ชื่อแผนก..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable cols={5} rows={3} />
        ) : filteredPositions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
            ไม่พบข้อมูลตำแหน่งงาน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                  <th className="py-4.5 px-5">รหัสย่อ</th>
                  <th className="py-4.5 px-5">ชื่อตำแหน่ง</th>
                  <th className="py-4.5 px-5">แผนกงานที่สังกัด</th>
                  <th className="py-4.5 px-5">สิทธิ์ใช้งาน</th>
                  <th className="py-4.5 px-5">สถานะ</th>
                  <th className="py-4.5 px-5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {currentPositions.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="py-4 px-5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {p.code}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                      {p.title || p.name}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-semibold">
                      {p.departmentName || p.department?.name || 'ไม่ระบุ'}
                    </td>
                    <td className="py-4 px-5">
                      <Badge
                        variant={
                          p.role === 'ceo'
                            ? 'warning'
                            : p.role === 'manager'
                              ? 'default'
                              : 'neutral'
                        }
                      >
                        {p.role === 'ceo'
                          ? 'CEO'
                          : p.role === 'manager'
                            ? 'หัวหน้าแผนก'
                            : 'พนักงานทั่วไป'}
                      </Badge>
                    </td>
                    <td className="py-4 px-5">
                      <Badge
                        variant={p.status === 'active' ? 'success' : 'neutral'}
                      >
                        {p.status === 'active' ? 'ใช้งานปกติ' : 'งดใช้งาน'}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1">
                      <button
                        onClick={() => handleEditOpen(p)}
                        className="inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-650 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPositions.length)}{' '}
              of {filteredPositions.length} positions
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {editingPos ? 'แก้ไขตำแหน่งงาน' : 'เพิ่มตำแหน่งงานใหม่'}
              </DialogTitle>
              <DialogDescription>
                กรุณาระบุรหัสย่อ ชื่อตำแหน่ง และฝ่ายแผนกงานที่ตำแหน่งสังกัดอยู่
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  รหัสตำแหน่ง (Code) *
                </label>
                <input
                  {...register('code')}
                  type="text"
                  placeholder="SWE"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  ชื่อตำแหน่ง (Title) *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Software Engineer"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  สังกัดแผนกงาน (Department) *
                </label>
                <select
                  {...register('departmentId')}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- เลือกแผนก (Select Department) --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {errors.departmentId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  ระดับสิทธิ์ (Role) *
                </label>
                <select
                  {...register('role')}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">พนักงานทั่วไป (User)</option>
                  <option value="manager">หัวหน้าแผนก (Manager)</option>
                  <option value="ceo">ผู้บริหารระดับสูง (CEO)</option>
                </select>
                {errors.role && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  สถานะ (Status) *
                </label>
                <select
                  {...register('status')}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">ใช้งานปกติ (Active)</option>
                  <option value="inactive">งดใช้งาน (Inactive)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-350 cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
              >
                บันทึกข้อมูล (Save)
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
