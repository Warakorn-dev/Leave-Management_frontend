'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { AttachmentPreviewModal } from '@/components/AttachmentPreviewModal';
import type { ExistingAttachment } from '@/lib/leaveAttachment';
import { fieldLabelClass } from './LeaveFormFields';

const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  /** File picked in this form (not uploaded yet). */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Edit forms: the file already stored with the leave. */
  existing?: ExistingAttachment | null;
  /** Shown when a picked file is too large; defaults to a browser alert. */
  onError?: (message: string) => void;
}

/**
 * "เอกสารแนบ (ถ้ามี)" of the employee create page, shared by every create and
 * edit form. The "ดูไฟล์ / ลบไฟล์แนบ" links sit under the upload box: the box
 * itself is covered by an invisible file input, so links inside it would open
 * the file picker instead.
 */
export function LeaveAttachmentField({
  file,
  onFileChange,
  existing = null,
  onError,
}: Props) {
  const [preview, setPreview] = useState<'new' | 'existing' | null>(null);

  const reportError = (message: string) =>
    onError ? onError(message) : alert(message);

  return (
    <div className="mb-10">
      <label className={fieldLabelClass}>เอกสารแนบ (ถ้ามี)</label>
      <div className="border border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm relative group overflow-hidden">
        <Upload
          className="w-8 h-8 text-black mb-3 group-hover:-translate-y-1 transition-transform"
          strokeWidth={2}
        />
        <p className="text-[13px] text-black font-semibold text-center">
          {file ? (
            <span className="text-blue-600">{file.name}</span>
          ) : (
            <>
              ลากไฟล์มาวางที่นี่ หรือ{' '}
              <span className="text-blue-600">คลิกเพื่ออัปโหลด</span>
            </>
          )}
        </p>
        <p className="text-[11px] text-gray-400 mt-1.5">
          รองรับไฟล์ PDF, PNG, JPG ขนาดไม่เกิน 2 MB
        </p>
        {/* Invisible file input */}
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            // allow picking the same file again after it was removed
            e.target.value = '';
            if (!picked) return;
            if (picked.size > MAX_BYTES) {
              reportError('ขนาดไฟล์ต้องไม่เกิน 2 MB');
              return;
            }
            onFileChange(picked);
          }}
        />
      </div>

      {file ? (
        <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {existing && (
            <span className="mr-auto text-[11px] text-gray-400">
              เมื่อบันทึก ไฟล์นี้จะแทนที่ไฟล์แนบเดิม
            </span>
          )}
          <button
            type="button"
            onClick={() => setPreview('new')}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            ดูไฟล์
          </button>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            ลบไฟล์แนบ
          </button>
        </div>
      ) : (
        existing && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
            <span className="mr-auto min-w-0 truncate text-xs text-gray-600">
              ไฟล์แนบเดิม: <span className="font-semibold">{existing.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setPreview('existing')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              ดูไฟล์
            </button>
          </div>
        )
      )}

      <AttachmentPreviewModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        file={preview === 'new' ? file : null}
        url={preview === 'existing' ? existing?.url : null}
        name={existing?.name}
        isImage={existing?.isImage}
      />
    </div>
  );
}

export default LeaveAttachmentField;
