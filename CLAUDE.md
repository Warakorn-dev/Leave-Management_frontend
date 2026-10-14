# Frontend — Leave-Management Web (Next.js)

ภาพรวมทั้งระบบและ workflow ใบลาอยู่ที่ [`../CLAUDE.md`](../CLAUDE.md) — ไฟล์นี้เน้นรายละเอียดฝั่ง frontend

> ⚠️ **Next.js 16 มี breaking changes** (จาก `AGENTS.md`): ก่อนเขียนโค้ดที่ใช้ API ของ Next ให้อ่านคู่มือใน `node_modules/next/dist/docs/` และระวัง deprecation notice

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (`components/ui`, config ใน `components.json`) · MUI 9 + `@mui/x-date-pickers` (dayjs) · axios · SweetAlert2 · recharts · react-hook-form + zod · jspdf / xlsx (export ฝั่ง client) · lucide-react · ฟอนต์ Sarabun (`public/fonts`)

## คำสั่ง
```bash
npm run dev            # http://localhost:3000 (bind 0.0.0.0) — backend default http://127.0.0.1:8000
npm run build          # ต้องตั้ง NEXT_PUBLIC_BACKEND_URL ตอน build production (ไม่งั้น build fail)
npm start
npm run lint
npm run test:e2e       # Playwright (ดูหัวข้อ E2E)
npm run test:e2e:demo  # เปิด Chrome จริงแบบช้าให้ดูตาม
npm run test:e2e:report
```

## Environment
- `NEXT_PUBLIC_BACKEND_URL` (หรือ `NEXT_PUBLIC_API_URL`) — URL ของ backend ใช้ใน `next.config.ts` rewrites เท่านั้น; **ฝังตอน build** แก้แล้วต้อง build ใหม่
- `NEXT_DIST_DIR` — เปลี่ยนโฟลเดอร์ build (e2e ใช้ `.next-e2e`)
- Dev: `.env.local`; Production: `.env.production.local` (ตัวอย่างใน `.env.production.example`)

## การเรียก API
- **Browser เรียกผ่าน path `/api/...` เสมอ** — `next.config.ts` rewrite `/api/*` และ `/uploads/*` ไปที่ backend (ห้ามใส่ URL backend ตรงในโค้ด client)
- `lib/api/axios.ts` (export เป็น `axiosInstance`): `baseURL: '/api'`, แนบ `Authorization: Bearer <accessToken>` จาก `sessionStorage`, interceptor จัดการ:
  - 401 → ลอง `POST /api/auth/refresh` (refresh token เป็น Bearer) แล้วยิงซ้ำ; ไม่สำเร็จ → popup session หมดอายุ
  - `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED` → popup แล้ว `sessionStorage.clear()` + กลับ `/login`
  - 400/403/409 ฯลฯ → แสดง SweetAlert ให้อัตโนมัติ
- Backend ห่อทุก response เป็น `{ success, message, data }` → ข้อมูลจริงอยู่ที่ `res.data.data` (axios) หรือ `json.data` (fetch)
- hooks ใน `hooks/` (`useLeave`, `useEmployee`, `useDashboard`, `useLeaveBalance`, `useLeaveType`, `useDepartment`, `usePosition`, `useNotification`, `useRoles`) — **ไม่ได้ใช้ react-query** แม้ชื่อจะเป็น `use...Query` / `use...Mutation`; บาง hook (เช่น mutation ใน `useLeave.ts`) และบางหน้า (`manager/approve`, `ceo/approval`, `hr/dept-approve`, `hr/employees`, `hr/reports`, `admin/users`) ใช้ `fetch('/api/...')` แนบ token เอง
- `lib/api/*.api.ts` เป็น wrapper axios แยกตาม domain — ⚠️ บางตัวเป็นโค้ดเก่าที่ endpoint ไม่ตรง backend แล้ว (เช่น `leaveApi.createLeave` → `/leave/request`, `getAllLeaves('CEO')` → `/ceo/leaves` ซึ่งไม่มีจริง) ก่อนใช้ให้เทียบกับ controller ใน backend
- `lib/api/store.ts` = โค้ดเก่า (mock types + วันหยุดไทยแบบ hard-code) ยังถูกใช้โดย `lib/leaveDuration.ts` (`calculateLeaveDays`); วันหยุดจริงมาจาก backend (`/leave/holidays`, `/hr/holidays`)

## Auth & Session
- Login (`app/login/page.tsx`): captcha จาก `/api/auth/captcha`, lockout modal (`lib/loginLockout.ts`, `LoginLockoutModal`)
- เก็บใน **`sessionStorage`** (ไม่ใช่ cookie): `accessToken`, `refreshToken`, `userId`, `role`, `username`, `fullName`, `department`, `position`, `email`, `employeeId`, `profilePic`
- `role` เก็บตามชื่อจาก backend (`Employee`/`Manager`/`HR`/`CEO`/`Admin`) แต่ **อ่านแบบ `.toLowerCase()` เสมอ**
- Logout: `endSession()` ใน `lib/session.ts` (เคลียร์ local ก่อน แล้วเรียก `/api/auth/logout`)
- Idle timeout: `IdleTimeoutGuard` + `lib/idleState.ts` ดึงนาทีจาก `GET /api/auth/config` (default 60); ระหว่าง popup idle มี flag `sessionStorage.idleTimeoutTriggered` ที่ guard อื่นต้องเคารพ
- `context/AuthContext.tsx` ให้ข้อมูล user จาก sessionStorage + `/leave/me` (Admin ไม่มีโปรไฟล์ employee → ข้าม)
- การตรวจสิทธิ์จริงอยู่ที่ backend เสมอ — ฝั่ง frontend เป็นแค่การแยกเมนู/หน้า

## Routing ตาม role (`app/`)
- `/` → redirect `/login`; `/forgot-password`, `/reset-password`
- `app/dashboard/layout.tsx` = `AuthProvider` → `IdleTimeoutGuard` → `DashboardShell`
- `dashboard-shell.tsx` บังคับ path prefix ตาม role และเลือก sidebar: `sidebar-user`, `ManagerSidebar`, `HRSidebar`, `sidebar-ceo`, `AdminSidebar`
- `RoleGuard` (`allowedRoles` เป็น lowercase) ใช้เพิ่มในบางหน้า (เช่น admin/users)

| พื้นที่ | Role | หน้า (`app/dashboard/<พื้นที่>/<หน้า>/page.tsx`) |
|---|---|---|
| `user` | Employee | dashboard, request, status, history, calendar, settings |
| `manager` | Manager | dashboard, request, status, history, approve, team, calendar, settings |
| `hr` | HR | dashboard (+ `dashboard/personal`), approval (ตรวจ PENDING_VERIFY), cancel-approval, dept-approve (HR ที่เป็นหัวหน้าแผนก), leave-request, leave-status, leave-history, leave-summary, employees (+ `employees/add`), departments, positions, organization, leave-types, holidays, announcements, reports, calendar, settings |
| `ceo` | CEO | dashboard, approval, employees, report, calendar, settings (ไม่มีหน้ายื่นลา) |
| `admin` | Admin | dashboard, users, users-list, roles, security, settings, system, audit-logs, captcha |

- `app/test/page.tsx` = หน้าทดลอง; `hr/approval/page_backup.txt` = ไฟล์สำรองเก่า (ไม่ได้ใช้)
- Notification ที่ backend ส่งมามี `redirectUrl` ชี้ path เหล่านี้ — เปลี่ยนชื่อ route ต้องแก้ backend (`leave-history-url.ts` และจุดสร้าง notification) ด้วย

## Logic สำคัญใน `lib/`
- `leaveRoute.ts` — timeline สถานะ (HR → หัวหน้า → CEO) จากประวัติ `approvals`: `stageStatus`, `showExecutiveStep`, `rejectedAtStage`, `rejectionComment`
- `leavePortions.ts` — คำนวณช่องเช้า/บ่ายที่ว่างก่อนยื่นลา (`analyzeRange`, `buildTakenMap`, `isDayUnavailable`); `LeaveMode = full_day | half_day | hourly` — ต้องสอดคล้องกับ `leave-portion.util.ts` ฝั่ง backend
- `leaveDuration.ts` — แสดงช่วงวันที่/ระยะเวลาลา
- `api/utils.ts` — `cn()`, `getLeaveStatusText()` (ข้อความไทยของแต่ละสถานะ), `getLeaveStatusBadgeColor()`, `resolveAssetUrl()`, `getErrorMessage()`
- `roleForPosition.ts` — สำเนากฎเดียวกับ backend (ใช้เตือน HR ก่อนบันทึก เซิร์ฟเวอร์เป็นคนตัดสิน)
- `escapeHtml.ts` — **ต้องใช้ทุกครั้ง** ที่ใส่ข้อมูลผู้ใช้ลงใน `Swal.fire({ html })` หรือ HTML string; `safeDataUrlKind` ตรวจไฟล์แนบ base64
- `api/attachmentPreview.ts` — `previewAttachment()` เปิดดูไฟล์แนบ (data URL)

## Components หลัก
- `LeaveDetailModal`, `ceo/CeoLeaveDetailModal` — รายละเอียดใบลา
- `LeaveActions` — UI กลางของคอลัมน์ "สถานะ" + "การดำเนินการ" ในตารางอนุมัติ (Manager/HR/CEO) มี `LeaveStatusBadge`; ปุ่มจะแสดงเฉพาะเมื่อหน้าส่ง handler มา
- Modal แก้ใบลา: `user/UserLeaveEditFormModal`, `manager/ManagerLeaveEditFormModal`, `hr/LeaveEditFormModal`
- `hr/employees/*` (EditEmployee, LeaveBalance), `hr/organization/*` (แผนก/ตำแหน่ง)
- `ThaiCalendarPicker`, `DateAndTime/*` (DatePicker, TimePicker, DateTimePicker), `LeaveTimePicker`, `LeaveDayAvailabilityPreview`
- `NotificationDropdown`, `RealtimeClock`, `ChangePasswordCard`

## แนวทางเขียนโค้ด
- หน้าใน dashboard เป็น client component (`"use client"`) เพราะพึ่ง `sessionStorage`
- Import ผ่าน alias `@/` (เช่น `@/lib/api/utils`, `@/hooks/useLeave`)
- ข้อความ UI เป็นภาษาไทย; แจ้งเตือนด้วย SweetAlert2
- แสดงสถานะด้วย `getLeaveStatusText` / `getLeaveStatusBadgeColor` แทนการเขียน mapping ใหม่
- ขนาดไฟล์อัปโหลดสูงสุด 2 MB (ต้องตรงกับ backend)
- `dashboard-shell` บังคับธีมสว่าง (ลบ class `dark`); สีหลักพื้นหลัง `#0B0F4E`

## E2E (Playwright)
- `playwright.config.ts` สตาร์ตทุกอย่างเอง: รีเซ็ต + seed DB → backend จาก source ที่ port **8100** (`DISABLE_RATE_LIMIT=true`, SMTP ปิด) → `next build` + `next start` port **3100** (dist `.next-e2e`)
- DB ใช้ชื่อเดียวกับ backend `.env` แต่เปลี่ยนเป็น `leave_management_e2e` (หรือ `E2E_DATABASE_URL`) — **ชื่อต้องลงท้าย `_e2e`** เพราะถูกล้างทุกครั้ง
- workers = 1 (ใช้ DB ร่วมกัน), locale `th-TH`, timezone `Asia/Bangkok`
- Specs: `e2e/leave-flow.spec.ts`, `pages.spec.ts`, `session.spec.ts`; helper ใน `e2e/helpers.ts`

## Deploy
- Windows Server + IIS reverse proxy → `next start` :3000 (PM2 `ecosystem.config.js` หรือ NSSM); config ใน `deploy/iis/`
- เอกสาร: `docs/frontend-server-th.md`, `docs/frontend-server-en.md`
- `allowedDevOrigins` ใน `next.config.ts` มี IP ในวง LAN สำหรับ dev
