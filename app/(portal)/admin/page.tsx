import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { entities } from "@/lib/admin-registry";
import { dataDelegate } from "@/lib/admin-data";
import { PageHeader } from "@/components/page-header";
export default async function AdminPage() {
  await requireUser(["ADMIN"]);
  const counts = await Promise.all(Object.keys(entities).map(async name => [name, await dataDelegate(name).count()] as const));
  return <><PageHeader title="Trung tâm quản trị" description="Toàn quyền quản lý dữ liệu, tài khoản và phân quyền trên tất cả phân hệ." actions={<Link className="btn btn-secondary" href="/audit">Nhật ký thay đổi</Link>}/><p className="card mb-6 p-5 text-sm text-zinc-500">Mỗi thay đổi yêu cầu lý do và được ghi lại. Dữ liệu có liên kết phải được xử lý theo thứ tự; hồ sơ có thể lưu trữ và khôi phục. Các thao tác phê duyệt thực hiện qua luồng nghiệp vụ để cập nhật đồng bộ.</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{counts.map(([name, count]) => <Link key={name} href={`/admin/data/${name}`} className="card p-5 transition hover:border-blue-400 hover:shadow-md"><h2>{entities[name]}</h2><p className="mt-2 text-sm text-zinc-500">{count} bản ghi</p><span className="mt-4 inline-block text-sm font-semibold text-blue-700">Thêm · Sửa · Xóa →</span></Link>)}</div></>;
}
