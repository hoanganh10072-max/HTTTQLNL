import "server-only";
import type { Prisma } from "@prisma/client";
export async function initializeEmployee(tx: Prisma.TransactionClient, employee: { id: string; hireDate: Date }) {
  const types = await tx.leaveType.findMany({ where: { status: "ACTIVE" } });
  for (const type of types) await tx.leaveBalance.upsert({ where: { employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: type.id, year: employee.hireDate.getFullYear() } }, create: { employeeId: employee.id, leaveTypeId: type.id, year: employee.hireDate.getFullYear(), allocated: type.annualAllowance }, update: {} });
  for (const title of ["Kiểm tra hồ sơ và giấy tờ tiếp nhận", "Định hướng công việc và nội quy", "Bàn giao tài khoản và trang thiết bị"]) {
    await tx.personnelActivity.create({ data: { employeeId: employee.id, category: "ONBOARDING", title, dueDate: new Date(employee.hireDate.getTime() + 7 * 86400000), owner: "Bộ phận nhân sự", notes: "Checklist tiếp nhận. Cập nhật người phụ trách và minh chứng khi hoàn thành." } });
  }
}
