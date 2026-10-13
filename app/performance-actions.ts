"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { weightedScore } from "@/lib/performance";
import { presetFor, reviewAccess } from "@/lib/performance-presets";
import { Prisma } from "@prisma/client";

export async function createCycleAction(form: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  const parsed = z.object({ name: z.string().trim().min(3), startDate: z.coerce.date(), endDate: z.coerce.date() }).safeParse(Object.fromEntries(form));
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) redirect("/performance?error=Ngày hoặc tên kỳ đánh giá không hợp lệ.");
  await db.$transaction(async tx => {
    const cycle = await tx.performanceCycle.create({ data: { ...parsed.data, status: "ACTIVE" } });
    await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: "CREATE", entity: "PerformanceCycle", entityId: cycle.id, description: `Tạo kỳ đánh giá ${cycle.name}` } });
  });
  revalidatePath("/performance");
}

export async function assignReviewAction(form: FormData) {
  const user = await requireUser(["ADMIN", "HR", "MANAGER"]);
  const cycleId = String(form.get("cycleId")); const employeeId = String(form.get("employeeId"));
  const subjectType = z.enum(["LEADERSHIP", "BRANCH", "EMPLOYEE"]).parse(form.get("subjectType") ?? "EMPLOYEE");
  const evaluationRole = String(form.get("evaluationRole") ?? "PROFESSIONAL");
  const preset = presetFor(evaluationRole);
  let id = ""; let error = "";
  try {
    id = await db.$transaction(async tx => {
      if (!preset || preset.subject !== subjectType) throw new Error("Bộ tiêu chí không phù hợp nhóm đánh giá.");
      const cycle = await tx.performanceCycle.findUniqueOrThrow({ where: { id: cycleId } });
      if (cycle.status !== "ACTIVE") throw new Error("Kỳ đánh giá không còn hoạt động.");
      let target: { employeeId?: string; branchId?: string; responsibleEmployeeId?: string };
      let targetName: string;
      if (subjectType === "BRANCH") {
        if (!["ADMIN", "HR"].includes(user.role)) throw new Error("Chỉ admin/HR giao KPI chi nhánh.");
        const branch = await tx.branch.findUniqueOrThrow({ where: { id: String(form.get("branchId")) } });
        const responsible = await tx.employee.findUniqueOrThrow({ where: { id: String(form.get("responsibleEmployeeId")) } });
        if (branch.deletedAt || branch.status !== "ACTIVE" || responsible.deletedAt || responsible.employmentStatus === "RESIGNED" || responsible.branchId !== branch.id) throw new Error("Người phụ trách phải là nhân viên đang hoạt động của chi nhánh đã chọn.");
        if (await tx.performanceReview.findUnique({ where: { cycleId_branchId: { cycleId, branchId: branch.id } } })) throw new Error("Chi nhánh đã có đánh giá trong kỳ này.");
        target = { branchId: branch.id, responsibleEmployeeId: responsible.id }; targetName = branch.name;
      } else {
        const employee = await tx.employee.findUniqueOrThrow({ where: { id: employeeId } });
        if (employee.deletedAt || employee.employmentStatus === "RESIGNED") throw new Error("Hồ sơ không còn hoạt động.");
        if (user.role === "MANAGER" && (!user.employeeId || employee.managerId !== user.employeeId)) throw new Error("Nhân viên ngoài phạm vi quản lý.");
        if (await tx.performanceReview.findUnique({ where: { cycleId_employeeId: { cycleId, employeeId } } })) throw new Error("Người này đã có đánh giá trong kỳ. Mở bản hiện có hoặc chọn kỳ khác.");
        target = { employeeId }; targetName = `${employee.employeeCode} · ${employee.lastName} ${employee.firstName}`;
      }
      const review = await tx.performanceReview.create({ data: { cycleId, ...target, subjectType, evaluationRole } });
      if (form.get("applyPreset") === "on") {
        for (const criterion of preset.criteria) await tx.performanceGoal.create({ data: { ...criterion, reviewId: review.id, dueDate: cycle.endDate } });
      }
      await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: "ASSIGN", entity: "PerformanceReview", entityId: review.id, description: `Giao KPI ${preset.label} cho ${targetName}` } });
      return review.id;
    });
  } catch (e) { error = e instanceof Prisma.PrismaClientKnownRequestError ? "Đối tượng không tồn tại hoặc đã có đánh giá trong kỳ." : e instanceof Error ? e.message : "Không thể giao KPI."; }
  if (error) redirect(`/performance?group=${subjectType}&error=${encodeURIComponent(error)}`);
  redirect(`/performance/${id}`);
}

export async function performanceAction(id: string, intent: string, form: FormData) {
  const user = await requireUser(); let error = "";
  try {
    await db.$transaction(async tx => {
      const review = await tx.performanceReview.findUniqueOrThrow({ where: { id }, include: { employee: true, branch: true, cycle: true, goals: true } });
      const admin = user.role === "ADMIN";
      const { owner, editor } = reviewAccess(user, review);
      if (!owner && !editor) throw new Error("Bạn không có quyền với đánh giá này.");
      if (review.cycle.status === "CLOSED" && !admin) throw new Error("Kỳ đánh giá đã đóng.");
      if (Number(form.get("version")) !== review.version) throw new Error("Dữ liệu đã thay đổi. Tải lại trang rồi thử lại.");
      const claimed = await tx.performanceReview.updateMany({ where: { id, version: review.version }, data: { version: { increment: 1 } } });
      if (claimed.count !== 1) throw new Error("Dữ liệu đã thay đổi.");
      const note = String(form.get("note") ?? "").trim();
      if (intent === "goal" || intent === "delete-goal") {
        if (!editor || review.status !== "DRAFT") throw new Error("Chỉ chỉnh mục tiêu khi bản đánh giá còn ở nháp. Admin có thể mở lại trước khi sửa.");
        const goalId = String(form.get("goalId") ?? "");
        if (goalId && !review.goals.some(g => g.id === goalId)) throw new Error("Mục tiêu không thuộc đánh giá này.");
        if (intent === "delete-goal") { if (!goalId) throw new Error("Thiếu mục tiêu."); await tx.performanceGoal.delete({ where: { id: goalId } }); }
        else {
          const data = z.object({ title: z.string().trim().min(3), description: z.string().optional(), unit: z.string().trim().min(1), target: z.coerce.number().positive(), weight: z.coerce.number().positive().max(100), direction: z.enum(["HIGHER", "LOWER"]), dueDate: z.coerce.date() }).parse(Object.fromEntries(form));
          if (data.dueDate < review.cycle.startDate || data.dueDate > review.cycle.endDate) throw new Error("Hạn mục tiêu phải nằm trong kỳ đánh giá.");
          if (goalId) await tx.performanceGoal.update({ where: { id: goalId }, data });
          else await tx.performanceGoal.create({ data: { ...data, reviewId: id } });
        }
      } else if (intent === "publish") {
        if (!editor || review.status !== "DRAFT") throw new Error("Không thể giao mục tiêu ở trạng thái hiện tại.");
        weightedScore(review.goals);
        await tx.performanceReview.update({ where: { id }, data: { status: "IN_PROGRESS" } });
        const targetEmployeeId = review.subjectType === "BRANCH" ? review.responsibleEmployeeId : review.employeeId;
        const target = targetEmployeeId ? await tx.user.findUnique({ where: { employeeId: targetEmployeeId } }) : null;
        if (target) await tx.notification.create({ data: { userId: target.id, title: "KPI đã được giao", message: review.cycle.name, type: "ACTION", link: `/performance/${id}` } });
      } else if (intent === "save" || intent === "submit") {
        if ((!owner && !admin) || review.status !== "IN_PROGRESS") throw new Error("Chỉ nhân viên được cập nhật kết quả trong giai đoạn thực hiện.");
        if (!review.goals.length) throw new Error("Chưa có mục tiêu.");
        for (const goal of review.goals) {
          if (form.get(`actual_${goal.id}`) === null || form.get(`actual_${goal.id}`) === "") throw new Error("Thiếu kết quả thực tế của mục tiêu.");
          const actual = z.coerce.number().nonnegative().parse(form.get(`actual_${goal.id}`));
          const evidence = String(form.get(`evidence_${goal.id}`) ?? "").trim();
          if (intent === "submit" && !evidence) throw new Error("Cần minh chứng cho tất cả mục tiêu trước khi gửi.");
          await tx.performanceGoal.update({ where: { id: goal.id }, data: { actual, evidence } });
        }
        if (intent === "submit" && note.length < 5) throw new Error("Cần nhận xét tự đánh giá tối thiểu 5 ký tự.");
        await tx.performanceReview.update({ where: { id }, data: { selfComment: note, ...(intent === "submit" ? { status: "SUBMITTED", submittedAt: new Date() } : {}) } });
      } else if (intent === "review") {
        if (!editor || (owner && !admin) || !["SUBMITTED", "REVIEWED"].includes(review.status)) throw new Error("Không thể tự duyệt đánh giá hoặc đánh giá chưa được gửi.");
        if (note.length < 5) throw new Error("Cần phản hồi đánh giá tối thiểu 5 ký tự.");
        const goals = [];
        for (const goal of review.goals) {
          if (form.get(`score_${goal.id}`) === null || form.get(`score_${goal.id}`) === "") throw new Error("Cần chấm điểm tất cả mục tiêu.");
          const managerScore = z.coerce.number().min(0).max(120).parse(form.get(`score_${goal.id}`));
          goals.push({ ...goal, managerScore });
          await tx.performanceGoal.update({ where: { id: goal.id }, data: { managerScore } });
        }
        await tx.performanceReview.update({ where: { id }, data: { score: weightedScore(goals), managerComment: note, developmentPlan: String(form.get("developmentPlan") ?? ""), evaluatedBy: user.id, status: "REVIEWED" } });
      } else if (intent === "approve") {
        if ((!admin && user.role !== "HR") || (owner && !admin) || review.status !== "REVIEWED") throw new Error("Chỉ HR/admin có thể phê duyệt kết quả đã đánh giá.");
        if (!review.managerComment || !review.developmentPlan?.trim()) throw new Error("Cần phản hồi và kế hoạch phát triển trước khi phê duyệt.");
        await tx.performanceReview.update({ where: { id }, data: { status: "APPROVED", score: weightedScore(review.goals), approvedAt: new Date() } });
      } else if (intent === "acknowledge") {
        if ((!owner && !admin) || review.status !== "APPROVED") throw new Error("Chỉ nhân viên được xác nhận kết quả đã duyệt.");
        await tx.performanceReview.update({ where: { id }, data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() } });
      } else if (intent === "reopen") {
        if (!editor || (!admin && !["SUBMITTED", "REVIEWED"].includes(review.status)) || note.length < 5) throw new Error("Cần quyền quản lý và lý do trả lại/mở lại ít nhất 5 ký tự.");
        await tx.performanceReview.update({ where: { id }, data: { status: admin ? "DRAFT" : "IN_PROGRESS", score: null, approvedAt: null, acknowledgedAt: null, managerComment: note } });
        await tx.performanceGoal.updateMany({ where: { reviewId: id }, data: { managerScore: null } });
      } else throw new Error("Thao tác không hợp lệ.");
      await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: intent.toUpperCase(), entity: "PerformanceReview", entityId: id, description: `${review.branch?.name ?? review.employee?.employeeCode} · ${review.cycle.name} · ${intent}`, metadata: JSON.stringify({ from: review.status, note, version: review.version, subjectType: review.subjectType, evaluationRole: review.evaluationRole }) } });
    });
  } catch (e) { error = e instanceof z.ZodError ? "Dữ liệu chưa hợp lệ, kiểm tra lại các trường số và ngày." : e instanceof Error ? e.message : "Không thể lưu đánh giá."; }
  revalidatePath("/performance");
  redirect(`/performance/${id}${error ? `?error=${encodeURIComponent(error)}` : "?success=1"}`);
}
