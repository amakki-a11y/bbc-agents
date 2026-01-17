-- DropIndex
DROP INDEX "ActionItem_assignee_id_idx";

-- DropIndex
DROP INDEX "ActionItem_task_id_idx";

-- DropIndex
DROP INDEX "Activity_task_id_timestamp_idx";

-- DropIndex
DROP INDEX "Activity_user_id_idx";

-- DropIndex
DROP INDEX "Activity_task_id_idx";

-- DropIndex
DROP INDEX "Attachment_task_id_idx";

-- DropIndex
DROP INDEX "CustomField_task_id_idx";

-- DropIndex
DROP INDEX "Event_user_id_start_time_idx";

-- DropIndex
DROP INDEX "Event_user_id_idx";

-- DropIndex
DROP INDEX "Project_user_id_created_at_idx";

-- DropIndex
DROP INDEX "Project_user_id_idx";

-- DropIndex
DROP INDEX "Subtask_task_id_idx";

-- DropIndex
DROP INDEX "Task_project_id_status_idx";

-- DropIndex
DROP INDEX "Task_user_id_due_date_idx";

-- DropIndex
DROP INDEX "Task_user_id_status_idx";

-- DropIndex
DROP INDEX "Task_user_id_idx";

-- DropIndex
DROP INDEX "TimeEntry_user_id_idx";

-- DropIndex
DROP INDEX "TimeEntry_task_id_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "recurrenceEndDate" DATETIME;
ALTER TABLE "Task" ADD COLUMN "recurrenceInterval" INTEGER;
ALTER TABLE "Task" ADD COLUMN "recurrenceType" TEXT;

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "tags" TEXT,
    "time_estimate" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "TaskTemplate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TaskDependencies" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TaskDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TaskDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_TaskDependencies_AB_unique" ON "_TaskDependencies"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskDependencies_B_index" ON "_TaskDependencies"("B");
