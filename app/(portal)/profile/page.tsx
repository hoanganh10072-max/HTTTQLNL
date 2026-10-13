import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { money, shortDate } from "@/lib/format";
export default async function ProfilePage() {
  const user = await requireUser();
  const e = user.employeeId ? await db.employee.findUnique({ where: { id: user.employeeId }, include: { branch: true, department: true, position: true } }) : null;
  return <><PageHeader title="Hồ sơ của tôi" description="Thông tin nhân sự cá nhân. Liên hệ bộ phận nhân sự để cập nhật hồ sơ." actions={<Link href="/settings" className="btn btn-secondary">Đổi mật khẩu</Link>}/>{e ? <section className="card p-6"><h2>{e.lastName} {e.firstName} · {e.employeeCode}</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[["Email", e.workEmail], ["Điện thoại", e.phone], ["Ngày sinh", e.dateOfBirth ? shortDate.format(e.dateOfBirth) : ""], ["Chi nhánh", e.branch.name], ["Phòng ban", e.department.name], ["Chức danh", e.position.name], ["Ngày vào làm", shortDate.format(e.hireDate)], ["Lương cơ bản", money.format(e.baseSalary)], ["Địa chỉ", e.address], ["Bằng cấp", e.qualifications], ["Kỹ năng", e.skills], ["Kinh nghiệm", e.experience]].map(([label, value]) => <div key={label}><dt className="label">{label}</dt><dd>{value || "Chưa cập nhật"}</dd></div>)}</dl><div className="mt-5"><StatusBadge status={e.employmentStatus}/></div></section> : <p className="card p-6">Tài khoản quản trị chưa liên kết hồ sơ nhân viên. Bạn vẫn có thể sử dụng các chức năng được cấp quyền.</p>}</>;
}
