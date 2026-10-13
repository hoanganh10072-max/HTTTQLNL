import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const prefix = `QA-GROUPS-${Date.now()}`;
async function login(page: Page, email: string) {
  await page.context().clearCookies(); await page.goto("/login");
  await page.getByLabel("Email công việc", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
test.afterAll(async () => {
  const cycles = await db.performanceCycle.findMany({ where: { name: { startsWith: prefix } } });
  const reviews = await db.performanceReview.findMany({ where: { cycleId: { in: cycles.map(c => c.id) } } });
  await db.performanceGoal.deleteMany({ where: { reviewId: { in: reviews.map(r => r.id) } } });
  await db.performanceReview.deleteMany({ where: { id: { in: reviews.map(r => r.id) } } });
  await db.performanceCycle.deleteMany({ where: { id: { in: cycles.map(c => c.id) } } });
  await db.$disconnect();
});
test("KPI có mục lãnh đạo, chi nhánh, nhân viên và tiêu chí/cách xét", async ({ page }) => {
  await login(page, "admin@vinamilk.demo"); await page.goto("/performance");
  const nav = page.getByRole("navigation", { name: "Nhóm đánh giá KPI" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "Lãnh đạo theo vai trò" }).click();
  await expect(page.getByLabel("Vai trò lãnh đạo", { exact: true })).toBeVisible();
  await page.getByLabel("Vai trò lãnh đạo", { exact: true }).selectOption("DEPARTMENT_HEAD");
  await expect(page.getByText("Kết quả mục tiêu phòng ban", { exact: true })).toBeVisible();
  await nav.getByRole("link", { name: "Tiêu chí & cách xét" }).click();
  await expect(page.getByRole("heading", { name: "Tiêu chí & cách xét KPI" })).toBeVisible();
  await expect(page.locator("main")).toContainText("93,5");
  await page.getByText("Giám đốc chi nhánh · 4 tiêu chí", { exact: true }).click();
  await expect(page.getByText("Hoàn thành kế hoạch chi nhánh", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/kpi-criteria-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/kpi-criteria-mobile.png", fullPage: true });
  expect(await page.locator("body").evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true);
});
test("giao đánh giá lãnh đạo đúng vai trò và tạo sẵn tiêu chí", async ({ page }) => {
  const account = await db.user.findUniqueOrThrow({ where: { email: "employee@vinamilk.demo" } });
  const cycle = await db.performanceCycle.create({ data: { name: `${prefix} lãnh đạo`, status: "ACTIVE", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") } });
  await login(page, "admin@vinamilk.demo"); await page.goto("/performance?group=LEADERSHIP");
  await page.locator('[name="cycleId"]').selectOption(cycle.id); await page.getByLabel("Vai trò lãnh đạo", { exact: true }).selectOption("DEPARTMENT_HEAD");
  await page.locator('[name="employeeId"]').selectOption(account.employeeId!); await page.getByRole("button", { name: "Tạo bản đánh giá", exact: true }).click();
  await expect(page).toHaveURL(/\/performance\/[a-z0-9]+$/);
  const review = await db.performanceReview.findUniqueOrThrow({ where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: account.employeeId! } }, include: { goals: true } });
  expect(review.subjectType).toBe("LEADERSHIP"); expect(review.evaluationRole).toBe("DEPARTMENT_HEAD"); expect(review.goals.length).toBe(4); expect(review.goals.reduce((s, g) => s + g.weight, 0)).toBe(100);
  await page.goto(`/performance?group=LEADERSHIP&cycle=${cycle.id}`); await expect(page.locator("tbody")).toContainText("Trưởng phòng");
  await page.goto(`/performance?group=EMPLOYEE&cycle=${cycle.id}`); await expect(page.locator("tbody tr")).toHaveCount(0);
  const csv = await page.request.get(`/api/export/performance?group=LEADERSHIP&cycle=${cycle.id}`); expect(csv.status()).toBe(200); expect(await csv.text()).toContain("Trưởng phòng");
});
test("đánh giá chi nhánh độc lập, báo cáo/phê duyệt và kiểm tra phạm vi", async ({ browser }) => {
  test.setTimeout(90000);
  const account = await db.user.findUniqueOrThrow({ where: { email: "employee@vinamilk.demo" }, include: { employee: true } });
  const cycle = await db.performanceCycle.create({ data: { name: `${prefix} chi nhánh`, status: "ACTIVE", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") } });
  const admin = await browser.newPage(), owner = await browser.newPage(), outsider = await browser.newPage();
  try {
    await login(admin, "admin@vinamilk.demo"); await admin.goto("/performance?group=BRANCH");
    await admin.locator('[name="cycleId"]').selectOption(cycle.id); await admin.getByLabel("Chi nhánh", { exact: true }).selectOption(account.employee!.branchId);
    await admin.getByLabel("Người phụ trách báo cáo chi nhánh", { exact: true }).selectOption(account.employeeId!);
    await admin.getByRole("button", { name: "Tạo bản đánh giá", exact: true }).click(); await expect(admin).toHaveURL(/\/performance\/[a-z0-9]+$/);
    const review = await db.performanceReview.findUniqueOrThrow({ where: { cycleId_branchId: { cycleId: cycle.id, branchId: account.employee!.branchId } }, include: { goals: true } });
    expect(review.employeeId).toBeNull(); expect(review.responsibleEmployeeId).toBe(account.employeeId); expect(review.goals.length).toBe(5);
    await admin.getByRole("button", { name: "Giao mục tiêu", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await login(owner, "employee@vinamilk.demo"); await owner.goto(`/performance/${review.id}`);
    for (const goal of review.goals) { await owner.locator(`[name="actual_${goal.id}"]`).fill(String(goal.target)); await owner.locator(`[name="evidence_${goal.id}"]`).fill("Báo cáo chi nhánh đã đối soát số liệu theo chỉ tiêu."); }
    await owner.locator('[name="note"]').fill("Đã hoàn thành kế hoạch và kiểm tra minh chứng của chi nhánh."); await owner.getByRole("button", { name: "Gửi tự đánh giá", exact: true }).click(); await expect(owner).toHaveURL(/success=1/);
    await expect(owner.getByRole("button", { name: "Lưu đánh giá quản lý", exact: true })).toHaveCount(0);
    await login(outsider, "manager@vinamilk.demo"); await outsider.goto(`/performance/${review.id}`);
    // A streamed Next.js not-found page may use HTTP 200; verify the denial UI and absence of protected data.
    await expect(outsider.getByRole("heading", { name: "404", exact: true })).toBeVisible();
    await expect(outsider.locator("main")).not.toContainText(cycle.name);
    await expect(outsider.getByRole("button", { name: "Lưu đánh giá quản lý", exact: true })).toHaveCount(0);
    const csv = await outsider.request.get(`/api/export/performance?group=BRANCH&cycle=${cycle.id}`); expect(await csv.text()).not.toContain(cycle.name);
    await admin.goto(`/performance/${review.id}`);
    for (const goal of review.goals) await admin.locator(`[name="score_${goal.id}"]`).fill("100");
    await admin.locator('form [name="note"]').first().fill("Các chỉ tiêu đáp ứng kế hoạch và có minh chứng rõ ràng."); await admin.locator('[name="developmentPlan"]').fill("Cải thiện dịch vụ và đào tạo đội ngũ ở kỳ kế tiếp.");
    await admin.getByRole("button", { name: "Lưu đánh giá quản lý", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    admin.on("dialog", dialog => dialog.accept()); await admin.getByRole("button", { name: "Phê duyệt kết quả", exact: true }).click(); await expect(admin).toHaveURL(/success=1/);
    await owner.goto(`/performance/${review.id}`); await owner.getByRole("button", { name: "Xác nhận đã nhận kết quả", exact: true }).click(); await expect(owner).toHaveURL(/success=1/);
    const final = await db.performanceReview.findUniqueOrThrow({ where: { id: review.id } }); expect(final.score).toBe(100); expect(final.status).toBe("ACKNOWLEDGED");
    await admin.goto(`/performance?group=BRANCH&cycle=${cycle.id}`); await expect(admin.locator("tbody")).toContainText("Đạt kỳ vọng");
    await admin.setViewportSize({ width: 1440, height: 1000 }); await admin.screenshot({ path: "test-results/kpi-branch-desktop.png", fullPage: true });
  } finally { await admin.close(); await owner.close(); await outsider.close(); }
});
