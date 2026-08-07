"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'manager@company.com' } });
    if (!user)
        return console.log('Manager not found');
    const emp = await prisma.employee.findUnique({ where: { userId: user.id } });
    console.log('Manager dept:', emp?.departmentId);
    const reqs = await prisma.leaveRequest.findMany({
        where: {
            status: 'Pending',
            employee: {
                departmentId: emp?.departmentId,
            }
        }
    });
    console.log('Pending reqs found:', reqs.length);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=test_query.js.map