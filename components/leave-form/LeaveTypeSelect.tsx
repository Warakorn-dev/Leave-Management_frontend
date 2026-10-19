'use client';

import type { LeaveBalance } from '@/hooks/useLeaveBalance';

/** Sick, personal, vacation first; the rest in Thai alphabetical order. */
function typeOrder(name: string): number {
  if (name.includes('ลาป่วย')) return 1;
  if (name.includes('ลากิจ')) return 2;
  if (name.includes('พักผ่อน') || name.includes('พักร้อน')) return 3;
  return 99;
}

interface OptionInfo {
  id: string;
  label: string;
  disabled: boolean;
}

/** Label rules of the employee create page: tenure, used-up quota, remaining + pending. */
export function describeBalance(b: LeaveBalance): Omit<OptionInfo, 'id'> {
  const name = b.leaveType?.name || 'ไม่ระบุ';
  const isOutOfQuota = (b.effectiveRemainingDays ?? 0) <= 0;

  const isVacation = name.includes('พักร้อน') || name.includes('พักผ่อน');
  const requiredTenure = isVacation ? 365 : (b.leaveType?.minTenureDays ?? 0);
  let isTenureNotMet = false;
  if (requiredTenure > 0 && b.employeeHireDate) {
    const diffDays =
      (Date.now() - new Date(b.employeeHireDate).getTime()) /
      (1000 * 60 * 60 * 24);
    isTenureNotMet = diffDays < requiredTenure;
  }

  let label = `${name} `;
  if (isTenureNotMet) {
    label += `(อายุงานไม่ครบ ${
      requiredTenure >= 365
        ? (requiredTenure / 365).toFixed(0) + ' ปี'
        : requiredTenure + ' วัน'
    })`;
  } else if (isOutOfQuota) {
    label += '(หมดโควตา)';
  } else {
    const pending =
      (b.pendingDays ?? 0) > 0 ? ` + รออนุมัติ ${b.pendingDays} วัน` : '';
    label += `(เหลือ ${b.effectiveRemainingDays ?? b.remainingDays ?? 0} วัน${pending})`;
  }
  return { label, disabled: isOutOfQuota || isTenureNotMet };
}

interface Props {
  value: string;
  onChange: (leaveTypeId: string) => void;
  /** The requester's own balances (GET /leave/balance) — only types they hold. */
  balances: LeaveBalance[];
  /** Edit forms: the leave's current type is never disabled (its own days count as pending). */
  keepEnabledTypeId?: string;
}

export function LeaveTypeSelect({
  value,
  onChange,
  balances,
  keepEnabledTypeId,
}: Props) {
  const options: OptionInfo[] = [...balances]
    .filter((b) => b.leaveType?.id || b.leaveTypeId)
    .sort((a, b) => {
      const nameA = a.leaveType?.name || '';
      const nameB = b.leaveType?.name || '';
      const diff = typeOrder(nameA) - typeOrder(nameB);
      return diff !== 0 ? diff : nameA.localeCompare(nameB, 'th');
    })
    .map((b) => {
      const id = String(b.leaveType?.id || b.leaveTypeId);
      const info = describeBalance(b);
      return {
        id,
        ...info,
        disabled: info.disabled && id !== keepEnabledTypeId,
      };
    });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700"
    >
      <option value="" disabled>
        -- กรุณาเลือกประเภทการลา --
      </option>
      {options.map((o) => (
        <option
          key={o.id}
          value={o.id}
          disabled={o.disabled}
          className={
            o.disabled ? 'text-gray-400 bg-gray-50 font-medium' : 'text-gray-800'
          }
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default LeaveTypeSelect;
