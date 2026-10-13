import { Bell, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { roleLabels } from "@/lib/format";

export function PortalHeader({ name, role, unread }: { name: string; role: string; unread: number }) {
  return <header className="portal-header sticky top-0 z-20 flex h-16 items-center justify-between px-5 backdrop-blur lg:px-8"><div><p className="portal-header-kicker text-xs font-bold uppercase tracking-[.14em]">Quản trị nguồn nhân lực</p></div><div className="flex items-center gap-3"><a href="/notifications" className="portal-icon-button relative rounded-xl p-2"><Bell size={18}/>{unread > 0 && <span className="portal-notification-count absolute -right-1 -top-1 min-w-4 rounded-full px-1 text-center text-[10px] text-white">{unread}</span>}</a><a href="/settings" className="hidden text-right sm:block"><p className="portal-user-name text-sm font-bold">{name}</p><p className="portal-user-role text-xs">{roleLabels[role] ?? role}</p></a><a href="/settings" className="portal-avatar rounded-xl p-2"><UserRound size={18}/></a><form action={logoutAction}><button aria-label="Đăng xuất" className="portal-logout rounded-xl p-2"><LogOut size={18}/></button></form></div></header>;
}
