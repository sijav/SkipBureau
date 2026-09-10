-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "startGuideId" TEXT;

-- AlterTable
ALTER TABLE "CategoryText" ADD COLUMN     "askPrompt" TEXT,
ADD COLUMN     "startReason" TEXT;

-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "readingMinutes" INTEGER;

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemText" (
    "itemId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ChecklistItemText_pkey" PRIMARY KEY ("itemId","locale")
);

-- CreateTable
CREATE TABLE "RelatedTask" (
    "categoryId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RelatedTask_pkey" PRIMARY KEY ("categoryId","taskId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItem_categoryId_position_key" ON "ChecklistItem"("categoryId", "position");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_startGuideId_fkey" FOREIGN KEY ("startGuideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemText" ADD CONSTRAINT "ChecklistItemText_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTask" ADD CONSTRAINT "RelatedTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTask" ADD CONSTRAINT "RelatedTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

