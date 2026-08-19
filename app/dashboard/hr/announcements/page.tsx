'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { previewAttachment } from '@/lib/api/attachmentPreview';
import { hrApi } from '@/lib/api';
import { ActionButton, IconButton } from '@/components/ui/action-button';

interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
  attachmentData?: string;
  attachmentName?: string;
}

export default function AnnouncementManagementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    isImportant: false,
    attachmentData: '',
    attachmentName: '',
  });

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await hrApi.getAnnouncements(100); // Fetch up to 100 for HR
      const data = res.data;
      if (
        (data as any).success ||
        Array.isArray((data as any).data) ||
        Array.isArray(data)
      ) {
        setAnnouncements((data as any).data || data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements
    .filter(
      (ann) =>
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.subtitle.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.isImportant === b.isImportant) return 0;
      return a.isImportant ? -1 : 1;
    });

  const handleOpenCreateModal = () => {
    setFormData({
      id: '',
      title: '',
      subtitle: '',
      isImportant: false,
      attachmentData: '',
      attachmentName: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (ann: Announcement) => {
    setFormData({
      id: ann.id,
      title: ann.title,
      subtitle: ann.subtitle,
      isImportant: ann.isImportant,
      attachmentData: ann.attachmentData || '',
      attachmentName: ann.attachmentName || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hrApi.createAnnouncement({
        title: formData.title,
        subtitle: formData.subtitle,
        isImportant: formData.isImportant,
        attachmentData: formData.attachmentData,
        attachmentName: formData.attachmentName,
      });
      const data = res.data;
      if ((data as any).success || data) {
        setIsCreateModalOpen(false);
        fetchAnnouncements();
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มประกาศสำเร็จ',
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเพิ่มประกาศได้', 'error');
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hrApi.updateAnnouncement(formData.id, {
        title: formData.title,
        subtitle: formData.subtitle,
        isImportant: formData.isImportant,
        attachmentData: formData.attachmentData,
        attachmentName: formData.attachmentName,
      });
      const data = res.data;
      if ((data as any).success || data) {
        setIsEditModalOpen(false);
        fetchAnnouncements();
        Swal.fire({
          icon: 'success',
          title: 'แก้ไขประกาศสำเร็จ',
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถแก้ไขประกาศได้', 'error');
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          attachmentData: reader.result as string,
          attachmentName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Swal.fire({
      html: `
        <div class="flex flex-col items-center pt-2 pb-2">
          <div class="w-[84px] h-[84px] bg-[#fff1f2] rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
          <h2 class="text-[24px] font-bold text-[#1e293b] mb-6">ยืนยันการลบข้อมูล</h2>
          <p class="text-[#64748b] text-[17px] mb-5">คุณต้องการลบประกาศ</p>
          <p class="text-[22px] font-bold text-[#1e293b] mb-5">"${title}"</p>
          <p class="text-[#64748b] text-[17px]">ออกจากระบบใช่หรือไม่?</p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-[24px] p-6 pb-8 w-full max-w-[480px]',
        confirmButton:
          'bg-[#ff3b30] hover:bg-[#ff2d20] text-white px-10 py-3.5 rounded-[12px] font-medium text-[17px] transition-colors',
        cancelButton:
          'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] px-10 py-3.5 rounded-[12px] font-medium text-[17px] transition-colors mr-3',
        actions: 'w-full flex justify-center mt-8',
      },
      buttonsStyling: false,
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await hrApi.deleteAnnouncement(id);
          const data = res.data;
          if ((data as any).success || data) {
            Swal.fire({
              title: 'ลบสำเร็จ!',
              text: 'ข้อมูลประกาศถูกลบเรียบร้อยแล้ว',
              icon: 'success',
              confirmButtonText: 'ตกลง',
              customClass: {
                confirmButton:
                  'bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-[12px] font-medium',
              },
            });
            fetchAnnouncements();
          } else {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบประกาศได้', 'error');
          }
        } catch (error) {
          Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  จัดการประกาศบริษัท
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  เพิ่ม, แก้ไข, และลบประกาศสำหรับพนักงานทุกคน
                </p>
              </div>
            </div>

            <ActionButton action="add" icon={Plus} onClick={handleOpenCreateModal}>สร้างประกาศใหม่</ActionButton>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาประกาศ (หัวข้อ, คำอธิบาย)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[40%]">
                    ประกาศ
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">
                    ความสำคัญ
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">
                    วันที่อัปเดต
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-[20%]">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          ไม่พบข้อมูลประกาศ
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAnnouncements.map((ann) => (
                    <tr
                      key={ann.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {ann.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {ann.subtitle}
                          </p>
                          {ann.attachmentName && (
                            <a
                              href="#"
                              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 rounded-md transition-all border border-slate-200 dark:border-slate-700"
                              onClick={(e) =>
                                previewAttachment(
                                  e,
                                  ann.attachmentData || '',
                                  ann.attachmentName || '',
                                )
                              }
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">
                                {ann.attachmentName}
                              </span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {ann.isImportant ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/60">
                            <AlertCircle className="w-3.5 h-3.5" />
                            ประกาศสำคัญ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                            ประกาศทั่วไป
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {new Date(ann.updatedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton action="edit" icon={Edit} label="แก้ไขประกาศ" size="icon-sm" onClick={() => handleOpenEditModal(ann)} />
                          <IconButton action="delete" icon={Trash2} label="ลบประกาศ" size="icon-sm" onClick={() => handleDelete(ann.id, ann.title)} />
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
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              สร้างประกาศใหม่
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              เพิ่มประกาศเพื่อแจ้งให้พนักงานทราบ
            </p>
          </div>

          <form onSubmit={handleCreate} className="px-8 py-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  หัวข้อประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="เช่น ประกาศวันหยุดพิเศษ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  รายละเอียด <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="รายละเอียดเนื้อหาประกาศ..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                <input
                  type="checkbox"
                  id="create-is-important"
                  checked={formData.isImportant}
                  onChange={(e) =>
                    setFormData({ ...formData, isImportant: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <label
                  htmlFor="create-is-important"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                >
                  ทำเครื่องหมายว่าเป็น{' '}
                  <span className="text-rose-600 dark:text-rose-400 font-bold">ประกาศสำคัญ</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  แนบไฟล์ (ไม่บังคับ)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="create-file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="create-file-upload"
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-slate-300 dark:border-slate-700"
                  >
                    เลือกไฟล์
                  </label>
                  {formData.attachmentName && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      <span className="truncate max-w-[200px]">
                        {formData.attachmentName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            attachmentData: '',
                            attachmentName: '',
                          })
                        }
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <ActionButton action="cancel" onClick={() => setIsCreateModalOpen(false)}>ยกเลิก</ActionButton>
              <ActionButton action="save" type="submit">สร้างประกาศ</ActionButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">แก้ไขประกาศ</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              อัปเดตข้อมูลและรายละเอียดประกาศ
            </p>
          </div>

          <form onSubmit={handleUpdate} className="px-8 py-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  หัวข้อประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="เช่น ประกาศวันหยุดพิเศษ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  รายละเอียด <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="รายละเอียดเนื้อหาประกาศ..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                <input
                  type="checkbox"
                  id="edit-is-important"
                  checked={formData.isImportant}
                  onChange={(e) =>
                    setFormData({ ...formData, isImportant: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <label
                  htmlFor="edit-is-important"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                >
                  ทำเครื่องหมายว่าเป็น{' '}
                  <span className="text-rose-600 dark:text-rose-400 font-bold">ประกาศสำคัญ</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  แนบไฟล์ (ไม่บังคับ)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="edit-file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="edit-file-upload"
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-slate-300 dark:border-slate-700"
                  >
                    เลือกไฟล์
                  </label>
                  {formData.attachmentName && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      <span className="truncate max-w-[200px]">
                        {formData.attachmentName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            attachmentData: '',
                            attachmentName: '',
                          })
                        }
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <ActionButton action="cancel" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</ActionButton>
              <ActionButton action="save" type="submit">บันทึกการแก้ไข</ActionButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
