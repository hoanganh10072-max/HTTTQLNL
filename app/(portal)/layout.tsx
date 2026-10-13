import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { PortalHeader } from "@/components/portal-header";
import { MobileNav } from "@/components/mobile-nav";
import type { Role } from "@/lib/rules";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { isRead: false, OR: [{ userId: user.id }, { role: user.role }] } });
  const name = user.employee ? `${user.employee.lastName} ${user.employee.firstName}` : user.email;
  return <div className="portal-shell min-h-screen"><Sidebar role={user.role as Role}/><div className="portal-content lg:ml-[250px]"><PortalHeader name={name} role={user.role} unread={unread}/><MobileNav role={user.role as Role}/><main className="portal-main p-5 lg:p-8">{children}</main></div></div>;
}
