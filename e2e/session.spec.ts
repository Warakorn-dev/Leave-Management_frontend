/**
 * Signing out and the sidebar profile.
 */
import { expect, test } from '@playwright/test';
import { ACCOUNTS, db, loginAs, type Role } from './helpers';
import { BACKEND_URL } from './env';

const userOf = (role: Role) => db.user.findFirstOrThrow({ where: { email: ACCOUNTS[role].username } });

for (const role of ['employee', 'manager', 'hr', 'ceo', 'admin'] as Role[]) {
  test(`${role}: ออกจากระบบ ends the session on the backend too`, async ({ page }) => {
    await loginAs(page, role);
    const oldToken = await page.evaluate(() => sessionStorage.getItem('accessToken'));
    expect(oldToken).toBeTruthy();
    const before = await userOf(role);
    expect(before.refreshToken).toBeTruthy();

    await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
    await page.waitForURL('**/login');

    // Nothing of the session is left in the browser …
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
    // … and the backend revoked it: refresh token cleared, old access token dead.
    await expect.poll(async () => (await userOf(role)).tokenVersion).toBeGreaterThan(before.tokenVersion);
    expect((await userOf(role)).refreshToken).toBeNull();
    const res = await fetch(`${BACKEND_URL}/api/auth/password-status`, {
      headers: { Authorization: `Bearer ${oldToken}` },
    });
    expect(res.status).toBe(401);

    // No "session expired" popup on the way out.
    await expect(page.locator('.swal2-popup')).toHaveCount(0);
  });
}

test('HR sidebar keeps the department-head menu when /leave/me fails', async ({ page }) => {
  await loginAs(page, 'hr');
  const deptApprove = page.getByRole('link', { name: 'อนุมัติการลา (หัวหน้าแผนก)' });
  await expect(deptApprove).toBeVisible(); // the seeded HR user is a Leader

  // Profile request fails from now on; the stored profile must survive a reload.
  await page.route('**/api/leave/me', (route) => route.fulfill({ status: 500, body: '{"success":false}' }));
  await page.reload();
  // axios reports each 500 in a modal dialog (AuthContext re-polls every 5 s),
  // which hides the page from role queries — so look the link up by href.
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await expect(page.locator('a[href="/dashboard/hr/dept-approve"]')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('position'))).toContain('Leader');
});

test('ออกจากระบบ still revokes the session when the access token has expired', async ({ page }) => {
  await loginAs(page, 'employee');
  const before = await userOf('employee');
  // An unusable access token behaves like an expired one (401); the refresh token is still valid.
  await page.evaluate(() => sessionStorage.setItem('accessToken', 'expired.access.token'));
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await page.waitForURL('**/login');
  await expect.poll(async () => (await userOf('employee')).refreshToken).toBeNull();
  expect((await userOf('employee')).tokenVersion).toBeGreaterThan(before.tokenVersion);
});

test('one shared /leave/me poll per page (sidebar + page + context)', async ({ page }) => {
  const calls: number[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/leave/me')) calls.push(Date.now());
  });
  await loginAs(page, 'hr');
  await page.goto('/dashboard/hr/dashboard');
  calls.length = 0;
  await page.waitForTimeout(11_000);
  // One poll every 5 s → 2 or 3 in 11 s; each extra consumer used to add its own.
  expect(calls.length).toBeLessThanOrEqual(3);
});

test('admin pages do not call /leave/me (admins have no employee profile)', async ({ page }) => {
  let calls = 0;
  page.on('request', (req) => {
    if (req.url().includes('/api/leave/me')) calls++;
  });
  await loginAs(page, 'admin');
  await page.waitForTimeout(6_000);
  expect(calls).toBe(0);
  await expect(page.locator('.swal2-popup')).toHaveCount(0);
});

test('a sidebar collapsed by hand stays collapsed while the window is resized', async ({ page }) => {
  await loginAs(page, 'hr');
  const sidebar = page.locator('aside').first();
  const toggle = sidebar.locator('button[title="ปิดเมนู"], button[title="เปิดเมนู"]').first();
  await expect(sidebar).toHaveClass(/w-\[280px\]/); // wide screen → expanded

  await toggle.click();
  await expect(sidebar).toHaveClass(/w-\[80px\]/);
  await page.setViewportSize({ width: 1300, height: 900 }); // still wide: keep the user's choice
  await page.waitForTimeout(300);
  await expect(sidebar).toHaveClass(/w-\[80px\]/);

  await page.setViewportSize({ width: 800, height: 900 }); // crossed below 1024 → collapsed
  await page.setViewportSize({ width: 1440, height: 900 }); // crossed back → expanded
  await expect(sidebar).toHaveClass(/w-\[280px\]/);
});
