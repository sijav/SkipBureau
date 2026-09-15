-- SB-202, on the owner's order of 2026-09-15: the research load makes the
-- database follow the research files, adding, rewriting and removing the rows
-- they own. The reasoning is in src/rules/research, `#SB-202 - The research
-- load makes the live database follow the research files.md`.
--
-- One explicit transaction. Prisma gives Postgres none per migration, so one
-- that failed halfway would leave its first statements standing on a database
-- recover-migrations.ts will not touch. The lock wait is bounded: adding a
-- column waits for an exclusive lock with every later read of the table queued
-- behind it, so a stuck session fails this migration instead of freezing reads.

BEGIN;

SET LOCAL lock_timeout = '30s';

-- Which research file wrote a row and keeps it as that file says. Null for a
-- row research did not write: the seed's, a test's, an editor's.
ALTER TABLE "RuleVersion" ADD COLUMN "research" TEXT;
ALTER TABLE "Region" ADD COLUMN "research" TEXT;
ALTER TABLE "ResidenceStatus" ADD COLUMN "research" TEXT;
ALTER TABLE "NationalityGroup" ADD COLUMN "research" TEXT;

-- Whether this transaction is the research load, which sets the setting as its
-- first statement. Transaction-local, so it ends with the load's transaction.
CREATE OR REPLACE FUNCTION skipbureau_research_load()
RETURNS BOOLEAN AS $$
  SELECT coalesce(current_setting('skipbureau.research_load', true), '') = 'on'
$$ LANGUAGE sql STABLE;

-- SB-081's three history functions, as 20260911200000 wrote them, each letting
-- the research load through first. Without the setting every refusal stands.

CREATE OR REPLACE FUNCTION skipbureau_rule_version_is_history()
RETURNS TRIGGER AS $$
BEGIN
  IF skipbureau_rule_version_is_new(OLD.id) OR skipbureau_research_load() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF OLD."validFrom" > current_date THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    IF NEW."validFrom" >= current_date THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'RuleVersion % has not started, and cannot be moved to start in the past (validFrom %).', OLD.id, NEW."validFrom";
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD."validTo" IS NULL
     AND NEW."validTo" IS NOT NULL
     AND NEW."validTo" >= current_date
     AND (NEW.id, NEW."countryCode", NEW."obligationId", NEW."validFrom", NEW."sourceUrl", NEW."sourceName", NEW."verifiedAt", NEW."createdAt")
         IS NOT DISTINCT FROM
         (OLD.id, OLD."countryCode", OLD."obligationId", OLD."validFrom", OLD."sourceUrl", OLD."sourceName", OLD."verifiedAt", OLD."createdAt")
  THEN
    RETURN NEW;
  END IF;

  IF OLD."validTo" IS NOT NULL THEN
    RAISE EXCEPTION
      'RuleVersion % is closed history (validTo %) and cannot be % . Supersede it with a new version instead.',
      OLD.id, OLD."validTo", TG_OP;
  END IF;
  RAISE EXCEPTION
    'RuleVersion % has been in force since % and is history: it can only be closed, from today on, and superseded by a new version, not %.',
    OLD.id, OLD."validFrom", CASE TG_OP WHEN 'UPDATE' THEN 'changed' ELSE 'deleted' END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION skipbureau_rule_part_may_change(target TEXT, part TEXT, operation TEXT)
RETURNS VOID AS $$
BEGIN
  IF skipbureau_rule_version_is_new(target) OR skipbureau_research_load() THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RuleVersion" WHERE id = target AND "validFrom" > current_date) THEN RETURN; END IF;
  IF operation = 'DELETE' AND NOT EXISTS (SELECT 1 FROM "RuleVersion" WHERE id = target) THEN RETURN; END IF;
  RAISE EXCEPTION
    '% belongs to RuleVersion %, which is history, and cannot be %. Supersede the version instead.',
    part, target, CASE operation WHEN 'INSERT' THEN 'added to it' WHEN 'UPDATE' THEN 'changed' ELSE 'removed' END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION skipbureau_group_membership_is_history()
RETURNS TRIGGER AS $$
BEGIN
  IF skipbureau_research_load() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF OLD."validFrom" > current_date THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    IF NEW."validFrom" >= current_date THEN RETURN NEW; END IF;
    RAISE EXCEPTION
      'The membership of % in % has not started, and cannot be moved to start in the past (validFrom %).',
      OLD.nationality, OLD."groupCode", NEW."validFrom";
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD."validTo" IS NULL
     AND NEW."validTo" IS NOT NULL
     AND NEW."validTo" >= current_date
     AND (NEW.id, NEW."groupCode", NEW.nationality, NEW."validFrom") IS NOT DISTINCT FROM (OLD.id, OLD."groupCode", OLD.nationality, OLD."validFrom")
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'The membership of % in % since % is history and cannot be %: close it from today on, or add a new one.',
    OLD.nationality, OLD."groupCode", OLD."validFrom", CASE TG_OP WHEN 'UPDATE' THEN 'changed' ELSE 'deleted' END;
END;
$$ LANGUAGE plpgsql;

COMMIT;
