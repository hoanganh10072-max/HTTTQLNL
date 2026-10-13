"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Building2, UserPlus, FileText, Clock3, CalendarDays, Banknote, ArrowLeftRight, UserMinus, BarChart3, Bell, ScrollText, PanelLeftClose, PanelLeftOpen, Target, ShieldCheck, ClipboardList, Settings, UserRound } from "lucide-react";
import type { Role } from "@/lib/rules";

const items = [
  ["/dashboard", "Tổng quan", LayoutDashboard, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/profile", "Hồ sơ của tôi", UserRound, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/performance", "Đánh giá KPI", Target, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/activities", "Vòng đời nhân sự", ClipboardList, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/admin", "Trung tâm quản trị", ShieldCheck, ["ADMIN"]],
  ["/organization", "Tổ chức", Building2, ["ADMIN", "HR", "MANAGER"]],
  ["/employees", "Nhân viên", Users, ["ADMIN", "HR", "MANAGER"]],
  ["/recruitment", "Tuyển dụng", UserPlus, ["ADMIN", "HR", "MANAGER"]],
  ["/contracts", "Hợp đồng", FileText, ["ADMIN", "HR"]],
  ["/attendance", "Chấm công", Clock3, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/leave", "Nghỉ phép", CalendarDays, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/payroll", "Tiền lương", Banknote, ["ADMIN", "HR", "EMPLOYEE"]],
  ["/transfers", "Thuyên chuyển", ArrowLeftRight, ["ADMIN", "HR", "MANAGER"]],
  ["/resignations", "Nghỉ việc", UserMinus, ["ADMIN", "HR", "MANAGER"]],
  ["/reports", "Báo cáo", BarChart3, ["ADMIN", "HR", "MANAGER"]],
  ["/notifications", "Thông báo", Bell, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
  ["/audit", "Nhật ký", ScrollText, ["ADMIN"]],
  ["/settings", "Cài đặt", Settings, ["ADMIN", "HR", "MANAGER", "EMPLOYEE"]],
] as const;

export function Sidebar({ role }: { role: Role }) {
  const path = usePathname(); const [collapsed, setCollapsed] = useState(false);
  return <aside className={`${collapsed ? "w-[76px]" : "w-[250px]"} portal-sidebar fixed inset-y-0 left-0 z-30 hidden text-white transition-all lg:flex lg:flex-col`}>
    <div className="portal-sidebar-brand flex h-20 items-center justify-between px-5"><div className={collapsed ? "hidden" : "block"}><p className="text-lg font-black tracking-wider">VINAMILK</p><p className="text-[10px] uppercase tracking-[.25em]">Human Resources</p></div><button aria-label="Thu gọn menu" onClick={() => setCollapsed(!collapsed)} className="portal-collapse rounded-lg p-2">{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button></div>
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">{items.filter(([, , , roles]) => (roles as readonly string[]).includes(role)).map(([href, label, Icon]) => {
      const active = path.startsWith(href); return <Link key={href} href={href} title={label} className={`portal-nav-link ${active ? "is-active" : ""} flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold`}><Icon size={18}/>{!collapsed && <span>{label}</span>}</Link>;
    })}</nav>
    {!collapsed && <div className="portal-sidebar-footer p-4 text-xs">Bản demo nội bộ · v1.0</div>}
  </aside>;
}
