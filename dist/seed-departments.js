"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const departmentsToInsert = [
        'Human Resource Department',
        'Account & Finance Department',
        'Administration Department',
        'Sales & Marketing Department',
        'Service & Support Department',
        'Software Development Department',
        'Project Department',
    ];
    for (const name of departmentsToInsert) {
        const existing = await prisma.department.findUnique({ where: { name } });
        if (!existing) {
            await prisma.department.create({ data: { name } });
            console.log(`Created department: ${name}`);
        }
        else {
            console.log(`Department already exists: ${name}`);
        }
    }
    const departments = await prisma.department.findMany();
    const getDeptId = (name) => departments.find(d => d.name === name)?.id;
    const positionsToInsert = [
        { name: 'SSO', dept: 'Human Resource Department' },
        { name: 'HR Office', dept: 'Human Resource Department' },
        { name: 'RD', dept: 'Account & Finance Department' },
        { name: 'Accounting & Finance', dept: 'Account & Finance Department' },
        { name: 'Office admin', dept: 'Administration Department' },
        { name: 'Operator', dept: 'Administration Department' },
        { name: 'Graphic designer', dept: 'Sales & Marketing Department' },
        { name: 'Marketing Officer', dept: 'Sales & Marketing Department' },
        { name: 'Senior Technical Support', dept: 'Service & Support Department' },
        { name: 'Technical Support', dept: 'Service & Support Department' },
        { name: 'SA & Senior Programmer', dept: 'Software Development Department' },
        { name: 'Programmer', dept: 'Software Development Department' },
        { name: 'Leader', dept: 'Project Department' },
        { name: 'Senior Asistance Project Manager', dept: 'Project Department' },
        { name: 'Asistance Project Manager', dept: 'Project Department' }
    ];
    for (const name of departmentsToInsert) {
        if (!positionsToInsert.some(p => p.name === 'Leader' && p.dept === name)) {
            positionsToInsert.push({ name: 'Leader', dept: name });
        }
    }
    for (const pos of positionsToInsert) {
        const departmentId = getDeptId(pos.dept);
        const existing = await prisma.position.findFirst({ where: { name: pos.name, departmentId } });
        if (!existing) {
            await prisma.position.create({ data: { name: pos.name, departmentId } });
            console.log(`Created position: ${pos.name} in ${pos.dept}`);
        }
        else {
            console.log(`Position already exists: ${pos.name} in ${pos.dept}`);
        }
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-departments.js.map