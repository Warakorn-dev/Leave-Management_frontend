// Wipes and seeds the e2e database, then exits. Called by playwright.config.ts
// right before the e2e backend starts. DATABASE_URL comes from the config and
// must name a database ending in _e2e.
import { execSync } from 'node:child_process';

const url = process.env.DATABASE_URL || '';
if (!/\/[^/?]+_e2e(\?|$)/.test(url)) {
  console.error('prepare-db: DATABASE_URL must point at a *_e2e database');
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: process.env });
run('npx prisma db push --force-reset --skip-generate --accept-data-loss');
run('npx ts-node prisma/seed.ts');
run('node prisma/seed-admin.js');
