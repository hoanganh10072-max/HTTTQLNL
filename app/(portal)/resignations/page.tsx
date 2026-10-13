import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { money,shortDate } from "@/lib/format";
import { completeResignationAction } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function ResignationsPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const user=await requireUser(["ADMIN","HR","MANAGER"]); const p=await searchParams;
  const requests=await db.resignationRequest.findMany({where:user.role==="MANAGER"?{employee:{managerId:user.employeeId??"__none__"}}:{},include:{employee:true},orderBy:{createdAt:"desc"}});
  return <><PageHeader title="Nghỉ việc" description="Xác nhận bàn giao, tài sản và quyết toán trước khi hoàn tất."/>{p.error&&<p role="alert" className="mb-5 bg-red-50 p-4 text-red-700">Cần hoàn thành đủ checklist bàn giao.</p>}<section className="card table-wrap"><table><thead><tr><th>Nhân viên</th><th>Ngày cuối</th><th>Lý do</th><th>Thanh toán</th><th>Trạng thái</th><th>Checklist & thao tác</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{r.employee.employeeCode} · {r.employee.lastName} {r.employee.firstName}</td><td>{shortDate.format(r.lastWorkingDate)}</td><td>{r.reason}</td><td>{user.role==="MANAGER"?"Giới hạn quyền":r.finalPayment!=null?money.format(r.finalPayment):"Chưa quyết toán"}</td><td><StatusBadge status={r.status}/></td><td>{user.role!=="MANAGER"&&["PENDING","APPROVED"].includes(r.status)?<form action={completeResignationAction.bind(null,r.id)} className="min-w-64 space-y-3"><label className="block text-sm"><input type="checkbox" name="handoverDone" required defaultChecked={r.handoverDone}/> Đã bàn giao công việc</label><label className="block text-sm"><input type="checkbox" name="assetsReturned" required defaultChecked={r.assetsReturned}/> Đã trả tài sản</label><label className="block text-sm"><input type="checkbox" name="confirmSettlement" required/> Đã kiểm tra quyết toán</label><label className="block"><span className="label">Quyết toán (VND)</span><input name="finalPayment" className="input" type="number" min="0" defaultValue={r.finalPayment??0} required/></label><ConfirmButton message="Hoàn tất nghỉ việc và khóa tài khoản?" className="btn btn-primary">Hoàn tất</ConfirmButton></form>:<span className="text-xs">Bàn giao {r.handoverDone?"✓":"○"} · Tài sản {r.assetsReturned?"✓":"○"} · Tài khoản {r.accountClosed?"✓":"○"}</span>}</td></tr>)}</tbody></table></section></>;
}
