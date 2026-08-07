"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const leaves = await prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
    console.log(leaves);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=temp-query.js.map