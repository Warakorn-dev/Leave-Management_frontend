/**
 * Shared settings for the browser e2e suite. The suite runs its own backend
 * (port 8100) against a throw-away database and its own frontend build
 * (port 3100), so the dev servers on 3000/8000 and the real database are
 * never touched.
 */
import * as fs from 'fs';
import * as path from 'path';

export const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'Leave-Management_backend');
export const BACKEND_PORT = 8100;
export const FRONTEND_PORT = 3100;
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/** E2E_DATABASE_URL, or the backend's DATABASE_URL pointed at `leave_management_e2e`. */
export function e2eDatabaseUrl(): string {
  let base = process.env.E2E_DATABASE_URL;
  if (!base) {
    const env = fs.readFileSync(path.join(BACKEND_DIR, '.env'), 'utf8');
    const m = env.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
    if (!m) throw new Error('DATABASE_URL not found in the backend .env');
    const url = new URL(m[1]);
    url.pathname = '/leave_management_e2e';
    base = url.toString();
  }
  if (!/\/[^/?]+_e2e(\?|$)/.test(base)) {
    throw new Error('Refusing to run: the e2e database name must end in _e2e (it is wiped).');
  }
  return base;
}
