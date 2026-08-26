/**
 * AI Leave Tools — Server-side only
 * ทุก Tool เรียก NestJS Backend โดยส่ง JWT ของ User ที่ Login อยู่
 * NestJS มี JwtAuthGuard + RolesGuard อยู่แล้ว → Permission บังคับโดย Backend เสมอ
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Helper: เรียก Backend API ────────────────────────────────────────────────
async function callBackend(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<ToolCallResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        errorMsg = errBody?.message || errBody?.error || errorMsg;
      } catch {
        // ignore parse error
      }
      return { success: false, error: errorMsg };
    }

    const json = await response.json();
    // NestJS ResponseInterceptor ห่อข้อมูลใน { data: ... }
    const data = json?.data !== undefined ? json.data : json;
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ─── Tool: ดึงวันลาคงเหลือ ─────────────────────────────────────────────────
export async function getMyLeaveBalance(token: string): Promise<ToolCallResult> {
  return callBackend('GET', '/leave/balance', token);
}

// ─── Tool: ดึงประวัติการลา ─────────────────────────────────────────────────
export async function getMyLeaveHistory(
  token: string,
  options?: { month?: number; year?: number; status?: string },
): Promise<ToolCallResult> {
  const result = await callBackend('GET', '/leave/history', token);

  if (!result.success || !Array.isArray(result.data)) return result;

  let data = result.data as Array<Record<string, unknown>>;
  const now = new Date();
  const targetYear = options?.year || now.getFullYear();
  const targetMonth = options?.month; // 1-12

  // กรอง Year
  data = data.filter((r) => {
    const d = new Date(r.startDate as string);
    return d.getFullYear() === targetYear;
  });

  // กรอง Month ถ้าระบุ
  if (targetMonth) {
    data = data.filter((r) => {
      const d = new Date(r.startDate as string);
      return d.getMonth() + 1 === targetMonth;
    });
  }

  // กรอง Status ถ้าระบุ
  if (options?.status) {
    data = data.filter((r) => r.status === options.status);
  }

  return { success: true, data };
}

// ─── Tool: ดึงสถานะคำขอลา ──────────────────────────────────────────────────
export async function getLeaveRequestStatus(
  token: string,
  options?: { requestId?: string; date?: string },
): Promise<ToolCallResult> {
  const result = await callBackend('GET', '/leave/history', token);

  if (!result.success || !Array.isArray(result.data)) return result;

  let data = result.data as Array<Record<string, unknown>>;

  if (options?.requestId) {
    data = data.filter((r) => r.id === options.requestId || r.requestCode === options.requestId);
  }

  if (options?.date) {
    data = data.filter((r) => {
      const startDate = new Date(r.startDate as string).toISOString().split('T')[0];
      const endDate = new Date(r.endDate as string).toISOString().split('T')[0];
      return startDate <= options.date! && options.date! <= endDate;
    });
  }

  // แปลงสถานะเป็นภาษาที่เข้าใจง่าย
  const statusMap: Record<string, string> = {
    PENDING_VERIFY: 'รอตรวจสอบ (HR ยังไม่ได้รับคำขอ)',
    REVIEWING_HR: 'HR กำลังตรวจสอบ',
    PENDING_SUPERVISOR: 'รอหัวหน้าแผนก/Manager อนุมัติ',
    PENDING_EXECUTIVE: 'รอ CEO อนุมัติ',
    PENDING_CANCELLATION: 'รอ HR ยืนยันการยกเลิก',
    APPROVED: 'อนุมัติแล้ว ✅',
    REJECTED: 'ไม่อนุมัติ ❌',
    CANCELLED: 'ยกเลิกแล้ว',
    Approved: 'อนุมัติแล้ว ✅',
    Rejected: 'ไม่อนุมัติ ❌',
    Cancelled: 'ยกเลิกแล้ว',
  };

  const enhanced = data.map((r) => ({
    ...r,
    statusThai: statusMap[r.status as string] || r.status,
  }));

  return { success: true, data: enhanced };
}

// ─── Tool: ดึงประเภทการลา ──────────────────────────────────────────────────
export async function getLeaveTypes(token: string): Promise<ToolCallResult> {
  return callBackend('GET', '/leave/types', token);
}

// ─── Tool: สร้างคำขอลา ────────────────────────────────────────────────────
// ห้าม AI เรียกโดยตรง — ต้องผ่าน Confirmation ก่อน
// Backend จะ validate ทุกอย่าง: balance, overlap, business rules, workflow
export async function createLeaveRequest(
  token: string,
  dto: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveMode?: string;
    period?: string;
  },
): Promise<ToolCallResult> {
  // Validate input ก่อนส่ง
  if (!dto.leaveTypeId || !dto.startDate || !dto.endDate || !dto.reason) {
    return {
      success: false,
      error: 'ข้อมูลไม่ครบ: ต้องระบุประเภทการลา, วันเริ่ม, วันสิ้นสุด และเหตุผล',
    };
  }

  const startDate = new Date(dto.startDate);
  const endDate = new Date(dto.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { success: false, error: 'วันที่ไม่ถูกต้อง' };
  }

  if (startDate > endDate) {
    return { success: false, error: 'วันเริ่มต้นต้องไม่เกินวันสิ้นสุด' };
  }

  return callBackend('POST', '/leave', token, {
    ...dto,
    leaveMode: dto.leaveMode || 'full_day',
  });
}

// ─── Tool: ยกเลิกคำขอลา ───────────────────────────────────────────────────
export async function cancelLeaveRequest(
  token: string,
  requestId: string,
): Promise<ToolCallResult> {
  if (!requestId) {
    return { success: false, error: 'ต้องระบุ ID ของคำขอลาที่ต้องการยกเลิก' };
  }
  return callBackend('DELETE', `/leave/${requestId}`, token);
}
