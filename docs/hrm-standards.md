# Đối chiếu và triển khai nghiệp vụ HRM

Ngày nghiên cứu: 13/10/2026. Đây là đối chiếu thực hành nghiệp vụ và kiểm soát phần mềm, không phải chứng nhận ISO, chứng nhận bảo mật hay kết luận tuân thủ pháp luật.

## Nguồn nghiên cứu

- CIPD, Performance management: An introduction (29/01/2026): https://www.cipd.org/en/knowledge/factsheets/performance-factsheet/
- CIPD, SMART objectives checklist: https://www.cipd.org/globalassets/media/knowledge/knowledge-hub/tools/2025-pdfs/2025-checklist-smart-objectives.pdf
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Next.js, tài liệu Server Actions và Mutating Data đi kèm phiên bản đã cài trong dự án.

CIPD nhấn mạnh mục tiêu gắn với tổ chức, chỉ số phù hợp công việc, trao đổi hai chiều định kỳ, phản hồi và kế hoạch phát triển. OWASP khuyến nghị mặc định từ chối, xác minh quyền ở mỗi yêu cầu và kiểm soát phạm vi dữ liệu. Các thang điểm bên dưới là thiết kế nội bộ của ứng dụng, không phải quy định của CIPD.

## Các chức năng đã triển khai

| Nhóm | Chức năng và kiểm soát |
| --- | --- |
| Tổ chức & hồ sơ | Chi nhánh, phòng ban, chức danh, thông tin cá nhân, định danh, ngân hàng, thuế/bảo hiểm, bằng cấp, kỹ năng, kinh nghiệm, quản lý trực tiếp, lịch sử công tác, tài liệu, hợp đồng |
| Tuyển dụng | Yêu cầu tuyển, ứng viên, lịch phỏng vấn, chuyển trạng thái và chuyển ứng viên đạt thành nhân viên; tự tạo hạn mức phép/checklist tiếp nhận |
| Chấm công & phép | Check-in/out, điều chỉnh bởi admin, số dư phép, kiểm tra đơn trùng, ngày làm việc, đơn chờ đã giữ hạn mức, duyệt theo phạm vi, hủy đơn chờ; admin sửa/xóa đơn sẽ đối soát lại số ngày đã dùng |
| Lương | Kỳ nháp → kiểm tra/điều chỉnh → phát hành; nhân viên chỉ đọc/xuất phiếu thuộc mình của kỳ đã phát hành; sửa phiếu tính lại lương theo công và thực nhận; admin có thể mở lại kỳ với lý do |
| KPI | Kỳ đánh giá; một đánh giá/nhân viên/kỳ; mục tiêu, nguồn đo, đơn vị, hạn, chiều đo, trọng số; minh chứng, tự đánh giá, phản hồi quản lý, kế hoạch phát triển, HR phê duyệt, nhân viên xác nhận; trả lại/mở lại có nhật ký |
| Vòng đời | Các bản ghi có nhân viên, người phụ trách, thời hạn, chi phí, minh chứng, trạng thái: tiếp nhận, đào tạo, phúc lợi/sức khỏe, tài sản, khen thưởng, kỷ luật, bàn giao |
| Thuyên chuyển & nghỉ việc | Gắn ngày hiệu lực, cập nhật chi nhánh/phòng ban và lịch sử; nghỉ việc cần xác nhận công việc, tài sản, quyết toán; khóa tài khoản khi hoàn tất |
| Quản trị | 24 nhóm dữ liệu nghiệp vụ: thêm/sửa/xóa; lưu trữ/khôi phục đối với bảng hỗ trợ; tài khoản, vai trò, kích hoạt, đặt mật khẩu; kiểm tra khóa ngoại, mã trùng, ngày/số; xác nhận XOA và lý do; giữ admin hoạt động cuối cùng |
| Báo cáo | Phân quyền cá nhân/nhóm/công ty; biến động dashboard lấy từ dữ liệu thật; xuất CSV theo quyền và phòng chống chèn công thức |
| Kiểm soát | Kiểm tra quyền tại server action/route; khóa tài khoản đã nghỉ/lưu trữ; không tự duyệt phép hoặc KPI trừ admin có nhật ký; giới hạn đăng nhập sai trên tiến trình local; nhật ký thay đổi admin trước/sau, không lưu mật khẩu/hash |

## Luồng KPI

Trang KPI hiện chia thành Lãnh đạo theo vai trò, Chi nhánh, Nhân viên và Tiêu chí & cách xét. Có 11 bộ mẫu: ban điều hành/giám đốc, giám đốc chi nhánh, trưởng phòng, trưởng nhóm, quản lý nhân sự; chi nhánh kinh doanh/văn phòng, nhà máy; chuyên viên, kinh doanh, vận hành và kỹ thuật. Đây là các bộ mẫu nội bộ, cần chỉnh theo kế hoạch công việc trước khi giao chính thức. Mẫu tạo các mục tiêu có trọng số tổng 100%, thời hạn cuối kỳ và nguồn minh chứng; không tạo kết quả thực tế hoặc tự chấm điểm.

Vai trò đánh giá tách khỏi vai trò đăng nhập. KPI chi nhánh có bản ghi riêng (không phải trung bình điểm nhân viên), bộ tiêu chí riêng và người phụ trách báo cáo đang làm tại chi nhánh đó. Admin/HR giao và đánh giá; người phụ trách cập nhật minh chứng, tự đánh giá và xác nhận kết quả. Quản lý nhóm không được mở toàn bộ KPI chi nhánh chỉ vì có quyền MANAGER. Bản cá nhân/lãnh đạo áp dụng cùng phạm vi quản lý trực tiếp. Mỗi cá nhân hoặc chi nhánh có một bản đánh giá trong một kỳ; chọn kỳ khác nếu cần đánh giá cùng người theo nhiều vai trò.

1. HR/admin mở kỳ. HR/admin/quản lý giao bản nháp cho nhân viên trong phạm vi.
2. Xác định mục tiêu đo được, chỉ tiêu dương, hạn trong kỳ và tổng trọng số 100%.
3. Giao mục tiêu → nhân viên cập nhật thực tế/minh chứng → gửi tự đánh giá.
4. Quản lý/HR/admin chấm từng mục tiêu, phản hồi và kế hoạch phát triển.
5. HR/admin phê duyệt → nhân viên xác nhận đã nhận kết quả.
6. Quản lý trả lại bản đã gửi/đánh giá cho nhân viên cập nhật. Admin mở lại về nháp để thay đổi mục tiêu, bắt buộc lý do. Kiểm tra phiên bản tránh ghi đè thao tác đồng thời.

Điểm đo = thực tế/chỉ tiêu × 100 nếu càng cao càng tốt; chỉ tiêu/thực tế × 100 nếu càng thấp càng tốt. Với kết quả thực tế bằng 0 ở chiều giảm, điểm là 120. Điểm tối đa 120. Điểm quản lý có thể điều chỉnh với phản hồi, tổng điểm là tổng điểm từng mục tiêu × trọng số/100.

Ngưỡng nội bộ: ≥110 vượt kỳ vọng, ≥90 đạt kỳ vọng, ≥70 cần cải thiện, dưới 70 chưa đạt. Không tự áp dụng KPI vào lương, sa thải hoặc kỷ luật. Người quản lý cần trao đổi với nhân viên và xem xét minh chứng.

## Quyền admin và tính nhất quán

Phiên thường hết hạn sau 8 giờ; lựa chọn ghi nhớ trên thiết bị cá nhân giữ tối đa 30 ngày. Đổi/reset mật khẩu hoặc đổi quyền thu hồi các phiên cũ. Quên mật khẩu hiện dùng luồng hỗ trợ bởi quản trị viên sau xác minh danh tính; chưa có gửi email tự động.

Admin quản lý tất cả dữ liệu nghiệp vụ. Xóa bản ghi có liên kết bị chặn để không làm hỏng dữ liệu; xử lý liên kết trước hoặc dùng lưu trữ mềm. Lưu trữ nhân viên khóa tài khoản, khôi phục hồ sơ không tự mở lại tài khoản. Các trạng thái KPI, phát hành lương, áp dụng thuyên chuyển và hoàn tất nghỉ việc được thao tác qua màn hình nghiệp vụ để cập nhật đủ dữ liệu phụ thuộc. Nhật ký kiểm toán là sổ ghi chỉ bổ sung, không có thao tác sửa/xóa qua ứng dụng.

Các hoạt động đào tạo/phúc lợi/tài sản là sổ theo dõi nhiệm vụ và hồ sơ, chưa thay thế LMS, quản lý kho tài sản, bảo hiểm hoặc công cụ xử lý kỷ luật chuyên sâu.

## Trước khi đưa vào sử dụng thật

Thư viện đã cập nhật: Next.js 16.3.8, Vitest 4.1.11; khóa các bản vá effect 3.20.0, deepmerge-ts 8.0.0, source-map-js 1.2.2 và tinypool 2.1.2. Kiểm tra npm audit production sau cập nhật: không có cảnh báo. Kiểm tra toàn bộ vẫn còn chuỗi 5 cảnh báo high của braces → micromatch → fast-glob → plugin ESLint; braces hiện chưa có phiên bản vá trên registry (mới nhất 3.0.3). Công cụ này dùng cho kiểm tra mã, không phục vụ yêu cầu người dùng. Không hạ ESLint Next về 14 hoặc chạy audit fix --force để đổi kiến trúc. Theo dõi và cập nhật khi nhà cung cấp phát hành bản vá.

- Kiểm toán quyền và bảo mật độc lập, HTTPS, MFA/SSO, rate limit dùng kho dùng chung, backup/restore tự động có kiểm thử, chính sách lưu giữ và mã hóa dữ liệu nhạy cảm. Thu hồi các session cũ khi đổi/reset mật khẩu hoặc đổi vai trò/kích hoạt đã được triển khai bằng sessionVersion.
- Chuyển SQLite sang cơ sở dữ liệu phù hợp vận hành nhiều người; kiểm thử tải, đồng thời, khôi phục và khả năng truy cập.
- Thẩm định chính sách công/nghỉ, lịch làm việc/ca/ngày lễ, phép qua năm, tăng ca, thuế, mức trần bảo hiểm, hợp đồng, hồ sơ và thời hạn lưu giữ theo pháp luật áp dụng. Công thức lương hiện có vẫn là mô hình demo; bảo hiểm cố định 10.5% chưa phải máy tính pháp lý đầy đủ.
- Upload/kiểm tra mã độc tệp, đối soát bảng lương, ngân hàng, thiết bị chấm công và HR integrations chưa triển khai; các trường tài liệu hiện lưu liên kết.
- Phê duyệt nhiều cấp, đánh giá 360 độ, danh mục năng lực, hoạch định kế nhiệm và lịch sử phản hồi định kỳ riêng có thể bổ sung theo chính sách doanh nghiệp.

Không chạy seed trên dữ liệu thật: seed xóa dữ liệu demo trước khi tạo lại. Nâng cấp này dùng migration bổ sung, không chạy seed. Bản sao trước nâng cấp lưu tại prisma/backup-before-hrm-20261013.db.
