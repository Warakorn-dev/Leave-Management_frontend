'use client';

import { useState } from 'react';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';
import type { LeaveLike } from '@/lib/leavePortions';
import type { ExistingAttachment } from '@/lib/leaveAttachment';
import { LeaveEditFormLayout } from '@/components/leave-form/LeaveEditFormLayout';

export interface LeaveEditForm {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveMode: string;
  period: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
  attachment: string | null;
  attachmentName: string | null;
}

interface SelectedRequestInfo {
  id?: string;
  name?: string;
  department?: string;
  positionName?: string;
  raw?: { userId?: string };
}

interface LeaveEditFormModalProps {
  selectedRequest: SelectedRequestInfo | null;
  username: string;
  editForm: LeaveEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<LeaveEditForm>>;
  balances: LeaveBalance[];
  /** Leaves loaded by the page, for the unavailable-day check. */
  allLeaves?: LeaveLike[];
  /** File picked in this form (replaces the stored file on save). */
  newFile?: File | null;
  /** Pick (File) or remove (null) the new attachment. */
  onAttachmentChange: (file: File | null) => void;
  /** File already stored with the leave being edited. */
  existingAttachment?: ExistingAttachment | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
}

/**
 * HR leave-history "แก้ไขข้อมูล" form. Layout and fields come from the
 * shared leave form (components/leave-form) so it matches the create page.
 */
export function LeaveEditFormModal({
  selectedRequest,
  username,
  editForm,
  setEditForm,
  balances,
  allLeaves = [],
  newFile = null,
  onAttachmentChange,
  existingAttachment = null,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
}: LeaveEditFormModalProps) {
  // The type the leave had when the form opened stays selectable.
  const [originalTypeId] = useState(editForm.type);

  return (
    <LeaveEditFormLayout
      requester={{
        name: selectedRequest?.name || username,
        department: selectedRequest?.department,
        position: selectedRequest?.positionName,
      }}
      values={editForm}
      onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
      balances={balances}
      originalTypeId={originalTypeId}
      leaves={allLeaves}
      ownerUserId={selectedRequest?.raw?.userId ?? null}
      excludeRequestId={selectedRequest?.id}
      attachmentFile={newFile}
      onAttachmentChange={onAttachmentChange}
      existingAttachment={existingAttachment}
      onSubmit={onSubmit}
      onClose={onClose}
      showConfirmEdit={showConfirmEdit}
      setShowConfirmEdit={setShowConfirmEdit}
      onConfirmSave={onConfirmSave}
    />
  );
}
