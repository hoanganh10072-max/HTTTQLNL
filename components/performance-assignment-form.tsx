"use client";
import { useState } from "react";
import { assignReviewAction } from "@/app/performance-actions";
import { performancePresets, subjectLabels, type SubjectType } from "@/lib/performance-presets";
export function PerformanceAssignmentForm({ subject, cycles, employees, branches }: {
  subject: SubjectType; cycles: { id: string; name: string }[];
  employees: { id: string; employeeCode: string; lastName: string; firstName: string; branchId: string }[]; branches: { id: string; name: string }[];
}) {
  const presets = performancePresets.filter(p => p.subject === subject);
  const [role, setRole] = useState(presets[0].key);
  const [branch, setBranch] = useState("");
  const selected = presets.find(p => p.key === role)!;
  return <form action={assignReviewAction} className="card space-y-4 p-5"><h2>Giao KPI · {subjectLabels[subject]}</h2><input type="hidden" name="subjectType" value={subject}/>
    <label className="block"><span className="label">Kỳ đánh giá đang mở</span><select className="input" name="cycleId" required><option value="">Chọn kỳ</option>{cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="block"><span className="label">{subject === "LEADERSHIP" ? "Vai trò lãnh đạo" : "Bộ tiêu chí áp dụng"}</span><select className="input" name="evaluationRole" aria-label={subject === "LEADERSHIP" ? "Vai trò lãnh đạo" : "Bộ tiêu chí áp dụng"} value={role} onChange={e => setRole(e.target.value)}>{presets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
    {subject === "BRANCH" ? <><label className="block"><span className="label">Chi nhánh</span><select className="input" name="branchId" aria-label="Chi nhánh" required value={branch} onChange={e => setBranch(e.target.value)}><option value="">Chọn chi nhánh</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="block"><span className="label">Người phụ trách báo cáo chi nhánh</span><select className="input" name="responsibleEmployeeId" aria-label="Người phụ trách báo cáo chi nhánh" key={branch} required disabled={!branch}><option value="">Chọn người phụ trách</option>{employees.filter(e => e.branchId === branch).map(e => <option key={e.id} value={e.id}>{e.employeeCode} · {e.lastName} {e.firstName}</option>)}</select></label></> : <label className="block"><span className="label">{subject === "LEADERSHIP" ? "Người được đánh giá" : "Nhân viên"}</span><select className="input" name="employeeId" required><option value="">Chọn nhân viên</option>{employees.map(e => <option key={e.id} value={e.id}>{e.employeeCode} · {e.lastName} {e.firstName}</option>)}</select></label>}
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><p className="mb-3 text-sm font-semibold text-blue-800">Bộ tiêu chí gợi ý · Tổng trọng số 100%</p><ul className="space-y-2 text-sm">{selected.criteria.map(c => <li className="flex justify-between gap-3" key={c.title}><span>{c.title}</span><strong>{c.weight}%</strong></li>)}</ul></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="applyPreset" defaultChecked/>Tạo sẵn tiêu chí từ bộ mẫu</label><p className="text-xs text-zinc-500">Mẫu là gợi ý nội bộ. Điều chỉnh chỉ tiêu, trọng số, nguồn minh chứng trước khi giao chính thức.</p><button className="btn btn-primary">Tạo bản đánh giá</button>
  </form>;
}
