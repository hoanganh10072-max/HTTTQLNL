import { Bell,CheckCircle2,AlertTriangle,Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";

export default async function NotificationsPage(){const user=await requireUser();const notifications=await db.notification.findMany({where:{OR:[{userId:user.id},{role:user.role}]},orderBy:{createdAt:"desc"},take:100});return <><PageHeader title="Thông báo" description="Yêu cầu chờ xử lý, kết quả phê duyệt và cảnh báo hệ thống."/><section className="card divide-y">{notifications.map(n=>{const Icon=n.type==="SUCCESS"?CheckCircle2:n.type==="WARNING"?AlertTriangle:n.type==="ACTION"?Bell:Info;return <a href={n.link??"#"} key={n.id} className="flex gap-4 p-5 hover:bg-zinc-50"><div className="rounded-xl bg-zinc-100 p-3"><Icon size={20}/></div><div className="flex-1"><div className="flex justify-between gap-4"><p className="font-black">{n.title}</p><time className="text-xs text-zinc-400">{n.createdAt.toLocaleString("vi-VN")}</time></div><p className="mt-1 text-sm text-zinc-500">{n.message}</p></div></a>})}</section></>}
