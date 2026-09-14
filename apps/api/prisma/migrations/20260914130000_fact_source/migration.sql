-- SB-188: a fact names the page it was read on, where that is not its
-- version's own. The reasoning is in this folder's plan, `#SB-188 - A rule fact
-- names the page that states it.md`.

-- AlterTable
ALTER TABLE "RuleFact" ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verifiedAt" DATE;

-- All three, or none. A URL without the day it was read is not a source this
-- product can show, and a name without a URL is not one a reader can open.
-- Prisma does not model a CHECK constraint, so `migrate diff` cannot see this
-- one; test/fact-source.e2e.spec.ts is what proves it holds.
ALTER TABLE "RuleFact" ADD CONSTRAINT "RuleFact_source_is_whole" CHECK (
  ("sourceUrl" IS NULL AND "sourceName" IS NULL AND "verifiedAt" IS NULL)
  OR ("sourceUrl" IS NOT NULL AND "sourceName" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);
