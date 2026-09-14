-- SB-189: a country's residence statuses, a tree like its places, which a rule
-- reaches through a residenceStatus criterion. The reasoning is in this
-- folder's plan, `#SB-189 - Residence status is a detail a rule can depend
-- on.md`.

-- CreateTable
CREATE TABLE "ResidenceStatus" (
    "code" VARCHAR(60) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "parentCode" VARCHAR(60),
    "name" TEXT NOT NULL,

    CONSTRAINT "ResidenceStatus_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ResidenceStatusText" (
    "statusCode" VARCHAR(60) NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ResidenceStatusText_pkey" PRIMARY KEY ("statusCode","locale")
);

-- CreateIndex
CREATE INDEX "ResidenceStatus_countryCode_idx" ON "ResidenceStatus"("countryCode");

-- CreateIndex
CREATE INDEX "ResidenceStatus_parentCode_idx" ON "ResidenceStatus"("parentCode");

-- AddForeignKey
ALTER TABLE "ResidenceStatus" ADD CONSTRAINT "ResidenceStatus_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidenceStatus" ADD CONSTRAINT "ResidenceStatus_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "ResidenceStatus"("code") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidenceStatusText" ADD CONSTRAINT "ResidenceStatusText_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "ResidenceStatus"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- The two trees a criterion can name, and everything the functions below need
-- to know about each: its lock, the criterion dimensions that name its rows,
-- and the words its refusals use. A closed list, written once: a name that is
-- not in it is an error, never a table a caller chose.

CREATE OR REPLACE FUNCTION skipbureau_tree(
  tree TEXT,
  OUT lock_name TEXT,
  OUT dimensions TEXT[],
  OUT noun TEXT,
  OUT kind TEXT
) AS $$
BEGIN
  CASE tree
    WHEN 'Region' THEN
      lock_name := 'skipbureau_region_tree';
      dimensions := ARRAY['residenceRegion', 'workRegion'];
      noun := 'region';
      kind := 'place';
    WHEN 'ResidenceStatus' THEN
      lock_name := 'skipbureau_status_tree';
      dimensions := ARRAY['residenceStatus'];
      noun := 'residence status';
      kind := 'status';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- The tree a criterion's dimension names, read from that list, or null for a
-- dimension that names no tree.
CREATE OR REPLACE FUNCTION skipbureau_tree_named_by(dimension TEXT)
RETURNS TEXT AS $$
  SELECT tree
  FROM unnest(ARRAY['Region', 'ResidenceStatus']) AS tree
  WHERE dimension = ANY ((skipbureau_tree(tree)).dimensions)
$$ LANGUAGE sql IMMUTABLE;

-- One lock per tree and country, held to the end of the transaction, taken
-- before anything reads what another transaction could be changing. SB-186's
-- lock, now kept apart per tree, so a status criterion waits only for a change
-- to the status tree. Exclusive for a change to a tree, shared for a criterion
-- naming a row, and both countries' in one order when a row changes country.
-- Two transactions that each write a criterion and then change the same tree of
-- one country can still deadlock; PostgreSQL aborts one, which is retried.

CREATE OR REPLACE FUNCTION skipbureau_lock_tree(tree TEXT, countries TEXT[], shared BOOLEAN)
RETURNS VOID AS $$
DECLARE
  tree_key CONSTANT INTEGER := hashtext((skipbureau_tree(tree)).lock_name);
  country TEXT;
BEGIN
  FOR country IN SELECT DISTINCT listed FROM unnest(countries) AS listed WHERE listed IS NOT NULL ORDER BY listed LOOP
    IF shared THEN
      PERFORM pg_advisory_xact_lock_shared(tree_key, hashtext(country));
    ELSE
      PERFORM pg_advisory_xact_lock(tree_key, hashtext(country));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- A row is inside a row of its own country and never inside itself, and a row
-- does not change country while a row inside it stays behind. After the row,
-- so the checks read the tree the whole statement leaves. The table is the one
-- the trigger fired on, schema-qualified and quoted, so nothing depends on
-- search_path.

CREATE OR REPLACE FUNCTION skipbureau_tree_holds()
RETURNS TRIGGER AS $$
DECLARE
  shape RECORD;
  label TEXT;
  parent_country TEXT;
  found BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."parentCode" IS NULL THEN
      RETURN NULL;
    END IF;
    PERFORM skipbureau_lock_tree(TG_TABLE_NAME, ARRAY[NEW."countryCode"::TEXT], false);
  ELSE
    IF NEW.code = OLD.code
       AND NEW."countryCode" = OLD."countryCode"
       AND NEW."parentCode" IS NOT DISTINCT FROM OLD."parentCode" THEN
      RETURN NULL;
    END IF;
    PERFORM skipbureau_lock_tree(TG_TABLE_NAME, ARRAY[OLD."countryCode"::TEXT, NEW."countryCode"::TEXT], false);
  END IF;

  SELECT * INTO shape FROM skipbureau_tree(TG_TABLE_NAME);
  label := upper(left(shape.noun, 1)) || substr(shape.noun, 2);

  IF NEW."parentCode" IS NOT NULL THEN
    EXECUTE format('SELECT node."countryCode"::TEXT FROM %I.%I node WHERE node.code = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
      INTO parent_country
      USING NEW."parentCode";
    IF parent_country IS DISTINCT FROM NEW."countryCode" THEN
      RAISE EXCEPTION
        '% % must be inside a % of its own country, and % is not one.',
        label, NEW.code, shape.noun, NEW."parentCode";
    END IF;

    EXECUTE format(
      'WITH RECURSIVE above(code, "parentCode") AS (
         SELECT node.code::TEXT, node."parentCode"::TEXT FROM %1$I.%2$I node WHERE node.code = $1
         UNION
         SELECT node.code::TEXT, node."parentCode"::TEXT FROM %1$I.%2$I node JOIN above ON node.code = above."parentCode"
       )
       SELECT EXISTS (SELECT 1 FROM above WHERE above.code = $2)',
      TG_TABLE_SCHEMA, TG_TABLE_NAME
    )
      INTO found
      USING NEW."parentCode", NEW.code;
    IF found THEN
      RAISE EXCEPTION
        '% % cannot be inside %, which is inside it.',
        label, NEW.code, NEW."parentCode";
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW."countryCode" <> OLD."countryCode" THEN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I node WHERE node."parentCode" = $1 AND node."countryCode" <> $2)',
        TG_TABLE_SCHEMA, TG_TABLE_NAME
      )
        INTO found
        USING NEW.code, NEW."countryCode";
      IF found THEN
        RAISE EXCEPTION
          '% % cannot be in % while a % inside it is in another country.',
          label, NEW.code, NEW."countryCode", shape.kind;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- A row a criterion names keeps its code, its country and its parent, and so
-- does every row a named one is inside, drafts included: SB-168's and SB-186's
-- freeze for regions, now for either tree. Only the criteria of this tree's own
-- dimensions count, so a region and a status never freeze each other.

CREATE OR REPLACE FUNCTION skipbureau_tree_row_in_use_keeps_its_place()
RETURNS TRIGGER AS $$
DECLARE
  shape RECORD;
  label TEXT;
  named BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM skipbureau_lock_tree(TG_TABLE_NAME, ARRAY[OLD."countryCode"::TEXT], false);
  ELSIF NEW.code <> OLD.code
     OR NEW."countryCode" <> OLD."countryCode"
     OR NEW."parentCode" IS DISTINCT FROM OLD."parentCode" THEN
    PERFORM skipbureau_lock_tree(TG_TABLE_NAME, ARRAY[OLD."countryCode"::TEXT, NEW."countryCode"::TEXT], false);
  ELSE
    RETURN NEW;
  END IF;

  SELECT * INTO shape FROM skipbureau_tree(TG_TABLE_NAME);

  EXECUTE format(
    'WITH RECURSIVE inside(code) AS (
       SELECT $1::TEXT
       UNION
       SELECT node.code::TEXT FROM %1$I.%2$I node JOIN inside ON node."parentCode" = inside.code
     )
     SELECT EXISTS (
       SELECT 1
       FROM %1$I."EligibilityCriterion" criterion
       WHERE criterion.dimension::TEXT = ANY ($2)
         AND criterion.value IN (SELECT inside.code FROM inside)
     )',
    TG_TABLE_SCHEMA, TG_TABLE_NAME
  )
    INTO named
    USING OLD.code, shape.dimensions;

  IF named THEN
    label := upper(left(shape.noun, 1)) || substr(shape.noun, 2);
    RAISE EXCEPTION
      '% % is named by a rule''s criteria, itself or through a % inside it, so it cannot be deleted or recoded, or moved.',
      label, OLD.code, shape.kind;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- A criterion naming a row of a tree names one of its version's own country.
-- It fires on EligibilityCriterion, so its own table says nothing about a tree:
-- the tree comes from the criterion's dimension, through the closed list, and
-- that one tree is used for both the lock and the check. A criterion of any
-- other dimension is left alone.

CREATE OR REPLACE FUNCTION skipbureau_criterion_names_a_tree_row()
RETURNS TRIGGER AS $$
DECLARE
  tree CONSTANT TEXT := skipbureau_tree_named_by(NEW.dimension::TEXT);
  shape RECORD;
  countries TEXT[];
  found BOOLEAN;
BEGIN
  IF tree IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO shape FROM skipbureau_tree(tree);

  EXECUTE format('SELECT ARRAY(SELECT version."countryCode"::TEXT FROM %I."RuleVersion" version WHERE version.id = $1)', TG_TABLE_SCHEMA)
    INTO countries
    USING NEW."ruleVersionId";
  PERFORM skipbureau_lock_tree(tree, countries, true);

  EXECUTE format(
    'SELECT EXISTS (
       SELECT 1
       FROM %1$I."RuleVersion" version
       JOIN %1$I.%2$I node ON node."countryCode" = version."countryCode"
       WHERE version.id = $1
         AND node.code = $2
     )',
    TG_TABLE_SCHEMA, tree
  )
    INTO found
    USING NEW."ruleVersionId", NEW.value;

  IF NOT found THEN
    RAISE EXCEPTION
      'A % criterion must name a % of its version''s own country, and % is not one.',
      NEW.dimension, shape.noun, NEW.value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SB-186's region triggers, moved onto the functions above in the order
-- PostgreSQL allows: each trigger dropped and made again before the function it
-- used is dropped, and nothing dropped with CASCADE.

DROP TRIGGER region_tree_holds ON "Region";
CREATE TRIGGER region_tree_holds
AFTER INSERT OR UPDATE ON "Region"
FOR EACH ROW EXECUTE FUNCTION skipbureau_tree_holds();

DROP TRIGGER region_in_use_keeps_its_code ON "Region";
CREATE TRIGGER region_in_use_keeps_its_code
BEFORE UPDATE OR DELETE ON "Region"
FOR EACH ROW EXECUTE FUNCTION skipbureau_tree_row_in_use_keeps_its_place();

DROP TRIGGER eligibility_criterion_names_a_region ON "EligibilityCriterion";
CREATE TRIGGER eligibility_criterion_names_a_tree_row
BEFORE INSERT OR UPDATE ON "EligibilityCriterion"
FOR EACH ROW EXECUTE FUNCTION skipbureau_criterion_names_a_tree_row();

CREATE TRIGGER residence_status_tree_holds
AFTER INSERT OR UPDATE ON "ResidenceStatus"
FOR EACH ROW EXECUTE FUNCTION skipbureau_tree_holds();

CREATE TRIGGER residence_status_in_use_keeps_its_code
BEFORE UPDATE OR DELETE ON "ResidenceStatus"
FOR EACH ROW EXECUTE FUNCTION skipbureau_tree_row_in_use_keeps_its_place();

DROP FUNCTION skipbureau_region_tree_holds();
DROP FUNCTION skipbureau_region_in_use_keeps_its_code();
DROP FUNCTION skipbureau_criterion_names_a_region();
DROP FUNCTION skipbureau_lock_region_tree(TEXT[], BOOLEAN);
