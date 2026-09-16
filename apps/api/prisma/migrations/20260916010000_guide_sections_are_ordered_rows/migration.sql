-- SB-307: a guide's sections are ordered rows, not one of each kind. A guide could hold seven sections at most,
-- because a section was identified by its kind, and Germany's business registration research has ten bold leads and
-- its health insurance nine. The reasoning is in prisma/`#SB-307 - A guide holds as many sections as its document
-- has, ordered, not one of each kind.md`.
--
-- One explicit transaction with a bounded lock wait, as SB-202's migration explains. Nothing is backfilled: every
-- writer already sets a section's position from its place in the file it came from, so the new index holds for every
-- row standing. If a database somewhere disagrees, the index creation says so here rather than later.

BEGIN;

SET LOCAL lock_timeout = '30s';

DROP INDEX "GuideSection_guideId_kind_key";

CREATE UNIQUE INDEX "GuideSection_guideId_position_key" ON "GuideSection"("guideId", "position");

COMMIT;
