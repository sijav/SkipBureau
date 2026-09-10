-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "guideId" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionText" (
    "questionId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "QuestionText_pkey" PRIMARY KEY ("questionId","locale")
);

-- CreateTable
CREATE TABLE "CountryText" (
    "countryCode" VARCHAR(2) NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CountryText_pkey" PRIMARY KEY ("countryCode","locale")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_countryCode_slug_key" ON "Question"("countryCode", "slug");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionText" ADD CONSTRAINT "QuestionText_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryText" ADD CONSTRAINT "CountryText_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

