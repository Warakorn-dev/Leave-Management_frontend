/**
 * Next.js API Route: POST /api/ai/chat
 * Server-side handler — API Key อยู่ที่นี่เท่านั้น ไม่ส่งไป Frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractAuthContext } from '@/lib/ai/auth.helper';
import { chat, ChatMessage } from '@/lib/ai/gemini.service';

// Rate limiting per user (in-memory, simple implementation)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '15', 10);

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const record = requestCounts.get(userId);
  if (!record || now > record.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authentication ──────────────────────────────────────────────────
    const authCtx = extractAuthContext(req);
    if (!authCtx) {
      return NextResponse.json(
        { error: 'Unauthorized: กรุณา Login ก่อนใช้งาน AI Assistant' },
        { status: 401 },
      );
    }

    // ── 2. Rate Limiting ──────────────────────────────────────────────────
    if (!checkRateLimit(authCtx.userId)) {
      return NextResponse.json(
        { error: `คุณส่งคำถามเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่ (จำกัด ${RATE_LIMIT} ครั้ง/นาที)` },
        { status: 429 },
      );
    }

    // ── 3. Parse & Validate Request Body ─────────────────────────────────
    let body: { message: string; history?: ChatMessage[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { message, history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'กรุณาพิมพ์ข้อความก่อน' },
        { status: 400 },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'ข้อความยาวเกินไป (สูงสุด 2000 ตัวอักษร)' },
        { status: 400 },
      );
    }

    // Validate history format
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: 'Invalid history format' }, { status: 400 });
    }

    // Limit history length (เก็บแค่ 6 messages ล่าสุด เพื่อประหยัด Token และโควต้า)
    const trimmedHistory = history.slice(-6);

    // ── 4. Call Gemini Service ────────────────────────────────────────────
    const reply = await chat(message.trim(), trimmedHistory, authCtx.token);

    // ── 5. Return Response ─────────────────────────────────────────────────
    // ห้ามส่ง token หรือ API key กลับไป
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('[AI Chat API] Error:', error);

    // ห้ามเปิดเผย error details ให้ client เห็น แต่ถ้าเป็น Rate Limit ให้บอกผู้ใช้
    const isKnownError =
      error instanceof Error &&
      (error.message.includes('GEMINI_API_KEY') ||
        error.message.includes('not configured'));

    if (isKnownError) {
      return NextResponse.json(
        { error: 'AI Service ยังไม่ได้รับการตั้งค่า กรุณาติดต่อ Admin' },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'โควต้าการใช้งาน AI เต็ม (Rate Limit) กรุณารอสัก 1 นาทีแล้วลองใหม่ครับ' },
        { status: 429 },
      );
    }

    if (error instanceof Error && error.message.includes('503')) {
      return NextResponse.json(
        { error: 'เซิร์ฟเวอร์ AI ทำงานหนักเกินไป กรุณารอสักครู่แล้วลองใหม่ครับ' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 },
    );
  }
}

// ปิด GET เพื่อป้องกัน information disclosure
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
