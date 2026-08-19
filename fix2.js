const fs = require('fs');
const p = 'd:/Leave-Management/Leave-Management_frontend/app/dashboard/hr/employees/page.tsx';
let content = fs.readFileSync(p, 'utf8');

const searchStr = `        onError: (err) => {
          console.error('Update failed:', err);
          Swal.fire(
            'ข้อผิดพลาด',
            err?.message || 'ไม่สามารถอัปเดตข้อมูลได้',
            'error',
          );
        },`;

const replaceStr = `        onError: (err: any) => {
          let errorMsg = 'ไม่สามารถอัปเดตข้อมูลได้';
          if (err?.isAxiosError && err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
            errorMsg = err.response.data?.message || err.response.statusText || errorMsg;
          } else {
            console.error('Update failed:', err);
            errorMsg = err?.message || errorMsg;
          }
          Swal.fire('ข้อผิดพลาด', errorMsg, 'error');
        },`;

const normalizedSearchStr = searchStr.replace(/\r/g, '');
const normalizedContent = content.replace(/\r/g, '');
if (normalizedContent.includes(normalizedSearchStr)) {
  const finalContent = normalizedContent.replace(normalizedSearchStr, replaceStr);
  fs.writeFileSync(p, finalContent, 'utf8');
  console.log('Successfully updated error handling');
} else {
  console.log('Error handling search string not found!');
}
