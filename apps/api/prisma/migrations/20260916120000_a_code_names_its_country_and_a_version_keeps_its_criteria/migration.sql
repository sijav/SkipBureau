-- SB-180: a code names the country its row is in, and a version does not leave its tree criteria
-- in another country. The reasoning is in this folder's plan, `#SB-180 - A region criterion stays
-- on its own country's version, and a region code agrees with its country.md`.

-- One. A row's code begins with the country it is in, in that tree's own shape: a region takes the
-- ISO 3166-2 form, upper case with a hyphen, `DE-SN` and `DE-BW.freiburg`; a status takes the
-- product's own, lower case with a dot, `tr.residence-permit.student`. Two constraints rather than
-- one rule in skipbureau_tree's closed list, because the two shapes genuinely differ and one
-- parameterised rule would say the same two things less directly.
--
-- A CHECK rather than a branch in skipbureau_tree_holds: it is validated against every existing row
-- as it is added, so this migration is itself the proof that the data conforms and fails loudly on
-- deploy if it does not, and it holds for every write rather than only those reaching a row trigger.
--
-- `left(code, length("countryCode") + 1)` rather than `LIKE "countryCode" || '-%'`: a LIKE pattern
-- built from a column would read an underscore in that column as a wildcard.

ALTER TABLE "Region" ADD CONSTRAINT "Region_code_names_its_country"
  CHECK (left(code, length("countryCode") + 1) = upper("countryCode") || '-');

ALTER TABLE "ResidenceStatus" ADD CONSTRAINT "ResidenceStatus_code_names_its_country"
  CHECK (left(code, length("countryCode") + 1) = "countryCode" || '.');

-- Two. A version's country and its tree criteria stay together.
--
-- skipbureau_criterion_names_a_tree_row fires on "EligibilityCriterion" only, so it judges a
-- criterion against its version's country at the moment the criterion is written and never again.
-- A draft may still change countryCode afterwards, because skipbureau_rule_version_is_history
-- returns early for a version whose validFrom is in the future. The criterion is then left naming a
-- region of the country the version has walked out of.
--
-- Both trees are locked, for the old and the new country, EXCLUSIVELY, before any criterion is
-- read. Shared would not do: a shared advisory lock conflicts only with an exclusive one, so a
-- transaction writing a criterion, which takes it shared, and one moving the version's country
-- would each validate without seeing the other's uncommitted row, and both would commit the
-- cross-country criterion this exists to prevent. Unconditionally and in one tree order, so the
-- mode can be read from pg_locks on a move that succeeds, and two trees are never taken in opposite
-- orders by two transactions. skipbureau_lock_tree already sorts the countries within a tree.
--
-- It does NOT honour skipbureau_research_load() or skipbureau_rule_version_is_new, which every
-- neighbouring guard checks first. Those exist so the loader and a same-transaction build can write
-- history the append-only freeze would refuse. This is not a history rule, and the loader does not
-- do this: load.ts creates versions and deletes the ones it sets aside, and its only in-place
-- update on a version writes `research`.

CREATE OR REPLACE FUNCTION skipbureau_version_keeps_its_tree_criteria()
RETURNS TRIGGER AS $$
DECLARE
  tree TEXT;
  shape RECORD;
  stray TEXT;
BEGIN
  FOREACH tree IN ARRAY ARRAY['Region', 'ResidenceStatus'] LOOP
    PERFORM skipbureau_lock_tree(tree, ARRAY[OLD."countryCode"::TEXT, NEW."countryCode"::TEXT], false);
  END LOOP;

  FOREACH tree IN ARRAY ARRAY['Region', 'ResidenceStatus'] LOOP
    SELECT * INTO shape FROM skipbureau_tree(tree);

    EXECUTE format(
      'SELECT criterion.value
         FROM %1$I."EligibilityCriterion" criterion
        WHERE criterion."ruleVersionId" = $1
          AND criterion.dimension::TEXT = ANY ($2)
          AND NOT EXISTS (
            SELECT 1 FROM %1$I.%2$I node
             WHERE node.code = criterion.value AND node."countryCode" = $3
          )
        LIMIT 1',
      TG_TABLE_SCHEMA, tree
    )
      INTO stray
      USING NEW.id, shape.dimensions, NEW."countryCode";

    IF stray IS NOT NULL THEN
      RAISE EXCEPTION
        'RuleVersion % cannot move to %, because a % criterion names %, which is not a % of that country.',
        NEW.id, NEW."countryCode", shape.noun, stray, shape.noun;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rule_version_keeps_its_tree_criteria
AFTER UPDATE ON "RuleVersion"
FOR EACH ROW
WHEN (NEW."countryCode" IS DISTINCT FROM OLD."countryCode")
EXECUTE FUNCTION skipbureau_version_keeps_its_tree_criteria();
