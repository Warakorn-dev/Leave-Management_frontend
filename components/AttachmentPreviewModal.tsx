'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  /** The file the user picked on the create-leave page (not uploaded yet). */
  file: File | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Popup that shows an attachment picked on a create-leave page before it is
 * sent. Same look as the attachment preview in LeaveDetailModal.
 * Images are shown as <img>, PDFs in an <iframe>; the file is read from the
 * user's own computer through an object URL, which is freed on close.
 */
export function AttachmentPreviewModal({ file, open, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  // Created inside the effect (not useMemo) so React Strict Mode's double
  // effect run cannot revoke a URL that is still on screen.
  useEffect(() => {
    if (!open || !file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [open, file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !file || !url) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf =
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-blue-500 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-black">ไฟล์เอกสารแนบ</h2>
            <p className="text-xs text-gray-500 truncate">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="w-8 h-8 shrink-0 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-50/50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200"
            />
          ) : isPdf ? (
            <iframe
              src={url}
              title="ตัวอย่างไฟล์แนบ"
              className="w-full h-[75vh] bg-white rounded-lg shadow-sm border border-gray-200"
            />
          ) : (
            <p className="text-sm text-gray-500 py-10">
              ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttachmentPreviewModal;
