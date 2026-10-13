# VINAMILK HRM — Tiến độ triển khai

Quy ước: `[ ]` chưa làm · `[-]` đang làm · `[x]` hoàn thành · `[~]` giản lược trong MVP.

## Nền tảng

- [x] Khởi tạo Next.js App Router, TypeScript strict, Tailwind CSS
- [x] Cấu hình ESLint, Prettier, Vitest và Playwright smoke test
- [x] Thiết kế Prisma schema, migration SQLite và seed dữ liệu mẫu
- [x] Tạo `.env.example`, README và script vận hành

## Bảo mật và giao diện chung

- [x] Đăng nhập/đăng xuất, đổi mật khẩu, mật khẩu băm, session cookie HTTP-only
- [x] Phân quyền ADMIN, HR, MANAGER, EMPLOYEE ở server, action, API và giao diện
- [x] Layout responsive, sidebar thu gọn, menu tablet, header và thông báo
- [x] Trang 403, empty/error states và phản hồi validation

## Phân hệ nghiệp vụ

- [x] Dashboard và biểu đồ/báo cáo tổng quan
- [~] Cơ cấu tổ chức: tra cứu chi nhánh, phòng ban, chức danh, định biên; CRUD đầy đủ chưa có UI
- [x] Hồ sơ nhân viên: tìm kiếm, lọc, phân trang, tạo/xem/sửa/lưu trữ mềm, CSV
- [~] Tuyển dụng: yêu cầu, ứng viên, phỏng vấn, trạng thái và chuyển thành nhân viên; form tạo lịch/yêu cầu được giản lược
- [~] Hợp đồng: tra cứu, lịch sử, cảnh báo hết hạn; form tạo/gia hạn được giản lược
- [~] Chấm công: check-in/out, chống trùng, tổng hợp tháng, CSV; import/điều chỉnh HR được giản lược
- [x] Nghỉ phép: số dư, gửi đơn, duyệt/từ chối, tự động trừ phép
- [~] Tính lương: kỳ lương, tạo hàng loạt, khóa, phiếu lương, CSV/in; UI điều chỉnh từng dòng được giản lược
- [~] Thuyên chuyển/bổ nhiệm: duyệt, cập nhật hồ sơ/lịch sử; form tạo đề nghị được giản lược
- [~] Nghỉ việc: hoàn tất, checklist, khóa tài khoản, cập nhật trạng thái; form tạo yêu cầu được giản lược
- [x] Báo cáo: biểu đồ, tổng hợp theo quyền và xuất CSV
- [x] Thông báo và audit log

## Kiểm thử và bàn giao

- [x] Unit test: lương, phép, tuyển dụng, thuyên chuyển, phân quyền
- [x] Smoke test đăng nhập, route lõi và giới hạn quyền (4 ca Playwright)
- [x] Migration và seed chạy thành công
- [x] Lint và TypeScript không lỗi
- [x] Toàn bộ unit test đạt (7/7)
- [x] Production build thành công (23 route)
- [x] Kiểm tra route và bốn tài khoản demo
- [x] README phản ánh đúng phạm vi hoàn thành và hạn chế
