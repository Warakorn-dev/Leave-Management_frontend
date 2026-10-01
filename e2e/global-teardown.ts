import * as fs from 'fs';
import * as path from 'path';

/**
 * `next build` with NEXT_DIST_DIR=.next-e2e points next-env.d.ts at the e2e
 * build; point it back so the e2e run leaves no diff behind.
 */
export default function globalTeardown() {
  const file = path.join(__dirname, '..', 'next-env.d.ts');
  const src = fs.readFileSync(file, 'utf8');
  const restored = src.replace('./.next-e2e/types/routes.d.ts', './.next/types/routes.d.ts');
  if (restored !== src) fs.writeFileSync(file, restored);
}
