import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeScope, rating } from "@/lib/performance";
import { subjectLabels, performancePresets, presetFor, reviewScope, type SubjectType } from "@/lib/performance-presets";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PerformanceAssignmentForm } from "@/components/performance-assignment-form";
import { PerformanceCriteria } from "@/components/performance-criteria";
import { createCycleAction } from "@/app/performance-actions";
import { shortDate } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ group?: string; cycle?: string; q?: string; branch?: string; evaluationRole?: string; error?: string }> }) {
  const user = await requireUser(); const p = await searchParams;
  const group = p.group === "CRITERIA" ? "CRITERIA" : Object.hasOwn(subjectLabels, p.group ?? "") ? p.group as SubjectType : "EMPLOYEE";
  const tabs = [["LEADERSHIP", "Lãnh đạo theo vai trò"], ["BRANCH", "Chi nhánh"], ["EMPLOYEE", "Nhân viên"], ["CRITERIA", "Tiêu chí & cách xét"]];
  const navigation = <nav aria-label="Nhóm đánh giá KPI" className="card mb-6 flex flex-wrap gap-2 p-3">{tabs.map(([key, label]) => <Link key={key} aria-current={group === key ? "page" : undefined} href={`?group=${key}${p.cycle ? `&cycle=${encodeURIComponent(p.cycle)}` : ""}`} className={`btn ${group === key ? "btn-primary" : "btn-secondary"}`}>{label}</Link>)}</nav>;
  if (group === "CRITERIA") return <><PageHeader title="Đánh giá KPI" description="Bộ tiêu chí theo đối tượng, cách tính điểm và điều kiện xét kết quả."/>{navigation}<PerformanceCriteria/></>;
  const where: Prisma.PerformanceReviewWhereInput = { AND: [
    reviewScope(user), { subjectType: group },
    ...(p.cycle ? [{ cycleId: p.cycle }] : []),
    ...(p.evaluationRole ? [{ evaluationRole: p.evaluationRole }] : []),
    ...(p.branch ? [group === "BRANCH" ? { branchId: p.branch } : { employee: { branchId: p.branch } }] : []),
    ...(p.q ? [group === "BRANCH" ? { branch: { OR: [{ name: { contains: p.q } }, { code: { contains: p.q } }] } } : { employee: { OR: [{ firstName: { contains: p.q } }, { lastName: { contains: p.q } }, { employeeCode: { contains: p.q } }] } }] : []),
  ] };
  const [cycles, employees, branches, reviews, total, pending, final] = await Promise.all([
    db.performanceCycle.findMany({ orderBy: { startDate: "desc" } }),
    db.employee.findMany({ where: { ...employeeScope(user), deletedAt: null, employmentStatus: { not: "RESIGNED" } }, orderBy: { employeeCode: "asc" } }),
    db.branch.findMany({ where: { deletedAt: null, status: "ACTIVE", ...(!["ADMIN", "HR"].includes(user.role) ? { id: user.employee?.branchId ?? "__none__" } : {}) }, orderBy: { name: "asc" } }),
    db.performanceReview.findMany({ where, include: { employee: { include: { department: true, branch: true } }, branch: true, responsibleEmployee: true, cycle: true, goals: true }, orderBy: { updatedAt: "desc" }, take: 200 }),
    db.performanceReview.count({ where }),
    db.performanceReview.count({ where: { AND: [where, { status: "SUBMITTED" }] } }),
    db.performanceReview.aggregate({ where: { AND: [where, { status: { in: ["APPROVED", "ACKNOWLEDGED"] } }] }, _avg: { score: true } }),
  ]);
  const params = new URLSearchParams({ group, ...(p.cycle ? { cycle: p.cycle } : {}), ...(p.branch ? { branch: p.branch } : {}), ...(p.q ? { q: p.q } : {}), ...(p.evaluationRole ? { evaluationRole: p.evaluationRole } : {}) });
  const canAssign = group === "BRANCH" ? ["ADMIN", "HR"].includes(user.role) : user.role !== "EMPLOYEE";
  return <><PageHeader title="Đánh giá KPI" description={`${subjectLabels[group]} · Giao tiêu chí → cập nhật minh chứng → tự đánh giá → phản hồi → phê duyệt → xác nhận.`} actions={<a className="btn btn-secondary" href={`/api/export/performance?${params}`}>Xuất KPI CSV</a>}/>{navigation}
    {p.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{p.error}</p>}
    <div className="mb-6 grid gap-4 sm:grid-cols-3">{[["Bản đánh giá", total], ["Chờ đánh giá", pending], ["Điểm KPI đã duyệt trung bình", final._avg.score != null ? `${final._avg.score.toFixed(1)} / 120` : "Chưa có"]].map(([label, value]) => <div className="card p-5" key={label}><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>
    {canAssign && <div className="mb-6 grid gap-5 xl:grid-cols-2">
      {["ADMIN", "HR"].includes(user.role) && <form action={createCycleAction} className="card space-y-4 p-5"><h2>Tạo kỳ đánh giá</h2><label className="block"><span className="label">Tên kỳ</span><input className="input" name="name" required minLength={3} placeholder="KPI quý IV / 2026"/></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Từ ngày</span><input className="input" type="date" name="startDate" required/></label><label><span className="label">Đến ngày</span><input className="input" type="date" name="endDate" required/></label></div><button className="btn btn-primary">Tạo kỳ đánh giá</button><div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Kỳ dùng chung cho lãnh đạo, chi nhánh và nhân viên. Mỗi người hoặc chi nhánh có một hồ sơ đánh giá trong kỳ.</div><Link href="?group=CRITERIA" className="inline-block text-sm font-semibold text-blue-700">Xem tiêu chí & cách xét →</Link></form>}
      <PerformanceAssignmentForm key={group} subject={group} cycles={cycles.filter(c => c.status === "ACTIVE")} employees={employees} branches={branches}/>
    </div>}
    <form className="card mb-5 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"><input type="hidden" name="group" value={group}/><input aria-label="Tìm đối tượng KPI" name="q" className="input" defaultValue={p.q} placeholder={group === "BRANCH" ? "Tên hoặc mã chi nhánh" : "Tên hoặc mã nhân viên"}/><select aria-label="Lọc kỳ đánh giá" className="input" name="cycle" defaultValue={p.cycle}><option value="">Tất cả kỳ</option>{cycles.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select><select aria-label="Lọc vai trò đánh giá" className="input" name="evaluationRole" defaultValue={p.evaluationRole}><option value="">Tất cả bộ tiêu chí / vai trò</option>{performancePresets.filter(preset => preset.subject === group).map(preset => <option key={preset.key} value={preset.key}>{preset.label}</option>)}</select><select aria-label="Lọc chi nhánh" className="input" name="branch" defaultValue={p.branch}><option value="">Tất cả chi nhánh</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4"><button className="btn btn-secondary">Lọc đánh giá</button>{user.role === "ADMIN" && <Link className="btn btn-secondary" href="/admin/data/PerformanceCycle">Quản lý kỳ đánh giá</Link>}</div></form>
    <section className="card table-wrap"><table><thead><tr><th>{group === "BRANCH" ? "Chi nhánh / Người phụ trách" : "Người được đánh giá"}</th><th>Vai trò / Bộ tiêu chí</th><th>Kỳ / Thời gian</th><th>Tiêu chí</th><th>Trạng thái</th><th>Kết quả</th><th/></tr></thead><tbody>{reviews.map(r => <tr key={r.id}><td><strong>{r.branch ? `${r.branch.code} · ${r.branch.name}` : r.employee ? `${r.employee.employeeCode} · ${r.employee.lastName} ${r.employee.firstName}` : "Hồ sơ không khả dụng"}</strong><p className="text-xs text-zinc-500">{r.branch ? `Phụ trách: ${r.responsibleEmployee?.lastName ?? ""} ${r.responsibleEmployee?.firstName ?? ""}` : `${r.employee?.department.name} · ${r.employee?.branch.name}`}</p></td><td>{presetFor(r.evaluationRole)?.label ?? r.evaluationRole}</td><td>{r.cycle.name}<p className="text-xs text-zinc-500">{shortDate.format(r.cycle.startDate)} – {shortDate.format(r.cycle.endDate)}</p></td><td>{r.goals.length} · {r.goals.reduce((s, g) => s + g.weight, 0)}%</td><td><StatusBadge status={r.status}/></td><td>{r.score == null ? "Chưa chấm" : `${r.score} · ${rating(r.score)}`}</td><td><Link className="btn btn-secondary" href={`/performance/${r.id}`}>Xem đánh giá</Link></td></tr>)}</tbody></table>{!reviews.length && <p className="p-8 text-center text-zinc-500">Chưa có đánh giá trong nhóm và phạm vi của bạn.</p>}</section>
    <p className="mt-4 text-xs text-zinc-500">Hiển thị tối đa 200 bản ghi. Điểm 0–120; chỉ kết quả đã duyệt được tính vào điểm trung bình. <Link href="?group=CRITERIA" className="font-semibold text-blue-700">Xem toàn bộ tiêu chí & cách xét.</Link></p>
  </>;
}
