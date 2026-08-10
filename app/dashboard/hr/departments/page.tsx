'use client';

import React, { useState } from 'react';
import { useDepartment } from '@/hooks/useDepartment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Swal from 'sweetalert2';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import { Department } from '@/lib/types';

const departmentSchema = z.object({
  code: z.string().min(2, 'รหัสแผนกต้องมีอย่างน้อย 2 ตัวอักษร (Code must be 2+ chars)').toUpperCase(),
  name: z.string().min(2, 'ชื่อแผนกต้องมีอย่างน้อย 2 ตัวอักษร (Name must be 2+ chars)'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function HRDepartments() {
  const { useDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation } = useDepartment();
  const { data: departments = [], isLoading } = useDepartmentsQuery();

  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const deleteMutation = useDeleteDepartmentMutation();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
  });

  const handleAddOpen = () => {
    setEditingDept(null);
    reset({
      code: '',
      name: '',
      description: '',
      status: 'active',
    });
    setDialogOpen(true);
  };

  const handleEditOpen = (dept: Department) => {
    setEditingDept(dept);
    reset({
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      status: dept.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      if (editingDept) {
        await updateMutation.mutateAsync({ id: editingDept.id, data: values });
        Swal.fire({ icon: 'success', title: 'อัปเดตแผนกสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        await createMutation.mutateAsync(values);
        Swal.fire({ icon: 'success', title: 'เพิ่มแผนกสำเร็จ', timer: 1500, showConfirmButton: false });
      }
      setDialogOpen(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  };

  const handleDelete = (dept: Department) => {
    Swal.fire({
      title: 'ยืนยันการลบแผนก?',
      text: `คุณต้องการลบแผนก ${dept.name} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteMutation.mutateAsync(dept.id);
          Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบแผนกได้' });
        }
      }
    });
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepts.length / itemsPerPage);
  const currentDepts = filteredDepts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            แผนกงาน (Departments)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            บริหารจัดการแผนกโครงสร้างองค์กร และตรวจสอบยอดจำนวนบุคลากรประจำแต่ละแผนก
          </p>
        </div>
        <button
          onClick={handleAddOpen}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>เพิ่มแผนก (Add Department)</span>
        </button>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-5 h-5 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="ค้นหาแผนกงานด้วยชื่อ หรือ รหัสย่อแผนก..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable cols={5} rows={3} />
        ) : filteredDepts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">ไม่พบข้อมูลแผนกงาน</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                  <th className="py-4.5 px-5">รหัสย่อ</th>
                  <th className="py-4.5 px-5">ชื่อแผนก</th>
                  <th className="py-4.5 px-5">รายละเอียด</th>
                  <th className="py-4.5 px-5">หัวหน้าแผนก</th>
                  <th className="py-4.5 px-5">สถานะ</th>
                  <th className="py-4.5 px-5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {currentDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-bold text-indigo-650 dark:text-indigo-400">
                      {d.code}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                      {d.name}
                    </td>
                    <td className="py-4 px-5 text-slate-500 max-w-[200px] truncate">
                      {d.description || '-'}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-semibold">
                      {d.managerName || 'ยังไม่ได้กำหนด'}
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={d.status === 'active' ? 'success' : 'neutral'}>
                        {d.status === 'active' ? 'ใช้งานปกติ' : 'งดใช้งาน'}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1">
                      <button
                        onClick={() => handleEditOpen(d)}
                        className="inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-650 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-all"
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDepts.length)} of {filteredDepts.length} departments
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-205 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-205 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              <DialogTitle>{editingDept ? 'แก้ไขแผนกงาน' : 'เพิ่มแผนกใหม่'}</DialogTitle>
              <DialogDescription>กรุณาระบุรหัสย่อ ชื่อแผนก และคำอธิบายลักษณะแผนกเพื่อบันทึกข้อมูลโครงสร้างองค์กร</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">รหัสย่อแผนก (Code) *</label>
                <input
                  {...register('code')}
                  type="text"
                  placeholder="ENG"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.code && <p className="text-xs text-red-500 mt-1 font-medium">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ชื่อแผนก (Name) *</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="เช่น Software Development"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">คำอธิบายแผนก (Description)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="รายละเอียดความรับผิดชอบของแผนกนี้..."
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">สถานะ (Status) *</label>
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
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer">
                บันทึกข้อมูล (Save)
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
