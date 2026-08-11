import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLeaveStatusText(status: string): string {
  if (!status) return '-';
  switch (status.toUpperCase()) {
    case 'PENDING_VERIFY': return 'รอตรวจสอบ (HR)';
    case 'PENDING_SUPERVISOR': return 'รอหัวหน้างานอนุมัติ';
    case 'PENDING_EXECUTIVE': return 'รอผู้บริหารอนุมัติ';
    case 'APPROVED': return 'อนุมัติแล้ว';
    case 'REJECTED': return 'ไม่อนุมัติ (ตีกลับ)';
    case 'CANCELLED': return 'ยกเลิกแล้ว';
    default: return status;
  }
}

export function getLeaveStatusBadgeColor(status: string): string {
  if (!status) return 'bg-gray-400';
  switch (status.toUpperCase()) {
    case 'PENDING_VERIFY': return 'bg-yellow-500';
    case 'PENDING_SUPERVISOR': return 'bg-orange-500';
    case 'PENDING_EXECUTIVE': return 'bg-purple-500';
    case 'APPROVED': return 'bg-green-500';
    case 'REJECTED': return 'bg-red-500';
    case 'CANCELLED': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
}

