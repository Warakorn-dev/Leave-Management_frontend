# เอกสารขอ Server: Frontend

## ชื่อระบบงาน

ระบบจัดการการลาพนักงาน (Frontend)

## วัตถุประสงค์ของ Server

Server นี้ใช้สำหรับให้บริการหน้าเว็บของระบบจัดการการลาพนักงาน โดยโปรเจกต์ frontend พัฒนาด้วย Next.js และ React

ผู้ใช้งานจะเข้าระบบผ่าน domain หลัก เช่น:

```text
https://leave.example.com
```

Frontend จะเรียก API ไปยัง Backend Server ผ่าน path `/api` หรือผ่าน backend domain ที่กำหนดใน environment variable

## เทคโนโลยีที่ใช้

```text
Next.js 16
React 19
Node.js 20 LTS
IIS
IIS URL Rewrite
Application Request Routing (ARR)
NSSM หรือ PM2
SSL Certificate
```

## ระบบปฏิบัติการ

```text
Windows Server 2022 Standard
หรือ
Windows Server 2025 Standard
```

## รายชื่อผู้ใช้งานเครื่อง

```text
Administrator
deploy
```

## Spec ที่แนะนำ

```text
CPU: 2 vCPU
RAM: 4 GB
Storage: 60 GB SSD
```

## Service / Application

```text
Node.js 20 LTS
Next.js Frontend
IIS Reverse Proxy
URL Rewrite
Application Request Routing (ARR)
NSSM หรือ PM2 สำหรับรัน service
SSL Certificate
```

## Port ที่ใช้

```text
Public HTTPS: 443
Internal Next.js: 3000
```

## Environment Variables

ตัวแปรสำคัญของ Frontend:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BACKEND_URL=https://api-leave.example.com
```

ถ้าองค์กรใช้ internal network แทน public backend domain สามารถตั้งเป็น:

```env
NEXT_PUBLIC_BACKEND_URL=http://10.0.0.20:8000
```

## Reverse Proxy

ผู้ใช้งานเข้า:

```text
https://leave.example.com
```

IIS reverse proxy ไปที่:

```text
http://127.0.0.1:3000
```

## Network

```text
Internet -> Server 1: TCP 443
Server 1 -> Server 2: TCP 443 หรือ TCP 8000
```

## Production Build

```powershell
cd C:\app\Leave-Management_frontend
npm ci
npm run build
npm run start
```

สำหรับ production ควรรันผ่าน NSSM หรือ PM2 ไม่ควรเปิด command prompt ค้างไว้

## Security

```text
ต้องใช้ HTTPS เท่านั้น
ไม่ควรเปิด port 3000 ออก internet โดยตรง
เปิด public เฉพาะ port 443
ตั้งค่า SSL certificate
จำกัดสิทธิ์ user deploy
ตรวจสอบว่า NEXT_PUBLIC_BACKEND_URL ชี้ไป backend production เท่านั้น
```

## Checklist

```text
[ ] ติดตั้ง Windows Server
[ ] ติดตั้ง Node.js 20 LTS
[ ] ติดตั้ง IIS
[ ] ติดตั้ง URL Rewrite
[ ] ติดตั้ง ARR
[ ] ตั้งค่า SSL certificate
[ ] ตั้งค่า NEXT_PUBLIC_BACKEND_URL
[ ] รัน npm ci
[ ] รัน npm run build
[ ] สร้าง Windows Service ด้วย NSSM หรือ PM2
[ ] ตั้ง IIS reverse proxy ไป port 3000
[ ] ทดสอบเข้า https://leave.example.com
[ ] ทดสอบ login
[ ] ทดสอบเรียก API ผ่าน frontend
```

## สรุป

Frontend Server สามารถแยกออกจาก Backend และ Database ได้โดยตรง เพราะโปรเจกต์มีการตั้งค่าให้ Next.js proxy request ไปยัง Backend Server ผ่าน environment variable แล้ว
