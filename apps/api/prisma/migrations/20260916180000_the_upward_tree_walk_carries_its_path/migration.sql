-- SB-361: the upward tree walk carries its path, because a cycle CAN be met. The reasoning is in
-- this folder's plan, `#SB-361 - The upward tree walk can loop inside one multi-row update.md`.

-- SB-200 added the upward walk and justified its UNION ALL like this:
--
--   That terminates because the parent chain cannot contain a cycle: skipbureau_tree_holds refuses
--   a row inside itself at the end of the statement that would create one, so no later statement's
--   BEFORE trigger can meet one.
--
-- That sentence is about LATER statements, and the statement that matters is the one creating the
-- cycle. It was wrong, and this is what is actually true, from PostgreSQL's own documentation:
--
--   "SQL commands executed in a row-level BEFORE trigger will see the effects of data changes for
--   rows previously processed in the same outer command."
--
-- and, on SPI visibility, commands in read-write mode "can see all changes made so far", while
-- "commands of VOLATILE functions are done in read-write mode". A plpgsql trigger function is
-- VOLATILE. So one UPDATE that points two rows of a tree at each other lets the BEFORE trigger for a
-- third row walk round that cycle without end: the steps counter makes every repetition a distinct
-- row, so UNION ALL never suppresses it, and the AFTER trigger that would refuse the cycle never
-- runs, because the statement never finishes. A trigger that does not return takes its connection
-- with it.
--
-- This was not reasoned about. The statement below was run against the schema as SB-200 left it, in
-- a child process, and had to be killed after ninety seconds:
--
--   UPDATE "Region" AS reg SET "parentCode" = v.parent
--   FROM (VALUES ('TR-70.p','TR-70.q'),('TR-70.q','TR-70.p'),('TR-70.r','TR-70')) AS v(code,parent)
--   WHERE reg.code = v.code;
--
-- The walk now carries the path it has taken and refuses to step onto a code already on it. That is
-- what the SQL standard's CYCLE clause rewrites to internally, and it is written out by hand rather
-- than using CYCLE because CYCLE needs PostgreSQL 14: PGlite 0.4.3 embeds 17.5 and supports it, but
-- NOTHING in this repository establishes the version of the managed Postgres the deployed API runs,
-- and a migration that parses here and fails on deploy is the worst outcome available.
--
-- When a cycle IS present as the walk runs, the walk stops at the repetition and raises no upward
-- refusal. The statement is still refused, by skipbureau_tree_holds at statement end, which is the
-- guard that owns cycles: a tree that is momentarily cyclic has no well defined "inside", so
-- declining to answer is correct rather than a hole. The tests in place.e2e.spec.ts hold both ends of
-- that down, including the case where a statement tries to use a temporary cycle to slip a row out
-- from under a named ancestor.

CREATE OR REPLACE FUNCTION skipbureau_tree_row_in_use_keeps_its_place()
RETURNS TRIGGER AS $$
DECLARE
  shape RECORD;
  label TEXT;
  named BOOLEAN;
  holder TEXT;
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

  -- Nothing names this row or anything inside it. It can still be a row a rule reaches from above,
  -- and taking it out from under that row would move every reader in it to another rule's answer.
  IF TG_OP = 'UPDATE' THEN
    IF NEW."parentCode" IS DISTINCT FROM OLD."parentCode" AND OLD."parentCode" IS NOT NULL THEN
      EXECUTE format(
        'WITH RECURSIVE above(code, steps, path) AS (
           SELECT $1::TEXT, 1, ARRAY[$1::TEXT]
           UNION ALL
           SELECT node."parentCode"::TEXT, above.steps + 1, above.path || node."parentCode"::TEXT
           FROM %1$I.%2$I node JOIN above ON node.code = above.code
           WHERE node."parentCode" IS NOT NULL
             AND NOT (node."parentCode"::TEXT = ANY (above.path))
         )
         SELECT above.code
         FROM above
         WHERE EXISTS (
           SELECT 1
           FROM %1$I."EligibilityCriterion" criterion
           WHERE criterion.dimension::TEXT = ANY ($2)
             AND criterion.value = above.code
         )
         ORDER BY above.steps
         LIMIT 1',
        TG_TABLE_SCHEMA, TG_TABLE_NAME
      )
        INTO holder
        USING OLD."parentCode", shape.dimensions;

      IF holder IS NOT NULL THEN
        label := upper(left(shape.noun, 1)) || substr(shape.noun, 2);
        RAISE EXCEPTION
          '% % is inside %, which a rule''s criteria name, so it cannot be moved.',
          label, OLD.code, holder;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
