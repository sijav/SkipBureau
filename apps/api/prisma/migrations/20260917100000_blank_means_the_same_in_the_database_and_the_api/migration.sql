-- SB-354: the database and the API disagreed about what blank means, so a rule could be stored that
-- no reader could ever match. The reasoning is in this folder's plan,
-- `#SB-354 - The database and the API disagree about what blank means.md`.
--
-- SB-181 added `CHECK (btrim(value) <> '')` and a comment saying it refuses a value that is "empty or
-- only whitespace". It does not. Single argument `btrim` strips U+0020 and nothing else, which was
-- measured rather than assumed: btrim of a tab, a newline, a no-break space, an em space or a zero
-- width no-break space all come back unchanged. Meanwhile rules.service.ts refuses a nationality or
-- situation whose JavaScript `trim()` is empty, and that strips twenty four more characters. So a
-- criterion made of a single tab passed the CHECK, was stored, and scoped a rule to nobody, while the
-- database reported it saved.
--
-- The contract is now one thing: a value is blank when it is empty or consists only of whitespace,
-- where whitespace means what JavaScript's `trim()` means. That direction because the TypeScript side
-- already implements it by specification rather than by a maintained list; the SQL is what was behind.
--
-- Written with `chr()` rather than an E string escape. Both parse, which was checked, but chr names
-- every code point in the clear and needs no escape syntax to read correctly. A POSIX class was
-- rejected on measurement: `[[:space:]]` does not match U+00A0, so it would have left the card's own
-- example open while looking closed.
--
-- Validated as it is added, exactly as SB-181's migration said of the constraint it is replacing: this
-- migration is itself the proof that the existing rows conform, and it fails loudly on deploy if they
-- do not. Every criterion value comes from a research file or a seed, so none should be whitespace.
--
-- One explicit transaction with a bounded lock wait, as SB-202's migration explains.

BEGIN;

SET LOCAL lock_timeout = '30s';

ALTER TABLE "EligibilityCriterion" DROP CONSTRAINT "EligibilityCriterion_value_is_not_blank";

ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_value_is_not_blank"
  CHECK (
    btrim(
      value,
      -- U+0020, then the twenty four JavaScript's trim() strips that single argument btrim does not.
      ' '
        || chr(9) || chr(10) || chr(11) || chr(12) || chr(13)
        || chr(160) || chr(5760)
        || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197)
        || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
        || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279)
    ) <> ''
  );

COMMIT;
