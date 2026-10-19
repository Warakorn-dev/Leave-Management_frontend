'use client';

import { LeaveRequestCreateForm } from '@/components/leave-form/LeaveRequestCreateForm';

/** Leave request form; same form for every role (components/leave-form). */
export default function RequestLeavePage() {
  return (
    <LeaveRequestCreateForm
      statusPath="/dashboard/user/status"
      subtitle="กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งให้หัวหน้าแผนกอนุมัติ"
    />
  );
}
