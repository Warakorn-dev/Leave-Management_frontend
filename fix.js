const fs = require('fs');
const p = 'd:/Leave-Management/Leave-Management_frontend/app/dashboard/hr/employees/page.tsx';
let content = fs.readFileSync(p, 'utf8');

const searchStr = `    const empData: Partial<Employee> & {
      username?: string;
      employeeCode?: string;
      hireDate?: string;
      gender?: string;
      phone?: string;
      roleName?: string;
    } = {
      employeeCode: editingEmployee.employeeId,
      username: editingEmployee.username,
      firstName: editingEmployee.firstName,
      lastName: editingEmployee.lastName,
      email: editingEmployee.email,
      phone: editingEmployee.phone,
      departmentId: editingEmployee.departmentId,
      positionId: editingEmployee.positionId,
      roleName: editingEmployee.roleName,
      hireDate: editingEmployee.joinDate,
      gender: editingEmployee.gender,
    };`;

const replaceStr = `    const empData: Partial<Employee> & {
      username?: string;
      employeeCode?: string;
      hireDate?: string;
      gender?: string;
      phone?: string;
      roleName?: string;
      firstNameEN?: string;
      lastNameEN?: string;
      idCardNumber?: string;
      dateOfBirth?: string;
      idCardAddress?: string;
      currentAddress?: string;
    } = {
      employeeCode: editingEmployee.employeeId,
      username: editingEmployee.username,
      firstName: editingEmployee.firstName,
      lastName: editingEmployee.lastName,
      email: editingEmployee.email,
      phone: editingEmployee.phone,
      departmentId: editingEmployee.departmentId,
      positionId: editingEmployee.positionId,
      roleName: editingEmployee.roleName,
      hireDate: editingEmployee.joinDate,
      gender: editingEmployee.gender,
      firstNameEN: editingEmployee.firstNameEN,
      lastNameEN: editingEmployee.lastNameEN,
      idCardNumber: editingEmployee.idCardNumber,
      dateOfBirth: editingEmployee.dateOfBirth,
      idCardAddress: editingEmployee.idCardAddress,
      currentAddress: editingEmployee.currentAddress,
    };`;

const normalizedSearchStr = searchStr.replace(/\r/g, '');
const normalizedContent = content.replace(/\r/g, '');
if (normalizedContent.includes(normalizedSearchStr)) {
  const finalContent = normalizedContent.replace(normalizedSearchStr, replaceStr);
  fs.writeFileSync(p, finalContent, 'utf8');
  console.log('Successfully updated frontend empData');
} else {
  console.log('Search string not found!');
}
