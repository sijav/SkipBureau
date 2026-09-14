-- SB-168: two ways a reader is connected to a region.
--
-- Alone in this file. PostgreSQL refuses to use an enum value inside the
-- transaction that added it, and the next migration's triggers compare against
-- these, so nothing may depend on how a runner batches one file's statements.

-- AlterEnum
ALTER TYPE "EligibilityDimension" ADD VALUE 'residenceRegion';
ALTER TYPE "EligibilityDimension" ADD VALUE 'workRegion';
