# VINAMILK HRM

Website quản trị nguồn nhân lực đa đơn vị bằng tiếng Việt. Dự án là MVP chạy local với dữ liệu hoàn toàn mô phỏng, không sử dụng logo chính thức hay thông tin cá nhân thật.

## Công nghệ

Nâng cấp nghiệp vụ 13/10/2026: đánh giá KPI toàn luồng tại `/performance`, vòng đời nhân sự tại `/activities`, hồ sơ cá nhân tại `/profile` và trung tâm quản trị admin tại `/admin`. Đối chiếu nghiên cứu, quyền, cách tính điểm và giới hạn triển khai: [docs/hrm-standards.md](docs/hrm-standards.md).

- Next.js 16.3.8 (App Router), React 19, TypeScript strict
- Tailwind CSS 4 và bộ component nội bộ
- Prisma ORM 6, SQLite; schema được thiết kế để chuyển sang PostgreSQL
- Zod cho validation, Recharts cho biểu đồ, Lucide cho icon
- Xác thực email/mật khẩu với bcrypt; session ký HMAC trong cookie HTTP-only
- Vitest cho unit test và Playwright/Chromium cho smoke test
- ESLint 9 và Prettier

## Cấu trúc chính

```text
app/
  (portal)/             Các trang đã bảo vệ bởi session và role
  api/export/           API xuất CSV có kiểm tra quyền
  actions.ts            Server actions và transaction nghiệp vụ
components/             Component giao diện dùng lại
lib/
  auth.ts               Session, cookie và route guard
  db.ts                 Prisma client
  rules.ts              Quy tắc lương, phép, tuyển dụng, quyền
prisma/
  schema.prisma         Các bảng nghiệp vụ, quan hệ, index
  migrations/           Migration khởi tạo SQLite
  seed.ts               Dữ liệu demo
tests/unit/             Unit test quy tắc nghiệp vụ
tests/e2e/              Playwright smoke test
```

## Yêu cầu môi trường

- Node.js 20.9 trở lên (đã kiểm thử với Node.js 24)
- npm 10 trở lên
- Windows, macOS hoặc Linux

## Cài đặt và chạy

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Trên macOS/Linux dùng `cp .env.example .env`. Mở `http://localhost:8080`.

Biến môi trường:

```dotenv
DATABASE_URL="file:./dev.db"
SESSION_SECRET="chuoi-ngau-nhien-toi-thieu-32-ky-tu"
```

Không commit `.env` hoặc secret thật. Với thay đổi schema trong môi trường phát triển, chạy `npm run db:migrate -- --name ten_thay_doi`.

## Tài khoản demo

Mật khẩu chung chỉ dùng cho seed: `Demo@123`.

| Vai trò | Email |
| --- | --- |
| ADMIN | `admin@vinamilk.demo` |
| HR | `hr@vinamilk.demo` |
| MANAGER | `manager@vinamilk.demo` |
| EMPLOYEE | `employee@vinamilk.demo` |

## Vai trò và quyền

- **ADMIN:** toàn quyền, quản trị người dùng, xem audit log.
- **HR:** hồ sơ nhân viên, tuyển dụng, hợp đồng, chấm công, phép, lương, thuyên chuyển, nghỉ việc và báo cáo.
- **MANAGER:** chỉ xem nhân viên và duyệt đơn phép thuộc phạm vi `managerId`; không truy cập bảng lương toàn công ty.
- **EMPLOYEE:** hồ sơ dashboard cá nhân, check-in/out, gửi đơn phép và chỉ xem phiếu lương của mình.

Quyền được kiểm tra cả ở menu, page server, server action và API xuất CSV. Người dùng không đủ quyền được chuyển đến `/forbidden`.

## Chức năng đã hoàn thành

- Đăng nhập/đăng xuất, đổi mật khẩu; bcrypt cost 12; cookie HTTP-only, SameSite=Lax, Secure ở production, thời hạn 8 giờ.
- Dashboard phân quyền, KPI, biểu đồ phòng ban/biến động, hợp đồng sắp hết hạn và sinh nhật.
- Cơ cấu chi nhánh, phòng ban, chức danh, định biên và sơ đồ cơ bản.
- Hồ sơ nhân viên: tìm kiếm, lọc, phân trang, tạo, xem, sửa, lưu trữ mềm, tự sinh mã và xuất CSV.
- Tuyển dụng: yêu cầu, ứng viên, phỏng vấn, chuyển trạng thái hợp lệ và transaction chuyển ứng viên đạt thành nhân viên.
- Hợp đồng: danh sách, phân loại, lịch sử và cảnh báo 30 ngày.
- Chấm công: check-in/out, chống trùng, tính giờ, phân quyền theo cá nhân/đội nhóm và xuất CSV.
- Nghỉ phép: số dư, ngày làm việc, gửi đơn, duyệt/từ chối, transaction trừ phép, thông báo kết quả.
- Tiền lương: tạo hàng loạt từ lương cơ bản và ngày công, ngày công chuẩn cấu hình, bảo hiểm mô phỏng, khóa/phát hành bằng transaction, CSV và in phiếu.
- Thuyên chuyển: duyệt/từ chối bằng transaction, cập nhật hồ sơ và lịch sử công tác.
- Nghỉ việc: checklist, hoàn tất bằng transaction, cập nhật trạng thái và khóa tài khoản.
- Báo cáo tổng hợp, biểu đồ, CSV, thông báo và audit log tìm kiếm được.
- Giao diện đen/trắng/xám, sidebar thu gọn, menu tablet, bảng responsive, trạng thái và xác nhận thao tác quan trọng.

## Phần được giản lược trong MVP

- Cơ cấu tổ chức, yêu cầu tuyển dụng, lịch phỏng vấn và hợp đồng hiện tập trung vào tra cứu; chưa có đầy đủ màn hình CRUD cho từng danh mục.
- Chưa có upload/lưu tệp thật cho ảnh đại diện, CV và tài liệu; schema đã có URL adapter.
- Điều chỉnh công, import CSV và điều chỉnh từng dòng lương chưa có UI riêng.
- Tạo mới đề nghị thuyên chuyển/nghỉ việc chưa có form; luồng duyệt và transaction hoàn tất đã hoạt động với dữ liệu seed.
- Thuế, bảo hiểm, tăng ca và thanh toán cuối cùng là mô phỏng, không phải kết quả pháp lý/kế toán.
- Thông báo là in-app, chưa có email/push; chưa có job scheduler tự động.
- SQLite phù hợp demo một tiến trình; production nhiều người dùng nên chuyển PostgreSQL và bổ sung object storage.

## Công thức lương

```text
Lương theo công = Lương cơ bản / Ngày công chuẩn × Ngày công thực tế

Thực nhận = Lương theo công
           + Phụ cấp + Tiền tăng ca + Thưởng
           - Bảo hiểm - Thuế - Khấu trừ khác
```

Ngày công chuẩn mặc định là 26 và có thể nhập khi tạo kỳ lương.

## Kiểm thử và build

```bash
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

Unit test bao phủ công thức lương, số ngày phép, trạng thái tuyển dụng, thuyên chuyển và phân quyền. Smoke test bao phủ đăng nhập theo vai trò, mở các phân hệ cốt lõi, giới hạn quyền nhân viên, bảng công, nghỉ phép và phiếu lương.

## Hướng phát triển tiếp theo

1. Chuyển datasource sang PostgreSQL và bổ sung connection pooling.
2. Hoàn thiện CRUD còn lại và workflow nhiều cấp có cấu hình.
3. Tách object storage cho hồ sơ/tài liệu; quét virus và signed URL.
4. Thêm hàng đợi email, lịch chạy cảnh báo hợp đồng và đối soát bảng công.
5. Bổ sung holiday calendar, công ca, biểu thuế phiên bản hóa và test concurrency.
6. Tích hợp adapter máy chấm công, ERP, bảo hiểm và ngân hàng khi có thông tin xác thực.
