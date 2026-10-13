import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { csvCell as esc } from "@/lib/csv";

export async function GET() {
  const user = await requireUser(["ADMIN", "HR", "MANAGER"]);
  const employees = await db.employee.findMany({ where: { deletedAt: null, ...(user.role === "MANAGER" ? { managerId: user.employeeId ?? "__none__" } : {}) }, include: { department: true, position: true }, orderBy: { employeeCode: "asc" } });
  const rows = [["Mã nhân viên","Họ tên","Email","Phòng ban","Chức danh","Trạng thái","Lương cơ bản"], ...employees.map((e) => [e.employeeCode,`${e.lastName} ${e.firstName}`,e.workEmail,e.department.name,e.position.name,e.employmentStatus,user.role === "MANAGER" ? "Giới hạn quyền" : e.baseSalary])];
  return new NextResponse("\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=employees.csv" } });
}
