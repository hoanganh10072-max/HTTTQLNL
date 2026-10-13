import "server-only";
import { fieldsFor, labels, optionsFor, relationFor, recordLabel, activityCategories, type RecordData } from "@/lib/admin-registry";
import { dataDelegate } from "@/lib/admin-data";
import type { AdminField } from "@/components/admin-record-form";
import { presetFor, subjectLabels, type SubjectType } from "@/lib/performance-presets";
import { statusLabels, roleLabels } from "@/lib/format";

export async function adminFieldsFor(entity: string, record: RecordData | null): Promise<AdminField[]> {
  const fields: AdminField[] = await Promise.all(fieldsFor(entity).map(async f => {
    const relation = relationFor(entity, f.name), options = optionsFor(entity, f.name);
    let value = record?.[f.name] ?? (typeof f.default === "string" || typeof f.default === "boolean" || typeof f.default === "number" ? f.default : "");
    const timed = ["checkIn", "checkOut", "scheduledAt"].includes(f.name);
    if (value instanceof Date) value = timed ? new Date(value.getTime() + 7 * 3600000).toISOString().slice(0, 16) : value.toISOString().slice(0, 10);
    const derived = ["workSalary", "netSalary", "totalHours", "used", "score"].includes(f.name) && !(entity === "Interview" && f.name === "score");
    return { name: f.name, label: `${labels[f.name] ?? f.name}${timed ? " (giờ Việt Nam)" : ""}`, value: String(value ?? ""), required: f.isRequired && !derived, readOnly: derived,
      type: f.type === "DateTime" ? timed ? "datetime-local" : "date" : ["Int", "Float"].includes(f.type) ? "number" : /email$/i.test(f.name) ? "email" : ["description", "notes", "note", "reason", "message", "selfComment", "managerComment", "developmentPlan", "evidence", "qualifications", "skills", "experience"].includes(f.name) ? "textarea" : "text",
      options: relation ? (await dataDelegate(relation).findMany({ orderBy: { createdAt: "desc" } })).map(r => ({ value: r.id, label: recordLabel(r) })) : f.type === "Boolean" ? [{ value: "true", label: "Có" }, { value: "false", label: "Không" }] : options?.map(v => ({ value: v, label: presetFor(v)?.label ?? subjectLabels[v as SubjectType] ?? roleLabels[v] ?? statusLabels[v] ?? activityCategories[v as keyof typeof activityCategories] ?? (v === "HIGHER" ? "Càng cao càng tốt" : v === "LOWER" ? "Càng thấp càng tốt" : v) })),
    };
  }));
  if (entity === "User") fields.push({ name: "password", label: record ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu (≥10 ký tự, có chữ hoa và số)", type: "password", value: "", required: !record });
  return fields;
}
