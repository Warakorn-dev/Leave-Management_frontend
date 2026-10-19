'use client';

import { useState } from 'react';
import type { Leave } from '@/lib/api/types';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';
import type { ExistingAttachment } from '@/lib/leaveAttachment';
import { LeaveEditFormLayout } from '@/components/leave-form/LeaveEditFormLayout';

export { formatPickerValue } from '@/components/leave-form/LeaveFormFields';

export interface UserLeaveEditForm {
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

interface UserLeaveEditFormModalProps {
  username: string;
  /** Defaults to the signed-in user's department / position (sessionStorage). */
  department?: string;
  positionName?: string;
  balances: LeaveBalance[];
  editForm: UserLeaveEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<UserLeaveEditForm>>;
  /** No longer used: the shared form works out unavailable days itself. */
  isEditDateDisabled?: (date: unknown) => boolean;
  allLeaves: Leave[];
  currentUserId: string | null;
  excludeRequestId?: string;
  onConflictChange: (hasConflict: boolean) => void;
  editAttachment: File | null;
  setEditAttachment: (file: File | null) => void;
  /** File already stored with the leave being edited. */
  existingAttachment?: ExistingAttachment | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  showConfirmEdit: boolean;
  setShowConfirmEdit: (show: boolean) => void;
  onConfirmSave: () => void;
}

/**
 * Employee leave-history "แก้ไขข้อมูล" form. Layout and fields come from the
 * shared leave form (components/leave-form) so it matches the create page.
 */
export function UserLeaveEditFormModal({
  username,
  department,
  positionName,
  balances,
  editForm,
  setEditForm,
  allLeaves,
  currentUserId,
  excludeRequestId,
  onConflictChange,
  editAttachment,
  setEditAttachment,
  existingAttachment = null,
  onSubmit,
  onClose,
  showConfirmEdit,
  setShowConfirmEdit,
  onConfirmSave,
}: UserLeaveEditFormModalProps) {
  // The type the leave had when the form opened stays selectable.
  const [originalTypeId] = useState(editForm.type);
  const stored = (key: string) =>
    typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;

  return (
    <LeaveEditFormLayout
      requester={{
        name: username,
        department: department ?? stored('department'),
        position: positionName ?? stored('position'),
      }}
      values={editForm}
      onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
      balances={balances}
      originalTypeId={originalTypeId}
      leaves={allLeaves}
      ownerUserId={currentUserId}
      excludeRequestId={excludeRequestId}
      onConflictChange={onConflictChange}
      attachmentFile={editAttachment}
      onAttachmentChange={setEditAttachment}
      existingAttachment={existingAttachment}
      onSubmit={onSubmit}
      onClose={onClose}
      showConfirmEdit={showConfirmEdit}
      setShowConfirmEdit={setShowConfirmEdit}
      onConfirmSave={onConfirmSave}
    />
  );
}
