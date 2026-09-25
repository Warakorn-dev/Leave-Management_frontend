/**
 * The role a position implies — the SAME rule the backend applies when HR
 * moves an employee to another position (hr-assignable-role.ts
 * roleForPosition): HR department → HR; a Leader position → Manager (ONLY
 * Leader — a title merely containing "Manager" is not a department head);
 * otherwise Employee. A CEO or Admin keeps their role.
 * Used here only to warn HR before saving; the server decides.
 */
export function roleForPosition(
  positionName: string | null | undefined,
  departmentName: string | null | undefined,
  currentRole: string | null | undefined,
): string {
  if (currentRole === 'CEO' || currentRole === 'Admin') return currentRole;
  const dept = (departmentName ?? '').toLowerCase();
  const pos = (positionName ?? '').toLowerCase();
  if (dept.includes('hr') || dept.includes('human resource')) return 'HR';
  if (pos.includes('leader')) return 'Manager';
  return 'Employee';
}
