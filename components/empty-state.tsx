import { Inbox } from "lucide-react";
export function EmptyState({ title = "Chưa có dữ liệu", description = "Không tìm thấy bản ghi phù hợp." }) {
  return <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500"><Inbox className="mb-3 h-9 w-9"/><p className="font-bold text-zinc-800">{title}</p><p className="mt-1 text-sm">{description}</p></div>;
}
