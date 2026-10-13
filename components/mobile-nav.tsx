"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/rules";

const links=[[/^\/admin/,"/admin","Quản trị",["ADMIN"]],[/^\/performance/,"/performance","KPI",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/activities/,"/activities","Vòng đời",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/profile/,"/profile","Hồ sơ của tôi",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/dashboard/,"/dashboard","Tổng quan",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/employees/,"/employees","Nhân viên",["ADMIN","HR","MANAGER"]],[/^\/attendance/,"/attendance","Chấm công",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/leave/,"/leave","Nghỉ phép",["ADMIN","HR","MANAGER","EMPLOYEE"]],[/^\/payroll/,"/payroll","Tiền lương",["ADMIN","HR","EMPLOYEE"]],[/^\/reports/,"/reports","Báo cáo",["ADMIN","HR","MANAGER"]]] as const;
export function MobileNav({role}:{role:Role}){const path=usePathname();return <nav className="portal-mobile-nav flex gap-2 overflow-x-auto px-4 py-2 lg:hidden">{links.filter(([, , ,roles])=>(roles as readonly string[]).includes(role)).map(([pattern,href,label])=><Link key={href} href={href} className={`portal-mobile-link whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${pattern.test(path)?"is-active":""}`}>{label}</Link>)}</nav>}
