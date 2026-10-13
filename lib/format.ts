export const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
export const number = new Intl.NumberFormat("vi-VN");
export const shortDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const roleLabels: Record<string, string> = { ADMIN: "Quản trị viên", HR: "Nhân sự", MANAGER: "Quản lý", EMPLOYEE: "Nhân viên" };
export const statusLabels: Record<string, string> = {
  IN_PROGRESS: "Đang thực hiện", SUBMITTED: "Đã tự đánh giá", REVIEWED: "Quản lý đã đánh giá", ACKNOWLEDGED: "Đã xác nhận", TODO: "Chưa thực hiện", INACTIVE: "Ngừng hoạt động", EXPIRED: "Hết hạn", TERMINATED: "Đã chấm dứt", SCHEDULED: "Đã lên lịch", ABSENT: "Vắng mặt", PRESENT: "Có mặt",
  ACTIVE: "Đang làm việc", PROBATION: "Thử việc", RESIGNED: "Đã nghỉ", PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt", REJECTED: "Từ chối", CANCELLED: "Đã hủy", DRAFT: "Bản nháp",
  PUBLISHED: "Đã phát hành", LOCKED: "Đã khóa", ON_TIME: "Đúng giờ", LATE: "Đi muộn",
  NEW: "Mới", SCREENING: "Sàng lọc", INTERVIEW: "Phỏng vấn", PASSED: "Đạt", FAILED: "Không đạt", HIRED: "Nhận việc",
  COMPLETED: "Hoàn tất", CLOSED: "Đã đóng", FIXED_TERM: "Xác định thời hạn", INDEFINITE: "Không xác định thời hạn",
};
