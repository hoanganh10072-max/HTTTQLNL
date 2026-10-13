import { statusLabels } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const tone = ["ACTIVE", "APPROVED", "PUBLISHED", "ON_TIME", "PASSED", "HIRED", "COMPLETED"].includes(status)
    ? "badge-success" : ["PENDING", "PROBATION", "LATE", "SCREENING", "INTERVIEW", "DRAFT"].includes(status)
      ? "badge-warning" : ["REJECTED", "FAILED", "RESIGNED", "TERMINATED"].includes(status) ? "badge-danger" : "";
  return <span className={`badge ${tone}`}>{statusLabels[status] ?? status}</span>;
}
