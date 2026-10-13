export type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export const permissions = {
  ADMIN: ["system:manage", "employee:read", "employee:write", "workflow:approve", "payroll:read", "payroll:write", "audit:read"],
  HR: ["employee:read", "employee:write", "workflow:approve", "payroll:read", "payroll:write", "report:read"],
  MANAGER: ["employee:read:team", "workflow:approve:team", "report:read:team"],
  EMPLOYEE: ["profile:read:self", "attendance:write:self", "leave:write:self", "payroll:read:self"],
} satisfies Record<Role, string[]>;

export function hasPermission(role: Role, permission: string) {
  if (role === "ADMIN") return true;
  return permissions[role].includes(permission);
}

export function calculatePayroll(input: {
  baseSalary: number; standardDays: number; actualDays: number; allowance?: number; overtime?: number;
  bonus?: number; insurance?: number; tax?: number; otherDeduction?: number;
}) {
  if (input.standardDays <= 0) throw new Error("Ngày công chuẩn phải lớn hơn 0");
  if (input.actualDays < 0) throw new Error("Ngày công thực tế không được âm");
  const workSalary = input.baseSalary / input.standardDays * input.actualDays;
  const netSalary = workSalary + (input.allowance ?? 0) + (input.overtime ?? 0) + (input.bonus ?? 0)
    - (input.insurance ?? 0) - (input.tax ?? 0) - (input.otherDeduction ?? 0);
  return { workSalary: Math.round(workSalary), netSalary: Math.round(netSalary) };
}

export function canRequestLeave(balance: number, used: number, requested: number) {
  return requested > 0 && requested <= balance - used;
}

const recruitmentTransitions: Record<string, string[]> = {
  NEW: ["SCREENING", "FAILED"], SCREENING: ["INTERVIEW", "FAILED"],
  INTERVIEW: ["PASSED", "FAILED"], PASSED: ["HIRED", "FAILED"], FAILED: [], HIRED: [],
};
export function canTransitionCandidate(from: string, to: string) {
  return recruitmentTransitions[from]?.includes(to) ?? false;
}

export function canApproveTransfer(input: { status: string; employeeStatus: string; newDepartmentId: string; newPositionId: string }) {
  return input.status === "PENDING" && input.employeeStatus !== "RESIGNED" && Boolean(input.newDepartmentId && input.newPositionId);
}

export function businessDays(start: Date, end: Date) {
  if (end < start) return 0;
  let days = 0;
  const cursor = new Date(start); cursor.setHours(0, 0, 0, 0);
  const last = new Date(end); last.setHours(0, 0, 0, 0);
  while (cursor <= last) { if (![0, 6].includes(cursor.getDay())) days++; cursor.setDate(cursor.getDate() + 1); }
  return days;
}
