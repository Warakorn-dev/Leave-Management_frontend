"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DatePicker } from '@/components/DateAndTime';
import { holidayApi } from '@/api';

interface Holiday {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function HolidayManagementPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    date: new Date()
  });

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const res = await holidayApi.getAll();
      const data = res.data;
      if ((data as any).success || Array.isArray((data as any).data) || Array.isArray(data)) {
        setHolidays((data as any).data || data);
      }
    } catch (error) {
      console.error("Failed to fetch holidays", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const filteredHolidays = holidays.filter((h) => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleOpenCreateModal = () => {
    setFormData({ id: '', name: '', date: new Date() });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (h: Holiday) => {
    setFormData({ 
      id: h.id, 
      name: h.name, 
      date: new Date(h.date)
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create offset date to avoid timezone issues
      const dateToSave = new Date(formData.date.getTime() - (formData.date.getTimezoneOffset() * 60000));
      const res = await holidayApi.create({
        name: formData.name,
        date: dateToSave.toISOString().split('T')[0]
      });
      const data = res.data;
      if ((data as any).success || data) {
        setIsCreateModalOpen(false);
        fetchHolidays();
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มวันหยุดสำเร็จ',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเพิ่มวันหยุดได้', 'error');
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateToSave = new Date(formData.date.getTime() - (formData.date.getTimezoneOffset() * 60000));
      const res = await holidayApi.update(formData.id, {
        name: formData.name,
        date: dateToSave.toISOString().split('T')[0]
      });
      const data = res.data;
      if ((data as any).success || data) {
        setIsEditModalOpen(false);
        fetchHolidays();
        Swal.fire({
          icon: 'success',
          title: 'แก้ไขวันหยุดสำเร็จ',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถแก้ไขวันหยุดได้', 'error');
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบวันหยุด "${name}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await holidayApi.delete(id);
          const data = res.data;
          if ((data as any).success || data) {
            Swal.fire('ลบสำเร็จ!', 'ลบวันหยุดเรียบร้อยแล้ว', 'success');
            fetchHolidays();
          } else {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบวันหยุดได้', 'error');
          }
        } catch (error) {
          Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">จัดการวันหยุดบริษัท</h1>
                <p className="text-sm text-slate-500 mt-1">
                  เพิ่ม แก้ไข หรือลบวันหยุดประจำปีของบริษัท
                </p>
              </div>
            </div>
            
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มวันหยุดใหม่</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาวันหยุด (ชื่อวันหยุด)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">ชื่อวันหยุด</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">วันที่</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-[20%]">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CalendarIcon className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">ไม่พบข้อมูลวันหยุด</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800 line-clamp-1">{h.name}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-blue-600">
                          {new Date(h.date).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(h)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id, h.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">เพิ่มวันหยุดใหม่</h2>
          </div>
          
          <form onSubmit={handleCreate} className="px-8 py-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อวันหยุด <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น วันขึ้นปีใหม่"
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DatePicker 
                    selected={formData.date}
                    onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
                    placeholderText="วว/ดด/ปปปป"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                บันทึก
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">แก้ไขวันหยุด</h2>
          </div>
          
          <form onSubmit={handleUpdate} className="px-8 py-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อวันหยุด <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DatePicker 
                    selected={formData.date}
                    onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
                    placeholderText="วว/ดด/ปปปป"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
