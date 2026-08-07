"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SHOW FULL TABLES').then(console.log).finally(() => prisma.$disconnect());
//# sourceMappingURL=check2.js.map