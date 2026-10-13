import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { money, shortDate, statusLabels } from "@/lib/format";

export default async function ContractsPage() {
  await requireUser(["ADMIN", "HR"]); const now = new Date(); const next30 = new Date(now.getTime() + 30*86400000); const contracts = await db.contract.findMany({where:{deletedAt:null}, include: { employee: true }, orderBy: { endDate: "asc" } });
  const expiring = contracts.filter((c) => c.status === "ACTIVE" && c.endDate && c.endDate >= now && c.endDate <= next30).length;
  return <><PageHeader title="Hợp đồng lao động" description={`${contracts.length} hợp đồng · ${expiring} hợp đồng hết hạn trong 30 ngày.`}/><section className="card overflow-hidden"><div className="table-wrap"><table><thead><tr><th>Số hợp đồng</th><th>Nhân viên</th><th>Loại hợp đồng</th><th>Thời hạn</th><th>Mức lương</th><th>Trạng thái</th></tr></thead><tbody>{contracts.map((c) => <tr key={c.id} className={c.status === "ACTIVE" && c.endDate && c.endDate <= next30 ? "bg-amber-50" : ""}><td className="font-black">{c.contractNumber}</td><td>{c.employee.employeeCode} · {c.employee.lastName} {c.employee.firstName}</td><td>{statusLabels[c.type] ?? c.type}</td><td>{shortDate.format(c.startDate)} — {c.endDate ? shortDate.format(c.endDate) : "Không thời hạn"}</td><td>{money.format(c.salary)}</td><td><StatusBadge status={c.status}/></td></tr>)}</tbody></table></div></section></>;
}
