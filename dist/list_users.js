"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const emps = await prisma.employee.findMany({
        include: { department: true, user: { include: { role: true } } }
    });
    console.table(emps.map(e => ({
        email: e.user.email,
        name: `${e.firstName} ${e.lastName}`,
        role: e.user.role.name,
        dept: e.department.name
    })));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=list_users.js.map