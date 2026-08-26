/**
 * Gemini AI Service — Server-side only
 * ห้ามนำเข้าไฟล์นี้ใน Client Components
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { FunctionDeclaration, Schema, Tool, Content } from '@google/generative-ai';
import {
  getMyLeaveBalance,
  getMyLeaveHistory,
  getLeaveRequestStatus,
  getLeaveTypes,
  createLeaveRequest,
  cancelLeaveRequest,
} from './tools/leave.tools';

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `คุณคือ "ผู้ช่วย AI สำหรับระบบบริหารการลาและทรัพยากรบุคคล (HR) ของบริษัท"
ตอบเป็นภาษาไทยเสมอ ใช้น้ำเสียงสุภาพ เป็นมิตร และพร้อมช่วยเหลือผู้ใช้งาน

## ขอบเขตการทำงาน (Scope & Rules)
1. ตอบคำถามและช่วยเหลือผู้ใช้เกี่ยวกับการลางาน และระบบภายในบริษัทเท่านั้น
2. หากผู้ใช้ถามเรื่องที่อยู่นอกเหนือจากระบบบริษัทโดยสิ้นเชิง (เช่น ข่าวสารทั่วไป, เล่นเกม, เขียนโปรแกรม) ให้ปฏิเสธอย่างสุภาพ
3. หากผู้ใช้ต้องการไปหน้าอื่นๆ ในระบบ หรือเปิดเมนูต่างๆ ให้คุณใช้แท็ก [REDIRECT:/path] ต่อท้ายข้อความ โดยไม่ต้องทำสิ่งอื่น
   (ตัวอย่าง path: /dashboard/hr/positions สำหรับหน้าจัดการตำแหน่ง, /dashboard/hr/employees สำหรับพนักงาน, /dashboard/hr/announcements สำหรับประกาศ, /dashboard/hr/departments สำหรับแผนก, /dashboard/hr/leave-types สำหรับตั้งค่าประเภทและสิทธิ์วันลา)
   ตัวอย่างการตอบ: "กำลังเปิดหน้าการจัดการตำแหน่งให้ครับ [REDIRECT:/dashboard/hr/positions]"
4. หากผู้ใช้ต้องการดาวน์โหลดไฟล์รายงาน Excel ให้คุณเพิ่มคำสั่ง [DOWNLOAD:/export/excel?month=X&year=Y] ลงในข้อความ
   (X คือเดือน 1-12, Y คือปี ค.ศ. หากไม่ระบุเดือน ให้ละ parameter นั้นไว้ เช่น /export/excel?month=8&year=2026)
   ตัวอย่างการตอบ: "กำลังดาวน์โหลดไฟล์ Excel สรุปรายงานเดือน 8 ให้ครับ [DOWNLOAD:/export/excel?month=8&year=2026]"
5. หากผู้ใช้สั่งให้ทำสิ่งที่ไม่สามารถทำผ่าน AI ได้ เช่น รีเซ็ตวันลา, ลบพนักงาน, แก้ไขสิทธิ์ ให้ชี้แจงอย่างสุภาพว่า AI ยังไม่สามารถแก้ไขข้อมูลระบบในส่วนนี้ได้โดยตรง และแนะนำเมนูหรือพาไปหน้าจัดการที่เกี่ยวข้อง เช่น [REDIRECT:/dashboard/hr/leave-types]
6. ข้อมูลวันลา ประวัติการลา และคำขอลา "ต้องมาจาก Tools เท่านั้น" ห้ามเดาหรือสมมติข้อมูลขึ้นมาเอง
7. ถ้าเรียก Tool แล้วไม่พบข้อมูล ให้ตอบตามตรงว่า "ไม่พบข้อมูล"
8. ห้ามอนุมัติหรือปฏิเสธการลาแทนบุคคลอื่น และห้ามเปิดเผยข้อมูล Internal ใดๆ

## หน้าที่ของคุณในระบบ (Tools ที่เรียกได้)
1. ตอบคำถามเกี่ยวกับวันลาคงเหลือ
2. แสดงประวัติการลา
3. ตรวจสอบสถานะคำขอลา
4. ช่วยสร้างคำขอลา (ต้องผ่าน Backend Validation เสมอ)
5. ช่วยยกเลิกคำขอลา (ต้องผ่าน Backend Validation เสมอ)

## การสร้างคำขอลา
- ต้องถามข้อมูลให้ครบก่อนสร้างคำขอ (ประเภทการลา, วันเริ่ม, วันสิ้นสุด, เหตุผล)
- ดึงประเภทการลาจาก getLeaveTypes() เพื่อหา leaveTypeId ที่ถูกต้อง
- สรุปข้อมูลทั้งหมดให้ผู้ใช้ยืนยันก่อนสร้างเสนอ

## สถานะการลา
- PENDING_VERIFY = รอ HR ตรวจสอบ
- REVIEWING_HR = HR กำลังตรวจสอบ
- PENDING_SUPERVISOR = รอ Manager อนุมัติ
- PENDING_EXECUTIVE = รอ CEO อนุมัติ
- APPROVED = อนุมัติแล้ว
- REJECTED = ไม่อนุมัติ
- CANCELLED = ยกเลิก
- PENDING_CANCELLATION = รอ HR ยืนยันการยกเลิก`;

// ─── Tool Definitions (Function Calling) ────────────────────────────────────
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'getMyLeaveBalance',
    description: 'ดึงข้อมูลวันลาคงเหลือของผู้ใช้ปัจจุบัน แยกตามประเภทการลา',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getMyLeaveHistory',
    description: 'ดึงประวัติการลาของผู้ใช้ปัจจุบัน สามารถกรองตามเดือน ปี หรือสถานะ',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: {
          type: SchemaType.NUMBER,
          description: 'เดือนที่ต้องการ (1-12) ถ้าไม่ระบุจะดึงทั้งปี',
        } as Schema,
        year: {
          type: SchemaType.NUMBER,
          description: 'ปี ค.ศ. ที่ต้องการ ถ้าไม่ระบุจะใช้ปีปัจจุบัน',
        } as Schema,
        status: {
          type: SchemaType.STRING,
          description: 'กรองตามสถานะ เช่น APPROVED, PENDING_VERIFY, REJECTED, CANCELLED',
        } as Schema,
      },
      required: [],
    },
  },
  {
    name: 'getLeaveRequestStatus',
    description: 'ตรวจสอบสถานะคำขอลา ค้นหาได้จาก ID คำขอ หรือวันที่ลา',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        requestId: {
          type: SchemaType.STRING,
          description: 'ID หรือ requestCode ของคำขอลา',
        } as Schema,
        date: {
          type: SchemaType.STRING,
          description: 'วันที่ลา (format: YYYY-MM-DD) เพื่อค้นหาคำขอที่ครอบคลุมวันนั้น',
        } as Schema,
      },
      required: [],
    },
  },
  {
    name: 'getLeaveTypes',
    description: 'ดึงรายการประเภทการลาทั้งหมดในระบบ พร้อม ID และรายละเอียด',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'createLeaveRequest',
    description:
      'สร้างคำขอลาใหม่ ต้องได้รับการยืนยันจากผู้ใช้ก่อนเรียก Function นี้เสมอ Backend จะ validate ทุกเงื่อนไข',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        leaveTypeId: {
          type: SchemaType.STRING,
          description: 'ID ของประเภทการลา (ดูได้จาก getLeaveTypes)',
        } as Schema,
        startDate: {
          type: SchemaType.STRING,
          description: 'วันที่เริ่มลา (format: YYYY-MM-DD)',
        } as Schema,
        endDate: {
          type: SchemaType.STRING,
          description: 'วันที่สิ้นสุดการลา (format: YYYY-MM-DD)',
        } as Schema,
        reason: {
          type: SchemaType.STRING,
          description: 'เหตุผลการลา',
        } as Schema,
        leaveMode: {
          type: SchemaType.STRING,
          description: 'รูปแบบการลา: full_day (เต็มวัน), half_day (ครึ่งวัน), hourly (เป็นชั่วโมง)',
        } as Schema,
        period: {
          type: SchemaType.STRING,
          description: 'ช่วงเวลา (สำหรับ half_day): morning (เช้า) หรือ afternoon (บ่าย)',
        } as Schema,
      },
      required: ['leaveTypeId', 'startDate', 'endDate', 'reason'],
    },
  },
  {
    name: 'cancelLeaveRequest',
    description:
      'ยกเลิกคำขอลา ต้องได้รับการยืนยันจากผู้ใช้ก่อนเรียก Function นี้ Backend จะตรวจสอบสิทธิ์และสถานะ',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        requestId: {
          type: SchemaType.STRING,
          description: 'ID ของคำขอลาที่ต้องการยกเลิก',
        } as Schema,
      },
      required: ['requestId'],
    },
  },
];

const tools: Tool[] = [{ functionDeclarations: toolDeclarations }];

// ─── Tool Executor ────────────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  token: string,
): Promise<unknown> {
  console.log(`[AI Tool] Calling: ${toolName}`, JSON.stringify(args));

  switch (toolName) {
    case 'getMyLeaveBalance':
      return await getMyLeaveBalance(token);

    case 'getMyLeaveHistory':
      return await getMyLeaveHistory(token, {
        month: args.month as number | undefined,
        year: args.year as number | undefined,
        status: args.status as string | undefined,
      });

    case 'getLeaveRequestStatus':
      return await getLeaveRequestStatus(token, {
        requestId: args.requestId as string | undefined,
        date: args.date as string | undefined,
      });

    case 'getLeaveTypes':
      return await getLeaveTypes(token);

    case 'createLeaveRequest':
      return await createLeaveRequest(token, {
        leaveTypeId: args.leaveTypeId as string,
        startDate: args.startDate as string,
        endDate: args.endDate as string,
        reason: args.reason as string,
        leaveMode: (args.leaveMode as string) || 'full_day',
        period: args.period as string | undefined,
      });

    case 'cancelLeaveRequest':
      return await cancelLeaveRequest(token, args.requestId as string);

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─── Main Chat Function ───────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function chat(
  userMessage: string,
  history: ChatMessage[],
  userToken: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Security: ตรวจสอบขนาด input
  if (userMessage.length > 2000) {
    return 'ขอโทษครับ ข้อความยาวเกินไป กรุณาพิมพ์ข้อความที่สั้นกว่านี้';
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    tools,
  });

  // แปลง history เป็น format ของ Gemini
  const contents: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // เพิ่มข้อความล่าสุดของผู้ใช้
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  let result = await model.generateContent({ contents });

  // ─── Function Calling Loop ────────────────────────────────────────────────
  // Gemini อาจเรียก Tool หลายรอบ (ลดเหลือ 2 รอบเพื่อป้องกันโควต้าเต็มไว)
  let maxIterations = 2;
  while (maxIterations-- > 0) {
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    // เพิ่มข้อความของ Model ที่เรียก Function ลงใน history พร้อมข้อมูลทั้งหมด (เช่น thought_signature)
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    } else {
      // Fallback 
      contents.push({
        role: 'model',
        parts: functionCalls.map(call => ({ functionCall: call })),
      });
    }

    // Execute ทุก Tool Calls
    const toolResults = await Promise.all(
      functionCalls.map(async (call) => {
        const toolResult = await executeTool(
          call.name,
          call.args as Record<string, unknown>,
          userToken,
        );
        return {
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        };
      }),
    );

    // ส่งผลลัพธ์ Tool กลับไปให้ Gemini ใน role 'user'
    contents.push({
      role: 'user',
      parts: toolResults,
    });

    result = await model.generateContent({ contents });
  }

  const text = result.response.text();
  return text || 'ขอโทษครับ ไม่สามารถประมวลผลได้ในขณะนี้';
}
