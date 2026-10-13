import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 86_400_000;

function atDay(year: number, month: number, day: number, hour = 8) {
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

async function main() {
  await prisma.$transaction([
    prisma.performanceGoal.deleteMany(), prisma.performanceReview.deleteMany(), prisma.performanceCycle.deleteMany(), prisma.personnelActivity.deleteMany(),
    prisma.auditLog.deleteMany(), prisma.notification.deleteMany(),
    prisma.resignationRequest.deleteMany(), prisma.transferRequest.deleteMany(),
    prisma.payrollRecord.deleteMany(), prisma.payrollPeriod.deleteMany(),
    prisma.leaveRequest.deleteMany(), prisma.leaveBalance.deleteMany(), prisma.leaveType.deleteMany(),
    prisma.attendanceRecord.deleteMany(), prisma.interview.deleteMany(), prisma.candidate.deleteMany(),
    prisma.recruitmentRequest.deleteMany(), prisma.contract.deleteMany(), prisma.employmentHistory.deleteMany(),
    prisma.employeeDocument.deleteMany(), prisma.user.deleteMany(), prisma.employee.deleteMany(),
    prisma.position.deleteMany(), prisma.department.deleteMany(), prisma.branch.deleteMany(),
  ]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const branch = await prisma.branch.create({
    data: { code: "HCM-HQ", name: "Văn phòng điều hành", address: "Quận 7, TP. Hồ Chí Minh" },
  });
  const factory = await prisma.branch.create({
    data: { code: "BD-PLANT", name: "Nhà máy Bình Dương", address: "Bến Cát, Bình Dương" },
  });

  const departmentNames = ["Nhân sự", "Tài chính", "Kinh doanh", "Sản xuất", "Công nghệ thông tin"];
  const departments = [];
  for (let i = 0; i < departmentNames.length; i++) {
    departments.push(await prisma.department.create({ data: {
      code: `PB${String(i + 1).padStart(2, "0")}`,
      name: departmentNames[i], branchId: i === 3 ? factory.id : branch.id, headcount: 12 + i * 3,
    }}));
  }

  const positionNames = ["Giám đốc", "Trưởng phòng", "Chuyên viên cao cấp", "Chuyên viên", "Nhân viên", "Kỹ sư", "Kế toán viên", "Nhân viên kinh doanh", "Kỹ thuật viên", "Thực tập sinh"];
  const positions = [];
  for (let i = 0; i < positionNames.length; i++) {
    positions.push(await prisma.position.create({ data: {
      code: `CD${String(i + 1).padStart(2, "0")}`,
      name: positionNames[i], level: Math.max(1, 5 - Math.floor(i / 2)), departmentId: departments[i % departments.length].id,
    }}));
  }

  const family = ["An", "Bình", "Chi", "Dũng", "Giang", "Hà", "Hùng", "Khánh", "Lan", "Minh", "Ngân", "Phúc", "Quân", "Trang", "Vy"];
  const employees = [];
  for (let i = 0; i < 30; i++) {
    const dep = departments[i % departments.length];
    const pos = positions[(i + 3) % positions.length];
    const status = i === 28 ? "PROBATION" : i === 29 ? "RESIGNED" : "ACTIVE";
    const employee = await prisma.employee.create({ data: {
      employeeCode: `VNM${String(i + 1).padStart(4, "0")}`,
      firstName: family[i % family.length], lastName: i % 2 === 0 ? "Nguyễn" : "Trần",
      gender: i % 2 === 0 ? "NAM" : "NỮ", dateOfBirth: atDay(1988 + (i % 10), (i % 12) + 1, (i % 25) + 1),
      workEmail: `nhanvien${i + 1}@vinamilk.demo`, personalEmail: `demo${i + 1}@example.test`,
      phone: `090000${String(i + 1).padStart(4, "0")}`, address: `Địa chỉ mô phỏng số ${i + 1}`,
      identityNumber: `079099${String(i + 1).padStart(6, "0")}`, bankAccount: `000100${String(i + 1).padStart(6, "0")}`,
      bankName: "Ngân hàng mô phỏng", taxCode: `TAX${String(i + 1).padStart(7, "0")}`,
      insuranceNumber: `BH${String(i + 1).padStart(8, "0")}`, qualifications: "Đại học",
      skills: i % 3 === 0 ? "Quản lý, phân tích dữ liệu" : "Giao tiếp, làm việc nhóm", experience: `${2 + (i % 8)} năm kinh nghiệm mô phỏng`,
      branchId: i % 5 === 3 ? factory.id : branch.id, departmentId: dep.id, positionId: pos.id,
      hireDate: new Date(now.getTime() - (90 + i * 37) * DAY),
      probationEndDate: i === 28 ? new Date(now.getTime() + 25 * DAY) : null,
      employmentStatus: status, baseSalary: 10_000_000 + (i % 10) * 1_250_000,
    }});
    employees.push(employee);
    await prisma.employmentHistory.create({ data: {
      employeeId: employee.id, departmentName: dep.name, positionName: pos.name,
      salary: employee.baseSalary, startDate: employee.hireDate, reason: "Tiếp nhận nhân sự",
    }});
    const endDate = i < 5 ? new Date(now.getTime() + (12 + i * 4) * DAY) : new Date(now.getTime() + (180 + i * 9) * DAY);
    await prisma.contract.create({ data: {
      contractNumber: `HD-${year}-${String(i + 1).padStart(4, "0")}`, employeeId: employee.id,
      type: i === 28 ? "PROBATION" : i % 7 === 0 ? "INDEFINITE" : "FIXED_TERM",
      startDate: employee.hireDate, endDate: i % 7 === 0 ? null : endDate, salary: employee.baseSalary,
      status: status === "RESIGNED" ? "TERMINATED" : "ACTIVE", createdBy: "seed",
    }});
  }

  for (let i = 0; i < 5; i++) {
    await prisma.department.update({ where: { id: departments[i].id }, data: { managerId: employees[i].id } });
  }
  for (let i = 5; i < employees.length; i++) {
    await prisma.employee.update({ where: { id: employees[i].id }, data: { managerId: employees[i % 5].id } });
  }

  const passwordHash = await bcrypt.hash("Demo@123", 12);
  const accounts = [
    ["admin@vinamilk.demo", "ADMIN", employees[0].id],
    ["hr@vinamilk.demo", "HR", employees[1].id],
    ["manager@vinamilk.demo", "MANAGER", employees[2].id],
    ["employee@vinamilk.demo", "EMPLOYEE", employees[5].id],
  ] as const;
  for (const [email, role, employeeId] of accounts) {
    await prisma.user.create({ data: { email, role, employeeId, passwordHash } });
  }

  const annualLeave = await prisma.leaveType.create({ data: { code: "ANNUAL", name: "Nghỉ phép năm", annualAllowance: 12, isPaid: true } });
  const sickLeave = await prisma.leaveType.create({ data: { code: "SICK", name: "Nghỉ ốm", annualAllowance: 10, isPaid: true } });
  await prisma.leaveType.create({ data: { code: "UNPAID", name: "Nghỉ không lương", annualAllowance: 0, isPaid: false } });
  for (const employee of employees) {
    await prisma.leaveBalance.createMany({ data: [
      { employeeId: employee.id, leaveTypeId: annualLeave.id, year, allocated: 12, used: employee.employeeCode.endsWith("1") ? 2 : 0 },
      { employeeId: employee.id, leaveTypeId: sickLeave.id, year, allocated: 10, used: 0 },
    ]});
  }
  const leaveStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
  for (let i = 0; i < 8; i++) {
    await prisma.leaveRequest.create({ data: {
      employeeId: employees[5 + i].id, leaveTypeId: annualLeave.id,
      startDate: new Date(now.getTime() + (i + 2) * DAY), endDate: new Date(now.getTime() + (i + 3) * DAY),
      days: 2, reason: `Lý do nghỉ phép mô phỏng ${i + 1}`, status: leaveStatuses[i % leaveStatuses.length],
      reviewerId: i % 4 === 0 ? null : "seed-manager", reviewedAt: i % 4 === 0 ? null : now,
    }});
  }

  const currentDay = Math.max(1, now.getDate());
  for (const employee of employees.filter((e) => e.employmentStatus !== "RESIGNED")) {
    for (let day = 1; day <= currentDay; day++) {
      const workDate = atDay(year, month, day, 0);
      if ([0, 6].includes(workDate.getDay())) continue;
      const late = (day + Number(employee.employeeCode.slice(-2))) % 7 === 0;
      const checkIn = atDay(year, month, day, late ? 9 : 8);
      const checkOut = atDay(year, month, day, 17);
      await prisma.attendanceRecord.create({ data: {
        employeeId: employee.id, workDate, checkIn, checkOut, totalHours: late ? 8 : 9, status: late ? "LATE" : "ON_TIME",
      }});
    }
  }

  const period = await prisma.payrollPeriod.create({ data: { month, year, standardDays: 26, status: "PUBLISHED", approvedBy: "seed", lockedAt: now } });
  for (const employee of employees.filter((e) => e.employmentStatus !== "RESIGNED")) {
    const actualDays = Math.min(26, Math.max(1, currentDay - 2));
    const workSalary = employee.baseSalary / 26 * actualDays;
    const allowance = 1_000_000; const insurance = employee.baseSalary * 0.105; const tax = Math.max(0, workSalary - 11_000_000) * 0.05;
    await prisma.payrollRecord.create({ data: {
      payrollPeriodId: period.id, employeeId: employee.id, baseSalary: employee.baseSalary, standardDays: 26, actualDays,
      workSalary, allowance, overtime: 300_000, bonus: 500_000, insurance, tax, otherDeduction: 0,
      netSalary: workSalary + allowance + 300_000 + 500_000 - insurance - tax, status: "PUBLISHED",
    }});
  }

  const reqs = [];
  for (let i = 0; i < 5; i++) {
    reqs.push(await prisma.recruitmentRequest.create({ data: {
      code: `TD-${year}-${String(i + 1).padStart(3, "0")}`, departmentId: departments[i].id,
      positionId: positions[(i + 3) % positions.length].id, quantity: 1 + (i % 3), reason: "Bổ sung định biên mô phỏng",
      status: ["PENDING", "APPROVED", "APPROVED", "CLOSED", "REJECTED"][i], requestedBy: "seed",
    }}));
  }
  const candidateStatuses = ["NEW", "SCREENING", "INTERVIEW", "PASSED", "FAILED", "HIRED"];
  for (let i = 0; i < 15; i++) {
    const candidate = await prisma.candidate.create({ data: {
      recruitmentRequestId: reqs[i % reqs.length].id, fullName: `Ứng viên Mô phỏng ${i + 1}`,
      email: `ungvien${i + 1}@example.test`, phone: `091100${String(i + 1).padStart(4, "0")}`,
      source: ["Website", "Giới thiệu", "Mạng xã hội"][i % 3], status: candidateStatuses[i % candidateStatuses.length],
    }});
    if (i % 3 !== 0) await prisma.interview.create({ data: {
      candidateId: candidate.id, scheduledAt: new Date(now.getTime() + (i + 1) * DAY), interviewer: "Hội đồng tuyển dụng mô phỏng",
      score: i % 3 === 1 ? 7.5 : 8.5, notes: "Nhận xét phỏng vấn mô phỏng", status: "COMPLETED",
    }});
  }

  await prisma.transferRequest.createMany({ data: [
    { employeeId: employees[8].id, oldDepartmentId: employees[8].departmentId, oldPositionId: employees[8].positionId, newDepartmentId: departments[0].id, newPositionId: positions[3].id, newSalary: 18_000_000, reason: "Điều chuyển nội bộ", effectiveDate: new Date(now.getTime() + 15 * DAY), status: "PENDING", requestedBy: "seed" },
    { employeeId: employees[9].id, oldDepartmentId: employees[9].departmentId, oldPositionId: employees[9].positionId, newDepartmentId: departments[2].id, newPositionId: positions[2].id, newSalary: 20_000_000, reason: "Bổ nhiệm", effectiveDate: new Date(now.getTime() - 10 * DAY), status: "APPROVED", requestedBy: "seed", approvedBy: "seed" },
  ]});
  await prisma.resignationRequest.create({ data: { employeeId: employees[29].id, lastWorkingDate: new Date(now.getTime() - DAY), reason: "Lý do mô phỏng", status: "COMPLETED", handoverDone: true, assetsReturned: true, accountClosed: true, finalPayment: 12_000_000, completedAt: now } });
  await prisma.resignationRequest.create({ data: { employeeId: employees[27].id, lastWorkingDate: new Date(now.getTime() + 30 * DAY), reason: "Thay đổi định hướng cá nhân (mô phỏng)", status: "PENDING" } });

  await prisma.notification.createMany({ data: [
    { role: "HR", title: "Đơn nghỉ phép chờ duyệt", message: "Có đơn nghỉ phép mới cần xử lý.", type: "ACTION", link: "/leave" },
    { role: "HR", title: "Hợp đồng sắp hết hạn", message: "Có 5 hợp đồng hết hạn trong 30 ngày.", type: "WARNING", link: "/contracts" },
    { role: "EMPLOYEE", title: "Phiếu lương đã phát hành", message: `Phiếu lương tháng ${month}/${year} đã sẵn sàng.`, type: "SUCCESS", link: "/payroll" },
  ]});
  await prisma.auditLog.createMany({ data: [
    { userEmail: "admin@vinamilk.demo", action: "SEED", entity: "SYSTEM", description: "Khởi tạo dữ liệu demo", metadata: JSON.stringify({ employees: 30 }) },
    { userEmail: "hr@vinamilk.demo", action: "CREATE", entity: "PAYROLL_PERIOD", entityId: period.id, description: `Tạo kỳ lương ${month}/${year}` },
    { userEmail: "manager@vinamilk.demo", action: "APPROVE", entity: "LEAVE_REQUEST", description: "Duyệt đơn nghỉ phép demo" },
  ]});

  console.log("Seed hoàn tất: 30 nhân viên, 4 tài khoản demo và dữ liệu nghiệp vụ.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
