import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fieldsFor, entities, labels, modelFor, recordLabel } from "@/lib/admin-registry";
import { dataDelegate } from "@/lib/admin-data";
import { PageHeader } from "@/components/page-header";
import { ConfirmButton } from "@/components/confirm-button";
import { removeAdminRecordAction } from "@/app/admin-actions";
import { statusLabels, roleLabels, shortDate } from "@/lib/format";
export default async function AdminDataPage({ params, searchParams }: { params: Promise<{ entity: string }>; searchParams: Promise<{ q?: string; page?: string; error?: string; saved?: string }> }) {
  await requireUser(["ADMIN"]); const { entity } = await params; const p = await searchParams;
  if (!Object.hasOwn(entities, entity)) notFound();
  const model = modelFor(entity); const delegate = dataDelegate(entity);
  const searchFields = model.fields.filter(f => f.type === "String" && f.kind !== "object" && !["passwordHash", "id"].includes(f.name));
  const where = p.q ? { OR: searchFields.map(f => ({ [f.name]: { contains: p.q } })) } : {};
  const page = Math.max(1, Math.floor(Number(p.page) || 1)); const take = 20;
  const [rows, total] = await Promise.all([delegate.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }), delegate.count({ where })]);
  const columns = fieldsFor(entity).filter(f => !["passwordHash", "selfComment", "managerComment", "developmentPlan", "description", "notes", "note", "reason", "message", "evidence", "avatarUrl", "identityNumber", "bankAccount"].includes(f.name)).slice(0, 6);
  const soft = model.fields.some(f => f.name === "deletedAt");
  const display = (v: unknown) => v == null ? "—" : v instanceof Date ? shortDate.format(v) : typeof v === "boolean" ? v ? "Có" : "Không" : statusLabels[String(v)] ?? roleLabels[String(v)] ?? String(v);
  return <><PageHeader title={entities[entity]} description={`${total} bản ghi · Trang ${page}/${Math.max(1, Math.ceil(total / take))}`} actions={<><Link className="btn btn-secondary" href="/admin">Quản trị</Link><Link className="btn btn-primary" href={`/admin/data/${entity}/new`}>Thêm bản ghi</Link></>}/>{p.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{p.error}</p>}{p.saved && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-700">Đã cập nhật dữ liệu.</p>}<form className="card mb-5 flex gap-3 p-4"><input name="q" className="input" aria-label="Tìm bản ghi" placeholder="Tìm theo nội dung, mã hoặc tên..." defaultValue={p.q}/><button className="btn btn-secondary">Tìm kiếm</button></form>
    <section className="card table-wrap"><table><thead><tr><th>Bản ghi</th>{columns.map(f => <th key={f.name}>{labels[f.name] ?? f.name}</th>)}<th>Thao tác</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong className="block max-w-xs truncate">{recordLabel(row)}</strong>{row.deletedAt != null && <span className="badge badge-warning">Đã lưu trữ</span>}</td>{columns.map(f => <td className="max-w-xs truncate" key={f.name}>{display(row[f.name])}</td>)}<td><Link className="btn btn-secondary" href={`/admin/data/${entity}/${row.id}`}>Chỉnh sửa</Link><details className="mt-3"><summary className="cursor-pointer text-sm text-red-700">Lưu trữ / Khôi phục / Xóa</summary><div className="mt-3 min-w-64 space-y-4">{soft && <form action={removeAdminRecordAction.bind(null, entity, row.id, row.deletedAt ? "restore" : "archive")} className="space-y-2"><input className="input" name="reasonForChange" placeholder="Lý do thao tác" aria-label="Lý do lưu trữ hoặc khôi phục" minLength={5} required/><ConfirmButton className="btn btn-secondary" message="Xác nhận lưu trữ/khôi phục bản ghi?">{row.deletedAt ? "Khôi phục" : "Lưu trữ"}</ConfirmButton></form>}<form action={removeAdminRecordAction.bind(null, entity, row.id, "delete")} className="space-y-2"><input className="input" name="reasonForChange" aria-label="Lý do xóa" placeholder="Lý do xóa vĩnh viễn" minLength={5} required/><input className="input" name="confirmation" aria-label="Xác nhận xóa" placeholder="Nhập XOA" pattern="XOA" required/><ConfirmButton message="Xóa vĩnh viễn bản ghi này? Dữ liệu chỉ có thể phục hồi từ bản sao lưu.">Xóa vĩnh viễn</ConfirmButton></form></div></details></td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-center text-zinc-500">Không có dữ liệu phù hợp.</p>}</section><div className="mt-5 flex gap-3">{page > 1 && <Link href={`?page=${page - 1}&q=${encodeURIComponent(p.q ?? "")}`} className="btn btn-secondary">Trang trước</Link>}{page * take < total && <Link href={`?page=${page + 1}&q=${encodeURIComponent(p.q ?? "")}`} className="btn btn-secondary">Trang sau</Link>}</div>
  </>;
}
