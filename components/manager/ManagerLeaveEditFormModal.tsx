'use client';

import { useState } from 'react';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';
import type { LeaveLike } from '@/lib/leavePortions';
import type { ExistingAttachment } from '@/lib/leaveAttachment';
import { LeaveEditFormLayout } from '@/components/leave-form/LeaveEditFormLayout';

export { formatPickerValue } from '@/components/leave-form/LeaveFormFields';

export interface ManagerLeaveEditForm {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveMode: string;
  period: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
}

interface ManagerLeaveEditFormModalProps {
  username: string;
  department?: string;
  positionName?: string;
  editForm: ManagerLeaveEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<ManagerLeaveEditForm>>;
  balances: LeaveBalance[];
  /** Leaves loaded by the page, for the unavailable-day check. */
  allLeaves?: LeaveLike[];
  /** The request being edited. */
  excludeRequestId?: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
  /** File picked in this form (replaces the stored file on save). */
  attachmentFile?: File | null;
  /** Pick (File) or remove (null) the new attachment. */
  onAttachmentChange: (file: File | null) => void;
  /** File already stored with the leave being edited. */
  existingAttachment?: ExistingAttachment | null;
}

/**
 * Manager leave-history "แก้ไขข้อมูล" form. Layout and fields come from the
 * shared leave form (components/leave-form) so it matches the create page.
 */
export function ManagerLeaveEditFormModal({
  username,
  department,
  positionName,
  editForm,
  setEditForm,
  balances,
  allLeaves = [],
  excludeRequestId,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
  attachmentFile = null,
  onAttachmentChange,
  existingAttachment = null,
}: ManagerLeaveEditFormModalProps) {
  // The type the leave had when the form opened stays selectable.
  const [originalTypeId] = useState(editForm.type);

  return (
    <LeaveEditFormLayout
      requester={{ name: username, department, position: positionName }}
      values={editForm}
      onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
      balances={balances}
      originalTypeId={originalTypeId}
      leaves={allLeaves}
      excludeRequestId={excludeRequestId}
      attachmentFile={attachmentFile}
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
