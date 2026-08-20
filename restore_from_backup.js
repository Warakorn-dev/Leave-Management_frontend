const fs = require('fs');

let content = fs.readFileSync('app/dashboard/hr/approval/page_backup.txt', 'utf8');

// Strip BOM
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Ensure correct line endings
content = content.replace(/\r\n/g, '\n');

// Replace the lock alert
const oldLockStr = `  const handleViewDetails = async (req: any) => {
    if (req.currentHrReviewerId && req.currentHrReviewerId !== user?.id) {
      alert("คำขอนี้กำลังถูกตรวจสอบโดย HR คนอื่น คุณไม่สามารถดูรายละเอียดได้");
      return;
    }
    // แค่เปิดดูรายละเอียดเฉยๆ ไม่ได้จะดึงมาตรวจสอบ`;

const newLockStr = `  const handleViewDetails = async (req: any) => {
    // แค่เปิดดูรายละเอียดเฉยๆ ไม่ได้จะดึงมาตรวจสอบ`;

// The backup text was wrapped by powershell so it might look weird. 
// Let's use regex to be safe.
const regex = /  const handleViewDetails = async \(req: any\) => \{\n\s*if \(req\.currentHrReviewerId && req\.currentHrReviewerId !== user\?\.id\) \{\n\s*alert\("คำขอนี้กำลังถูกตรวจสอบโดย HR คนอื่น\s*คุณไม่สามารถดูรายละเอียดได้"\);\n\s*return;\n\s*\}\n\s*\/\/ แค่เปิดดูรายละเอียดเฉยๆ\s*ไม่ได้จะดึงมาตรวจสอบ/;

if (content.includes(oldLockStr)) {
  content = content.replace(oldLockStr, newLockStr);
  console.log("Replaced lock exactly!");
} else if (regex.test(content)) {
  content = content.replace(regex, newLockStr);
  console.log("Replaced lock via Regex!");
} else {
  console.log("Warning: Could not find the lock alert block to replace.");
}

fs.writeFileSync('app/dashboard/hr/approval/page.tsx', content, 'utf8');
console.log("Restored page.tsx from backup");
