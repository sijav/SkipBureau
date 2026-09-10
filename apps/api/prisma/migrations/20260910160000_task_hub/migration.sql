-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('decision', 'ifItApplies', 'ongoing', 'alternativeRoute');

-- AlterTable
ALTER TABLE "TaskText" ADD COLUMN     "areasIntro" TEXT,
ADD COLUMN     "dependsNote" TEXT,
ADD COLUMN     "heading" TEXT,
ADD COLUMN     "intro" TEXT,
ADD COLUMN     "otherRoutesIntro" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "kind" "CategoryKind";

-- AlterTable
ALTER TABLE "GuideSource" ADD COLUMN     "publisher" TEXT;

