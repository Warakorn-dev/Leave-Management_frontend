'use client';

/**
 * Shared "สถานะ" + "การดำเนินการ" UI for every leave-approval table (Manager / HR / CEO).
 *
 * UI only: pages pass their existing handlers and decide which actions are allowed.
 * An action button renders only when its handler is provided, so a page hides
 * approve/reject for non-actionable rows simply by not passing them.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, getLeaveStatusText } from '@/lib/api/utils';

// ──────────────── status badge ────────────────

type StatusTone = 'pending' | 'reviewing' | 'cancelling' | 'approved' | 'rejected' | 'cancelled' | 'neutral';

const STATUS_TONE: Record<string, StatusTone> = {
  PENDING_VERIFY: 'pending',
  PENDING_SUPERVISOR: 'pending',
  PENDING_EXECUTIVE: 'pending',
  REVIEWING_HR: 'reviewing',
  PENDING_CANCELLATION: 'cancelling',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const TONE_CLASS: Record<StatusTone, { chip: string; dot: string }> = {
  pending: {
    chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  reviewing: {
    chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  cancelling: {
    chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  approved: {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  rejected: {
    chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
    dot: 'bg-red-500',
  },
  cancelled: {
    chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
    dot: 'bg-slate-400',
  },
  neutral: {
    chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

interface LeaveStatusBadgeProps {
  /** backend status enum, e.g. PENDING_SUPERVISOR — never renamed, only displayed */
  status?: string | null;
  /** override the text from getLeaveStatusText (e.g. "ตรวจสอบโดยคุณ") */
  label?: ReactNode;
  /** secondary line under the chip (e.g. who is reviewing) */
  hint?: ReactNode;
  className?: string;
}

export function LeaveStatusBadge({ status, label, hint, className }: LeaveStatusBadgeProps) {
  const tone = TONE_CLASS[STATUS_TONE[(status || '').toUpperCase()] ?? 'neutral'];
  return (
    <span className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold leading-none',
          tone.chip,
        )}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.dot)} aria-hidden="true" />
        {label ?? getLeaveStatusText(status || '')}
      </span>
      {hint && <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{hint}</span>}
    </span>
  );
}

// ──────────────── action buttons ────────────────

export type LeaveActionVariant = 'detail' | 'approve' | 'reject' | 'primary';

const VARIANT_CLASS: Record<LeaveActionVariant, string> = {
  // dark text on orange keeps WCAG AA contrast (white on orange does not)
  detail: 'bg-amber-500 text-amber-950 hover:bg-amber-600 focus-visible:ring-amber-500',
  approve: 'bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-700',
  reject: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  // non-decision workflow steps (e.g. HR "รับเรื่องตรวจสอบ")
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
};

const SIZE_CLASS = {
  sm: 'h-8 min-w-[84px] px-3.5 text-[13px] gap-1.5',
  lg: 'h-11 min-w-[120px] px-6 text-[14px] gap-2',
} as const;

interface LeaveActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant: LeaveActionVariant;
  size?: keyof typeof SIZE_CLASS;
  loading?: boolean;
  icon?: ReactNode;
}

export function LeaveActionButton({
  variant,
  size = 'sm',
  loading = false,
  disabled,
  icon,
  className,
  children,
  ...rest
}: LeaveActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

export type LeaveActionKind = 'approve' | 'reject';

interface LeaveActionButtonsProps {
  onDetail?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  /** which action is currently in flight; disables every button in the group */
  loading?: LeaveActionKind | null;
  disabled?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  /** accessible full meaning when the short label needs context */
  approveTitle?: string;
  rejectTitle?: string;
  /** extra workflow buttons, rendered after "รายละเอียด" (e.g. HR claim) */
  children?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

/** Standard order: [รายละเอียด] [อนุมัติ] [ปฏิเสธ] — review first, then decide. */
export function LeaveActionButtons({
  onDetail,
  onApprove,
  onReject,
  loading = null,
  disabled = false,
  approveLabel = 'อนุมัติ',
  rejectLabel = 'ปฏิเสธ',
  approveTitle,
  rejectTitle,
  children,
  size = 'sm',
  className,
}: LeaveActionButtonsProps) {
  const busy = disabled || loading !== null;
  return (
    <div className={cn('flex flex-nowrap items-center gap-2', className)}>
      {onDetail && (
        <LeaveActionButton variant="detail" size={size} onClick={onDetail}>
          รายละเอียด
        </LeaveActionButton>
      )}
      {children}
      {onApprove && (
        <LeaveActionButton
          variant="approve"
          size={size}
          onClick={onApprove}
          disabled={busy}
          loading={loading === 'approve'}
          title={approveTitle}
          aria-label={approveTitle}
        >
          {approveLabel}
        </LeaveActionButton>
      )}
      {onReject && (
        <LeaveActionButton
          variant="reject"
          size={size}
          onClick={onReject}
          disabled={busy}
          loading={loading === 'reject'}
          title={rejectTitle}
          aria-label={rejectTitle}
        >
          {rejectLabel}
        </LeaveActionButton>
      )}
    </div>
  );
}
