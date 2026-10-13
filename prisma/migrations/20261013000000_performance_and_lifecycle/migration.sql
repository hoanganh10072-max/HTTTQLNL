CREATE TABLE "PerformanceCycle" (
 "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "startDate" DATETIME NOT NULL,
 "endDate" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT',
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "PerformanceReview" (
 "id" TEXT NOT NULL PRIMARY KEY, "cycleId" TEXT NOT NULL, "employeeId" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'DRAFT', "selfComment" TEXT, "managerComment" TEXT,
 "developmentPlan" TEXT, "score" REAL, "evaluatedBy" TEXT, "submittedAt" DATETIME,
 "approvedAt" DATETIME, "acknowledgedAt" DATETIME, "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
 FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PerformanceReview_cycleId_employeeId_key" ON "PerformanceReview"("cycleId", "employeeId");
CREATE INDEX "PerformanceReview_employeeId_status_idx" ON "PerformanceReview"("employeeId", "status");
CREATE TABLE "PerformanceGoal" (
 "id" TEXT NOT NULL PRIMARY KEY, "reviewId" TEXT NOT NULL, "title" TEXT NOT NULL,
 "description" TEXT, "unit" TEXT NOT NULL, "target" REAL NOT NULL, "actual" REAL NOT NULL DEFAULT 0,
 "direction" TEXT NOT NULL DEFAULT 'HIGHER', "weight" REAL NOT NULL, "dueDate" DATETIME NOT NULL,
 "evidence" TEXT, "managerScore" REAL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
 FOREIGN KEY ("reviewId") REFERENCES "PerformanceReview"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PerformanceGoal_reviewId_idx" ON "PerformanceGoal"("reviewId");
CREATE TABLE "PersonnelActivity" (
 "id" TEXT NOT NULL PRIMARY KEY, "employeeId" TEXT NOT NULL, "category" TEXT NOT NULL,
 "title" TEXT NOT NULL, "owner" TEXT, "dueDate" DATETIME NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'TODO', "notes" TEXT, "cost" REAL NOT NULL DEFAULT 0,
 "completedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" DATETIME NOT NULL,
 FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PersonnelActivity_employeeId_category_status_idx" ON "PersonnelActivity"("employeeId", "category", "status");
