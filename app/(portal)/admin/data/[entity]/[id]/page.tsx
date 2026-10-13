import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { entities, recordLabel } from "@/lib/admin-registry";
import { dataDelegate } from "@/lib/admin-data";
import { adminFieldsFor } from "@/lib/admin-form";
import { PageHeader } from "@/components/page-header";
import { AdminRecordForm } from "@/components/admin-record-form";

export default async function AdminRecordPage({ params }: { params: Promise<{ entity: string; id: string }> }) {
  await requireUser(["ADMIN"]); const { entity, id } = await params;
  if (!Object.hasOwn(entities, entity)) notFound();
  const record = id === "new" ? null : await dataDelegate(entity).findUnique({ where: { id } });
  if (id !== "new" && !record) notFound();
  const fields = await adminFieldsFor(entity, record);
  return <><PageHeader title={`${record ? "Chỉnh sửa" : "Thêm"} · ${entities[entity]}`} description={record ? recordLabel(record) : "Nhập dữ liệu và lý do tạo bản ghi."} actions={<Link className="btn btn-secondary" href={`/admin/data/${entity}`}>Quay lại danh sách</Link>}/>{entity === "PerformanceReview" && record && <Link className="btn btn-primary mb-5" href={`/performance/${id}`}>Mở luồng đánh giá / phê duyệt KPI</Link>}<AdminRecordForm entity={entity} id={record?.id ?? null} fields={fields}/></>;
}
