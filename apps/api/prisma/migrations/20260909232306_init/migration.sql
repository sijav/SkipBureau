-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ObligationKind" AS ENUM ('document', 'registration', 'permit', 'deadline', 'fee', 'tax', 'insurance');

-- CreateEnum
CREATE TYPE "FactOperator" AS ENUM ('equals', 'atMost', 'atLeast', 'within');

-- CreateEnum
CREATE TYPE "EligibilityDimension" AS ENUM ('nationality', 'nationalityGroup', 'situation');

-- CreateTable
CREATE TABLE "Country" (
    "code" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ObligationKind" NOT NULL,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationText" (
    "obligationId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,

    CONSTRAINT "ObligationText_pkey" PRIMARY KEY ("obligationId","locale")
);

-- CreateTable
CREATE TABLE "RuleVersion" (
    "id" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "obligationId" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "verifiedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleFact" (
    "id" TEXT NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "operator" "FactOperator" NOT NULL DEFAULT 'equals',
    "numericValue" DECIMAL(14,2),
    "textValue" TEXT,
    "unit" TEXT,
    "currency" VARCHAR(3),

    CONSTRAINT "RuleFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleText" (
    "ruleVersionId" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "RuleText_pkey" PRIMARY KEY ("ruleVersionId","locale")
);

-- CreateTable
CREATE TABLE "EligibilityCriterion" (
    "id" TEXT NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "dimension" "EligibilityDimension" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "EligibilityCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalityGroup" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "NationalityGroup_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "NationalityGroupMember" (
    "id" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "nationality" VARCHAR(2) NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,

    CONSTRAINT "NationalityGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Obligation_slug_key" ON "Obligation"("slug");

-- CreateIndex
CREATE INDEX "RuleVersion_countryCode_obligationId_validFrom_idx" ON "RuleVersion"("countryCode", "obligationId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "RuleFact_ruleVersionId_key_key" ON "RuleFact"("ruleVersionId", "key");

-- CreateIndex
CREATE INDEX "EligibilityCriterion_dimension_value_idx" ON "EligibilityCriterion"("dimension", "value");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityCriterion_ruleVersionId_dimension_value_key" ON "EligibilityCriterion"("ruleVersionId", "dimension", "value");

-- CreateIndex
CREATE INDEX "NationalityGroupMember_nationality_groupCode_idx" ON "NationalityGroupMember"("nationality", "groupCode");

-- AddForeignKey
ALTER TABLE "ObligationText" ADD CONSTRAINT "ObligationText_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleFact" ADD CONSTRAINT "RuleFact_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "RuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleText" ADD CONSTRAINT "RuleText_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "RuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "RuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalityGroupMember" ADD CONSTRAINT "NationalityGroupMember_groupCode_fkey" FOREIGN KEY ("groupCode") REFERENCES "NationalityGroup"("code") ON DELETE CASCADE ON UPDATE CASCADE;
