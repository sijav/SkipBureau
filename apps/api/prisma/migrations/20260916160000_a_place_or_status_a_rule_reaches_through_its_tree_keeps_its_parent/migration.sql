-- SB-200: a place or status a rule reaches through its tree keeps its parent. The reasoning is in
-- this folder's plan, `#SB-200 - A place or status a rule reaches through its tree keeps its
-- parent.md`.

-- skipbureau_tree_row_in_use_keeps_its_place has walked in one direction since it was written. Its
-- recursive CTE is seeded with OLD.code and joins node."parentCode" = inside.code, so it refuses a
-- change when a criterion names the row or a row INSIDE it, and sees nothing above the row at all.
--
-- That catches the case it was written for and misses the mirror of it. With a version naming
-- TR-34, moving TR-34.kadikoy under TR-16 walks down from Kadikoy to Moda and Fenerbahce and never
-- reaches TR-34, so nothing refuses. Every reader in Kadikoy then leaves Istanbul's rule for
-- Bursa's without any version changing, which is precisely what the freeze exists to prevent. The
-- same hole is in the status tree: with a version naming tr.residence-permit, moving
-- tr.residence-permit.student out from under it takes student permit holders out of every rule for
-- permit holders. Both were watched being accepted before this was written.
--
-- Three decisions, each with its reason:
--
-- The downward walk is UNCHANGED, and runs first. Every case refused before this migration is
-- refused after it with the identical message, which is what the two existing tests assert.
--
-- The upward walk runs only when the row's PARENT CHANGES. A rule reaches a row through the parent
-- links, not through the readable code pattern, so it is the link that must not move. A rename, a
-- recode or a country change leaves the links alone and the ancestor's rule still reaches the row;
-- a criterion naming the row itself is caught by the downward walk either way. Widening this to
-- every update would freeze rows nothing is wrong with.
--
-- The message is its own. "TR-34.kadikoy is named by a rule's criteria, itself or through a place
-- inside it" would be untrue here: nothing names Kadikoy. The row refused and the row in use are
-- different rows, and the error has to say which is which or whoever reads it looks in the wrong
-- place.
--
-- The upward CTE carries a step count and uses UNION ALL so the NEAREST named ancestor is named,
-- rather than an arbitrary one. That terminates because the parent chain cannot contain a cycle:
-- skipbureau_tree_holds refuses a row inside itself at the end of the statement that would create
-- one, so no later statement's BEFORE trigger can meet one.

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
        'WITH RECURSIVE above(code, steps) AS (
           SELECT $1::TEXT, 1
           UNION ALL
           SELECT node."parentCode"::TEXT, above.steps + 1
           FROM %1$I.%2$I node JOIN above ON node.code = above.code
           WHERE node."parentCode" IS NOT NULL
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
