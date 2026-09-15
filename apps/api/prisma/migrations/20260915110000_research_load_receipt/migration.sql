-- SB-232: a receipt of what the research load wrote, in the load's own transaction, so a publish can
-- tell that the deployed database holds its file, not only that a new build serves. The reasoning is
-- in src/rules/research, `#SB-232 - A finished research is published to the live database by one
-- script, and taken down by the same script.md`.
--
-- One explicit transaction with a bounded lock wait, as SB-202's migration explains.

BEGIN;

SET LOCAL lock_timeout = '30s';

CREATE TABLE "ResearchLoad" (
    "research" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchLoad_pkey" PRIMARY KEY ("research")
);

COMMIT;
