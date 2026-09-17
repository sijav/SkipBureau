-- SB-305: a guide and its area say which research wrote them, so a row the research renames away
-- can be found and removed instead of being reported as sample content. Until now `sample` was
-- derived by absence, `!RESEARCHED_GUIDE_KEYS.has(...)`, so the moment a slug left the research the
-- row it left behind started calling itself design filler. The reasoning is in
-- src/guide, `#SB-305 - A row the research renamed is not called sample content.md`.
--
-- Nullable and no backfill, deliberately. Null means "no research wrote this", which is true of every
-- sample and editor written row, so existing rows are correct the moment the column exists. The first
-- load after this stamps every row the research still names, because the loader spreads the same row
-- object into the update and the create of its upserts.
--
-- No data step: the deployed database was queried first and holds no row the research no longer
-- names, in either country, for guides or areas.
--
-- One explicit transaction with a bounded lock wait, as SB-202's migration explains.

BEGIN;

SET LOCAL lock_timeout = '30s';

ALTER TABLE "Guide" ADD COLUMN "research" TEXT;

ALTER TABLE "Category" ADD COLUMN "research" TEXT;

COMMIT;
