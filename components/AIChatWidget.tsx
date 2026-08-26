'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, RotateCcw } from 'lucide-react';

import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface HistoryEntry {
  role: 'user' | 'model';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'ฉันเหลือวันลากี่วัน?',
  'เดือนนี้ฉันลาไปกี่วัน?',
  'ใบลาล่าสุดของฉันถึงไหนแล้ว?',
  'ฉันต้องการลาพักร้อน ช่วยได้ไหม?',
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export default function AIChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const token = getToken();
      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '⚠️ กรุณา Login เข้าสู่ระบบก่อนใช้งาน AI Assistant',
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      // เพิ่ม user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      setHasError(false);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmed, history }),
          signal: AbortSignal.timeout(60000),
        });

        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

        if (!res.ok) {
          throw new Error(data.error || data.message || `เกิดข้อผิดพลาด (${res.status})`);
        }

        let aiReply = data.reply as string;

        // --- 1. ตรวจจับคำสั่ง REDIRECT เปลี่ยนหน้าเว็บ ---
        const redirectMatch = aiReply.match(/\[REDIRECT:(.+?)\]/);
        if (redirectMatch) {
          const path = redirectMatch[1];
          router.push(path);
          aiReply = aiReply.replace(/\[REDIRECT:.+?\]/g, '').trim();
          if (!aiReply) aiReply = 'กำลังพาคุณไปยังหน้าต่างที่ต้องการครับ...';
        }

        // --- 2. ตรวจจับคำสั่ง DOWNLOAD ไฟล์ ---
        const downloadMatch = aiReply.match(/\[DOWNLOAD:(.+?)\]/);
        if (downloadMatch) {
          const endpoint = downloadMatch[1];
          aiReply = aiReply.replace(/\[DOWNLOAD:.+?\]/g, '').trim();
          if (!aiReply) aiReply = 'กำลังสร้างไฟล์ให้คุณครับ กรุณารอสักครู่...';
          
          // ดาวน์โหลดไฟล์ผ่าน Fetch พร้อม JWT Token
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          .then(res => {
            if (!res.ok) throw new Error('Download failed');
            return res.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = endpoint.includes('excel') ? 'leave_report.xlsx' : 'leave_report.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          })
          .catch(err => console.error('Failed to download file:', err));
        }

        // เพิ่ม AI message
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // อัปเดต history
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: trimmed },
          { role: 'model', content: aiReply },
        ]);
      } catch (err: unknown) {
        let errMsg = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        if (err instanceof Error) {
          if (err.message.includes('timed out') || err.message.includes('AbortError')) {
            errMsg = 'ใช้เวลานานเกินไป กรุณาลองใหม่';
          } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            errMsg = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบการเชื่อมต่อ';
          } else {
            errMsg = err.message;
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `❌ ${errMsg}`,
            timestamp: new Date(),
            isError: true,
          },
        ]);
        setHasError(true);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [isLoading, history],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setHistory([]);
    setInput('');
    setHasError(false);
  };

  if (!mounted) return null;

  const chatWidth = isExpanded ? 'w-[480px]' : 'w-[360px]';
  const chatHeight = isExpanded ? 'h-[620px]' : 'h-[500px]';

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col items-end gap-3">
      {/* ── Chat Panel ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`${chatWidth} ${chatHeight} flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-white dark:bg-slate-900 transition-all duration-200`}
          style={{ animation: 'slideUp 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">AI Leave Assistant</p>
                <p className="text-[10px] text-white/70 mt-0.5">ผู้ช่วยระบบการลา</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={resetChat}
                  title="ล้างการสนทนา"
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'ย่อ' : 'ขยาย'}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-900">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    สวัสดีครับ! ฉันคือ AI Assistant
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    ช่วยตรวจสอบวันลา ดูสถานะ <br />
                    หรือยื่นคำขอลาได้เลยครับ
                  </p>
                </div>
                {/* Suggested Questions */}
                <div className="w-full space-y-1.5 mt-1">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
            {hasError && (
              <p className="text-xs text-red-500 mb-2 text-center">
                เกิดข้อผิดพลาด{' '}
                <button
                  onClick={resetChat}
                  className="underline hover:text-red-700"
                >
                  ล้างการสนทนา
                </button>
              </p>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="พิมพ์คำถามเกี่ยวกับวันลา... (Enter เพื่อส่ง)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2.5 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
              Shift+Enter เพื่อขึ้นบรรทัดใหม่
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        id="ai-chat-toggle-btn"
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
        aria-label="เปิด AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        {/* Pulse indicator */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-violet-500" />
          </span>
        )}
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
