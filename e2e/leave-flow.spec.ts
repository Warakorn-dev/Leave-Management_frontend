/**
 * The leave workflow driven through the real web pages:
 *   employee files a leave (form) → HR verifies (hr/approval) → department
 *   head approves or rejects (manager/approve) → CEO decides special leave
 *   (ceo/approval) → the employee sees the result (user/status).
 * State is checked in the e2e database after every step.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  apiAs,
  db,
  latestLeaveOf,
  leaveStatus,
  loginAs,
  pickMonth,
  settle,
  watchForErrors,
  workingDays,
} from './helpers';

// Each test uses its own leave date, so one failure does not block the rest.
let dates: string[] = [];
test.beforeAll(async () => {
  // Start ~5 weeks out: past any advance-notice rule, and in a month the
  // approval pages have to be switched to (exercises the month picker).
  dates = await workingDays(6, 35);
});

const leaveTypeId = async (name: string) => (await db.leaveType.findFirstOrThrow({ where: { name } })).id;

/** Types a date into the MUI date field under `label` (DD/MM/Buddhist-year sections). */
async function fillDate(page: Page, label: string, iso: string) {
  const [y, m, d] = iso.split('-');
  const beYear = String(Number(y) + 543);
  const box = page.getByText(label, { exact: true }).locator('xpath=..');
  await box.getByRole('spinbutton', { name: 'Day' }).click();
  await page.keyboard.type(`${d}${m}${beYear}`, { delay: 30 });
  await expect(box.getByRole('spinbutton', { name: 'Year' })).toHaveText(beYear);
}

/** Files a one-day sick leave through the request form and returns its id. */
async function fileLeaveViaForm(page: Page, date: string, reason: string) {
  await page.goto('/dashboard/user/request');
  await settle(page);
  await page.locator('select').first().selectOption(await leaveTypeId('ลาป่วย'));
  await fillDate(page, 'วันที่เริ่มต้น', date);
  await fillDate(page, 'วันที่สิ้นสุด', date);
  await page.getByPlaceholder('ระบุเหตุผลที่ชัดเจน...').fill(reason);
  await page.getByRole('button', { name: 'ส่งคำขอลา' }).click();
  await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await page.waitForURL('**/dashboard/user/status');
  const leave = await latestLeaveOf('employee');
  expect(leave.reason).toBe(reason);
  expect(leave.startDate.toISOString().slice(0, 10)).toBe(date);
  return leave.id;
}

/** HR takes the request (รับเรื่องตรวจสอบ), opens it and approves or rejects. */
async function hrDecide(page: Page, date: string, action: 'approve' | 'reject', reason = '') {
  await page.goto('/dashboard/hr/approval');
  await settle(page);
  await pickMonth(page, date);
  await page.getByRole('button', { name: 'รับเรื่องตรวจสอบ' }).first().click();
  await page.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).first().click();
  if (action === 'approve') {
    await page.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
    await page.getByRole('button', { name: 'ยืนยันอนุมัติ' }).click();
  } else {
    await page.getByRole('button', { name: 'ไม่อนุมัติ', exact: true }).click();
    await page.getByPlaceholder('พิมพ์เหตุผลที่นี่...').fill(reason);
    await page.getByRole('button', { name: 'ยืนยันไม่อนุมัติ' }).click();
  }
}

/** Department head approves or rejects the only request of that month. */
async function managerDecide(page: Page, date: string, action: 'approve' | 'reject', reason = '') {
  await page.goto('/dashboard/manager/approve');
  await settle(page);
  await pickMonth(page, date);
  const row = page.locator('tbody tr').filter({ hasText: 'สมศักดิ์' }).first();
  if (action === 'approve') {
    await row.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
    await page.locator('.swal2-confirm').click();
  } else {
    await row.getByRole('button', { name: 'ไม่อนุมัติ', exact: true }).click();
    await page.locator('.swal2-textarea').fill(reason);
    await page.locator('.swal2-confirm').click();
  }
}

test('employee files leave → HR approves → manager approves → APPROVED', async ({ page }) => {
  const errors = watchForErrors(page);

  await loginAs(page, 'employee');
  const id = await fileLeaveViaForm(page, dates[0], 'ไม่สบาย (e2e ผ่านหน้าเว็บ)');
  expect(await leaveStatus(id)).toBe('PENDING_VERIFY');
  await expect(page.getByText('รอฝ่ายบุคคลตรวจสอบ').first()).toBeVisible();

  await loginAs(page, 'hr');
  await hrDecide(page, dates[0], 'approve');
  await expect.poll(() => leaveStatus(id)).toBe('PENDING_SUPERVISOR');

  await loginAs(page, 'manager');
  await managerDecide(page, dates[0], 'approve');
  await expect.poll(() => leaveStatus(id)).toBe('APPROVED');

  await loginAs(page, 'employee');
  await page.goto('/dashboard/user/status');
  await settle(page);
  await expect(page.getByText('หัวหน้าแผนกอนุมัติแล้ว').first()).toBeVisible();

  await errors.check('approve flow');
  expect(errors.problems, errors.problems.join('\n')).toEqual([]);
});

test('HR rejects with a reason → REJECTED', async ({ page }) => {
  const errors = watchForErrors(page);
  await loginAs(page, 'employee');
  const id = await fileLeaveViaForm(page, dates[1], 'ธุระ (e2e HR ไม่อนุมัติ)');

  await loginAs(page, 'hr');
  await hrDecide(page, dates[1], 'reject', 'เอกสารไม่ครบ (e2e)');
  await expect.poll(() => leaveStatus(id)).toBe('REJECTED');

  await loginAs(page, 'employee');
  await page.goto('/dashboard/user/status');
  await settle(page);
  await expect(page.getByText('ฝ่ายบุคคลไม่อนุมัติคำขอ').first()).toBeVisible();
  await expect(page.getByText('หมายเหตุ: เอกสารไม่ครบ (e2e)')).toBeVisible();
  expect(errors.problems, errors.problems.join('\n')).toEqual([]);
});

test('manager rejects with a reason → REJECTED', async ({ page }) => {
  const errors = watchForErrors(page);
  await loginAs(page, 'employee');
  const id = await fileLeaveViaForm(page, dates[2], 'ธุระ (e2e หัวหน้าไม่อนุมัติ)');

  await loginAs(page, 'hr');
  await hrDecide(page, dates[2], 'approve');
  await expect.poll(() => leaveStatus(id)).toBe('PENDING_SUPERVISOR');

  await loginAs(page, 'manager');
  await managerDecide(page, dates[2], 'reject', 'ช่วงนั้นงานเร่ง (e2e)');
  await expect.poll(() => leaveStatus(id)).toBe('REJECTED');

  await loginAs(page, 'employee');
  await page.goto('/dashboard/user/status');
  await settle(page);
  await expect(page.getByText('หัวหน้าแผนกไม่อนุมัติคำขอ').first()).toBeVisible();
  await expect(page.getByText('หมายเหตุ: ช่วงนั้นงานเร่ง (e2e)')).toBeVisible();
  expect(errors.problems, errors.problems.join('\n')).toEqual([]);
});

test('special leave reaches the CEO page and the CEO approves → APPROVED', async ({ page }) => {
  const errors = watchForErrors(page);
  // Getting a special leave to the CEO is covered above; set it up via the API.
  const asEmployee = await apiAs('employee');
  await asEmployee('POST', '/leave', {
    leaveTypeId: await leaveTypeId('ลาพักผ่อนประจำปี (พักร้อน)'),
    leaveMode: 'full_day',
    startDate: dates[3],
    endDate: dates[3],
    reason: 'พักร้อน (e2e CEO)',
  });
  const id = (await latestLeaveOf('employee')).id;
  await (await apiAs('hr'))('PUT', `/hr/leaves/${id}/verify`, { action: 'Approve' });
  await (await apiAs('manager'))('PUT', `/manager/approve/${id}`, {});
  expect(await leaveStatus(id)).toBe('PENDING_EXECUTIVE');

  await loginAs(page, 'ceo');
  await page.goto('/dashboard/ceo/approval');
  await settle(page);
  const row = page.locator('tbody tr').filter({ hasText: 'พักร้อน' }).first();
  await row.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await page.locator('.swal2-confirm').click();
  await expect.poll(() => leaveStatus(id)).toBe('APPROVED');
  expect(errors.problems, errors.problems.join('\n')).toEqual([]);
});
