"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const reqs = await prisma.leaveRequest.findMany({
        where: {
            reason: { contains: 'ไปหามารดา' }
        },
        include: {
            approvals: true
        }
    });
    console.log('Requests:', JSON.stringify(reqs, null, 2));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check_reason.js.map