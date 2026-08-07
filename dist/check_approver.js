"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { id: '4126f91d-25af-4d24-84e2-0a912adc7c70' },
        include: { role: true, employee: true }
    });
    console.log('Approver:', JSON.stringify(user, null, 2));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check_approver.js.map