-- CreateEnum
CREATE TYPE "SectionKind" AS ENUM ('whatYouNeed', 'yourOptions', 'howToDoIt', 'whereToDoIt', 'importantToKnow', 'whatToCheck', 'commonProblems');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskText" (
    "taskId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,

    CONSTRAINT "TaskText_pkey" PRIMARY KEY ("taskId","locale")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "taskId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryText" (
    "categoryId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryText_pkey" PRIMARY KEY ("categoryId","locale")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "verifiedAt" DATE NOT NULL,
    "showDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "showSuggestUpdate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideText" (
    "guideId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quickAnswer" TEXT,
    "cost" TEXT,
    "time" TEXT,

    CONSTRAINT "GuideText_pkey" PRIMARY KEY ("guideId","locale")
);

-- CreateTable
CREATE TABLE "GuideSection" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "kind" "SectionKind" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GuideSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideSectionText" (
    "sectionId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT,
    "body" TEXT,

    CONSTRAINT "GuideSectionText_pkey" PRIMARY KEY ("sectionId","locale")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStepText" (
    "stepId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,

    CONSTRAINT "GuideStepText_pkey" PRIMARY KEY ("stepId","locale")
);

-- CreateTable
CREATE TABLE "GuideOption" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GuideOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideOptionText" (
    "optionId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,

    CONSTRAINT "GuideOptionText_pkey" PRIMARY KEY ("optionId","locale")
);

-- CreateTable
CREATE TABLE "GuideSource" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verifiedAt" DATE NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GuideSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideObligation" (
    "guideId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GuideObligation_pkey" PRIMARY KEY ("guideId","obligationId")
);

-- CreateTable
CREATE TABLE "RelatedGuide" (
    "fromGuideId" TEXT NOT NULL,
    "toGuideId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RelatedGuide_pkey" PRIMARY KEY ("fromGuideId","toGuideId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_slug_key" ON "Task"("slug");

-- CreateIndex
CREATE INDEX "Category_countryCode_taskId_idx" ON "Category"("countryCode", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_countryCode_slug_key" ON "Category"("countryCode", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_countryCode_slug_key" ON "Guide"("countryCode", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuideSection_guideId_kind_key" ON "GuideSection"("guideId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "GuideStep_sectionId_position_key" ON "GuideStep"("sectionId", "position");

-- AddForeignKey
ALTER TABLE "TaskText" ADD CONSTRAINT "TaskText_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryText" ADD CONSTRAINT "CategoryText_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideText" ADD CONSTRAINT "GuideText_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideSection" ADD CONSTRAINT "GuideSection_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideSectionText" ADD CONSTRAINT "GuideSectionText_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GuideSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GuideSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStepText" ADD CONSTRAINT "GuideStepText_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "GuideStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideOption" ADD CONSTRAINT "GuideOption_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideOptionText" ADD CONSTRAINT "GuideOptionText_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "GuideOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideSource" ADD CONSTRAINT "GuideSource_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideObligation" ADD CONSTRAINT "GuideObligation_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideObligation" ADD CONSTRAINT "GuideObligation_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedGuide" ADD CONSTRAINT "RelatedGuide_fromGuideId_fkey" FOREIGN KEY ("fromGuideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedGuide" ADD CONSTRAINT "RelatedGuide_toGuideId_fkey" FOREIGN KEY ("toGuideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
