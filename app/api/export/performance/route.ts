import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rating } from "@/lib/performance";
import { reviewScope, presetFor, subjectLabels, type SubjectType } from "@/lib/performance-presets";
import type { Prisma } from "@prisma/client";
import { csvCell } from "@/lib/csv";
export async function GET(req: NextRequest) {
  const user = await requireUser(); const p = req.nextUrl.searchParams;
  const cycle = p.get("cycle"), group = p.get("group"), branch = p.get("branch"), q = p.get("q"), role = p.get("evaluationRole");
  if (group && !Object.hasOwn(subjectLabels, group)) return new NextResponse("Nhóm đánh giá không hợp lệ.", { status: 400 });
  const where: Prisma.PerformanceReviewWhereInput = { AND: [reviewScope(user), ...(group ? [{ subjectType: group }] : []), ...(cycle ? [{ cycleId: cycle }] : []), ...(role ? [{ evaluationRole: role }] : []), ...(branch ? [group === "BRANCH" ? { branchId: branch } : { employee: { branchId: branch } }] : []), ...(q ? [group === "BRANCH" ? { branch: { OR: [{ name: { contains: q } }, { code: { contains: q } }] } } : { employee: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { employeeCode: { contains: q } }] } }] : [])] };
  const reviews = await db.performanceReview.findMany({ where, include: { employee: true, branch: true, responsibleEmployee: true, cycle: true }, orderBy: { createdAt: "desc" } });
  const rows = [["Nhóm", "Mã đối tượng", "Tên đối tượng", "Vai trò / Bộ tiêu chí", "Phụ trách chi nhánh", "Kỳ", "Trạng thái", "Điểm", "Xếp loại"], ...reviews.map(r => [subjectLabels[r.subjectType as SubjectType], r.branch?.code ?? r.employee?.employeeCode, r.branch?.name ?? `${r.employee?.lastName ?? ""} ${r.employee?.firstName ?? ""}`, presetFor(r.evaluationRole)?.label, r.responsibleEmployee ? `${r.responsibleEmployee.lastName} ${r.responsibleEmployee.firstName}` : "", r.cycle.name, r.status, r.score ?? "", r.score == null ? "" : rating(r.score)])];
  return new NextResponse("\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=performance.csv", "Cache-Control": "no-store" } });
}
