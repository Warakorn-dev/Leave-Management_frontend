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
