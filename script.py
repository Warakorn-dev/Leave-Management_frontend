import re
with open('app/dashboard/hr/organization/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
target = "setEditPos({ id: pos.id, name: pos.name || pos.title || '', code: pos.code || '', departmentId: pos.departmentId || pos.department?.id || '' });"
replacement = "setEditPos({ id: pos.id, name: pos.name || pos.title || '', code: pos.code || '', departmentId: pos.departmentId || pos.department?.id || '', roleId: pos.roleId || (pos.role as any)?.id || '' });"
content = content.replace(target, replacement)
with open('app/dashboard/hr/organization/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
