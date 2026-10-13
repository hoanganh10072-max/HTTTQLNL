export const subjectLabels = { LEADERSHIP: "Lãnh đạo", BRANCH: "Chi nhánh", EMPLOYEE: "Nhân viên" };
export type SubjectType = keyof typeof subjectLabels;
export type CriterionPreset = { title: string; weight: number; target: number; unit: string; direction: "HIGHER" | "LOWER"; description: string };
export type PerformancePreset = { key: string; label: string; subject: SubjectType; criteria: CriterionPreset[] };
const metric = (title: string, weight: number, description: string, target = 100, direction: "HIGHER" | "LOWER" = "HIGHER", unit = "%"): CriterionPreset => ({ title, weight, target, direction, unit, description });
export const performancePresets: PerformancePreset[] = [
  { key: "EXECUTIVE", label: "Ban điều hành / Giám đốc", subject: "LEADERSHIP", criteria: [
    metric("Hoàn thành mục tiêu chiến lược", 30, "Số mục tiêu chiến lược hoàn thành / số mục tiêu cam kết × 100. Minh chứng: kế hoạch và báo cáo điều hành."),
    metric("Kết quả kinh doanh & tài chính", 30, "Kết quả đạt / kế hoạch đã duyệt × 100. Minh chứng: báo cáo tài chính và kế hoạch kinh doanh."),
    metric("Phát triển đội ngũ kế cận", 20, "Số kế hoạch phát triển/nhân sự kế cận hoàn thành / kế hoạch cam kết × 100. Minh chứng: hồ sơ phát triển và đào tạo."),
    metric("Quản trị rủi ro & tuân thủ", 20, "Số yêu cầu kiểm soát hoàn thành / tổng yêu cầu đến hạn × 100. Minh chứng: kết quả kiểm tra và khắc phục."),
  ] },
  { key: "BRANCH_DIRECTOR", label: "Giám đốc chi nhánh", subject: "LEADERSHIP", criteria: [
    metric("Hoàn thành kế hoạch chi nhánh", 35, "Kết quả kinh doanh/sản lượng đạt / kế hoạch × 100. Báo cáo chi nhánh đã đối soát."),
    metric("Hiệu quả vận hành", 25, "Tỷ lệ hạng mục vận hành hoàn thành đúng hạn. Nhật ký vận hành và SLA."),
    metric("Phát triển & ổn định nhân sự", 25, "Tỷ lệ kế hoạch tuyển dụng, đào tạo, phát triển hoàn thành. Báo cáo nhân sự chi nhánh."),
    metric("Tuân thủ & chất lượng dịch vụ", 15, "Tỷ lệ yêu cầu kiểm soát/chất lượng đạt chuẩn nội bộ. Báo cáo kiểm tra, phản hồi khách hàng."),
  ] },
  { key: "DEPARTMENT_HEAD", label: "Trưởng phòng", subject: "LEADERSHIP", criteria: [
    metric("Kết quả mục tiêu phòng ban", 35, "Mục tiêu phòng hoàn thành / mục tiêu được giao × 100. Báo cáo kế hoạch."),
    metric("Tiến độ & chất lượng đầu ra", 25, "Số đầu việc đạt chất lượng đúng hạn / tổng đầu việc × 100. Biên bản nghiệm thu."),
    metric("Huấn luyện & phát triển nhân viên", 25, "Kế hoạch huấn luyện hoàn tất / kế hoạch cam kết × 100. Hồ sơ coaching/đào tạo."),
    metric("Phối hợp liên phòng ban", 15, "Yêu cầu phối hợp được đáp ứng / tổng yêu cầu × 100. Phiếu SLA và phản hồi đối tác nội bộ."),
  ] },
  { key: "TEAM_LEAD", label: "Trưởng nhóm / Quản lý trực tiếp", subject: "LEADERSHIP", criteria: [
    metric("Hoàn thành công việc của nhóm", 40, "Đầu việc nhóm hoàn thành / kế hoạch × 100. Bảng theo dõi công việc."),
    metric("Chất lượng & đúng hạn", 25, "Đầu việc được nghiệm thu đúng hạn / tổng đầu việc × 100. Nhật ký nghiệm thu."),
    metric("Hỗ trợ & phản hồi nhân viên", 20, "Phiên trao đổi/coaching hoàn tất / kế hoạch × 100. Biên bản phản hồi."),
    metric("Cải tiến cách làm", 15, "Cải tiến được áp dụng / mục tiêu cải tiến × 100. Kết quả trước và sau thay đổi."),
  ] },
  { key: "HR_LEAD", label: "Lãnh đạo / Quản lý nhân sự", subject: "LEADERSHIP", criteria: [
    metric("Tuyển dụng & định biên", 30, "Vị trí tuyển đúng hạn / kế hoạch tuyển × 100. Hồ sơ tuyển dụng."),
    metric("Chất lượng hồ sơ & tuân thủ", 25, "Hồ sơ đạt yêu cầu kiểm tra / tổng hồ sơ × 100. Checklist kiểm tra."),
    metric("Đào tạo & giữ chân nhân sự", 25, "Kế hoạch phát triển/giữ chân hoàn thành / kế hoạch × 100. Báo cáo nhân sự."),
    metric("Chất lượng dịch vụ nhân sự", 20, "Yêu cầu HR giải quyết đúng hạn / tổng yêu cầu × 100. Phiếu yêu cầu và phản hồi."),
  ] },
  { key: "BRANCH_BUSINESS", label: "Chi nhánh kinh doanh / văn phòng", subject: "BRANCH", criteria: [
    metric("Doanh thu / kết quả kế hoạch", 35, "Doanh thu hoặc kết quả thực tế / kế hoạch đã duyệt × 100. Báo cáo chi nhánh."),
    metric("Kiểm soát ngân sách vận hành", 20, "Chi phí thực tế / ngân sách được duyệt × 100; càng thấp càng tốt, cần bảo đảm chất lượng đầu ra. Báo cáo ngân sách.", 100, "LOWER"),
    metric("Phát triển nguồn nhân lực", 15, "Kế hoạch nhân lực, đào tạo và phát triển hoàn tất / kế hoạch × 100. Báo cáo nhân sự."),
    metric("Chất lượng dịch vụ / khách hàng", 15, "Trường hợp đáp ứng SLA/chất lượng / tổng trường hợp × 100. Báo cáo dịch vụ."),
    metric("Tuân thủ & kiểm soát nội bộ", 15, "Yêu cầu kiểm soát hoàn thành / tổng yêu cầu × 100. Biên bản kiểm tra."),
  ] },
  { key: "BRANCH_FACTORY", label: "Chi nhánh sản xuất / nhà máy", subject: "BRANCH", criteria: [
    metric("Hoàn thành kế hoạch sản xuất", 35, "Sản lượng đạt / kế hoạch × 100. Báo cáo sản lượng."),
    metric("Chất lượng sản phẩm", 25, "Sản phẩm đạt yêu cầu / tổng sản phẩm × 100. Báo cáo kiểm soát chất lượng."),
    metric("An toàn & tuân thủ vận hành", 20, "Checklist an toàn hoàn thành / tổng checklist × 100. Biên bản kiểm tra và khắc phục."),
    metric("Hiệu quả & phát triển bền vững", 20, "Hạng mục tiết kiệm/tối ưu hoàn thành / kế hoạch × 100. Báo cáo cải tiến."),
  ] },
  { key: "PROFESSIONAL", label: "Chuyên viên / Nhân viên văn phòng", subject: "EMPLOYEE", criteria: [
    metric("Hoàn thành khối lượng công việc", 40, "Đầu việc hoàn tất / đầu việc được giao × 100. Báo cáo công việc."),
    metric("Chất lượng & đúng hạn", 25, "Đầu việc nghiệm thu đúng hạn / tổng đầu việc × 100. Kết quả nghiệm thu."),
    metric("Tuân thủ & kỷ luật công việc", 20, "Yêu cầu/quy trình đáp ứng / tổng yêu cầu × 100. Checklist và dữ liệu chấm công đã xác minh."),
    metric("Phối hợp & phát triển kỹ năng", 15, "Cam kết phối hợp/đào tạo hoàn tất / kế hoạch × 100. Phản hồi và kết quả đào tạo."),
  ] },
  { key: "SALES", label: "Nhân viên kinh doanh", subject: "EMPLOYEE", criteria: [
    metric("Hoàn thành chỉ tiêu bán hàng", 40, "Doanh thu/sản lượng thực tế / chỉ tiêu × 100. Dữ liệu bán hàng đã đối soát."),
    metric("Chất lượng bán hàng & công nợ", 25, "Giao dịch/thu hồi công nợ đáp ứng cam kết / kế hoạch × 100. Báo cáo bán hàng và công nợ."),
    metric("Chăm sóc & phát triển khách hàng", 20, "Cam kết chăm sóc/phát triển hoàn thành / kế hoạch × 100. CRM và phản hồi."),
    metric("Tuân thủ quy trình bán hàng", 15, "Giao dịch đáp ứng kiểm soát / tổng giao dịch × 100. Biên bản kiểm tra."),
  ] },
  { key: "OPERATIONS", label: "Nhân viên sản xuất / vận hành", subject: "EMPLOYEE", criteria: [
    metric("Năng suất / khối lượng", 35, "Sản lượng/công việc thực tế / chỉ tiêu × 100. Nhật ký ca và báo cáo sản lượng."),
    metric("Chất lượng đầu ra", 25, "Đầu ra đạt yêu cầu / tổng đầu ra × 100. Phiếu kiểm tra chất lượng."),
    metric("An toàn & quy trình", 25, "Checklist an toàn/quy trình đáp ứng / tổng checklist × 100. Báo cáo giám sát."),
    metric("Phối hợp & cải tiến", 15, "Cam kết cải tiến/đào tạo hoàn thành / kế hoạch × 100. Hồ sơ cải tiến."),
  ] },
  { key: "TECHNICAL", label: "Kỹ thuật / Công nghệ thông tin", subject: "EMPLOYEE", criteria: [
    metric("Hoàn thành hạng mục kỹ thuật", 40, "Hạng mục nghiệm thu / kế hoạch × 100. Hồ sơ dự án/ticket."),
    metric("Đáp ứng SLA & xử lý sự cố", 25, "Ticket đáp ứng SLA / tổng ticket × 100. Nhật ký dịch vụ."),
    metric("Chất lượng & ổn định giải pháp", 20, "Hạng mục đạt kiểm tra / tổng hạng mục × 100. Kết quả kiểm thử."),
    metric("Tài liệu & phát triển năng lực", 15, "Tài liệu/đào tạo hoàn tất / kế hoạch × 100. Tài liệu và chứng nhận nội bộ."),
  ] },
];
export function presetFor(key: string) { return performancePresets.find(p => p.key === key); }
export function reviewScope(user: { role: string; employeeId: string | null }) {
  if (["ADMIN", "HR"].includes(user.role)) return {};
  const id = user.employeeId ?? "__none__";
  return { OR: [{ employeeId: id }, { subjectType: "BRANCH", responsibleEmployeeId: id }, ...(user.role === "MANAGER" ? [{ employee: { managerId: id } }] : [])] };
}
export function reviewAccess(user: { role: string; employeeId: string | null }, review: { subjectType: string; employeeId: string | null; responsibleEmployeeId: string | null; employee: { managerId: string | null } | null }) {
  const owner = !!user.employeeId && (review.subjectType === "BRANCH" ? review.responsibleEmployeeId === user.employeeId : review.employeeId === user.employeeId);
  const editor = ["ADMIN", "HR"].includes(user.role) || (review.subjectType !== "BRANCH" && user.role === "MANAGER" && !!user.employeeId && review.employee?.managerId === user.employeeId);
  return { owner, editor };
}
