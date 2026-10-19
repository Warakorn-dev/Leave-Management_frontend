'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { AttachmentPreviewModal } from '@/components/AttachmentPreviewModal';
import type { ExistingAttachment } from '@/lib/leaveAttachment';

type Props = {
  /** File picked in this edit form; it replaces the stored file on save. */
  newFile: File | null;
  /** File already stored with the leave (from getExistingAttachment). */
  existing: ExistingAttachment | null;
  /** Cancels the picked file, so the stored file is kept. */
  onRemoveNew: () => void;
};

/**
 * Row shown under the upload box of the "แก้ไขคำขอลา" forms: which file the
 * leave will have after saving, with "ดูไฟล์" (popup) and, for a newly picked
 * file, "ลบไฟล์".
 *
 * Kept outside the upload box on purpose: the box is covered by an invisible
 * file input, so buttons inside it would open the file picker instead.
 */
export function EditAttachmentStatus({ newFile, existing, onRemoveNew }: Props) {
  const [preview, setPreview] = useState<'new' | 'existing' | null>(null);

  if (!newFile && !existing) return null;

  return (
    <>
      <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
        {newFile ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-gray-700">
              <Paperclip className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="shrink-0 font-semibold">ไฟล์ใหม่:</span>
              <span className="truncate text-emerald-700">{newFile.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreview('new')}
                className="text-blue-600 underline hover:text-blue-800"
              >
                ดูไฟล์
              </button>
              <button
                type="button"
                onClick={onRemoveNew}
                className="text-red-500 underline hover:text-red-700"
              >
                ลบไฟล์
              </button>
            </span>
            {existing && (
              <p className="w-full text-[11px] text-gray-400">
                เมื่อบันทึก ไฟล์นี้จะแทนที่ไฟล์แนบเดิม (กด &quot;ลบไฟล์&quot;
                เพื่อใช้ไฟล์เดิมต่อ)
              </p>
            )}
          </div>
        ) : (
          existing && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-gray-700">
                <Paperclip className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="shrink-0 font-semibold">ไฟล์แนบเดิม:</span>
                <span className="truncate">{existing.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreview('existing')}
                className="shrink-0 text-xs font-semibold text-blue-600 underline hover:text-blue-800"
              >
                ดูไฟล์
              </button>
              <p className="w-full text-[11px] text-gray-400">
                ถ้าเลือกไฟล์ใหม่ ไฟล์เดิมจะถูกแทนที่เมื่อบันทึก
              </p>
            </div>
          )
        )}
      </div>

      <AttachmentPreviewModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        file={preview === 'new' ? newFile : null}
        url={preview === 'existing' ? existing?.url : null}
        name={existing?.name}
        isImage={existing?.isImage}
      />
    </>
  );
}

export default EditAttachmentStatus;
