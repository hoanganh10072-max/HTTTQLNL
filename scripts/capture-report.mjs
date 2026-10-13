import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = "http://127.0.0.1:3010";
const outputDir = "D:/đoan/web_report_screenshots";

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});

await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "01-dang-nhap.png"), fullPage: false });

await page.getByLabel("Email công việc").fill("hr@vinamilk.demo");
await page.getByLabel("Mật khẩu").fill("Demo@123");
await Promise.all([
  page.waitForURL("**/dashboard"),
  page.getByRole("button", { name: "Đăng nhập" }).click(),
]);

const pages = [
  ["dashboard", "02-tong-quan.png"],
  ["organization", "03-co-cau-to-chuc.png"],
  ["employees", "04-ho-so-nhan-vien.png"],
  ["recruitment", "05-tuyen-dung.png"],
  ["contracts", "06-hop-dong.png"],
  ["attendance", "07-cham-cong.png"],
  ["leave", "08-nghi-phep.png"],
  ["payroll", "09-tien-luong.png"],
  ["transfers", "10-thuyen-chuyen.png"],
  ["resignations", "11-nghi-viec.png"],
  ["reports", "12-bao-cao.png"],
];

for (const [route, fileName] of pages) {
  await page.goto(`${baseURL}/${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, fileName), fullPage: false });
}

await browser.close();
console.log(`Đã lưu ${pages.length + 1} ảnh tại ${outputDir}`);
