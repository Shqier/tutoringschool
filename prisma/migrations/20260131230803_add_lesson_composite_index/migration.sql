-- CreateIndex
CREATE INDEX "lessons_orgId_teacherId_idx" ON "lessons"("orgId", "teacherId");

-- CreateIndex
CREATE INDEX "teachers_orgId_id_idx" ON "teachers"("orgId", "id");
