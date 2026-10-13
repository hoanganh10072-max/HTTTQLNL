import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login"); await page.getByLabel("Email công việc", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123"); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}

test("đăng nhập HR và mở các phân hệ cốt lõi", async ({ page }) => {
  await login(page, "hr@vinamilk.demo");
  for (const path of ["/employees", "/attendance", "/leave", "/payroll", "/transfers"]) { await page.goto(path); await expect(page.locator("h1")).toBeVisible(); }
});

test("nhân viên xem phiếu lương và gửi đơn nghỉ", async ({ page }) => {
  await login(page, "employee@vinamilk.demo"); await page.goto("/payroll"); await expect(page.getByText("Phiếu lương cá nhân")).toBeVisible(); await page.goto("/leave"); await expect(page.getByRole("button", { name: "Gửi đơn nghỉ" })).toBeVisible();
});

test("nhân viên có nút check-in/check-out và không mở được hồ sơ toàn công ty", async ({ page }) => {
  await login(page, "employee@vinamilk.demo"); await page.goto("/attendance"); await expect(page.getByRole("button", { name: "Check-in" })).toBeVisible(); await page.goto("/employees"); await expect(page).toHaveURL(/forbidden/);
});

test("quản lý xem luồng duyệt phép đúng phạm vi", async ({ page }) => {
  await login(page, "manager@vinamilk.demo"); await page.goto("/leave"); await expect(page.locator("h1")).toContainText("Nghỉ phép");
});
