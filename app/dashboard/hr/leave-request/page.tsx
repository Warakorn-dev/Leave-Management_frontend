'use client';

import { LeaveRequestCreateForm } from '@/components/leave-form/LeaveRequestCreateForm';

/** Leave request form; same form for every role (components/leave-form). */
export default function HRLeaveRequestPage() {
  return (
    <LeaveRequestCreateForm
      statusPath="/dashboard/hr/leave-status"
      subtitle="กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเข้าสู่กระบวนการพิจารณา"
    />
  );
}
