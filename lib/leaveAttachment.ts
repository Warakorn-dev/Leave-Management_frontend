/**
 * Helpers for the file attached to a leave request.
 *
 * A leave carries its file either in the `attachments` relation (current
 * backend) or in the legacy `attachmentUrl` field. Shared by LeaveDetailModal
 * and the three "แก้ไขคำขอลา" forms.
 */

export interface ExistingAttachment {
  /** Address the browser can open (data: URL, absolute URL or /uploads/...). */
  url: string;
  isImage: boolean;
  /** Short label, e.g. "รูปภาพแนบ" or the stored file name. */
  name: string;
}

interface LeaveWithAttachment {
  attachments?: Array<{ filePath?: string; fileType?: string }> | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

/** Stored file path → address the browser can open. */
export function resolveAttachmentSrc(filePath?: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('data:') || filePath.startsWith('http'))
    return filePath;
  return `/${filePath.replace(/^\/+/, '')}`;
}

export function isImageAttachment(filePath?: string, fileType?: string): boolean {
  return Boolean(
    fileType?.startsWith('image/') ||
      filePath?.match(/\.(jpeg|jpg|gif|png)$/i) ||
      filePath?.startsWith('data:image/'),
  );
}

/** The file currently attached to a leave, or null when it has none. */
export function getExistingAttachment(
  leave: LeaveWithAttachment | null | undefined,
): ExistingAttachment | null {
  if (!leave) return null;
  const first =
    Array.isArray(leave.attachments) && leave.attachments.length > 0
      ? leave.attachments[0]
      : leave.attachmentUrl
        ? { filePath: leave.attachmentUrl, fileType: undefined }
        : null;
  if (!first?.filePath) return null;

  const url = resolveAttachmentSrc(first.filePath);
  const isImage = isImageAttachment(first.filePath, first.fileType);
  const storedName = first.filePath.startsWith('data:')
    ? null
    : first.filePath.split(/[\\/]/).pop() || null;
  return {
    url,
    isImage,
    name: leave.attachmentName || storedName || (isImage ? 'รูปภาพแนบ' : 'ไฟล์แนบ'),
  };
}
