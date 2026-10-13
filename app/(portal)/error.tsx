"use client";
export default function PortalError({ reset }: { reset: () => void }) {
  return <section className="card mx-auto max-w-xl space-y-4 p-8"><h1 className="text-xl font-bold">Chưa thể hoàn tất thao tác</h1><p className="text-sm text-zinc-500">Dữ liệu có thể đã được xử lý hoặc chưa đủ điều kiện. Kiểm tra trạng thái, ngày hiệu lực, quyền truy cập và các trường bắt buộc trước khi thử lại.</p><button className="btn btn-primary" onClick={reset}>Tải lại dữ liệu</button></section>;
}
