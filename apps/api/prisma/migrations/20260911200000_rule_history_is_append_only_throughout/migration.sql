-- SB-081: a rule's history is append only throughout, not only at the row of
-- a version that has closed. The reasoning is in this folder's plan,
-- `#SB-081 - Append-only stops at the version row, and its children are
-- unprotected.md`; in short, a version is history once it has STARTED, since
-- a reader of a version in force since 2020 was told what it says.

-- Which versions this transaction has inserted. Those are being recorded,
-- and their facts, texts and criteria are written with them: a version that
-- closed years ago can only be recorded that way. A transaction-local
-- setting rather than `xmin`, which also changes when a row is updated in
-- the same transaction and would then let any later update through.

CREATE OR REPLACE FUNCTION skipbureau_note_new_rule_version()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config(
    'skipbureau.new_versions',
    coalesce(current_setting('skipbureau.new_versions', true), '') || '|' || NEW.id || '|',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rule_version_noted_as_new
AFTER INSERT ON "RuleVersion"
FOR EACH ROW EXECUTE FUNCTION skipbureau_note_new_rule_version();

CREATE OR REPLACE FUNCTION skipbureau_rule_version_is_new(target TEXT)
RETURNS BOOLEAN AS $$
  SELECT position('|' || target || '|' IN coalesce(current_setting('skipbureau.new_versions', true), '')) > 0
$$ LANGUAGE sql VOLATILE;

-- 1. The version row. Recorded in this transaction, it is the recorder's to
--    shape. Not yet started, it is a draft, as long as it is not moved to
--    start in the past. Started, it can only be closed, from today on, with
--    every other column as it was: closing it retroactively would say it
--    stopped being in force at a time a reader was told it was. It cannot be
--    deleted.

CREATE OR REPLACE FUNCTION skipbureau_rule_version_is_history()
RETURNS TRIGGER AS $$
BEGIN
  IF skipbureau_rule_version_is_new(OLD.id) THEN
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

-- The trigger that runs it, rule_version_history_is_immutable, stays as the
-- first migration made it: BEFORE UPDATE OR DELETE.

-- 2. A version's parts: its facts, texts and criteria. Written only while the
--    version is a draft or is being recorded, and never moved to or from a
--    version that is history: an update reads both the old version and the
--    new. A delete whose version is already gone is the cascade from that
--    version's own delete, which its trigger has allowed.

CREATE OR REPLACE FUNCTION skipbureau_rule_part_may_change(target TEXT, part TEXT, operation TEXT)
RETURNS VOID AS $$
BEGIN
  IF skipbureau_rule_version_is_new(target) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RuleVersion" WHERE id = target AND "validFrom" > current_date) THEN RETURN; END IF;
  IF operation = 'DELETE' AND NOT EXISTS (SELECT 1 FROM "RuleVersion" WHERE id = target) THEN RETURN; END IF;
  RAISE EXCEPTION
    '% belongs to RuleVersion %, which is history, and cannot be %. Supersede the version instead.',
    part, target, CASE operation WHEN 'INSERT' THEN 'added to it' WHEN 'UPDATE' THEN 'changed' ELSE 'removed' END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION skipbureau_rule_part_is_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM skipbureau_rule_part_may_change(OLD."ruleVersionId", TG_TABLE_NAME, TG_OP);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM skipbureau_rule_part_may_change(NEW."ruleVersionId", TG_TABLE_NAME, TG_OP);
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Facts had their own trigger, for UPDATE and DELETE on a closed version
-- only, reading only the new row's version (SB-102). Replaced.
DROP TRIGGER rule_fact_history_is_immutable ON "RuleFact";
DROP FUNCTION skipbureau_rule_fact_is_history();

CREATE TRIGGER rule_fact_is_history
BEFORE INSERT OR UPDATE OR DELETE ON "RuleFact"
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_part_is_history();

CREATE TRIGGER rule_text_is_history
BEFORE INSERT OR UPDATE OR DELETE ON "RuleText"
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_part_is_history();

CREATE TRIGGER eligibility_criterion_is_history
BEFORE INSERT OR UPDATE OR DELETE ON "EligibilityCriterion"
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_part_is_history();

-- 3. No two versions for the same obligation, country and people in force at
--    once, now checked for a version id, so that criteria written after the
--    version, or changed on a draft, are checked too.

CREATE OR REPLACE FUNCTION skipbureau_rule_version_clash(target TEXT)
RETURNS TEXT AS $$
  SELECT other.id
  FROM "RuleVersion" this
  JOIN "RuleVersion" other
    ON other.id <> this.id
   AND other."countryCode" = this."countryCode"
   AND other."obligationId" = this."obligationId"
   AND daterange(other."validFrom", other."validTo", '[)') && daterange(this."validFrom", this."validTo", '[)')
  WHERE this.id = target
    AND NOT EXISTS (
      SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = other.id
      EXCEPT
      SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = this.id
    )
    AND NOT EXISTS (
      SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = this.id
      EXCEPT
      SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = other.id
    )
  LIMIT 1
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION skipbureau_rule_versions_do_not_overlap()
RETURNS TRIGGER AS $$
DECLARE
  clash TEXT;
BEGIN
  clash := skipbureau_rule_version_clash(NEW.id);
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION
      'RuleVersion % already covers the same obligation, country and people over an overlapping period.',
      clash;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION skipbureau_criteria_keep_versions_apart()
RETURNS TRIGGER AS $$
DECLARE
  clash TEXT;
  target TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    target := OLD."ruleVersionId";
    clash := skipbureau_rule_version_clash(target);
  END IF;
  IF clash IS NULL AND TG_OP IN ('INSERT', 'UPDATE') THEN
    target := NEW."ruleVersionId";
    clash := skipbureau_rule_version_clash(target);
  END IF;
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION
      'With these criteria RuleVersion % would cover the same obligation, country and people as RuleVersion % over an overlapping period.',
      target, clash;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Deferred like the version's own check: a version's criteria are written
-- after it, and are only complete at the end of the transaction.
CREATE CONSTRAINT TRIGGER eligibility_keeps_rule_versions_apart
AFTER INSERT OR UPDATE OR DELETE ON "EligibilityCriterion"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION skipbureau_criteria_keep_versions_apart();

-- 4. Group membership is dated because a historical question must be answered
--    with the groups as they were. A membership that has taken effect cannot
--    be changed or deleted, except to close an open one from today on; a
--    future one can change, as long as it stays in the future. Deleting a
--    group cascades here, and so is refused for a group with a past.

CREATE OR REPLACE FUNCTION skipbureau_group_membership_is_history()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER nationality_group_membership_is_history
BEFORE UPDATE OR DELETE ON "NationalityGroupMember"
FOR EACH ROW EXECUTE FUNCTION skipbureau_group_membership_is_history();

-- 5. TRUNCATE removes rows without running row triggers, and this schema has
--    no privileges set up to keep it out of reach. A statement trigger fires
--    for every table truncated, those reached by CASCADE included.

CREATE OR REPLACE FUNCTION skipbureau_history_is_not_truncated()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% holds rule history, and TRUNCATE would remove it past the triggers that guard it.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rule_version_is_not_truncated BEFORE TRUNCATE ON "RuleVersion" FOR EACH STATEMENT EXECUTE FUNCTION skipbureau_history_is_not_truncated();
CREATE TRIGGER rule_fact_is_not_truncated BEFORE TRUNCATE ON "RuleFact" FOR EACH STATEMENT EXECUTE FUNCTION skipbureau_history_is_not_truncated();
CREATE TRIGGER rule_text_is_not_truncated BEFORE TRUNCATE ON "RuleText" FOR EACH STATEMENT EXECUTE FUNCTION skipbureau_history_is_not_truncated();
CREATE TRIGGER eligibility_criterion_is_not_truncated BEFORE TRUNCATE ON "EligibilityCriterion" FOR EACH STATEMENT EXECUTE FUNCTION skipbureau_history_is_not_truncated();
CREATE TRIGGER nationality_group_membership_is_not_truncated BEFORE TRUNCATE ON "NationalityGroupMember" FOR EACH STATEMENT EXECUTE FUNCTION skipbureau_history_is_not_truncated();
