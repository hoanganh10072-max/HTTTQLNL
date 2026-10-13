PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PerformanceReview" (
 "id" TEXT NOT NULL PRIMARY KEY, "cycleId" TEXT NOT NULL, "employeeId" TEXT,
 "branchId" TEXT, "responsibleEmployeeId" TEXT,
 "subjectType" TEXT NOT NULL DEFAULT 'EMPLOYEE', "evaluationRole" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
 "status" TEXT NOT NULL DEFAULT 'DRAFT', "selfComment" TEXT, "managerComment" TEXT,
 "developmentPlan" TEXT, "score" REAL, "evaluatedBy" TEXT, "submittedAt" DATETIME,
 "approvedAt" DATETIME, "acknowledgedAt" DATETIME, "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
 FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CHECK (("subjectType" IN ('EMPLOYEE','LEADERSHIP') AND "employeeId" IS NOT NULL AND "branchId" IS NULL AND "responsibleEmployeeId" IS NULL)
 OR ("subjectType" = 'BRANCH' AND "employeeId" IS NULL AND "branchId" IS NOT NULL AND "responsibleEmployeeId" IS NOT NULL))
);
INSERT INTO "new_PerformanceReview" ("id","cycleId","employeeId","status","selfComment","managerComment","developmentPlan","score","evaluatedBy","submittedAt","approvedAt","acknowledgedAt","version","createdAt","updatedAt")
SELECT "id","cycleId","employeeId","status","selfComment","managerComment","developmentPlan","score","evaluatedBy","submittedAt","approvedAt","acknowledgedAt","version","createdAt","updatedAt" FROM "PerformanceReview";
DROP TABLE "PerformanceReview";
ALTER TABLE "new_PerformanceReview" RENAME TO "PerformanceReview";
CREATE UNIQUE INDEX "PerformanceReview_cycleId_employeeId_key" ON "PerformanceReview"("cycleId","employeeId");
CREATE UNIQUE INDEX "PerformanceReview_cycleId_branchId_key" ON "PerformanceReview"("cycleId","branchId");
CREATE INDEX "PerformanceReview_employeeId_status_idx" ON "PerformanceReview"("employeeId","status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
