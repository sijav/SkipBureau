-- AlterEnum
ALTER TYPE "SectionKind" ADD VALUE 'beforeYouStart';

-- AlterTable
ALTER TABLE "GuideText" ADD COLUMN     "costNote" TEXT,
ADD COLUMN     "deadlines" TEXT;

-- AlterTable
ALTER TABLE "GuideSection" ADD COLUMN     "linkGuideId" TEXT;

-- AlterTable
ALTER TABLE "GuideSectionText" ADD COLUMN     "callout" TEXT,
ADD COLUMN     "calloutBody" TEXT,
ADD COLUMN     "calloutSource" TEXT,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "GuideStepText" ADD COLUMN     "label" TEXT,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "GuideOptionText" ADD COLUMN     "bestFor" TEXT,
ADD COLUMN     "caveat" TEXT;

-- AlterTable
ALTER TABLE "GuideSource" ADD COLUMN     "note" TEXT,
ADD COLUMN     "official" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "GuideSection" ADD CONSTRAINT "GuideSection_linkGuideId_fkey" FOREIGN KEY ("linkGuideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

