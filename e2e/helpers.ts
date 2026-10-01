import { createRequire } from 'module';
import * as path from 'path';
import { expect, type Page, type Response } from '@playwright/test';
import { BACKEND_DIR, BACKEND_URL, e2eDatabaseUrl } from './env';

// The e2e database is read with the backend's own Prisma client.
const backendRequire = createRequire(path.join(BACKEND_DIR, 'package.json'));
const { PrismaClient } = backendRequire('@prisma/client') as typeof import('../../Leave-Management_backend/node_modules/@prisma/client');
export const db = new PrismaClient({ datasourceUrl: e2eDatabaseUrl() });

export type Role = 'employee' | 'manager' | 'hr' | 'ceo' | 'admin';

/** Seeded accounts (prisma/seed.ts + seed-admin.js in the backend). */
export const ACCOUNTS: Record<Role, { username: string; password: string; home: string; name?: string }> = {
  employee: { username: 'user@company.com', password: 'password1234', home: '/dashboard/user/dashboard', name: 'สมศักดิ์' },
  manager: { username: 'manager@company.com', password: 'password1234', home: '/dashboard/manager/dashboard' },
  hr: { username: 'hrmanager@company.com', password: 'password1234', home: '/dashboard/hr/dashboard' },
  ceo: { username: 'ceo@company.com', password: 'password1234', home: '/dashboard/ceo/dashboard' },
  admin: { username: 'admin@admin.com', password: 'admin1234', home: '/dashboard/admin/dashboard' },
};

async function captchaCode(captchaId: string): Promise<string> {
  const row = await db.captcha.findUnique({ where: { id: captchaId } });
  if (!row) throw new Error(`captcha ${captchaId} not found in the e2e database`);
  return row.captchaCode;
}

/** Logs in through the real login page (the CAPTCHA answer is read from the e2e DB). */
export async function loginAs(page: Page, role: Role) {
  const account = ACCOUNTS[role];
  const captchaIds: string[] = [];
  const onResponse = async (res: Response) => {
    if (res.request().method() !== 'GET' || !res.url().includes('/api/auth/captcha')) return;
    const body = await res.json().catch(() => null);
    const id = body?.data?.captcha_id ?? body?.captcha_id;
    if (id) captchaIds.push(id);
  };
  page.on('response', onResponse);

  await page.goto('/login');
  await expect.poll(() => captchaIds.length, { message: 'login page loads a CAPTCHA' }).toBeGreaterThan(0);
  await page.getByPlaceholder('Enter your username').fill(account.username);
  await page.getByPlaceholder('Enter your password').fill(account.password);
  await page.getByPlaceholder('Enter CAPTCHA').fill(await captchaCode(captchaIds[captchaIds.length - 1]));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**${account.home}`, { timeout: 30_000 });
  page.off('response', onResponse);
}

/**
 * Collects problems while a page is used: uncaught JS errors, 5xx API
 * responses, SweetAlert error dialogs and the Next.js error screen.
 */
export function watchForErrors(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (err) => problems.push(`JS error: ${err.message}`));
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 500) {
      problems.push(`HTTP ${res.status()} ${res.request().method()} ${new URL(res.url()).pathname}`);
    }
  });
  return {
    problems,
    async check(where: string) {
      const errorDialog = page.locator('.swal2-popup .swal2-icon-error:visible');
      if (await errorDialog.count()) {
        const text = await page.locator('.swal2-popup').innerText().catch(() => '');
        problems.push(`error dialog on ${where}: ${text.replace(/\s+/g, ' ').trim()}`);
      }
      const body = await page.locator('body').innerText().catch(() => '');
      if (/Application error|Unhandled Runtime Error|This page could not be found/.test(body)) {
        problems.push(`error screen on ${where}`);
      }
    },
  };
}

/** Waits until the page has settled (polling pages never go fully idle). */
export async function settle(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
}

/** Future working days (Mon–Fri, not a seeded public holiday), from `fromDays` ahead. */
export async function workingDays(count: number, fromDays: number): Promise<string[]> {
  const holidays = new Set(
    (await db.publicHoliday.findMany()).map((h: { date: Date }) => h.date.toISOString().slice(0, 10)),
  );
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + fromDays);
  while (out.length < count) {
    const iso = d.toISOString().slice(0, 10);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && !holidays.has(iso)) out.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export async function leaveStatus(id: string): Promise<string> {
  return (await db.leaveRequest.findUniqueOrThrow({ where: { id } })).status;
}

/** Latest leave request of a seeded account. */
export async function latestLeaveOf(role: Role) {
  const emp = await db.employee.findFirstOrThrow({ where: { user: { email: ACCOUNTS[role].username } } });
  return db.leaveRequest.findFirstOrThrow({ where: { employeeId: emp.id }, orderBy: { createdAt: 'desc' } });
}

/** Backend call as a seeded user (for setting up data a test is not about). */
export async function apiAs(role: Role) {
  const captcha = await (await fetch(`${BACKEND_URL}/api/auth/captcha`)).json();
  const captchaId = captcha.data.captcha_id as string;
  const login = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ACCOUNTS[role].username,
      password: ACCOUNTS[role].password,
      captchaId,
      captchaInput: await captchaCode(captchaId),
    }),
  });
  const token = (await login.json()).data.accessToken as string;
  return async (method: string, url: string, body?: unknown) => {
    const res = await fetch(`${BACKEND_URL}/api${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${await res.text()}`);
    return res.json();
  };
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/**
 * Approval pages list one month at a time (by leave start date). Opens the
 * month picker and chooses the month of `isoDate`.
 */
export async function pickMonth(page: Page, isoDate: string) {
  const [y, m] = isoDate.split('-').map(Number);
  // The picker button is the first rounded button holding a Buddhist-era year.
  await page.getByRole('button', { name: /25\d\d/ }).first().click();
  const yearLabel = page.locator('span').filter({ hasText: /^25\d\d$/ }).first();
  for (let i = 0; i < 3; i++) {
    const shown = Number(await yearLabel.innerText()) - 543;
    if (shown === y) break;
    const nav = yearLabel.locator('xpath=..').getByRole('button');
    await nav.nth(shown < y ? 1 : 0).click();
  }
  await page.getByRole('button', { name: THAI_MONTHS[m - 1], exact: true }).click();
}
