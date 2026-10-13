import Link from "next/link";
import { ShieldX } from "lucide-react";
export default function ForbiddenPage() { return <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6"><div className="card max-w-md p-10 text-center"><ShieldX className="mx-auto mb-4 h-12 w-12"/><h1 className="text-2xl font-black">Không có quyền truy cập</h1><p className="mt-2 text-zinc-500">Vai trò hiện tại không được phép mở trang này.</p><Link className="btn btn-primary mt-6" href="/dashboard">Về trang tổng quan</Link></div></main>; }
