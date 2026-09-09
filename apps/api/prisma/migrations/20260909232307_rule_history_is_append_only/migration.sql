-- A rule's history is append only, and this is where that is true.
--
-- "A change is a new row, never an edit" was a convention in a comment, and a
-- convention is not a guarantee: Prisma cannot express either of these, so
-- they are written here. Both are triggers rather than constraints because
-- each has to look at rows other than the one being written, which EXCLUDE
-- cannot do once eligibility lives in child rows.

-- 1. A version that has been closed is history. It may not be changed or
--    removed, or the answer to "what did this say in March" changes with it,
--    and every verified date in the product stops meaning anything.

CREATE OR REPLACE FUNCTION skipbureau_rule_version_is_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."validTo" IS NOT NULL THEN
    RAISE EXCEPTION
      'RuleVersion % is closed history (validTo %) and cannot be % . Supersede it with a new version instead.',
      OLD.id, OLD."validTo", TG_OP;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rule_version_history_is_immutable
BEFORE UPDATE OR DELETE ON "RuleVersion"
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_version_is_history();

-- Facts belong to their version. Editing a closed version's facts edits the
-- past just as surely as editing the version row.

CREATE OR REPLACE FUNCTION skipbureau_rule_fact_is_history()
RETURNS TRIGGER AS $$
DECLARE
  closed DATE;
  born TIMESTAMP(3);
  target TEXT;
BEGIN
  target := COALESCE(NEW."ruleVersionId", OLD."ruleVersionId");
  SELECT "validTo", "createdAt" INTO closed, born FROM "RuleVersion" WHERE id = target;

  IF closed IS NOT NULL THEN
    RAISE EXCEPTION
      'RuleFact belongs to RuleVersion %, which is closed history (validTo %, created %). Supersede the version instead.',
      target, closed, born;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UPDATE and DELETE only, deliberately.
--
-- RECORDING history has to stay possible: a version imported already closed
-- writes its facts after the version row, and an INSERT rule blocked that,
-- which made the past unrecordable rather than immutable. The boundary test
-- caught it. Distinguishing "written while creating it" from "added later"
-- needs a transaction check, and `createdAt` cannot serve as one because
-- Prisma generates that default on the client rather than in the database.
--
-- The gap that leaves is in TECH-DEBT.md: a fact can still be ADDED to a
-- version that was already closed. Nothing already written can be changed or
-- removed, and the version row itself is immutable once closed, which is the
-- property the verified dates rest on. Closing the gap belongs to the
-- editorial publish workflow, SB-011, not to a trigger.
CREATE TRIGGER rule_fact_history_is_immutable
BEFORE UPDATE OR DELETE ON "RuleFact"
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_fact_is_history();

-- 2. Two versions of the same obligation, in the same country, for the same
--    people, may not both be in force at once. Half open: validFrom <= at <
--    validTo, so a version ending on the first of the month and another
--    starting that day do not overlap.
--
--    "The same people" is compared as a set of criteria rows, which is why
--    this cannot be an EXCLUDE constraint.

CREATE OR REPLACE FUNCTION skipbureau_rule_versions_do_not_overlap()
RETURNS TRIGGER AS $$
DECLARE
  clash TEXT;
BEGIN
  SELECT other.id INTO clash
  FROM "RuleVersion" other
  WHERE other.id <> NEW.id
    AND other."countryCode" = NEW."countryCode"
    AND other."obligationId" = NEW."obligationId"
    AND daterange(other."validFrom", other."validTo", '[)')
        && daterange(NEW."validFrom", NEW."validTo", '[)')
    AND NOT EXISTS (
      SELECT 1 FROM (
        SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = other.id
        EXCEPT
        SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = NEW.id
      ) AS only_in_other
    )
    AND NOT EXISTS (
      SELECT 1 FROM (
        SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = NEW.id
        EXCEPT
        SELECT dimension, value FROM "EligibilityCriterion" WHERE "ruleVersionId" = other.id
      ) AS only_in_new
    )
  LIMIT 1;

  IF clash IS NOT NULL THEN
    RAISE EXCEPTION
      'RuleVersion % already covers the same obligation, country and people over an overlapping period.',
      clash;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deferred to the end of the transaction: criteria rows are written after the
-- version they belong to, so checking on insert would compare an empty scope.
CREATE CONSTRAINT TRIGGER rule_versions_do_not_overlap
AFTER INSERT OR UPDATE ON "RuleVersion"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION skipbureau_rule_versions_do_not_overlap();
