# Server Request Document: Frontend

## System Name

Employee Leave Management System (Frontend)

## Server Purpose

This server hosts the web frontend of the Employee Leave Management System. The frontend is built with Next.js and React.

Users access the system through the main domain, for example:

```text
https://leave.example.com
```

The frontend sends API requests to the Backend Server through `/api` or through the backend URL configured in the environment variables.

## Technology Stack

```text
Next.js 16
React 19
Node.js 20 LTS
IIS
IIS URL Rewrite
Application Request Routing (ARR)
NSSM or PM2
SSL Certificate
```

## Operating System

```text
Windows Server 2022 Standard
or
Windows Server 2025 Standard
```

## Server Users

```text
Administrator
deploy
```

## Recommended Specification

```text
CPU: 2 vCPU
RAM: 4 GB
Storage: 60 GB SSD
```

## Services / Applications

```text
Node.js 20 LTS
Next.js Frontend
IIS Reverse Proxy
URL Rewrite
Application Request Routing (ARR)
NSSM or PM2 for service management
SSL Certificate
```

## Ports

```text
Public HTTPS: 443
Internal Next.js: 3000
```

## Environment Variables

Required frontend environment variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BACKEND_URL=https://api-leave.example.com
```

If the organization prefers internal network routing, the backend URL can be:

```env
NEXT_PUBLIC_BACKEND_URL=http://10.0.0.20:8000
```

## Reverse Proxy

User-facing URL:

```text
https://leave.example.com
```

IIS reverse proxy target:

```text
http://127.0.0.1:3000
```

## Network

```text
Internet -> Server 1: TCP 443
Server 1 -> Server 2: TCP 443 or TCP 8000
```

## Production Build

```powershell
cd C:\app\Leave-Management_frontend
npm ci
npm run build
npm run start
```

For production, the application should run through NSSM or PM2 instead of an open command prompt.

## Security

```text
HTTPS is required
Do not expose port 3000 directly to the internet
Expose only port 443 publicly
Configure SSL certificate
Restrict deploy user permissions
Ensure NEXT_PUBLIC_BACKEND_URL points only to the production backend
```

## Checklist

```text
[ ] Install Windows Server
[ ] Install Node.js 20 LTS
[ ] Install IIS
[ ] Install URL Rewrite
[ ] Install ARR
[ ] Configure SSL certificate
[ ] Configure NEXT_PUBLIC_BACKEND_URL
[ ] Run npm ci
[ ] Run npm run build
[ ] Create Windows Service using NSSM or PM2
[ ] Configure IIS reverse proxy to port 3000
[ ] Test https://leave.example.com
[ ] Test login
[ ] Test API calls through frontend
```

## Summary

The Frontend Server can be separated from the Backend and Database Servers because the project already supports backend routing through a configurable environment variable.
