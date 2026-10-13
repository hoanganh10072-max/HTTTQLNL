import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const prefix = `QA-ORG-${Date.now()}`;
async function login(page: Page, email = "admin@vinamilk.demo") {
  await page.context().clearCookies(); await page.goto("/login");
  await page.getByLabel("Email công việc", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
test.afterAll(async () => {
  await db.employee.deleteMany({ where: { employeeCode: { startsWith: prefix } } });
  await db.position.deleteMany({ where: { code: { startsWith: prefix } } });
  await db.department.deleteMany({ where: { code: { startsWith: prefix } } });
  await db.branch.deleteMany({ where: { code: { startsWith: prefix } } });
  await db.$disconnect();
});
test("admin thêm/sửa/lưu trữ/khôi phục/xóa cơ cấu ngay tại trang tổ chức", async ({ page }) => {
  test.setTimeout(90000);
  const branch = await db.branch.findFirstOrThrow({ where: { deletedAt: null, status: "ACTIVE" } });
  const department = await db.department.findFirstOrThrow({ where: { branchId: branch.id, deletedAt: null } });
  await login(page); page.on("dialog", d => d.accept()); await page.goto("/organization");
  for (const [entity, label] of [["Branch", "chi nhánh"], ["Department", "phòng ban"], ["Position", "chức danh"]] as const) {
    await page.getByRole("button", { name: `Thêm ${label}`, exact: true }).click();
    let dialog = page.locator("dialog[open]");
    await dialog.locator('[name="code"]').fill(`${prefix}-${entity}`); await dialog.locator('[name="name"]').fill(`${prefix} ${label}`);
    if (entity === "Department") await dialog.locator('[name="branchId"]').selectOption(branch.id);
    if (entity === "Position") await dialog.locator('[name="departmentId"]').selectOption(department.id);
    await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử thêm cơ cấu tổ chức");
    await dialog.getByRole("button", { name: "Tạo bản ghi", exact: true }).click();
    await expect(page).toHaveURL(/\/organization\?saved=/); await expect(page.locator("dialog[open]")).toHaveCount(0);
    let row = page.locator(`[data-org-entry="${entity}"]`).filter({ hasText: `${prefix} ${label}` });
    await row.getByRole("button", { name: /^Chỉnh sửa/ }).click(); dialog = page.locator("dialog[open]");
    await dialog.locator('[name="name"]').fill(`${prefix} ${label} cập nhật`); await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử chỉnh sửa cơ cấu");
    await dialog.getByRole("button", { name: "Lưu thay đổi", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0);
    row = page.locator(`[data-org-entry="${entity}"]`).filter({ hasText: `${prefix} ${label} cập nhật` }); await expect(row).toBeVisible();
    await row.getByRole("button", { name: /^Lưu trữ/ }).click(); dialog = page.locator("dialog[open]");
    await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử lưu trữ cơ cấu"); await dialog.getByRole("button", { name: "Lưu trữ", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0); await expect(row).toHaveCount(0);
    await page.getByRole("link", { name: "Đã lưu trữ", exact: true }).click();
    row = page.locator(`[data-org-entry="${entity}"]`).filter({ hasText: `${prefix} ${label} cập nhật` }); await expect(row).toBeVisible();
    await row.getByRole("button", { name: /^Khôi phục/ }).click(); dialog = page.locator("dialog[open]");
    await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử khôi phục cơ cấu"); await dialog.getByRole("button", { name: "Khôi phục", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0); await expect(page).toHaveURL(/\/organization\?saved=/);
    row = page.locator(`[data-org-entry="${entity}"]`).filter({ hasText: `${prefix} ${label} cập nhật` }); await expect(row).toBeVisible();
    await row.getByRole("button", { name: /^Lưu trữ/ }).click(); dialog = page.locator("dialog[open]"); await dialog.getByLabel("Thao tác cơ cấu").selectOption("delete");
    await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử xóa dữ liệu độc lập"); await dialog.locator('[name="confirmation"]').fill("XOA");
    await dialog.getByRole("button", { name: "Xóa vĩnh viễn", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0); await expect(row).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: "test-results/organization-admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole("button", { name: "Thêm phòng ban", exact: true }).click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  expect(await page.locator("dialog[open]").evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Đóng cửa sổ chỉnh sửa" }).click();
});
test("đổi chi nhánh phòng ban đồng bộ nhân viên và chặn xóa dữ liệu còn liên kết", async ({ page }) => {
  const a = await db.branch.create({ data: { code: `${prefix}-A`, name: `${prefix} A` } });
  const b = await db.branch.create({ data: { code: `${prefix}-B`, name: `${prefix} B` } });
  const dep = await db.department.create({ data: { code: `${prefix}-D`, name: `${prefix} phòng chuyển`, branchId: a.id } });
  const pos = await db.position.create({ data: { code: `${prefix}-P`, name: `${prefix} chức danh`, departmentId: dep.id } });
  const employee = await db.employee.create({ data: { employeeCode: `${prefix}-E`, firstName: "Kiểm thử", lastName: "Nhân viên", workEmail: `${prefix.toLowerCase()}@example.test`, branchId: a.id, departmentId: dep.id, positionId: pos.id, hireDate: new Date(), baseSalary: 10000000 } });
  await login(page); page.on("dialog", d => d.accept()); await page.goto("/organization");
  const row = page.locator('[data-org-entry="Department"]').filter({ hasText: dep.name });
  await row.getByRole("button", { name: /^Chỉnh sửa/ }).click(); let dialog = page.locator("dialog[open]");
  await dialog.locator('[name="branchId"]').selectOption(b.id); await dialog.locator('[name="headcount"]').fill("20"); await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử chuyển chi nhánh phòng ban");
  await dialog.getByRole("button", { name: "Lưu thay đổi", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect((await db.employee.findUniqueOrThrow({ where: { id: employee.id } })).branchId).toBe(b.id); await expect(row).toContainText("1/20");
  await row.getByRole("button", { name: /^Lưu trữ/ }).click(); dialog = page.locator("dialog[open]"); await dialog.getByLabel("Thao tác cơ cấu").selectOption("delete");
  await dialog.locator('[name="reasonForChange"]').fill("Kiểm thử ràng buộc dữ liệu"); await dialog.locator('[name="confirmation"]').fill("XOA");
  await dialog.getByRole("button", { name: "Xóa vĩnh viễn", exact: true }).click(); await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator('main [role="alert"]')).toContainText("dữ liệu liên quan"); expect(await db.department.findUnique({ where: { id: dep.id } })).not.toBeNull();
});
test("HR và quản lý chỉ xem cơ cấu, không có nút quản trị", async ({ page }) => {
  for (const email of ["hr@vinamilk.demo", "manager@vinamilk.demo"]) {
    await login(page, email); await page.goto("/organization"); await expect(page.getByRole("heading", { name: "Cơ cấu tổ chức", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Thêm / })).toHaveCount(0); await expect(page.getByRole("button", { name: /^Chỉnh sửa/ })).toHaveCount(0);
    await page.goto("/admin/data/Department/new"); await expect(page).toHaveURL(/forbidden/);
  }
});
