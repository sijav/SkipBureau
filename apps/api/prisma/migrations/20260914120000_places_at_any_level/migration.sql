-- SB-186: a place at any level below the country, a province or state, a city
-- or an area, each naming the place it is inside. The reasoning is in this
-- folder's plan, `#SB-186 - A rule belongs to a place at any level and inherits
-- what it does not change.md`.

-- A key below the first level, `TR-34.kadikoy`, is longer than an ISO 3166-2
-- code. Widening a varchar is binary compatible, so neither table is
-- rewritten, but each ALTER still holds an exclusive lock on its table while it
-- runs. Written by hand as direct type changes, not whatever sequence Prisma
-- would generate for them.

-- AlterTable
ALTER TABLE "Region" ALTER COLUMN "code" SET DATA TYPE VARCHAR(40),
ADD COLUMN "parentCode" VARCHAR(40),
ADD COLUMN "officialCode" TEXT;

-- AlterTable
ALTER TABLE "RegionText" ALTER COLUMN "regionCode" SET DATA TYPE VARCHAR(40);

-- CreateIndex
CREATE INDEX "Region_parentCode_idx" ON "Region"("parentCode");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Region"("code") ON DELETE NO ACTION ON UPDATE CASCADE;

-- One lock per country, held to the end of the transaction, taken before
-- anything reads what another transaction could be changing: the tree, or the
-- criteria that name its places. A change to the tree takes it exclusively. A
-- criterion naming a region takes it shared, so rules written at the same time
-- wait only for a change to the tree, never for each other. When a region
-- changes country both countries' locks are taken, in one order, so two such
-- changes wait for each other rather than deadlock. That holds at READ
-- COMMITTED, the database's default, where every query after the lock takes a
-- new snapshot and reads what the transaction it waited for committed.
--
-- Two transactions that each write a criterion naming a place and then change
-- the tree of the same country can still deadlock, each holding the lock shared
-- and wanting it exclusively. PostgreSQL detects that and aborts one, which is
-- retried: a refused write, never a wrong tree. Every trigger that reads regions
-- or the criteria naming them takes this lock through this function.

CREATE OR REPLACE FUNCTION skipbureau_lock_region_tree(countries TEXT[], shared BOOLEAN)
RETURNS VOID AS $$
DECLARE
  tree CONSTANT INTEGER := hashtext('skipbureau_region_tree');
  country TEXT;
BEGIN
  FOR country IN SELECT DISTINCT listed FROM unnest(countries) AS listed WHERE listed IS NOT NULL ORDER BY listed LOOP
    IF shared THEN
      PERFORM pg_advisory_xact_lock_shared(tree, hashtext(country));
    ELSE
      PERFORM pg_advisory_xact_lock(tree, hashtext(country));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- A place is inside a region of its own country and never inside itself, and a
-- region does not change country while a place inside it stays behind.
--
-- After the row, so the checks read the tree the whole statement leaves: one
-- that writes a city before its province, or a country's code change that
-- carries every region with it, is judged when it is done. Without the lock,
-- two transactions that each moved one place under the other would each read
-- the tree without the other's change and both commit a cycle.

CREATE OR REPLACE FUNCTION skipbureau_region_tree_holds()
RETURNS TRIGGER AS $$
DECLARE
  parent_country TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."parentCode" IS NULL THEN
      RETURN NULL;
    END IF;
    PERFORM skipbureau_lock_region_tree(ARRAY[NEW."countryCode"::TEXT], false);
  ELSE
    IF NEW.code = OLD.code
       AND NEW."countryCode" = OLD."countryCode"
       AND NEW."parentCode" IS NOT DISTINCT FROM OLD."parentCode" THEN
      RETURN NULL;
    END IF;
    PERFORM skipbureau_lock_region_tree(ARRAY[OLD."countryCode"::TEXT, NEW."countryCode"::TEXT], false);
  END IF;

  IF NEW."parentCode" IS NOT NULL THEN
    SELECT region."countryCode" INTO parent_country FROM "Region" region WHERE region.code = NEW."parentCode";
    IF parent_country IS DISTINCT FROM NEW."countryCode" THEN
      RAISE EXCEPTION
        'Region % must be inside a region of its own country, and % is not one.',
        NEW.code, NEW."parentCode";
    END IF;

    IF EXISTS (
      WITH RECURSIVE above(code, "parentCode") AS (
        SELECT region.code::TEXT, region."parentCode"::TEXT FROM "Region" region WHERE region.code = NEW."parentCode"
        UNION
        SELECT region.code::TEXT, region."parentCode"::TEXT FROM "Region" region JOIN above ON region.code = above."parentCode"
      )
      SELECT 1 FROM above WHERE above.code = NEW.code
    ) THEN
      RAISE EXCEPTION
        'Region % cannot be inside %, which is inside it.',
        NEW.code, NEW."parentCode";
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW."countryCode" <> OLD."countryCode" AND EXISTS (
      SELECT 1 FROM "Region" region WHERE region."parentCode" = NEW.code AND region."countryCode" <> NEW."countryCode"
    ) THEN
      RAISE EXCEPTION
        'Region % cannot be in % while a place inside it is in another country.',
        NEW.code, NEW."countryCode";
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER region_tree_holds
AFTER INSERT OR UPDATE ON "Region"
FOR EACH ROW EXECUTE FUNCTION skipbureau_region_tree_holds();

-- A region a criterion names keeps its code and its country, SB-168, and now
-- its parent, and so does every region a named one is inside: moving Kadıköy
-- under another province would change which rules a version for Moda inherits
-- from without touching that version. Drafts included, SB-168's policy: a
-- mistake in the tree under a draft is corrected by removing the draft first.
-- Names and official codes stay editable.
--
-- The lock comes first. Without it, a transaction moving Kadıköy could read no
-- criterion under it while another named Moda and committed, and the move
-- would then land under a rule already recorded.

CREATE OR REPLACE FUNCTION skipbureau_region_in_use_keeps_its_code()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM skipbureau_lock_region_tree(ARRAY[OLD."countryCode"::TEXT], false);
  ELSIF NEW.code <> OLD.code
     OR NEW."countryCode" <> OLD."countryCode"
     OR NEW."parentCode" IS DISTINCT FROM OLD."parentCode" THEN
    PERFORM skipbureau_lock_region_tree(ARRAY[OLD."countryCode"::TEXT, NEW."countryCode"::TEXT], false);
  ELSE
    RETURN NEW;
  END IF;

  IF EXISTS (
    WITH RECURSIVE inside(code) AS (
      SELECT OLD.code::TEXT
      UNION
      SELECT region.code::TEXT FROM "Region" region JOIN inside ON region."parentCode" = inside.code
    )
    SELECT 1
    FROM "EligibilityCriterion" criterion
    WHERE criterion.dimension IN ('residenceRegion', 'workRegion')
      AND criterion.value IN (SELECT inside.code FROM inside)
  ) THEN
    RAISE EXCEPTION
      'Region % is named by a rule''s criteria, itself or through a place inside it, so it cannot be deleted or recoded, or moved.',
      OLD.code;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SB-168's check that a criterion names a region of its version's own country,
-- now after the country's lock, shared. Without it a region deleted or moved
-- while a criterion naming it is written could leave the criterion naming a
-- region that is gone, or one that moved under it.

CREATE OR REPLACE FUNCTION skipbureau_criterion_names_a_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dimension NOT IN ('residenceRegion', 'workRegion') THEN
    RETURN NEW;
  END IF;

  PERFORM skipbureau_lock_region_tree(
    ARRAY(SELECT version."countryCode"::TEXT FROM "RuleVersion" version WHERE version.id = NEW."ruleVersionId"),
    true
  );

  IF NOT EXISTS (
    SELECT 1
    FROM "RuleVersion" version
    JOIN "Region" region ON region."countryCode" = version."countryCode"
    WHERE version.id = NEW."ruleVersionId"
      AND region.code = NEW.value
  ) THEN
    RAISE EXCEPTION
      'A % criterion must name a region of its version''s own country, and % is not one.',
      NEW.dimension, NEW.value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
