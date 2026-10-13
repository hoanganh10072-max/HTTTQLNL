"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fieldsFor, modelFor, optionsFor, relationFor } from "@/lib/admin-registry";
import { dataDelegate, sanitized } from "@/lib/admin-data";
import { businessDays, calculatePayroll } from "@/lib/rules";
import { weightedScore } from "@/lib/performance";
import { initializeEmployee } from "@/lib/onboarding";
import { presetFor } from "@/lib/performance-presets";

type Result = { error?: string };
async function reconcileLeave(tx: Prisma.TransactionClient, employeeId: string, leaveTypeId: string, year: number) {
  const requests = await tx.leaveRequest.findMany({ where: { employeeId, leaveTypeId, status: "APPROVED", startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } } });
  const used = requests.reduce((s, r) => s + r.days, 0);
  const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } } });
  if (used && (!balance || balance.allocated < used)) throw new Error("Tổng phép đã duyệt vượt hạn mức. Cập nhật hạn mức trước.");
  if (balance) await tx.leaveBalance.update({ where: { id: balance.id }, data: { used } });
}
export async function saveAdminRecordAction(entity: string, id: string | null, _state: Result, form: FormData): Promise<Result> {
  const user = await requireUser(["ADMIN"]);
  let resultId = id;
  try {
    const model = modelFor(entity);
    const reason = z.string().trim().min(5, "Lý do thay đổi cần ít nhất 5 ký tự.").parse(form.get("reasonForChange"));
    const data: Record<string, unknown> = {};
    const derived = ["workSalary", "netSalary", "totalHours", "used", "score"];
    for (const field of fieldsFor(entity)) {
      if (derived.includes(field.name) && !(entity === "Interview" && field.name === "score")) continue;
      const raw = form.get(field.name);
      if (raw === null) continue;
      const value = String(raw).trim();
      if (!value && field.type !== "Boolean") {
        if (!field.isRequired) { data[field.name] = null; continue; }
        if (!id && field.hasDefaultValue) continue;
        throw new Error(`${field.name}: Không được để trống.`);
      }
      if (field.type === "Boolean") data[field.name] = value === "true";
      else if (field.type === "DateTime") data[field.name] = z.coerce.date().parse(["checkIn", "checkOut", "scheduledAt"].includes(field.name) && value.length === 16 ? `${value}+07:00` : value);
      else if (["Int", "Float"].includes(field.type)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || (field.type === "Int" && !Number.isInteger(n))) throw new Error(`${field.name}: Số không hợp lệ.`);
        if (["month"].includes(field.name) && (n < 1 || n > 12)) throw new Error("Tháng phải từ 1 đến 12.");
        if (["baseSalary", "salary", "standardDays", "target", "quantity"].includes(field.name) && n <= 0) throw new Error(`${field.name}: Phải lớn hơn 0.`);
        if (field.name === "weight" && (n <= 0 || n > 100)) throw new Error("Trọng số phải lớn hơn 0 và không quá 100.");
        if (field.name === "managerScore" && n > 120) throw new Error("Điểm tối đa là 120.");
        data[field.name] = n;
      } else {
        if (value.length > 20000) throw new Error("Nội dung quá dài.");
        if (/email$/i.test(field.name)) z.email().parse(value);
        const options = optionsFor(entity, field.name);
        if (options && !options.includes(value)) throw new Error("Giá trị trạng thái/vai trò không hợp lệ.");
        if (["url", "avatarUrl", "cvUrl", "link"].includes(field.name) && !(/^(https?:\/\/|\/(?!\/))/i.test(value))) throw new Error("Liên kết phải bắt đầu bằng https://, http:// hoặc /.");
        data[field.name] = /email$/i.test(field.name) ? value.toLowerCase() : value;
      }
    }
    if (entity === "User") {
      const password = String(form.get("password") ?? "");
      if (!id || password) { z.string().min(10).regex(/[A-Z]/).regex(/[0-9]/).parse(password); data.passwordHash = await bcrypt.hash(password, 12); }
    }
    await db.$transaction(async tx => {
      const delegate = dataDelegate(entity, tx); const before = id ? await delegate.findUnique({ where: { id } }) : null;
      if (id && !before) throw new Error("Bản ghi không còn tồn tại.");
      for (const field of fieldsFor(entity)) {
        const related = relationFor(entity, field.name);
        if (related && data[field.name] && data[field.name] !== before?.[field.name]) {
          const reference = await dataDelegate(related, tx).findUnique({ where: { id: data[field.name] } });
          if (!reference || reference.deletedAt) throw new Error(`Liên kết ${field.name} không tồn tại hoặc đã lưu trữ.`);
          if (related === "Employee" && entity === "User" && reference.employmentStatus === "RESIGNED") throw new Error("Không thể gắn tài khoản với nhân viên đã nghỉ việc.");
        }
      }
      if (entity === "User" && before?.role === "ADMIN" && before.isActive && (data.role !== "ADMIN" || data.isActive === false)) {
        if (await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1) throw new Error("Phải giữ ít nhất một admin đang hoạt động.");
      }
      const merged = { ...before, ...data };
      if (entity === "User" && before && (data.passwordHash || data.role !== before.role || data.isActive !== before.isActive)) data.sessionVersion = Number(before.sessionVersion ?? 0) + 1;
      for (const [start, end] of [["startDate", "endDate"], ["checkIn", "checkOut"]]) if (merged[start] && merged[end] && new Date(String(merged[end])) < new Date(String(merged[start]))) throw new Error("Ngày/giờ kết thúc phải sau ngày/giờ bắt đầu.");
      if (entity === "Employee") {
        if (data.employmentStatus === "RESIGNED") {
          const account = id ? await tx.user.findUnique({ where: { employeeId: id } }) : null;
          if (account?.id === user.id || (account?.role === "ADMIN" && account.isActive && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1)) throw new Error("Không thể vô hiệu tài khoản đang dùng hoặc admin hoạt động cuối cùng.");
        }
        if (id && data.managerId === id) throw new Error("Nhân viên không thể tự quản lý chính mình.");
        if (data.managerId) {
          let cursor = String(data.managerId); const seen = new Set<string>();
          while (cursor) {
            if (cursor === id || seen.has(cursor)) throw new Error("Quan hệ quản lý tạo vòng lặp.");
            seen.add(cursor); cursor = (await tx.employee.findUnique({ where: { id: cursor } }))?.managerId ?? "";
          }
        }
        const dep = await tx.department.findUniqueOrThrow({ where: { id: String(data.departmentId) } });
        if (dep.branchId !== data.branchId) throw new Error("Phòng ban không thuộc chi nhánh đã chọn.");
      }
      if (entity === "LeaveRequest") {
        const start = new Date(String(data.startDate)), end = new Date(String(data.endDate));
        if (start.getFullYear() !== end.getFullYear()) throw new Error("Tách đơn nghỉ theo từng năm.");
        data.days = businessDays(start, end);
        if (!data.days) throw new Error("Đơn phải có ít nhất một ngày làm việc.");
        if (["PENDING", "APPROVED"].includes(String(data.status))) {
          const overlap = await tx.leaveRequest.findFirst({ where: { employeeId: String(data.employeeId), id: { not: id ?? "" }, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: end }, endDate: { gte: start } } });
          if (overlap) throw new Error("Thời gian nghỉ trùng đơn đang chờ/đã duyệt.");
        }
      }
      if (entity === "PayrollRecord") Object.assign(data, calculatePayroll(data as Parameters<typeof calculatePayroll>[0]));
      if (entity === "AttendanceRecord") data.totalHours = data.checkIn && data.checkOut ? Math.round((new Date(String(data.checkOut)).getTime() - new Date(String(data.checkIn)).getTime()) / 36000) / 100 : 0;
      if (entity === "PerformanceGoal") {
        const review = await tx.performanceReview.findUniqueOrThrow({ where: { id: String(data.reviewId) } });
        if (review.status !== "DRAFT") throw new Error("Mở lại KPI về nháp ở màn hình đánh giá trước khi sửa mục tiêu.");
        const cycle = await tx.performanceCycle.findUniqueOrThrow({ where: { id: review.cycleId } });
        if (new Date(String(data.dueDate)) < cycle.startDate || new Date(String(data.dueDate)) > cycle.endDate) throw new Error("Hạn mục tiêu ngoài kỳ đánh giá.");
        await tx.performanceReview.update({ where: { id: review.id }, data: { version: { increment: 1 } } });
      }
      if (entity === "PerformanceReview") {
        if (id && ["employeeId", "cycleId", "branchId", "subjectType"].some(key => data[key] !== before?.[key])) throw new Error("Tạo bản đánh giá mới khi đổi đối tượng, nhóm hoặc kỳ.");
        const preset = presetFor(String(data.evaluationRole));
        if (!preset || preset.subject !== data.subjectType) throw new Error("Bộ tiêu chí không phù hợp nhóm đánh giá.");
        if (id && before?.status !== "DRAFT" && data.evaluationRole !== before?.evaluationRole) throw new Error("Mở lại về nháp trước khi đổi vai trò đánh giá.");
        if (data.subjectType === "BRANCH") {
          if (data.employeeId || !data.branchId || !data.responsibleEmployeeId) throw new Error("KPI chi nhánh cần chi nhánh, người phụ trách và để trống nhân viên được đánh giá.");
          const responsible = await tx.employee.findUniqueOrThrow({ where: { id: String(data.responsibleEmployeeId) } });
          if (responsible.branchId !== data.branchId || responsible.deletedAt || responsible.employmentStatus === "RESIGNED") throw new Error("Người phụ trách không thuộc chi nhánh hoặc đã ngừng hoạt động.");
          if (id && before?.status !== "DRAFT" && data.responsibleEmployeeId !== before?.responsibleEmployeeId) throw new Error("Mở lại về nháp trước khi đổi người phụ trách.");
        } else if (!data.employeeId || data.branchId || data.responsibleEmployeeId) throw new Error("KPI cá nhân cần nhân viên và để trống chi nhánh/người phụ trách riêng.");
        if (data.status !== (before?.status ?? "DRAFT")) throw new Error("Dùng luồng KPI để giao, đánh giá, phê duyệt hoặc mở lại. Các trường hồ sơ khác vẫn chỉnh được tại đây.");
        data.version = Number(before?.version ?? 0) + 1;
        if (["REVIEWED", "APPROVED", "ACKNOWLEDGED"].includes(String(data.status))) data.score = weightedScore(await tx.performanceGoal.findMany({ where: { reviewId: id ?? "" } }));
      }
      if (entity === "PerformanceCycle" && data.status === "CLOSED" && await tx.performanceReview.count({ where: { cycleId: id ?? "", status: { notIn: ["APPROVED", "ACKNOWLEDGED"] } } })) throw new Error("Hoàn tất hoặc xóa các đánh giá chưa duyệt trước khi đóng kỳ.");
      if (entity === "PersonnelActivity") data.completedAt = data.status === "COMPLETED" ? merged.completedAt ?? new Date() : null;
      if (entity === "TransferRequest" && data.status === "APPROVED" && before?.status !== "APPROVED") throw new Error("Lưu yêu cầu chờ rồi duyệt ở màn hình Thuyên chuyển để cập nhật hồ sơ/lịch sử đồng bộ.");
      if (entity === "ResignationRequest" && data.status === "COMPLETED" && before?.status !== "COMPLETED") throw new Error("Hoàn tất ở màn hình Nghỉ việc sau khi xác nhận bàn giao, tài sản và quyết toán.");
      if (entity === "PayrollPeriod" && data.status !== (before?.status ?? "DRAFT")) {
        if (data.status === "PUBLISHED") throw new Error("Phát hành ở màn hình Tiền lương sau khi kiểm tra phiếu lương.");
        data.lockedAt = null;
        await tx.payrollRecord.updateMany({ where: { payrollPeriodId: id ?? "" }, data: { status: "DRAFT" } });
      }
      const record = id ? await delegate.update({ where: { id }, data }) : await delegate.create({ data });
      resultId = record.id;
      let employeesMoved = 0;
      if (entity === "Department" && before && before.branchId !== record.branchId) {
        const moved = await tx.employee.updateMany({ where: { departmentId: record.id, deletedAt: null, employmentStatus: { in: ["ACTIVE", "PROBATION"] } }, data: { branchId: String(record.branchId) } });
        employeesMoved = moved.count;
      }
      if (entity === "Employee") {
        if (record.employmentStatus === "RESIGNED") await tx.user.updateMany({ where: { employeeId: record.id }, data: { isActive: false } });
        if (!before) await initializeEmployee(tx, { id: record.id, hireDate: new Date(String(record.hireDate)) });
        if (!before || ["departmentId", "positionId", "managerId", "baseSalary"].some(k => before[k] !== record[k])) {
          const dep = await tx.department.findUniqueOrThrow({ where: { id: String(record.departmentId) } }); const pos = await tx.position.findUniqueOrThrow({ where: { id: String(record.positionId) } });
          await tx.employmentHistory.updateMany({ where: { employeeId: record.id, endDate: null }, data: { endDate: new Date() } });
          await tx.employmentHistory.create({ data: { employeeId: record.id, departmentName: dep.name, positionName: pos.name, salary: Number(record.baseSalary), startDate: before ? new Date() : new Date(String(record.hireDate)), reason } });
        }
      }
      if (entity === "LeaveRequest") {
        if (before) await reconcileLeave(tx, String(before.employeeId), String(before.leaveTypeId), new Date(String(before.startDate)).getFullYear());
        await reconcileLeave(tx, String(record.employeeId), String(record.leaveTypeId), new Date(String(record.startDate)).getFullYear());
      }
      if (entity === "LeaveBalance") await reconcileLeave(tx, String(record.employeeId), String(record.leaveTypeId), Number(record.year));
      if (model.fields.some(f => f.name === "deletedAt") && record.deletedAt) throw new Error("Khôi phục bản ghi đã lưu trữ trước khi chỉnh sửa.");
      await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, entity, entityId: record.id, action: id ? "ADMIN_UPDATE" : "ADMIN_CREATE", description: reason, metadata: JSON.stringify({ before: sanitized(before), after: sanitized(record), ...(employeesMoved ? { employeesMoved } : {}) }) } });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) return { error: e.code === "P2002" ? "Mã/email hoặc cặp dữ liệu đã tồn tại." : e.code === "P2003" ? "Liên kết dữ liệu không hợp lệ." : "Không thể lưu dữ liệu. Kiểm tra các trường liên kết." };
    return { error: e instanceof z.ZodError ? e.issues.map(i => i.message).join(" · ") : e instanceof Error ? e.message : "Không thể lưu dữ liệu." };
  }
  revalidatePath("/", "layout");
  const destination = form.get("returnTo") === "/organization" && ["Branch", "Department", "Position"].includes(entity) ? "/organization" : `/admin/data/${entity}`;
  redirect(`${destination}?saved=${resultId}`);
}

export async function removeAdminRecordAction(entity: string, id: string, intent: "archive" | "restore" | "delete", form: FormData) {
  const user = await requireUser(["ADMIN"]); let error = "";
  try {
    modelFor(entity);
    const reason = z.string().trim().min(5).parse(form.get("reasonForChange"));
    if (intent === "delete" && form.get("confirmation") !== "XOA") throw new Error("Nhập XOA để xác nhận xóa vĩnh viễn.");
    await db.$transaction(async tx => {
      const delegate = dataDelegate(entity, tx); const row = await delegate.findUnique({ where: { id } });
      if (!row) throw new Error("Bản ghi không còn tồn tại.");
      if (entity === "User" && (id === user.id || (row.role === "ADMIN" && row.isActive && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1))) throw new Error("Không thể xóa tài khoản đang dùng hoặc admin hoạt động cuối cùng.");
      if (entity === "Employee" && intent !== "restore") {
        const account = await tx.user.findUnique({ where: { employeeId: id } });
        if (account?.id === user.id || (account?.role === "ADMIN" && account.isActive && await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1)) throw new Error("Không thể vô hiệu hồ sơ của tài khoản đang dùng hoặc admin cuối cùng.");
        if (intent === "delete" && account) throw new Error("Xóa hoặc gỡ liên kết tài khoản trước khi xóa vĩnh viễn hồ sơ.");
      }
      if (intent === "delete") await delegate.delete({ where: { id } });
      else {
        if (!modelFor(entity).fields.some(f => f.name === "deletedAt")) throw new Error("Phân hệ này không có lưu trữ mềm.");
        await delegate.update({ where: { id }, data: { deletedAt: intent === "archive" ? new Date() : null } });
        if (entity === "Employee" && intent === "archive") await tx.user.updateMany({ where: { employeeId: id }, data: { isActive: false } });
      }
      if (entity === "LeaveRequest") await reconcileLeave(tx, String(row.employeeId), String(row.leaveTypeId), new Date(String(row.startDate)).getFullYear());
      if (entity === "PerformanceGoal") {
        const review = await tx.performanceReview.findUniqueOrThrow({ where: { id: String(row.reviewId) } });
        if (review.status !== "DRAFT") throw new Error("Mở lại đánh giá về nháp trước khi xóa mục tiêu.");
        await tx.performanceReview.update({ where: { id: review.id }, data: { version: { increment: 1 } } });
      }
      await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, entity, entityId: id, action: `ADMIN_${intent.toUpperCase()}`, description: reason, metadata: JSON.stringify({ before: sanitized(row) }) } });
    });
  } catch (e) { error = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003" ? "Bản ghi có dữ liệu liên quan. Hãy lưu trữ hoặc xử lý các liên kết trước khi xóa." : e instanceof z.ZodError ? "Lý do thao tác cần ít nhất 5 ký tự." : e instanceof Error ? e.message : "Không thể thực hiện thao tác."; }
  revalidatePath("/", "layout");
  const destination = form.get("returnTo") === "/organization" && ["Branch", "Department", "Position"].includes(entity) ? "/organization" : `/admin/data/${entity}`;
  redirect(`${destination}${error ? `?error=${encodeURIComponent(error)}` : "?saved=1"}`);
}
