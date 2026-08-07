"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.department.updateMany({
        where: { name: 'IT' },
        data: { name: 'Engineering' }
    });
    console.log(`Updated ${result.count} department(s) to Engineering.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=rename.js.map