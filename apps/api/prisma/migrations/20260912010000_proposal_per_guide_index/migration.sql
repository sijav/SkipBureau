-- SB-050: the limit on how much one guide may receive in an hour is counted
-- on every submission, and Postgres does not index a foreign key on its own.
-- Without this, the query that exists to survive a flood is a sequential scan
-- of the table the flood is filling.
CREATE INDEX "Proposal_guideId_createdAt_idx" ON "Proposal"("guideId", "createdAt");
