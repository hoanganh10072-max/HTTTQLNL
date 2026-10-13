export type GoalInput = { target: number; actual: number; direction: string; weight: number; managerScore?: number | null };
export function achievement(goal: GoalInput) {
  if (![goal.target, goal.actual, goal.weight].every(Number.isFinite) || goal.target <= 0 || goal.actual < 0 || goal.weight <= 0 || goal.weight > 100) throw new Error("Chỉ tiêu, kết quả hoặc trọng số không hợp lệ.");
  if (!["HIGHER", "LOWER"].includes(goal.direction)) throw new Error("Chiều đo không hợp lệ.");
  return Math.round(Math.min(120, goal.direction === "LOWER" ? (goal.actual === 0 ? 120 : goal.target / goal.actual * 100) : goal.actual / goal.target * 100) * 100) / 100;
}
export function weightedScore(goals: GoalInput[]) {
  if (!goals.length || Math.abs(goals.reduce((sum, g) => sum + g.weight, 0) - 100) > .001) throw new Error("Tổng trọng số KPI phải bằng 100%.");
  return Math.round(goals.reduce((sum, goal) => {
    const measured = achievement(goal);
    const score = goal.managerScore ?? measured;
    if (!Number.isFinite(score) || score < 0 || score > 120) throw new Error("Điểm KPI phải từ 0 đến 120.");
    return sum + score * goal.weight / 100;
  }, 0) * 100) / 100;
}
export function rating(score: number) { return score >= 110 ? "Vượt kỳ vọng" : score >= 90 ? "Đạt kỳ vọng" : score >= 70 ? "Cần cải thiện" : "Chưa đạt"; }
export function employeeScope(user: { role: string; employeeId: string | null }) {
  return user.role === "EMPLOYEE" ? { id: user.employeeId ?? "__none__" } : user.role === "MANAGER" ? { managerId: user.employeeId ?? "__none__" } : {};
}
