import { describe, expect, it } from "vitest";
import { calculatePayroll, canApproveTransfer, canRequestLeave, canTransitionCandidate, hasPermission } from "@/lib/rules";

describe("công thức tính lương", () => {
  it("tính đúng lương theo công và thực nhận", () => {
    expect(calculatePayroll({ baseSalary: 26_000_000, standardDays: 26, actualDays: 24, allowance: 1_000_000, overtime: 500_000, bonus: 2_000_000, insurance: 2_730_000, tax: 500_000, otherDeduction: 200_000 })).toEqual({ workSalary: 24_000_000, netSalary: 24_070_000 });
  });
  it("từ chối ngày công chuẩn bằng 0", () => expect(() => calculatePayroll({ baseSalary: 10, standardDays: 0, actualDays: 1 })).toThrow());
});

describe("quy tắc ngày phép", () => {
  it("cho phép khi số dư còn đủ", () => expect(canRequestLeave(12, 4, 3)).toBe(true));
  it("từ chối khi vượt số dư hoặc số ngày không dương", () => { expect(canRequestLeave(12, 10, 3)).toBe(false); expect(canRequestLeave(12, 0, 0)).toBe(false); });
});

describe("chuyển trạng thái tuyển dụng", () => {
  it("chỉ cho phép luồng hợp lệ", () => { expect(canTransitionCandidate("NEW", "SCREENING")).toBe(true); expect(canTransitionCandidate("NEW", "HIRED")).toBe(false); expect(canTransitionCandidate("HIRED", "FAILED")).toBe(false); });
});

describe("quy tắc thuyên chuyển", () => {
  it("chỉ duyệt yêu cầu chờ và nhân viên đang làm", () => { expect(canApproveTransfer({ status: "PENDING", employeeStatus: "ACTIVE", newDepartmentId: "d2", newPositionId: "p2" })).toBe(true); expect(canApproveTransfer({ status: "APPROVED", employeeStatus: "ACTIVE", newDepartmentId: "d2", newPositionId: "p2" })).toBe(false); expect(canApproveTransfer({ status: "PENDING", employeeStatus: "RESIGNED", newDepartmentId: "d2", newPositionId: "p2" })).toBe(false); });
});

describe("phân quyền", () => {
  it("admin có toàn quyền, nhân viên chỉ có quyền cá nhân", () => { expect(hasPermission("ADMIN", "audit:read")).toBe(true); expect(hasPermission("EMPLOYEE", "payroll:read:self")).toBe(true); expect(hasPermission("EMPLOYEE", "payroll:read:any")).toBe(false); expect(hasPermission("EMPLOYEE", "employee:write")).toBe(false); expect(hasPermission("MANAGER", "workflow:approve:team")).toBe(true); });
});
