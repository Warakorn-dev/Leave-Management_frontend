'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  /** A file picked on this page (not uploaded yet). Takes priority over `url`. */
  file?: File | null;
  /** A file already stored on the server (see lib/leaveAttachment.ts). */
  url?: string | null;
  /** Display name for `url`; a picked `file` uses its own name. */
  name?: string;
  /** For `url`: whether it is an image. Guessed from the address when omitted. */
  isImage?: boolean;
  open: boolean;
  onClose: () => void;
};

/**
 * Popup that shows a leave attachment: either a file just picked on a
 * create/edit form, or the file already stored with the leave.
 * Same look as the attachment preview in LeaveDetailModal.
 * Images are shown as <img>, PDFs in an <iframe>. A picked file is read
 * through an object URL, which is freed on close.
 */
export function AttachmentPreviewModal({
  file,
  url,
  name,
  isImage,
  open,
  onClose,
}: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Created inside the effect (not useMemo) so React Strict Mode's double
  // effect run cannot revoke a URL that is still on screen.
  useEffect(() => {
    if (!open || !file) {
      setObjectUrl(null);
      return;
    }
    const created = URL.createObjectURL(file);
    setObjectUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [open, file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const src = file ? objectUrl : url || null;
  if (!open || !src) return null;

  const title = file ? file.name : name || 'ไฟล์แนบ';
  const showAsImage = file
    ? file.type.startsWith('image/')
    : (isImage ??
      (/^data:image\//.test(src) || /\.(jpeg|jpg|gif|png)$/i.test(src)));
  const showAsPdf = file
    ? file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    : !showAsImage;

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
            <p className="text-xs text-gray-500 truncate">{title}</p>
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
          {showAsImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200"
            />
          ) : showAsPdf ? (
            <iframe
              src={src}
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
