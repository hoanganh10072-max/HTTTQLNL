"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { activityCategories } from "@/lib/admin-registry";
export async function createActivityAction(form: FormData) {
  const user = await requireUser(["ADMIN", "HR"]); let error = "";
  try {
    const data = z.object({ employeeId: z.string().min(1), category: z.enum(Object.keys(activityCategories) as [string, ...string[]]), title: z.string().trim().min(3), owner: z.string(), dueDate: z.coerce.date(), notes: z.string(), cost: z.coerce.number().nonnegative() }).parse(Object.fromEntries(form));
    await db.$transaction(async tx => {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: data.employeeId } });
      if (employee.deletedAt) throw new Error("Nhân viên đã được lưu trữ.");
      const activity = await tx.personnelActivity.create({ data });
      await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, entity: "PersonnelActivity", entityId: activity.id, action: "CREATE", description: data.title } });
    });
  } catch (e) { error = e instanceof z.ZodError ? "Kiểm tra tên, ngày, nhân viên và chi phí." : e instanceof Error ? e.message : "Không thể tạo hoạt động."; }
  revalidatePath("/activities"); if (error) redirect(`/activities?error=${encodeURIComponent(error)}`);
}
export async function updateActivityAction(id: string, form: FormData) {
  const user = await requireUser(["ADMIN", "HR"]);
  const status = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).parse(form.get("status"));
  await db.$transaction(async tx => {
    await tx.personnelActivity.update({ where: { id }, data: { status, completedAt: status === "COMPLETED" ? new Date() : null } });
    await tx.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: "UPDATE", entity: "PersonnelActivity", entityId: id, description: `Cập nhật hoạt động: ${status}` } });
  }); revalidatePath("/activities");
}
