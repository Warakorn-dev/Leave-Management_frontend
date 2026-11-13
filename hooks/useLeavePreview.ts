import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';

export interface LeavePreview {
  ok: boolean;
  /** Days the request would use; null when it would be refused. */
  totalDays: number | null;
  /** Why it would be refused (Thai, from the server); null when ok. */
  message: string | null;
}

/** The fields of the create form that decide how a request is sized. */
export interface LeavePreviewInput {
  type: string;
  leaveMode: string;
  period: string;
  startDate: string;
  endDate: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
}

const DEBOUNCE_MS = 400;

/** Query for GET /leave/preview, or null while the form is still incomplete. */
function previewParams(v: LeavePreviewInput): Record<string, string> | null {
  if (!v.type) return null;
  if (v.leaveMode === 'hourly') {
    if (!v.leaveDate || !v.startTime || !v.endTime) return null;
    return {
      leaveTypeId: v.type,
      leaveMode: v.leaveMode,
      leaveDate: v.leaveDate,
      startTime: v.startTime,
      endTime: v.endTime,
    };
  }
  if (!v.startDate || !v.endDate) return null;
  const params: Record<string, string> = {
    leaveTypeId: v.type,
    leaveMode: v.leaveMode,
    startDate: v.startDate,
    endDate: v.endDate,
  };
  if (v.leaveMode === 'half_day') params.period = v.period;
  return params;
}

/**
 * Asks the server whether the request in the form would be accepted, and for
 * how many days (GET /leave/preview, the same rules as submitting). Returns
 * null while the form is incomplete, while a check is running, and when the
 * check itself fails (network): the server decides again on submit, so a
 * failed preview never blocks the user.
 */
export function useLeavePreview(values: LeavePreviewInput): LeavePreview | null {
  const [result, setResult] = useState<{ key: string; preview: LeavePreview } | null>(null);

  const params = previewParams(values);
  const key = params ? JSON.stringify(params) : '';

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get('/leave/preview', {
          params: JSON.parse(key),
          signal: controller.signal,
          skipErrorAlert: true,
        });
        setResult({ key, preview: res.data?.data ?? res.data });
      } catch {
        // Aborted by a newer input, or the check failed: show nothing.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  // A result only counts for the exact inputs it was computed for.
  return key && result?.key === key ? result.preview : null;
}
