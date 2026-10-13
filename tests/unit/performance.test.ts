import { describe, it, expect } from "vitest";
import { achievement, weightedScore, rating, employeeScope } from "@/lib/performance";
import { csvCell } from "@/lib/csv";
import { loginBlocked, recordLoginFailure, clearLoginFailures } from "@/lib/login-throttle";
import { performancePresets, reviewAccess, reviewScope } from "@/lib/performance-presets";
describe("KPI có trọng số và chiều đo", () => {
  const high = { target: 100, actual: 90, direction: "HIGHER", weight: 60 };
  const low = { target: 10, actual: 5, direction: "LOWER", weight: 40 };
  it("tính cả chỉ tiêu tăng và giảm, giới hạn mức vượt 120", () => { expect(achievement(high)).toBe(90); expect(achievement(low)).toBe(120); expect(weightedScore([high, low])).toBe(102); });
  it("điểm quản lý được áp dụng đúng trọng số", () => expect(weightedScore([{ ...high, managerScore: 100 }, { ...low, managerScore: 80 }])).toBe(92));
  it("không chia cho zero khi KPI càng thấp càng tốt", () => expect(achievement({ ...low, actual: 0 })).toBe(120));
  it("từ chối trọng số thiếu/thừa, dữ liệu âm, NaN và điểm vượt giới hạn", () => {
    expect(() => weightedScore([high])).toThrow(); expect(() => weightedScore([])).toThrow();
    expect(() => achievement({ ...high, target: 0 })).toThrow(); expect(() => achievement({ ...high, actual: -1 })).toThrow();
    expect(() => achievement({ ...high, target: NaN })).toThrow(); expect(() => weightedScore([{ ...high, weight: 100, managerScore: 121 }])).toThrow();
  });
  it("phân loại theo ngưỡng nội bộ", () => { expect(rating(110)).toBe("Vượt kỳ vọng"); expect(rating(90)).toBe("Đạt kỳ vọng"); expect(rating(69)).toBe("Chưa đạt"); });
});
describe("phạm vi và dữ liệu xuất", () => {
  it("tài khoản thiếu hồ sơ không được mở phạm vi công ty", () => { expect(employeeScope({ role: "EMPLOYEE", employeeId: null })).toEqual({ id: "__none__" }); expect(employeeScope({ role: "MANAGER", employeeId: null })).toEqual({ managerId: "__none__" }); });
  it("vô hiệu công thức CSV mà vẫn giữ số âm thật", () => { expect(csvCell("=1+1")).toBe('"\'=1+1"'); expect(csvCell("  @SUM(1)")).toContain("'"); expect(csvCell(-12)).toBe('"-12"'); expect(csvCell('a"b')).toBe('"a""b"'); });
});
describe("giới hạn đăng nhập sai", () => {
  it("khóa sau 5 lần sai và mở lại sau cửa sổ 15 phút", () => {
    const key = "test-login"; clearLoginFailures(key);
    for (let i = 0; i < 5; i++) recordLoginFailure(key, 1000);
    expect(loginBlocked(key, 1001)).toBe(true); expect(loginBlocked(key, 1000 + 15 * 60000)).toBe(false); clearLoginFailures(key);
  });
});

describe("bộ tiêu chí theo nhóm và quyền chi nhánh", () => {
  it("tất cả vai trò có bộ mẫu hợp lệ với tổng trọng số 100%", () => {
    expect(new Set(performancePresets.map(p => p.key)).size).toBe(performancePresets.length);
    for (const preset of performancePresets) {
      expect(preset.criteria.reduce((s, c) => s + c.weight, 0)).toBe(100);
      expect(weightedScore(preset.criteria.map(c => ({ ...c, actual: c.target })))).toBe(100);
      expect(preset.criteria.every(c => c.description.length > 20)).toBe(true);
    }
  });
  it("người phụ trách chỉ báo cáo chi nhánh được giao, không tự trở thành người chấm", () => {
    const review = { subjectType: "BRANCH", employeeId: null, responsibleEmployeeId: "owner", employee: null };
    expect(reviewAccess({ role: "MANAGER", employeeId: "owner" }, review)).toEqual({ owner: true, editor: false });
    expect(reviewAccess({ role: "EMPLOYEE", employeeId: "outside" }, review)).toEqual({ owner: false, editor: false });
    expect(reviewAccess({ role: "ADMIN", employeeId: null }, review)).toEqual({ owner: false, editor: true });
  });
  it("tài khoản không có hồ sơ không nhận được phạm vi chi nhánh rộng", () => {
    expect(reviewScope({ role: "EMPLOYEE", employeeId: null })).toEqual({ OR: [{ employeeId: "__none__" }, { subjectType: "BRANCH", responsibleEmployeeId: "__none__" }] });
  });
});
