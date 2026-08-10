import * as fs from 'fs';

function traverse(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(traverse(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [
  ...traverse('d:/leave-management-system/leave-management-frontend/app/dashboard/manager'),
  ...traverse('d:/leave-management-system/leave-management-frontend/app/dashboard/user')
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;

  // Replacements
  newContent = newContent.replace(/\baddLeave\b/g, 'addLeaveRequest');
  newContent = newContent.replace(/\bgetLeaves\b/g, 'getLeaveRequests');
  newContent = newContent.replace(/\bdeleteLeave\b/g, 'deleteLeaveRequest');
  newContent = newContent.replace(/\bupdateLeave\b/g, 'updateLeaveRequest');
  
  newContent = newContent.replace(/import \{([^}]*)\bLeave\b([^}]*)\} from ['"]@\/lib\/store['"]/g, 'import {$1LeaveRequest$2} from "@/lib/store"');
  
  newContent = newContent.replace(/(\w*)\s*:\s*Leave\b/g, '$1: LeaveRequest');
  newContent = newContent.replace(/<Leave>/g, '<LeaveRequest>');
  newContent = newContent.replace(/<Leave\[\]>/g, '<LeaveRequest[]>');
  newContent = newContent.replace(/\(l: Leave\)/g, '(l: LeaveRequest)');
  newContent = newContent.replace(/\(leave: Leave\)/g, '(leave: LeaveRequest)');
  newContent = newContent.replace(/\(req: Leave\)/g, '(req: LeaveRequest)');

  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated', f);
  }
});
