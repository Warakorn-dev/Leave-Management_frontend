/**
 * The built-in pay/eligibility rule of a leave type (backend: LeaveType.rule,
 * applied in computeAccrual). It is kept apart from the type's name so HR can
 * rename a type without losing its rule. Must match the backend enum LeaveRule.
 */
export const LEAVE_RULES = [
  {
    value: 'GENERAL',
    label: 'ทั่วไป',
    hint: 'จ่ายเต็มทุกวัน (เช่น ลากิจ ลาทำหมัน ลาอุปสมบท)',
  },
  {
    value: 'SICK',
    label: 'ลาป่วย',
    hint: 'จ่ายไม่เกิน 30 วันต่อปี ส่วนที่เกินไม่จ่าย',
  },
  {
    value: 'MATERNITY',
    label: 'ลาคลอดบุตร',
    hint: 'ตามเพศ: หญิงไม่เกิน 135 วัน (จ่าย 60 วัน + ครึ่งหนึ่งของส่วนที่เกิน 120), ชายไม่เกิน 15 วัน',
  },
  {
    value: 'MILITARY',
    label: 'รับราชการทหาร',
    hint: 'จ่ายไม่เกิน 60 วันต่อปี',
  },
  {
    value: 'VACATION',
    label: 'ลาพักร้อน',
    hint: 'ต้องอายุงานครบ 1 ปี และยกยอดไปปีถัดไปได้ (รวมไม่เกิน 12 วัน)',
  },
] as const;

export type LeaveRule = (typeof LEAVE_RULES)[number]['value'];

export const LEAVE_RULE_VALUES = LEAVE_RULES.map((r) => r.value) as [
  LeaveRule,
  ...LeaveRule[],
];

export function leaveRuleLabel(rule?: string | null): string {
  return LEAVE_RULES.find((r) => r.value === rule)?.label ?? 'ทั่วไป';
}

/**
 * Vacation (annual) leave. Decided by `rule`; the name is only a fallback for
 * data from a backend that does not send `rule` yet.
 */
export function isVacationType(
  type: { rule?: unknown; name?: string | null } | null | undefined,
): boolean {
  if (!type) return false;
  if (typeof type.rule === 'string') return type.rule === 'VACATION';
  const name = type.name ?? '';
  return name.includes('พักร้อน') || name.includes('พักผ่อน');
}
