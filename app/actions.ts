"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { businessDays, calculatePayroll, canApproveTransfer, canRequestLeave, canTransitionCandidate } from "@/lib/rules";
import { clearSession, requireUser, setSession } from "@/lib/auth";
import { loginBlocked, recordLoginFailure, clearLoginFailures } from "@/lib/login-throttle";
import { initializeEmployee } from "@/lib/onboarding";

async function audit(user: { id: string; email: string }, action: string, entity: string, entityId: string | null, description: string) {
  await db.auditLog.create({ data: { userId: user.id, userEmail: user.email, action, entity, entityId, description } });
}

export async function loginAction(_previous: { error?: string } | undefined, formData: FormData) {
  const parsed = z.object({ email: z.email(), password: z.string().min(8) }).safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Email hoặc mật khẩu không hợp lệ." };
  const loginKey = parsed.data.email.toLowerCase();
  if (loginBlocked(loginKey)) return { error: "Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút." };
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) { recordLoginFailure(loginKey); return { error: "Email hoặc mật khẩu không đúng." }; }
  clearLoginFailures(loginKey);
  await setSession(user.id, formData.get("remember") === "on");
  await audit(user, "LOGIN", "USER", user.id, "Đăng nhập hệ thống");
  redirect("/dashboard");
}

export async function logoutAction() { const user = await requireUser(); await audit(user, "LOGOUT", "USER", user.id, "Đăng xuất hệ thống"); await clearSession(); redirect("/login"); }

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) redirect("/settings?error=invalid");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), sessionVersion: { increment: 1 } } });
  await setSession(user.id);
  await audit(user, "UPDATE", "USER", user.id, "Đổi mật khẩu");
  redirect("/settings?success=1");
}

export async function createEmployeeAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  const schema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), workEmail: z.email(), departmentId: z.string().min(1), positionId: z.string().min(1), branchId: z.string().min(1), hireDate: z.coerce.date(), baseSalary: z.coerce.number().positive() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/employees/new?error=validation");
  const last = await db.employee.findFirst({ orderBy: { employeeCode: "desc" }, select: { employeeCode: true } });
  const next = Number(last?.employeeCode.replace(/\D/g, "") ?? 0) + 1;
  const employee = await db.$transaction(async (tx) => {
    const created = await tx.employee.create({ data: { ...parsed.data, employeeCode: `VNM${String(next).padStart(4, "0")}`, employmentStatus: "PROBATION" } });
    await initializeEmployee(tx, created);
    const [department, position] = await Promise.all([tx.department.findUniqueOrThrow({ where: { id: created.departmentId } }), tx.position.findUniqueOrThrow({ where: { id: created.positionId } })]);
    await tx.employmentHistory.create({ data: { employeeId: created.id, departmentName: department.name, positionName: position.name, salary: created.baseSalary, startDate: created.hireDate, reason: "Tiếp nhận nhân viên mới" } });
    return created;
  });
  await audit(user, "CREATE", "EMPLOYEE", employee.id, `Tạo nhân viên ${employee.employeeCode}`);
  redirect(`/employees/${employee.id}?created=1`);
}

export async function updateEmployeeAction(id: string, formData: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  const parsed = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), workEmail: z.email(), phone: z.string().optional(), departmentId: z.string().min(1), positionId: z.string().min(1), branchId: z.string().min(1), baseSalary: z.coerce.number().positive(), employmentStatus: z.enum(["ACTIVE", "PROBATION", "RESIGNED"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/employees/${id}/edit?error=validation`);
  const employee = await db.$transaction(async tx => {
    const before = await tx.employee.findUniqueOrThrow({ where: { id } });
    const department = await tx.department.findUniqueOrThrow({ where: { id: parsed.data.departmentId } });
    const position = await tx.position.findUniqueOrThrow({ where: { id: parsed.data.positionId } });
    if (department.branchId !== parsed.data.branchId) throw new Error("Phòng ban không thuộc chi nhánh đã chọn.");
    if (parsed.data.employmentStatus === "RESIGNED") {
      const account = await tx.user.findUnique({ where: { employeeId: id } });
      if (account?.id === user.id || (account?.role === "ADMIN" && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1)) throw new Error("Không thể vô hiệu tài khoản đang dùng hoặc admin cuối cùng.");
      await tx.user.updateMany({ where: { employeeId: id }, data: { isActive: false } });
    }
    const value = await tx.employee.update({ where: { id }, data: parsed.data });
    if (before.departmentId !== value.departmentId || before.positionId !== value.positionId || before.baseSalary !== value.baseSalary) {
      await tx.employmentHistory.updateMany({ where: { employeeId: id, endDate: null }, data: { endDate: new Date() } });
      await tx.employmentHistory.create({ data: { employeeId: id, departmentName: department.name, positionName: position.name, salary: value.baseSalary, startDate: new Date(), reason: "Cập nhật hồ sơ nhân viên" } });
    }
    return value;
  });
  await audit(user, "UPDATE", "EMPLOYEE", id, `Cập nhật hồ sơ ${employee.employeeCode}`);
  redirect(`/employees/${id}?updated=1`);
}

export async function archiveEmployeeAction(id: string) {
  const user = await requireUser(["ADMIN", "HR"]);
  const employee = await db.$transaction(async (tx) => {
    const account = await tx.user.findUnique({ where: { employeeId: id } });
    if (account?.id === user.id || (account?.role === "ADMIN" && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1)) throw new Error("Không thể lưu trữ hồ sơ của tài khoản đang dùng hoặc admin cuối cùng.");
    const value = await tx.employee.update({ where: { id }, data: { deletedAt: new Date(), employmentStatus: "RESIGNED" } });
    await tx.user.updateMany({ where: { employeeId: id }, data: { isActive: false } });
    return value;
  });
  await audit(user, "ARCHIVE", "EMPLOYEE", id, `Lưu trữ hồ sơ ${employee.employeeCode}`);
  redirect("/employees");
}

export async function updateCandidateStatusAction(id: string, formData: FormData) {
  const user = await requireUser(["ADMIN", "HR"]); const to = String(formData.get("status"));
  const candidate = await db.candidate.findUniqueOrThrow({ where: { id } });
  if (!canTransitionCandidate(candidate.status, to)) throw new Error("Chuyển trạng thái không hợp lệ");
  await db.candidate.update({ where: { id }, data: { status: to } });
  await audit(user, "UPDATE_STATUS", "CANDIDATE", id, `Chuyển ứng viên từ ${candidate.status} sang ${to}`); revalidatePath("/recruitment");
}

export async function convertCandidateAction(id: string) {
  const user = await requireUser(["ADMIN", "HR"]);
  const employee = await db.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUniqueOrThrow({ where: { id }, include: { recruitmentRequest: { include: { department: true, position: true } } } });
    if (candidate.status !== "PASSED") throw new Error("Ứng viên chưa ở trạng thái đạt");
    const last = await tx.employee.findFirst({ orderBy: { employeeCode: "desc" }, select: { employeeCode: true } }); const next = Number(last?.employeeCode.replace(/\D/g, "") ?? 0) + 1;
    const parts = candidate.fullName.trim().split(/\s+/); const firstName = parts.pop() ?? candidate.fullName; const lastName = parts.join(" ") || "Ứng viên";
    const created = await tx.employee.create({ data: { employeeCode: `VNM${String(next).padStart(4, "0")}`, firstName, lastName, workEmail: candidate.email, phone: candidate.phone, branchId: candidate.recruitmentRequest.department.branchId, departmentId: candidate.recruitmentRequest.departmentId, positionId: candidate.recruitmentRequest.positionId, hireDate: new Date(), probationEndDate: new Date(Date.now() + 60 * 86400000), employmentStatus: "PROBATION", baseSalary: 12_000_000 } });
    await tx.employmentHistory.create({ data: { employeeId: created.id, departmentName: candidate.recruitmentRequest.department.name, positionName: candidate.recruitmentRequest.position.name, salary: created.baseSalary, startDate: created.hireDate, reason: "Chuyển từ ứng viên đạt" } });
    await tx.candidate.update({ where: { id }, data: { status: "HIRED", convertedEmployeeId: created.id } });
    await initializeEmployee(tx, created);
    return created;
  });
  await audit(user, "CONVERT", "CANDIDATE", id, `Chuyển ứng viên thành ${employee.employeeCode}`); redirect(`/employees/${employee.id}`);
}

function startOfToday() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

export async function attendanceAction(intent: "check-in" | "check-out") {
  const user = await requireUser(); if (!user.employeeId) redirect("/attendance?error=no-profile");
  const workDate = startOfToday(); const now = new Date();
  const existing = await db.attendanceRecord.findUnique({ where: { employeeId_workDate: { employeeId: user.employeeId, workDate } } });
  if (intent === "check-in") {
    if (existing?.checkIn) redirect("/attendance?error=duplicate-checkin");
    const status = now.getHours() >= 9 ? "LATE" : "ON_TIME";
    await db.attendanceRecord.upsert({ where: { employeeId_workDate: { employeeId: user.employeeId, workDate } }, create: { employeeId: user.employeeId, workDate, checkIn: now, status }, update: { checkIn: now, status } });
  } else {
    if (!existing?.checkIn || existing.checkOut) redirect("/attendance?error=invalid-checkout");
    const hours = Math.max(0, (now.getTime() - existing.checkIn.getTime()) / 3_600_000);
    await db.attendanceRecord.update({ where: { id: existing.id }, data: { checkOut: now, totalHours: Math.round(hours * 100) / 100 } });
  }
  await audit(user, intent === "check-in" ? "CHECK_IN" : "CHECK_OUT", "ATTENDANCE", existing?.id ?? null, intent === "check-in" ? "Chấm công vào" : "Chấm công ra");
  revalidatePath("/attendance");
}

export async function submitLeaveAction(formData: FormData) {
  const user = await requireUser(); if (!user.employeeId) redirect("/leave?error=no-profile");
  const parsed = z.object({ leaveTypeId: z.string().min(1), startDate: z.coerce.date(), endDate: z.coerce.date(), reason: z.string().min(5) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) redirect("/leave?error=validation");
  const days = businessDays(parsed.data.startDate, parsed.data.endDate);
  if (!days || parsed.data.startDate.getFullYear() !== parsed.data.endDate.getFullYear()) redirect("/leave?error=validation");
  const employeeId = user.employeeId;
  const request = await db.$transaction(async tx => {
    const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: parsed.data.leaveTypeId, year: parsed.data.startDate.getFullYear() } } });
    const pending = await tx.leaveRequest.aggregate({ where: { employeeId, leaveTypeId: parsed.data.leaveTypeId, status: "PENDING", startDate: { gte: new Date(parsed.data.startDate.getFullYear(), 0, 1), lt: new Date(parsed.data.startDate.getFullYear() + 1, 0, 1) } }, _sum: { days: true } });
    if (!balance || !canRequestLeave(balance.allocated, balance.used + (pending._sum.days ?? 0), days)) return null;
    const overlap = await tx.leaveRequest.findFirst({ where: { employeeId, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: parsed.data.endDate }, endDate: { gte: parsed.data.startDate } } });
    if (overlap) return null;
    return tx.leaveRequest.create({ data: { employeeId, ...parsed.data, days } });
  });
  if (!request) redirect("/leave?error=balance-or-overlap");
  await db.notification.create({ data: { role: "HR", title: "Đơn nghỉ phép mới", message: `${user.employee?.firstName ?? "Nhân viên"} gửi đơn nghỉ ${days} ngày.`, type: "ACTION", link: "/leave" } });
  await audit(user, "CREATE", "LEAVE_REQUEST", request.id, `Gửi đơn nghỉ ${days} ngày`);
  revalidatePath("/leave");
}

export async function reviewLeaveAction(id: string, decision: "APPROVED" | "REJECTED") {
  const user = await requireUser(["ADMIN", "HR", "MANAGER"]);
  if (!["APPROVED", "REJECTED"].includes(decision)) redirect("/leave?error=validation");
  await db.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUniqueOrThrow({ where: { id } });
    if (request.status !== "PENDING") throw new Error("Đơn đã được xử lý");
    if (request.employeeId === user.employeeId && user.role !== "ADMIN") throw new Error("Không thể tự phê duyệt đơn nghỉ của mình.");
    if (user.role === "MANAGER") {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: request.employeeId } });
      if (!user.employeeId || employee.managerId !== user.employeeId) throw new Error("Ngoài phạm vi quản lý");
    }
    if (decision === "APPROVED") {
      const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year: request.startDate.getFullYear() } } });
      if (!balance || !canRequestLeave(balance.allocated, balance.used, request.days)) throw new Error("Không đủ số dư phép");
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { used: { increment: request.days } } });
    }
    await tx.leaveRequest.update({ where: { id }, data: { status: decision, reviewerId: user.id, reviewedAt: new Date() } });
    const target = await tx.user.findUnique({ where: { employeeId: request.employeeId } });
    if (target) await tx.notification.create({ data: { userId: target.id, title: `Đơn nghỉ phép ${decision === "APPROVED" ? "đã được duyệt" : "bị từ chối"}`, message: `Yêu cầu nghỉ ${request.days} ngày đã được xử lý.`, type: decision === "APPROVED" ? "SUCCESS" : "WARNING", link: "/leave" } });
  });
  await audit(user, decision === "APPROVED" ? "APPROVE" : "REJECT", "LEAVE_REQUEST", id, `${decision === "APPROVED" ? "Duyệt" : "Từ chối"} đơn nghỉ phép`);
  revalidatePath("/leave");
}

export async function generatePayrollAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  const parsed = z.object({ month: z.coerce.number().min(1).max(12), year: z.coerce.number().min(2020), standardDays: z.coerce.number().positive() }).parse(Object.fromEntries(formData));
  const period = await db.$transaction(async (tx) => {
    const created = await tx.payrollPeriod.create({ data: parsed });
    const employees = await tx.employee.findMany({ where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, deletedAt: null } });
    const start = new Date(parsed.year, parsed.month - 1, 1); const end = new Date(parsed.year, parsed.month, 1);
    for (const employee of employees) {
      const attendance = await tx.attendanceRecord.count({ where: { employeeId: employee.id, workDate: { gte: start, lt: end }, checkIn: { not: null } } });
      const insurance = employee.baseSalary * 0.105; const allowance = 1_000_000;
      const salary = calculatePayroll({ baseSalary: employee.baseSalary, standardDays: parsed.standardDays, actualDays: attendance, allowance, insurance });
      await tx.payrollRecord.create({ data: { payrollPeriodId: created.id, employeeId: employee.id, baseSalary: employee.baseSalary, standardDays: parsed.standardDays, actualDays: attendance, workSalary: salary.workSalary, allowance, insurance, netSalary: salary.netSalary } });
    }
    return created;
  });
  await audit(user, "CREATE", "PAYROLL_PERIOD", period.id, `Tạo kỳ lương ${period.month}/${period.year}`);
  revalidatePath("/payroll");
}

export async function lockPayrollAction(id: string) {
  const user = await requireUser(["ADMIN", "HR"]);
  await db.$transaction(async tx => {
    const period = await tx.payrollPeriod.findUniqueOrThrow({ where: { id }, include: { records: true } });
    if (period.status !== "DRAFT" || !period.records.length) throw new Error("Chỉ phát hành kỳ nháp có phiếu lương.");
    await tx.payrollPeriod.update({ where: { id }, data: { status: "PUBLISHED", approvedBy: user.id, lockedAt: new Date() } });
    await tx.payrollRecord.updateMany({ where: { payrollPeriodId: id }, data: { status: "PUBLISHED" } });
    await tx.notification.create({ data: { role: "EMPLOYEE", title: "Phiếu lương đã phát hành", message: "Phiếu lương mới đã sẵn sàng.", type: "SUCCESS", link: "/payroll" } });
  });
  await audit(user, "LOCK", "PAYROLL_PERIOD", id, "Phê duyệt và khóa kỳ lương"); revalidatePath("/payroll");
}

export async function approveTransferAction(id: string, decision: "APPROVED" | "REJECTED") {
  const user = await requireUser(["ADMIN", "HR"]);
  await db.$transaction(async (tx) => {
    const request = await tx.transferRequest.findUniqueOrThrow({ where: { id }, include: { employee: { include: { department: true, position: true } } } });
    if (!canApproveTransfer({ status: request.status, employeeStatus: request.employee.employmentStatus, newDepartmentId: request.newDepartmentId, newPositionId: request.newPositionId })) throw new Error("Yêu cầu không còn hợp lệ");
    if (decision === "APPROVED") {
      await tx.employmentHistory.updateMany({ where: { employeeId: request.employeeId, endDate: null }, data: { endDate: request.effectiveDate } });
      const [department, position] = await Promise.all([tx.department.findUniqueOrThrow({ where: { id: request.newDepartmentId } }), tx.position.findUniqueOrThrow({ where: { id: request.newPositionId } })]);
      if (request.effectiveDate > new Date()) throw new Error("Chỉ áp dụng thuyên chuyển khi đến ngày hiệu lực.");
      await tx.employee.update({ where: { id: request.employeeId }, data: { branchId: department.branchId, departmentId: request.newDepartmentId, positionId: request.newPositionId, managerId: request.newManagerId, ...(request.newSalary ? { baseSalary: request.newSalary } : {}) } });
      await tx.employmentHistory.create({ data: { employeeId: request.employeeId, departmentName: department.name, positionName: position.name, salary: request.newSalary ?? request.employee.baseSalary, startDate: request.effectiveDate, reason: request.reason } });
    }
    await tx.transferRequest.update({ where: { id }, data: { status: decision, approvedBy: user.id, reviewedAt: new Date() } });
  });
  await audit(user, decision === "APPROVED" ? "APPROVE" : "REJECT", "TRANSFER_REQUEST", id, `${decision === "APPROVED" ? "Duyệt" : "Từ chối"} thuyên chuyển`); revalidatePath("/transfers");
}

export async function completeResignationAction(id: string, formData: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  if (formData.get("handoverDone") !== "on" || formData.get("assetsReturned") !== "on" || formData.get("confirmSettlement") !== "on") redirect("/resignations?error=checklist");
  const finalPayment = z.coerce.number().nonnegative().parse(formData.get("finalPayment"));
  const request = await db.$transaction(async (tx) => {
    const value = await tx.resignationRequest.findUniqueOrThrow({ where: { id } });
    if (!["PENDING", "APPROVED"].includes(value.status)) throw new Error("Yêu cầu đã hoàn tất");
    const account = await tx.user.findUnique({ where: { employeeId: value.employeeId } });
    if (account?.id === user.id || (account?.role === "ADMIN" && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1)) throw new Error("Không thể khóa tài khoản đang dùng hoặc admin cuối cùng.");
    if (value.lastWorkingDate > new Date()) throw new Error("Chưa đến ngày làm việc cuối cùng.");
    await tx.resignationRequest.update({ where: { id }, data: { finalPayment, status: "COMPLETED", handoverDone: true, assetsReturned: true, accountClosed: true, completedAt: new Date(), approvedBy: user.id } });
    await tx.employee.update({ where: { id: value.employeeId }, data: { employmentStatus: "RESIGNED" } });
    await tx.user.updateMany({ where: { employeeId: value.employeeId }, data: { isActive: false } });
    await tx.employmentHistory.updateMany({ where: { employeeId: value.employeeId, endDate: null }, data: { endDate: value.lastWorkingDate } });
    return value;
  });
  await audit(user, "COMPLETE", "RESIGNATION_REQUEST", request.id, "Hoàn tất nghỉ việc và khóa tài khoản"); revalidatePath("/resignations");
}

export async function cancelLeaveAction(id: string) {
  const user = await requireUser();
  await db.$transaction(async tx => {
    const request = await tx.leaveRequest.findUniqueOrThrow({ where: { id } });
    if (request.status !== "PENDING" || (user.role !== "ADMIN" && request.employeeId !== user.employeeId)) throw new Error("Chỉ hủy đơn chờ duyệt thuộc hồ sơ của bạn.");
    await tx.leaveRequest.update({ where: { id }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: "CANCEL", entity: "LeaveRequest", entityId: id, description: "Hủy đơn nghỉ chờ duyệt" } });
  }); revalidatePath("/leave");
}
