/*
  Warnings:

  - Added the required column `updated_at` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar_url" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "task_id" INTEGER NOT NULL,
    CONSTRAINT "Subtask_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "due_date" DATETIME,
    "task_id" INTEGER NOT NULL,
    "assignee_id" INTEGER,
    CONSTRAINT "ActionItem_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "task_id" INTEGER NOT NULL,
    CONSTRAINT "CustomField_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task_id" INTEGER NOT NULL,
    CONSTRAINT "Attachment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER,
    "task_id" INTEGER NOT NULL,
    CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "duration" INTEGER,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    CONSTRAINT "TimeEntry_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT,
    "tags" TEXT,
    "due_date" DATETIME,
    "start_date" DATETIME,
    "time_estimate" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("created_at", "due_date", "id", "status", "title", "user_id") SELECT "created_at", "due_date", "id", "status", "title", "user_id" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_user_id_idx" ON "Task"("user_id");
CREATE INDEX "Task_project_id_idx" ON "Task"("project_id");
CREATE INDEX "Task_user_id_status_idx" ON "Task"("user_id", "status");
CREATE INDEX "Task_user_id_due_date_idx" ON "Task"("user_id", "due_date");
CREATE INDEX "Task_project_id_status_idx" ON "Task"("project_id", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Project_user_id_idx" ON "Project"("user_id");

-- CreateIndex
CREATE INDEX "Project_user_id_created_at_idx" ON "Project"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Subtask_task_id_idx" ON "Subtask"("task_id");

-- CreateIndex
CREATE INDEX "ActionItem_task_id_idx" ON "ActionItem"("task_id");

-- CreateIndex
CREATE INDEX "ActionItem_assignee_id_idx" ON "ActionItem"("assignee_id");

-- CreateIndex
CREATE INDEX "CustomField_task_id_idx" ON "CustomField"("task_id");

-- CreateIndex
CREATE INDEX "Attachment_task_id_idx" ON "Attachment"("task_id");

-- CreateIndex
CREATE INDEX "Activity_task_id_idx" ON "Activity"("task_id");

-- CreateIndex
CREATE INDEX "Activity_user_id_idx" ON "Activity"("user_id");

-- CreateIndex
CREATE INDEX "Activity_task_id_timestamp_idx" ON "Activity"("task_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "TimeEntry_task_id_idx" ON "TimeEntry"("task_id");

-- CreateIndex
CREATE INDEX "TimeEntry_user_id_idx" ON "TimeEntry"("user_id");

-- CreateIndex
CREATE INDEX "Event_user_id_idx" ON "Event"("user_id");

-- CreateIndex
CREATE INDEX "Event_user_id_start_time_idx" ON "Event"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
