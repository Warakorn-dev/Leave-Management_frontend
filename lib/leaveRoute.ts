type ApprovalLike = { status?: string };

const IN_PROGRESS = ['PENDING_VERIFY', 'REVIEWING_HR', 'PENDING_SUPERVISOR'];

/**
 * True once the request has actually been forwarded to the CEO. The backend
 * logs every forward to the CEO as an approval row with status PENDING_EXECUTIVE,
 * so this is a fact from history, not a guess from the leave type.
 */
export function reachedExecutive(
  status: string,
  approvals?: ApprovalLike[] | null,
): boolean {
  return (
    status === 'PENDING_EXECUTIVE' ||
    (approvals ?? []).some((a) => a.status === 'PENDING_EXECUTIVE')
  );
}

/**
 * Whether the status timeline shows the CEO step. Finished requests show it only
 * when they really went through the CEO. Requests still in progress also show it
 * when they are expected to go there (manager requester or special leave type).
 */
export function showExecutiveStep(
  status: string,
  approvals: ApprovalLike[] | null | undefined,
  expectsExecutive: boolean,
): boolean {
  if (reachedExecutive(status, approvals)) return true;
  return IN_PROGRESS.includes(status) && expectsExecutive;
}

export type ApprovalStage = 'HR' | 'MANAGER' | 'CEO';
export type StageState = 'approved' | 'pending' | 'waiting' | 'cancelled';

/**
 * Which step turned a REJECTED request down. Every approval row stores the
 * status the request moved to, so a PENDING_EXECUTIVE row means the CEO had it
 * and a PENDING_SUPERVISOR row means HR passed it on to the department head.
 */
export function rejectedAtStage(approvals?: ApprovalLike[] | null): ApprovalStage {
  const list = approvals ?? [];
  if (list.some((a) => a.status === 'PENDING_EXECUTIVE')) return 'CEO';
  if (list.some((a) => a.status === 'PENDING_SUPERVISOR')) return 'MANAGER';
  return 'HR';
}

/**
 * Timeline state of one step of a leave request. For a REJECTED request the
 * step that rejected it is 'pending' (the status pages draw it red with the
 * reason), the steps before it 'approved' and the ones after it 'waiting'.
 */
export function stageStatus(
  status: string,
  stage: ApprovalStage,
  approvals?: ApprovalLike[] | null,
): StageState {
  if (status === 'CANCELLED' || status === 'Cancelled') return 'cancelled';

  if (status === 'REJECTED') {
    const order: ApprovalStage[] = ['HR', 'MANAGER', 'CEO'];
    const rejectedAt = order.indexOf(rejectedAtStage(approvals));
    const current = order.indexOf(stage);
    if (current < rejectedAt) return 'approved';
    return current === rejectedAt ? 'pending' : 'waiting';
  }

  if (stage === 'HR') {
    return ['PENDING_VERIFY', 'REVIEWING_HR', 'PENDING_CANCELLATION'].includes(status)
      ? 'pending'
      : 'approved';
  }
  if (stage === 'MANAGER') {
    if (status === 'PENDING_VERIFY' || status === 'REVIEWING_HR') return 'waiting';
    return status === 'PENDING_SUPERVISOR' ? 'pending' : 'approved';
  }
  if (status === 'PENDING_EXECUTIVE') return 'pending';
  return status === 'APPROVED' ? 'approved' : 'waiting';
}

/** The reason given when the request was rejected (approvals come newest first). */
export function rejectionComment(
  approvals?: (ApprovalLike & { comment?: string | null })[] | null,
): string | undefined {
  return (approvals ?? []).find((a) => a.status === 'REJECTED')?.comment || undefined;
}
