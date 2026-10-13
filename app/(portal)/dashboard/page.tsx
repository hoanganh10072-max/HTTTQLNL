import Link from "next/link";
import { Users, UserCheck, CalendarClock, WalletCards, Target, ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeScope, rating } from "@/lib/performance";
import { reviewScope } from "@/lib/performance-presets";
import { money, shortDate } from "@/lib/format";
import { DepartmentChart, MovementChart } from "@/components/dashboard-charts";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 1), end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const scope = { ...employeeScope(user), deletedAt: null };
  const personal = user.role === "EMPLOYEE";
  const payAccess = user.role !== "MANAGER";
  const [total, active, pending, reviews, activities, groups, departments, payroll] = await Promise.all([
    db.employee.count({ where: scope }),
    db.employee.count({ where: { ...scope, employmentStatus: { in: ["ACTIVE", "PROBATION"] } } }),
    db.leaveRequest.count({ where: { employee: scope, status: "PENDING" } }),
    db.performanceReview.findMany({ where: reviewScope(user), include: { employee: true, branch: true, cycle: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
    db.personnelActivity.findMany({ where: { employee: scope, status: { in: ["TODO", "IN_PROGRESS"] } }, include: { employee: true }, orderBy: { dueDate: "asc" }, take: 6 }),
    db.employee.groupBy({ by: ["departmentId"], where: { ...scope, employmentStatus: { in: ["ACTIVE", "PROBATION"] } }, _count: true }),
    db.department.findMany({ select: { id: true, name: true } }),
    payAccess ? db.payrollRecord.aggregate({ where: { employee: scope, status: "PUBLISHED", payrollPeriod: { status: "PUBLISHED", month: now.getMonth() + 1, year: now.getFullYear() } }, _sum: { netSalary: true } }) : null,
  ]);
  const movements = await Promise.all(Array.from({ length: 6 }, async (_, i) => {
    const from = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const [join, leave] = await Promise.all([
      db.employee.count({ where: { ...employeeScope(user), hireDate: { gte: from, lt: to } } }),
      db.resignationRequest.count({ where: { employee: employeeScope(user), status: "COMPLETED", lastWorkingDate: { gte: from, lt: to } } }),
    ]);
    return { month: `${from.getMonth() + 1}/${String(from.getFullYear()).slice(-2)}`, join, leave };
  }));
  const attendance = personal && user.employeeId ? await db.attendanceRecord.count({ where: { employeeId: user.employeeId, workDate: { gte: start, lt: end }, checkIn: { not: null } } }) : 0;
  const map = new Map(departments.map(d => [d.id, d.name]));
  return <><PageHeader title={personal ? "Tổng quan cá nhân" : user.role === "MANAGER" ? "Tổng quan nhóm" : "Tổng quan nhân sự"} description={`Dữ liệu thực tế từ hệ thống · Tháng ${now.getMonth() + 1}/${now.getFullYear()} · Theo phạm vi của bạn.`} actions={user.role === "ADMIN" ? <Link className="btn btn-primary" href="/admin">Trung tâm quản trị</Link> : undefined}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label={personal ? "Ngày công tháng này" : "Tổng hồ sơ"} value={personal ? attendance : total}/>
      <Metric icon={UserCheck} label={personal ? "Trạng thái công việc" : "Đang làm / thử việc"} value={personal ? user.employee?.employmentStatus ?? "Chưa liên kết hồ sơ" : active}/>
      <Metric icon={CalendarClock} label="Đơn phép chờ duyệt" value={pending}/>
      <Metric icon={WalletCards} label={personal ? "Lương đã phát hành tháng này" : "Quỹ lương đã phát hành tháng này"} value={payAccess ? money.format(payroll?._sum.netSalary ?? 0) : "Giới hạn quyền"}/>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="card p-5"><h2><Target size={18} className="mr-2 inline"/>Đánh giá KPI gần đây</h2><div className="mt-4 space-y-3">{reviews.map(r => <Link key={r.id} href={`/performance/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 p-4 hover:bg-blue-50"><div><strong>{r.branch?.name ?? `${r.employee?.lastName ?? ""} ${r.employee?.firstName ?? ""}`}</strong><p className="text-xs text-zinc-500">{r.cycle.name}</p></div><StatusBadge status={r.status}/><span className="text-sm">{r.score == null ? "Chưa chấm" : `${r.score} · ${rating(r.score)}`}</span></Link>)}{!reviews.length && <p className="text-sm text-zinc-500">Chưa có đánh giá KPI.</p>}</div><Link className="mt-4 inline-block font-semibold text-blue-700" href="/performance">Xem tất cả KPI →</Link></section>
      <section className="card p-5"><h2><ClipboardList size={18} className="mr-2 inline"/>Nhiệm vụ nhân sự cần xử lý</h2><div className="mt-4 space-y-3">{activities.map(a => <div key={a.id} className="flex justify-between gap-3 rounded-xl border border-blue-100 p-4"><div><strong>{a.title}</strong><p className="text-xs text-zinc-500">{a.employee.lastName} {a.employee.firstName} · {shortDate.format(a.dueDate)}</p></div><span className={a.dueDate < now ? "text-xs text-red-700" : "text-xs text-blue-700"}>{a.dueDate < now ? "Quá hạn" : "Đang chờ"}</span></div>)}{!activities.length && <p className="text-sm text-zinc-500">Chưa có nhiệm vụ đang chờ.</p>}</div><Link className="mt-4 inline-block font-semibold text-blue-700" href="/activities">Quản lý vòng đời nhân sự →</Link></section>
    </div>
    {!personal && <div className="mt-6 grid gap-6 xl:grid-cols-2"><section className="card p-5"><h2>Nhân sự theo phòng ban</h2><DepartmentChart data={groups.map(g => ({ name: map.get(g.departmentId) ?? "Khác", value: g._count }))}/></section><section className="card p-5"><h2>Biến động nhân sự</h2><p className="text-xs text-zinc-500">Ngày tiếp nhận và hồ sơ nghỉ việc đã hoàn tất · 6 tháng gần nhất</p><MovementChart data={movements}/></section></div>}
  </>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return <div className="card flex items-start justify-between gap-3 p-5"><div><p className="text-sm text-zinc-500">{label}</p><p className="mt-3 text-xl font-bold">{value}</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={20}/></div></div>;
}
