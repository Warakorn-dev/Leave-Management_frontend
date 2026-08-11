'use client';

import React, { useState } from 'react';
import { useLeaveType } from '@/hooks/useLeaveType';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Swal from 'sweetalert2';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { LeaveType } from '@/lib/types';

const leaveTypeSchema = z.object({
  name: z.string().min(2, 'ชื่อประเภทการลาต้องมีอย่างน้อย 2 ตัวอักษร (Name must be 2+ chars)'),
  defaultDays: z.number().min(1, 'โควตาต้องมีอย่างน้อย 1 วัน (Max days must be at least 1)'),
  requiresCertificate: z.boolean(),
  isSpecial: z.boolean(),
  advanceNoticeDays: z.number().min(0, 'จำนวนวันแจ้งล่วงหน้าต้องไม่ติดลบ'),
  minTenureDays: z.number().min(0, 'อายุงานขั้นต่ำต้องไม่ติดลบ'),
});

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

export default function HRLeaveTypes() {
  const { useLeaveTypesQuery, useCreateLeaveTypeMutation, useUpdateLeaveTypeMutation, useDeleteLeaveTypeMutation } = useLeaveType();
  const { data: leaveTypes = [], isLoading } = useLeaveTypesQuery();

  const createMutation = useCreateLeaveTypeMutation();
  const updateMutation = useUpdateLeaveTypeMutation();
  const deleteMutation = useDeleteLeaveTypeMutation();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLt, setEditingLt] = useState<LeaveType | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
  });

  const handleAddOpen = () => {
    setEditingLt(null);
    reset({
      name: '',
      defaultDays: 10,
      requiresCertificate: false,
      isSpecial: false,
      advanceNoticeDays: 0,
      minTenureDays: 0,
    });
    setDialogOpen(true);
  };

  const handleEditOpen = (lt: LeaveType) => {
    setEditingLt(lt);
    reset({
      name: lt.name,
      defaultDays: lt.defaultDays,
      requiresCertificate: lt.requiresCertificate,
      isSpecial: lt.isSpecial,
      advanceNoticeDays: lt.advanceNoticeDays,
      minTenureDays: lt.minTenureDays,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: LeaveTypeFormValues) => {
    try {
      if (editingLt) {
        await updateMutation.mutateAsync({ id: editingLt.id, data: values });
        Swal.fire({ icon: 'success', title: 'อัปเดตประเภทการลาสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        await createMutation.mutateAsync(values);
        Swal.fire({ icon: 'success', title: 'เพิ่มประเภทการลาสำเร็จ', timer: 1500, showConfirmButton: false });
      }
      setDialogOpen(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  };

  const handleDelete = (lt: LeaveType) => {
    Swal.fire({
      title: 'ยืนยันการลบประเภทการลา?',
      text: `คุณต้องการลบประเภทการลา ${lt.name} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
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
          await deleteMutation.mutateAsync(lt.id);
          Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบประเภทการลาได้' });
        }
      }
    });
  };

  const filteredLts = leaveTypes.filter(lt => {
    const query = search.toLowerCase();
    return lt.name.toLowerCase().includes(query) || lt.code.includes(query);
  });

  const totalPages = Math.ceil(filteredLts.length / itemsPerPage);
  const currentLts = filteredLts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-1 sm:mt-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ประเภทการลา (Leave Policies)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              ตั้งเกณฑ์โควตาการลาประจำปีของพนักงาน กำหนดการบังคับแนบหลักฐานสำหรับแต่ละประเภท
            </p>
          </div>
        </div>
        <button
          onClick={handleAddOpen}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-500/20 transition-all shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มประเภทการลา</span>
        </button>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-5 h-5 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="ค้นหาประเภทการลาด้วยชื่อ หรือ รหัสย่อการลา..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
        {isLoading ? (
          <SkeletonTable cols={5} rows={3} />
        ) : filteredLts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-slate-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยังไม่มีข้อมูลประเภทการลา</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">คุณยังไม่ได้เพิ่มประเภทการลาใดๆ ในระบบ กรุณาคลิกที่ปุ่ม "เพิ่มประเภทการลา" ด้านบนเพื่อเริ่มต้น</p>
            <button
              onClick={handleAddOpen}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างประเภทการลาแรกเลย</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider bg-slate-50">
                  <th className="py-4 px-6 rounded-tl-xl hidden md:table-cell">รหัส</th>
                  <th className="py-4 px-6 hidden md:table-cell">ประเภทการลา</th>
                  <th className="py-4 px-6 md:hidden rounded-tl-xl">ข้อมูลประเภทการลา</th>
                  <th className="py-4 px-6 hidden sm:table-cell">โควตาสูงสุด / ปี</th>
                  <th className="py-4 px-6 hidden md:table-cell">แจ้งล่วงหน้า (วัน)</th>
                  <th className="py-4 px-6 hidden lg:table-cell">อายุงานขั้นต่ำ (วัน)</th>
                  <th className="py-4 px-6 hidden sm:table-cell">เงื่อนไขพิเศษ</th>
                  <th className="py-4 px-6 text-right rounded-tr-xl">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {currentLts.map((lt) => (
                  <tr key={lt.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    {/* Desktop View Column */}
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 hidden md:table-cell">
                      {lt.code}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800 hidden md:table-cell">
                      {lt.name}
                    </td>

                    {/* Mobile View Column */}
                    <td className="py-4 px-6 md:hidden">
                      <div className="font-bold text-slate-800">{lt.code} - {lt.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                        <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{lt.defaultDays} วัน</span>
                        {lt.requiresCertificate && <span className="inline-block bg-amber-50 text-amber-600 px-2 py-0.5 rounded">แนบใบรับรอง</span>}
                        {lt.isSpecial && <span className="inline-block bg-rose-50 text-rose-600 px-2 py-0.5 rounded">อนุมัติพิเศษ</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-semibold hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                          {lt.defaultDays}
                        </div>
                        <span className="text-xs text-slate-500">วัน</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="text-sm text-slate-600 font-medium">
                        {lt.advanceNoticeDays > 0 ? `${lt.advanceNoticeDays} วัน` : '-'}
                      </div>
                    </td>

                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="text-sm text-slate-600 font-medium">
                        {lt.minTenureDays > 0 ? `${lt.minTenureDays} วัน` : '-'}
                      </div>
                    </td>

                    <td className="py-4 px-6 hidden sm:table-cell">
                      <div className="flex flex-col gap-1.5">
                        {lt.requiresCertificate && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 w-max text-[10px]">
                            บังคับแนบใบรับรองแพทย์
                          </Badge>
                        )}
                        {lt.isSpecial && (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 w-max text-[10px]">
                            ส่งตรงให้ CEO อนุมัติ
                          </Badge>
                        )}
                        {!lt.requiresCertificate && !lt.isSpecial && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEditOpen(lt)}
                        className="inline-flex p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 cursor-pointer transition-all shadow-sm"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lt)}
                        className="inline-flex p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 cursor-pointer transition-all shadow-sm"
                        title="ลบ"
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLts.length)} of {filteredLts.length} types
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
              <DialogTitle>{editingLt ? 'แก้ไขประเภทการลา' : 'เพิ่มประเภทการลาใหม่'}</DialogTitle>
              <DialogDescription>ตั้งเกณฑ์การลา ข้อกำหนดในการยื่นแนบไฟล์ใบรับรองแพทย์หรือหลักฐานการลา</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ชื่อประเภทการลา *</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Annual Leave (ลาพักร้อน)"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">จำนวนวันลาสะสมสูงสุด / ปี *</label>
                <input
                  {...register('defaultDays', { valueAsNumber: true })}
                  type="number"
                  placeholder="12"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {errors.defaultDays && <p className="text-xs text-red-500 mt-1 font-medium">{errors.defaultDays.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">แจ้งล่วงหน้า (วัน)</label>
                  <input
                    {...register('advanceNoticeDays', { valueAsNumber: true })}
                    type="number"
                    placeholder="0"
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.advanceNoticeDays && <p className="text-xs text-red-500 mt-1 font-medium">{errors.advanceNoticeDays.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">อายุงานขั้นต่ำ (วัน)</label>
                  <input
                    {...register('minTenureDays', { valueAsNumber: true })}
                    type="number"
                    placeholder="0"
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.minTenureDays && <p className="text-xs text-red-500 mt-1 font-medium">{errors.minTenureDays.message}</p>}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2.5">
                  <input
                    {...register('requiresCertificate')}
                    type="checkbox"
                    id="requiresCertificate"
                    className="w-4.5 h-4.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="requiresCertificate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    บังคับแนบเอกสารหลักฐาน (Requires Certificate)
                  </label>
                </div>

                <div className="flex items-center space-x-2.5">
                  <input
                    {...register('isSpecial')}
                    type="checkbox"
                    id="isSpecial"
                    className="w-4.5 h-4.5 rounded border-slate-350 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="isSpecial" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2">
                    ต้องให้ผู้บริหารสูงสุดอนุมัติ (Special Leave)
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px] py-0">CEO</Badge>
                  </label>
                </div>
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
