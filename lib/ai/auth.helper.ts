/**
 * AI Auth Helper — Server-side only
 * ดึง JWT token จาก Request header เพื่อส่งต่อไปยัง NestJS Backend
 */

import { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  token: string;
}

/**
 * ดึง Auth Context จาก Request
 * ตรวจสอบ Authorization header และ decode JWT
 */
export function extractAuthContext(req: NextRequest): AuthContext | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) return null;

    const payload = jwtDecode<JwtPayload>(token);

    // ตรวจสอบว่า token ยังไม่หมดอายุ
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      token,
    };
  } catch {
    return null;
  }
}
