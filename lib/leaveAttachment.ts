import axiosInstance from '@/lib/api/axios';

/**
 * Helpers for the file attached to a leave request.
 *
 * Lists of leaves carry only `{ id, fileType }` for each attachment: the
 * content (a base64 data URL) is loaded one file at a time from
 * GET /api/leave/attachments/:id when someone opens it. Older payloads may
 * still carry the content in `filePath` or the legacy `attachmentUrl` field.
 * Shared by LeaveDetailModal, CeoLeaveDetailModal and the three
 * "แก้ไขคำขอลา" forms.
 */

export interface StoredAttachment {
  id?: string;
  filePath?: string;
  fileType?: string;
}

export interface ExistingAttachment {
  /** Server id, used to load the content when `url` is empty. */
  id?: string;
  /** Address the browser can open (data: URL, absolute URL or /uploads/...), or '' until loaded. */
  url: string;
  isImage: boolean;
  /** Short label, e.g. "รูปภาพแนบ" or the stored file name. */
  name: string;
}

interface LeaveWithAttachment {
  attachments?: StoredAttachment[] | null;
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

/** Content (data URL) of one stored attachment, from the server. */
export async function loadAttachmentDataUrl(id: string): Promise<string> {
  const res = await axiosInstance.get(
    `/leave/attachments/${encodeURIComponent(id)}`,
  );
  const dataUrl = (res.data as { data?: { dataUrl?: string } })?.data?.dataUrl;
  if (!dataUrl) throw new Error('ไม่พบไฟล์แนบ');
  return dataUrl;
}

/** Address the browser can open for `att`, loading the content when needed. */
export async function attachmentSource(att: StoredAttachment): Promise<string> {
  if (att.filePath) return resolveAttachmentSrc(att.filePath);
  if (att.id) return loadAttachmentDataUrl(att.id);
  throw new Error('ไม่พบไฟล์แนบ');
}

/** Saves `src` (data URL or same-site address) under `name`. */
export function downloadAttachment(src: string, name: string): void {
  const a = document.createElement('a');
  a.href = src;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** The file currently attached to a leave, or null when it has none. */
export function getExistingAttachment(
  leave: LeaveWithAttachment | null | undefined,
): ExistingAttachment | null {
  if (!leave) return null;
  const first: StoredAttachment | null =
    Array.isArray(leave.attachments) && leave.attachments.length > 0
      ? leave.attachments[0]
      : leave.attachmentUrl
        ? { filePath: leave.attachmentUrl }
        : null;
  if (!first?.filePath && !first?.id) return null;

  const url = resolveAttachmentSrc(first.filePath);
  const isImage = isImageAttachment(first.filePath, first.fileType);
  const storedName =
    !first.filePath || first.filePath.startsWith('data:')
      ? null
      : first.filePath.split(/[\\/]/).pop() || null;
  return {
    id: first.id,
    url,
    isImage,
    name: leave.attachmentName || storedName || (isImage ? 'รูปภาพแนบ' : 'ไฟล์แนบ'),
  };
}
