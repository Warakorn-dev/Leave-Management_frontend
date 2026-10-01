/**
 * Every dashboard page of every role opens without a JS error, a 5xx API
 * response, an error dialog or the Next.js error screen — and stays on the
 * page (RoleGuard does not bounce the right role away).
 */
import { expect, test } from '@playwright/test';
import { ACCOUNTS, loginAs, settle, watchForErrors, type Role } from './helpers';

const PAGES: Record<Role, string[]> = {
  employee: ['user/dashboard', 'user/request', 'user/status', 'user/history', 'user/calendar', 'user/settings'],
  manager: [
    'manager/dashboard',
    'manager/request',
    'manager/status',
    'manager/approve',
    'manager/history',
    'manager/team',
    'manager/calendar',
    'manager/settings',
  ],
  hr: [
    'hr/dashboard',
    'hr/dashboard/personal',
    'hr/leave-request',
    'hr/leave-status',
    'hr/leave-history',
    'hr/approval',
    'hr/cancel-approval',
    'hr/dept-approve',
    'hr/calendar',
    'hr/employees',
    'hr/employees/add',
    'hr/organization',
    'hr/departments',
    'hr/positions',
    'hr/leave-types',
    'hr/holidays',
    'hr/leave-summary',
    'hr/reports',
    'hr/announcements',
    'hr/settings',
  ],
  ceo: ['ceo/dashboard', 'ceo/approval', 'ceo/calendar', 'ceo/employees', 'ceo/report', 'ceo/settings'],
  admin: [
    'admin/dashboard',
    'admin/users',
    'admin/users-list',
    'admin/roles',
    'admin/audit-logs',
    'admin/captcha',
    'admin/security',
    'admin/system',
    'admin/settings',
  ],
};

for (const [role, pages] of Object.entries(PAGES) as [Role, string[]][]) {
  test(`${role}: all ${pages.length} pages open without errors`, async ({ page }) => {
    test.setTimeout(30_000 + pages.length * 15_000);
    const errors = watchForErrors(page);
    await loginAs(page, role);

    for (const p of pages) {
      const url = `/dashboard/${p}`;
      await test.step(url, async () => {
        await page.goto(url);
        await settle(page);
        expect(new URL(page.url()).pathname, `${url} should not redirect`).toBe(url);
        await expect(page.locator('main, [class*="flex-1"]').first()).toBeVisible();
        await errors.check(url);
      });
    }
    expect(errors.problems, errors.problems.join('\n')).toEqual([]);
  });
}

test('pages of another role are blocked', async ({ page }) => {
  await loginAs(page, 'employee');
  for (const url of ['/dashboard/hr/dashboard', '/dashboard/admin/users', '/dashboard/ceo/approval']) {
    await page.goto(url);
    await expect.poll(() => new URL(page.url()).pathname, { message: `${url} must redirect` }).not.toBe(url);
  }
});

test('dashboard pages redirect to login without a session', async ({ page }) => {
  await page.goto('/dashboard/user/dashboard');
  await page.waitForURL('**/login');
});

test('/dashboard sends every role to its own home page', async ({ page }) => {
  for (const role of ['employee', 'manager', 'hr', 'ceo', 'admin'] as Role[]) {
    await loginAs(page, role);
    await page.goto('/dashboard');
    await page.waitForURL(`**${ACCOUNTS[role].home}`);
  }
});
