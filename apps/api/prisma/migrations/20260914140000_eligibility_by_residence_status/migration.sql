-- SB-189: what a reader holds in a country, a third connection a rule can
-- depend on.
--
-- Alone in this file, as SB-168's region values were. PostgreSQL refuses to use
-- an enum value inside the transaction that added it, and the next migration's
-- triggers compare against this one.

-- AlterEnum
ALTER TYPE "EligibilityDimension" ADD VALUE 'residenceStatus';
