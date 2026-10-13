import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const prefix = `QA-HRM-${Date.now()}`;
async function login(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email công việc", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test.afterAll(async () => {
  const cycles = await prisma.performanceCycle.findMany({ where: { name: { startsWith: prefix } } });
  const reviews = await prisma.performanceReview.findMany({ where: { cycleId: { in: cycles.map(c => c.id) } } });
  await prisma.performanceGoal.deleteMany({ where: { reviewId: { in: reviews.map(r => r.id) } } });
  await prisma.performanceReview.deleteMany({ where: { id: { in: reviews.map(r => r.id) } } });
  await prisma.performanceCycle.deleteMany({ where: { id: { in: cycles.map(c => c.id) } } });
  await prisma.branch.deleteMany({ where: { code: { startsWith: prefix } } });
  await prisma.personnelActivity.deleteMany({ where: { title: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix.toLowerCase() } } });
  await prisma.$disconnect();
});
test("admin tạo, sửa, lưu trữ, khôi phục và xóa chi nhánh; lưu nhật ký", async ({ page }) => {
  await login(page, "admin@vinamilk.demo");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/hrm-dashboard-desktop.png", fullPage: true });
  await page.goto("/admin/data/Branch/new");
  await page.locator('[name="code"]').fill(prefix);
  await page.locator('[name="name"]').fill(`${prefix} chi nhánh`);
  await page.locator('[name="reasonForChange"]').fill("Kiểm thử tạo chi nhánh");
  await page.getByRole("button", { name: "Tạo bản ghi", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/data\/Branch\?saved=/);
  const branch = await prisma.branch.findUniqueOrThrow({ where: { code: prefix } });
  await page.goto(`/admin/data/Branch/${branch.id}`);
  await page.locator('[name="name"]').fill(`${prefix} đã cập nhật`);
  await page.locator('[name="reasonForChange"]').fill("Kiểm thử cập nhật chi nhánh");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page).toHaveURL(/saved=/);
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`/admin/data/Branch?q=${prefix}`);
  let row = page.locator("tbody tr").filter({ hasText: prefix });
  await row.locator("summary").click();
  await row.getByLabel("Lý do lưu trữ hoặc khôi phục").fill("Kiểm thử lưu trữ");
  await row.getByRole("button", { name: "Lưu trữ", exact: true }).click();
  await expect(page).toHaveURL(/saved=/);
  await page.goto(`/admin/data/Branch?q=${prefix}`);
  row = page.locator("tbody tr").filter({ hasText: prefix });
  await expect(row).toContainText("Đã lưu trữ");
  await row.locator("summary").click();
  await row.getByLabel("Lý do lưu trữ hoặc khôi phục").fill("Kiểm thử khôi phục");
  await row.getByRole("button", { name: "Khôi phục", exact: true }).click();
  await expect(page).toHaveURL(/saved=/);
  await page.goto(`/admin/data/Branch?q=${prefix}`);
  row = page.locator("tbody tr").filter({ hasText: prefix });
  await row.locator("summary").click();
  await row.getByLabel("Lý do xóa", { exact: true }).fill("Kiểm thử xóa bản ghi độc lập");
  await row.getByLabel("Xác nhận xóa").fill("XOA");
  await row.getByRole("button", { name: "Xóa vĩnh viễn", exact: true }).click();
  await expect(page).toHaveURL(/saved=/);
  expect(await prisma.branch.findUnique({ where: { id: branch.id } })).toBeNull();
  expect(await prisma.auditLog.count({ where: { entity: "Branch", entityId: branch.id } })).toBeGreaterThanOrEqual(5);
});
test("KPI chạy hết luồng; trọng số sai bị chặn; nhân viên không có quyền quản trị", async ({ browser }) => {
  const employeeAccount = await prisma.user.findUniqueOrThrow({ where: { email: "employee@vinamilk.demo" } });
  const cycle = await prisma.performanceCycle.create({ data: { name: `${prefix} KPI`, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), status: "ACTIVE" } });
  const review = await prisma.performanceReview.create({ data: { cycleId: cycle.id, employeeId: employeeAccount.employeeId! } });
  const admin = await browser.newPage(); const employee = await browser.newPage(); const hr = await browser.newPage();
  try {
    await login(admin, "admin@vinamilk.demo"); await admin.goto(`/performance/${review.id}`);
    await admin.locator('[name="title"]').fill("Hoàn thành yêu cầu đúng hạn"); await admin.locator('[name="target"]').fill("100"); await admin.locator('[name="weight"]').fill("80");
    await admin.getByRole("button", { name: "Thêm mục tiêu", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await admin.getByRole("button", { name: "Giao mục tiêu", exact: true }).click();
    await expect(admin.locator('main [role="alert"]')).toContainText("100%");
    await admin.getByText("Chỉnh sửa mục tiêu", { exact: true }).click();
    await admin.locator('details [name="weight"]').fill("100");
    await admin.getByRole("button", { name: "Lưu mục tiêu", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await admin.getByRole("button", { name: "Giao mục tiêu", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await login(employee, "employee@vinamilk.demo"); await employee.goto("/admin"); await expect(employee).toHaveURL(/forbidden/);
    await employee.goto(`/performance/${review.id}`);
    await employee.locator('[name^="actual_"]').fill("95"); await employee.locator('[name^="evidence_"]').fill("Báo cáo công việc: 95/100 yêu cầu hoàn thành đúng hạn.");
    await employee.locator('[name="note"]').fill("Hoàn thành các nhiệm vụ ưu tiên và cần cải thiện tốc độ phản hồi.");
    await employee.getByRole("button", { name: "Gửi tự đánh giá", exact: true }).click(); await expect(employee).toHaveURL(/success=1/);
    await admin.goto(`/performance/${review.id}`); await admin.locator('[name^="score_"]').fill("95");
    await admin.locator('form [name="note"]').first().fill("Kết quả có minh chứng, hoàn thành tốt công việc được giao.");
    await admin.locator('[name="developmentPlan"]').fill("Đào tạo quản lý thời gian và phản hồi trong 24 giờ.");
    await admin.getByRole("button", { name: "Lưu đánh giá quản lý", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await login(hr, "hr@vinamilk.demo"); await hr.goto(`/performance/${review.id}`); hr.on("dialog", dialog => dialog.accept());
    await hr.getByRole("button", { name: "Phê duyệt kết quả", exact: true }).click(); await expect(hr).toHaveURL(/success=1/);
    await employee.goto(`/performance/${review.id}`); await employee.getByRole("button", { name: "Xác nhận đã nhận kết quả", exact: true }).click(); await expect(employee).toHaveURL(/success=1/);
    const final = await prisma.performanceReview.findUniqueOrThrow({ where: { id: review.id } }); expect(final.status).toBe("ACKNOWLEDGED"); expect(final.score).toBe(95); expect(final.approvedAt).not.toBeNull();
    await employee.setViewportSize({ width: 390, height: 844 });
    await employee.screenshot({ path: "test-results/hrm-kpi-mobile.png", fullPage: true });
    expect(await prisma.auditLog.count({ where: { entity: "PerformanceReview", entityId: review.id } })).toBeGreaterThanOrEqual(7);
  } finally { await admin.close(); await employee.close(); await hr.close(); }
});
test("nhân viên không thấy lương nháp; quản lý không thấy KPI ngoài nhóm", async ({ page }) => {
  await login(page, "employee@vinamilk.demo"); await page.goto("/payroll");
  await expect(page.locator("main")).not.toContainText("Bản nháp");
  await login(page, "manager@vinamilk.demo");
  const manager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@vinamilk.demo" } });
  const outside = await prisma.employee.findFirstOrThrow({ where: { managerId: { not: manager.employeeId }, employmentStatus: "ACTIVE" } });
  const cycle = await prisma.performanceCycle.create({ data: { name: `${prefix} outside`, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), status: "ACTIVE" } });
  const review = await prisma.performanceReview.create({ data: { cycleId: cycle.id, employeeId: outside.id } });
  await page.goto(`/performance/${review.id}`); await expect(page.getByRole("button", { name: "Giao mục tiêu", exact: true })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(cycle.name);
});

test("admin truy cập form của mọi phân hệ và không vô hiệu admin cuối cùng", async ({ page }) => {
  test.setTimeout(90000);
  await login(page, "admin@vinamilk.demo");
  const entities = ["User", "Branch", "Department", "Position", "Employee", "EmployeeDocument", "EmploymentHistory", "Contract", "RecruitmentRequest", "Candidate", "Interview", "AttendanceRecord", "LeaveType", "LeaveBalance", "LeaveRequest", "PayrollPeriod", "PayrollRecord", "TransferRequest", "ResignationRequest", "Notification", "PerformanceCycle", "PerformanceReview", "PerformanceGoal", "PersonnelActivity"];
  for (const entity of entities) {
    await page.goto(`/admin/data/${entity}/new`);
    await expect(page.getByRole("button", { name: "Tạo bản ghi", exact: true })).toBeVisible();
  }
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vinamilk.demo" } });
  if (await prisma.user.count({ where: { role: "ADMIN", isActive: true } }) === 1) {
    await page.goto(`/admin/data/User/${admin.id}`);
    await page.locator('[name="role"]').selectOption("HR");
    await page.locator('[name="reasonForChange"]').fill("Kiểm thử bảo vệ admin cuối cùng");
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
    await expect(page.locator('main [role="alert"]')).toContainText("ít nhất một admin");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe("ADMIN");
  }
});

test("HR tạo nhiệm vụ đào tạo, hoàn thành và nhân viên xem đúng hồ sơ", async ({ page }) => {
  const employee = await prisma.user.findUniqueOrThrow({ where: { email: "employee@vinamilk.demo" } });
  await login(page, "hr@vinamilk.demo"); await page.goto("/activities");
  await page.getByText("Thêm hoạt động / nhiệm vụ nhân sự", { exact: true }).click();
  await page.locator('[name="employeeId"]').selectOption(employee.employeeId!);
  await page.locator('form [name="category"]').first().selectOption("TRAINING");
  await page.locator('[name="title"]').fill(`${prefix} đào tạo`);
  await page.locator('[name="dueDate"]').fill("2026-12-31");
  await page.getByRole("button", { name: "Tạo hoạt động", exact: true }).click();
  const activity = page.locator("section").filter({ has: page.getByRole("heading", { name: `${prefix} đào tạo`, exact: true }) });
  await expect(activity).toBeVisible();
  await activity.locator('[name="status"]').selectOption("COMPLETED"); await activity.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(activity).toContainText("Hoàn tất");
  await login(page, "employee@vinamilk.demo"); await page.goto("/activities");
  await expect(page.getByRole("heading", { name: `${prefix} đào tạo`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo hoạt động", exact: true })).toHaveCount(0);
});

test("admin reset mật khẩu thu hồi phiên đăng nhập cũ", async ({ browser }) => {
  const account = await prisma.user.create({ data: { email: `${prefix.toLowerCase()}@example.test`, role: "EMPLOYEE", passwordHash: await bcrypt.hash("Demo@123", 12) } });
  const admin = await browser.newPage(); const employee = await browser.newPage();
  try {
    await login(employee, account.email); await login(admin, "admin@vinamilk.demo");
    await admin.goto(`/admin/data/User/${account.id}`);
    await admin.locator('[name="password"]').fill("NewDemo@456");
    await admin.locator('[name="reasonForChange"]').fill("Kiểm thử thu hồi session sau reset mật khẩu");
    await admin.getByRole("button", { name: "Lưu thay đổi", exact: true }).click(); await expect(admin).toHaveURL(/saved=/);
    await employee.goto("/profile"); await expect(employee).toHaveURL(/login/);
    await employee.getByLabel("Email công việc", { exact: true }).fill(account.email);
    await employee.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123");
    await employee.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(employee.locator(".login-error")).toBeVisible();
    await employee.getByLabel("Mật khẩu", { exact: true }).fill("NewDemo@456");
    await employee.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(employee).toHaveURL(/dashboard/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: account.id } })).sessionVersion).toBe(1);
  } finally { await admin.close(); await employee.close(); }
});
