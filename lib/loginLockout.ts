/**
 * Browser-side lockout countdown for the login page.
 *
 * The server never says "this account is locked" (that would reveal which
 * usernames exist). Instead it states its global policy in the generic error,
 * e.g. "…ผิดติดต่อกัน 5 ครั้ง … ชั่วคราว 15 นาที". The page counts failed
 * attempts per typed username in this browser and, when the count reaches the
 * policy limit, shows a countdown — the same for every username, existing or
 * not, so nothing leaks. For a real account the timing matches the server's
 * lock, which starts on that same failed attempt.
 */

const STORAGE_KEY = 'login-lockout';
const DEFAULT_POLICY = { maxAttempts: 5, lockoutMinutes: 15 };

type Entry = { fails: number; lockedUntil?: number; totalMs?: number; maxAttempts?: number };

/** An active countdown: when it ends, its full length, and the attempt limit it came from. */
export type LockState = { until: number; totalMs: number; maxAttempts: number };
type Store = Record<string, Entry>;

const keyOf = (username: string) => username.trim().toLowerCase();

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}
function write(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable (private mode): the countdown just won't persist
  }
}

/** True when the error is the server's generic wrong-credentials answer. */
export function isCredentialFailure(message: string): boolean {
  return message.startsWith('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
}

/** Reads the lockout policy the server states in its generic message. */
export function parseLockoutPolicy(message: string) {
  const m = /ติดต่อกัน\s*(\d+)\s*ครั้ง[\s\S]*?(\d+)\s*นาที/.exec(message);
  return m
    ? { maxAttempts: Number(m[1]), lockoutMinutes: Number(m[2]) }
    : DEFAULT_POLICY;
}

/** The running countdown for this username, or null. */
export function getLockState(username: string, now = Date.now()): LockState | null {
  if (!username.trim()) return null;
  const store = read();
  const entry = store[keyOf(username)];
  if (!entry?.lockedUntil) return null;
  if (entry.lockedUntil > now) {
    return {
      until: entry.lockedUntil,
      totalMs: entry.totalMs ?? entry.lockedUntil - now,
      maxAttempts: entry.maxAttempts ?? DEFAULT_POLICY.maxAttempts,
    };
  }
  delete store[keyOf(username)]; // countdown over: start fresh
  write(store);
  return null;
}

/**
 * Counts one failed attempt. Returns the new countdown when this attempt
 * reaches the limit, otherwise null.
 */
export function recordFailedLogin(
  username: string,
  policy: { maxAttempts: number; lockoutMinutes: number },
  now = Date.now(),
): LockState | null {
  if (!username.trim()) return null;
  const store = read();
  const key = keyOf(username);
  const fails = (store[key]?.fails ?? 0) + 1;
  if (fails >= policy.maxAttempts) {
    const totalMs = policy.lockoutMinutes * 60_000;
    const lock = { until: now + totalMs, totalMs, maxAttempts: policy.maxAttempts };
    store[key] = { fails: 0, lockedUntil: lock.until, totalMs, maxAttempts: lock.maxAttempts };
    write(store);
    return lock;
  }
  store[key] = { fails };
  write(store);
  return null;
}

/** Successful login: forget the failures for this username. */
export function clearFailedLogins(username: string) {
  const store = read();
  delete store[keyOf(username)];
  write(store);
}
