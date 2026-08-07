"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const reqs = await prisma.leaveRequest.findMany({
        include: {
            employee: {
                include: { department: true }
            }
        }
    });
    console.table(reqs.map(r => ({
        id: r.id.substring(0, 5),
        status: r.status,
        empName: `${r.employee.firstName} ${r.employee.lastName}`,
        dept: r.employee.department.name
    })));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check_reqs.js.map