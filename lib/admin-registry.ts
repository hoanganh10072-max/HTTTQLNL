import { Prisma } from "@prisma/client";
import { performancePresets } from "@/lib/performance-presets";
export const entities: Record<string, string> = {
  User: "Tài khoản & phân quyền", Branch: "Chi nhánh", Department: "Phòng ban", Position: "Chức danh",
  Employee: "Hồ sơ nhân viên", EmployeeDocument: "Tài liệu nhân viên", EmploymentHistory: "Lịch sử công tác", Contract: "Hợp đồng",
  RecruitmentRequest: "Yêu cầu tuyển dụng", Candidate: "Ứng viên", Interview: "Lịch phỏng vấn", AttendanceRecord: "Chấm công",
  LeaveType: "Loại nghỉ phép", LeaveBalance: "Hạn mức phép", LeaveRequest: "Đơn nghỉ phép", PayrollPeriod: "Kỳ lương", PayrollRecord: "Phiếu lương",
  TransferRequest: "Thuyên chuyển", ResignationRequest: "Nghỉ việc", Notification: "Thông báo",
  PerformanceCycle: "Kỳ đánh giá KPI", PerformanceReview: "Đánh giá KPI", PerformanceGoal: "Mục tiêu KPI", PersonnelActivity: "Hoạt động nhân sự",
};
export const labels: Record<string, string> = {
  subjectType: "Nhóm đối tượng KPI", evaluationRole: "Vai trò / Bộ tiêu chí", responsibleEmployeeId: "Người phụ trách báo cáo chi nhánh",
  id: "Mã bản ghi", name: "Tên", code: "Mã", email: "Email đăng nhập", role: "Vai trò", isActive: "Cho phép đăng nhập", employeeId: "Nhân viên", password: "Mật khẩu mới",
  employeeCode: "Mã nhân viên", firstName: "Tên", lastName: "Họ và tên đệm", gender: "Giới tính", dateOfBirth: "Ngày sinh", personalEmail: "Email cá nhân", workEmail: "Email công việc", phone: "Điện thoại", address: "Địa chỉ", avatarUrl: "Đường dẫn ảnh đại diện", identityNumber: "Số giấy tờ định danh", bankAccount: "Tài khoản ngân hàng", bankName: "Ngân hàng", taxCode: "Mã số thuế", insuranceNumber: "Số bảo hiểm", qualifications: "Bằng cấp", skills: "Kỹ năng", experience: "Kinh nghiệm",
  branchId: "Chi nhánh", departmentId: "Phòng ban", positionId: "Chức danh", managerId: "Quản lý trực tiếp", hireDate: "Ngày vào làm", probationEndDate: "Hết thử việc", employmentStatus: "Trạng thái làm việc", baseSalary: "Lương cơ bản", deletedAt: "Ngày lưu trữ", createdAt: "Ngày tạo", updatedAt: "Cập nhật lần cuối",
  status: "Trạng thái", type: "Loại", url: "Đường dẫn tài liệu", departmentName: "Tên phòng ban", positionName: "Tên chức danh", managerName: "Tên quản lý", salary: "Mức lương", startDate: "Ngày bắt đầu", endDate: "Ngày kết thúc", reason: "Lý do", headcount: "Định biên", level: "Cấp bậc", contractNumber: "Số hợp đồng", parentId: "Hợp đồng gốc", createdBy: "Người tạo", quantity: "Số lượng", requestedBy: "Người yêu cầu", approvedBy: "Người phê duyệt", closedAt: "Ngày đóng", recruitmentRequestId: "Yêu cầu tuyển dụng", fullName: "Họ tên", source: "Nguồn tuyển", cvUrl: "Đường dẫn CV", convertedEmployeeId: "Nhân viên đã chuyển đổi", candidateId: "Ứng viên", scheduledAt: "Lịch phỏng vấn", interviewer: "Người phỏng vấn", score: "Điểm", notes: "Ghi chú", workDate: "Ngày công", checkIn: "Giờ vào", checkOut: "Giờ ra", totalHours: "Tổng giờ", note: "Ghi chú", adjustedBy: "Người điều chỉnh", annualAllowance: "Phép năm", isPaid: "Có hưởng lương", leaveTypeId: "Loại phép", year: "Năm", allocated: "Số ngày được cấp", used: "Số ngày đã dùng", days: "Số ngày nghỉ", reviewerId: "Người duyệt", reviewedAt: "Ngày duyệt", reviewNote: "Nhận xét duyệt", month: "Tháng", standardDays: "Ngày công chuẩn", lockedAt: "Ngày khóa", payrollPeriodId: "Kỳ lương", actualDays: "Ngày công thực tế", workSalary: "Lương theo công", allowance: "Phụ cấp", overtime: "Tiền tăng ca", bonus: "Thưởng", insurance: "Bảo hiểm", tax: "Thuế", otherDeduction: "Khấu trừ khác", netSalary: "Thực nhận",
  oldDepartmentId: "Phòng ban cũ", oldPositionId: "Chức danh cũ", oldManagerId: "Quản lý cũ", newDepartmentId: "Phòng ban mới", newPositionId: "Chức danh mới", newManagerId: "Quản lý mới", newSalary: "Lương mới", effectiveDate: "Ngày hiệu lực", lastWorkingDate: "Ngày làm cuối", handoverDone: "Đã bàn giao", assetsReturned: "Đã trả tài sản", accountClosed: "Đã khóa tài khoản", finalPayment: "Quyết toán", completedAt: "Ngày hoàn tất", userId: "Tài khoản nhận", title: "Tiêu đề", message: "Nội dung", isRead: "Đã đọc", link: "Liên kết",
  cycleId: "Kỳ đánh giá", reviewId: "Bản đánh giá", selfComment: "Nhận xét nhân viên", managerComment: "Phản hồi quản lý", developmentPlan: "Kế hoạch phát triển", evaluatedBy: "Người đánh giá", submittedAt: "Ngày gửi đánh giá", approvedAt: "Ngày phê duyệt", acknowledgedAt: "Ngày xác nhận", version: "Phiên bản", description: "Mô tả", unit: "Đơn vị đo", target: "Chỉ tiêu", actual: "Kết quả thực tế", direction: "Chiều đo", weight: "Trọng số (%)", dueDate: "Hạn hoàn thành", evidence: "Minh chứng", managerScore: "Điểm quản lý", category: "Nhóm hoạt động", owner: "Người phụ trách", cost: "Chi phí / giá trị",
};
export const activityCategories = { ONBOARDING: "Tiếp nhận nhân viên", OFFBOARDING: "Bàn giao nghỉ việc", TRAINING: "Đào tạo & phát triển", ASSET: "Tài sản & trang thiết bị", BENEFIT: "Phúc lợi & sức khỏe", REWARD: "Khen thưởng", DISCIPLINE: "Kỷ luật" };
export const statusOptions: Record<string, string[]> = {
  User: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"], Employee: ["ACTIVE", "PROBATION", "RESIGNED"], Candidate: ["NEW", "SCREENING", "INTERVIEW", "PASSED", "FAILED", "HIRED"],
  RecruitmentRequest: ["PENDING", "APPROVED", "REJECTED", "CLOSED"], Contract: ["ACTIVE", "EXPIRED", "TERMINATED"], Interview: ["SCHEDULED", "COMPLETED", "CANCELLED"], AttendanceRecord: ["ON_TIME", "LATE", "ABSENT", "PRESENT"],
  LeaveRequest: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], PayrollPeriod: ["DRAFT", "PUBLISHED"], PayrollRecord: ["DRAFT", "PUBLISHED"], TransferRequest: ["PENDING", "APPROVED", "REJECTED"], ResignationRequest: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
  PerformanceCycle: ["DRAFT", "ACTIVE", "CLOSED"], PerformanceReview: ["DRAFT", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "APPROVED", "ACKNOWLEDGED"], PersonnelActivity: ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
};
export function modelFor(name: string) {
  if (!Object.hasOwn(entities, name)) throw new Error("Phân hệ không hợp lệ.");
  return Prisma.dmmf.datamodel.models.find(m => m.name === name)!;
}
export function fieldsFor(name: string) { return modelFor(name).fields.filter(f => f.kind !== "object" && !["id", "createdAt", "updatedAt", "passwordHash", "deletedAt", "version", "sessionVersion"].includes(f.name)); }
export function optionsFor(entity: string, field: string) {
  if (field === "subjectType") return ["EMPLOYEE", "LEADERSHIP", "BRANCH"];
  if (field === "evaluationRole") return performancePresets.map(p => p.key);
  if (field === "role") return ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  if (field === "category") return Object.keys(activityCategories);
  if (field === "direction") return ["HIGHER", "LOWER"];
  if (field === "employmentStatus") return statusOptions.Employee;
  if (field === "status") return statusOptions[entity] ?? ["ACTIVE", "INACTIVE"];
  return undefined;
}
export function relationFor(entity: string, field: string) {
  const relation = modelFor(entity).fields.find(f => f.kind === "object" && f.relationFromFields?.includes(field));
  if (relation) return relation.type;
  if (["managerId", "oldManagerId", "newManagerId", "convertedEmployeeId"].includes(field)) return "Employee";
  if (["oldDepartmentId", "newDepartmentId"].includes(field)) return "Department";
  if (["oldPositionId", "newPositionId"].includes(field)) return "Position";
  if (["approvedBy", "requestedBy", "createdBy", "reviewerId", "adjustedBy", "evaluatedBy"].includes(field)) return "User";
  if (entity === "Contract" && field === "parentId") return "Contract";
  return undefined;
}
export type RecordData = Record<string, unknown> & { id: string };
export function recordLabel(r: RecordData) { return String(r.name ?? r.title ?? r.fullName ?? (r.employeeCode ? `${r.employeeCode} · ${r.lastName} ${r.firstName}` : r.email ?? r.code ?? r.contractNumber ?? (r.month ? `${r.month}/${r.year}` : r.id))); }
