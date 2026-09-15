# SB-271, A rule with no version for everyone asks for the detail without calling itself the rule for everyone

**Exit:** on the live site, /en/TR/guides/short-term-residence-permit and /en/DE/guides/residence-permit
show neither the caption nor the sentence The rule for everyone for their permits and charge, and still
ask for the detail with a button that opens the panel, in en and fa; Anmeldung still shows its rule for
everyone; a RuleAnswer story for the new state was watched failing.

## What is wrong

SB-257's plan said that a rule with no version for everyone (`resolution: contextRequired`) shows only
the line naming the detail and the button. What shipped draws it through RuleAnswer's `general` state,
which always captions itself "The rule for everyone", and its panel says "This is the rule for everyone.
Tell us, and we show the answer for you." Guide.tsx already passes no lines and no notes for such a
rule, so the caption stands over nothing and the sentence is false.

Measured on the live site on 2026-09-15, for a reader who has said nothing: Turkey's short-term
residence permit guide shows it twice, for the permit, which needs a residence status, and for the
charge, which needs a nationality; Germany's residence permit guide shows it once, for the skilled
worker's permit, which needs a nationality first. `needsReview` has the same caption, over nothing
when the rule has no version for everyone.

## The change

- **RuleAnswer captions what it shows.** One boolean, whether the answer shows at least one line or
  one note, decides both the caption and the panel's words below. "The rule for everyone" is drawn
  only over lines or notes of that rule, in `general` and `needsReview`. "For you" stays on
  `answered`, and `noRule` keeps no caption.
- **The question's panel says only what is true of what is on screen.** With the rule for everyone
  shown, as now: "{asks} can change this", and "This is the rule for everyone. Tell us, and we show the
  answer for you." With nothing shown: "{asks} decides the answer", and "Tell us to show your answer."
  `{asks}` is one of "Your nationality", "Where you live", "Your residence status", "Your situation" (since SB-286, "Your role", the panel's word),
  "Where you work".
- **Guide.tsx does not change.** It already gives a rule with no version for everyone no lines and no
  notes.
- **A story, `AsksFirst`,** story first: a rule with no lines and no notes, missing the reader's
  nationality. Its play finds neither the caption nor the sentence about the rule for everyone, finds
  "Your nationality decides the answer", and Tell us calls its handler.
- RuleAnswer.md and DESIGN.md's departure for the Guide Detail page say it, and the two new strings get
  Persian in `fa.po`.

## Why the caption follows what is shown rather than a new prop

The caption labels the lines and notes beneath it. Guide.tsx could pass the obligation's resolution
down instead, but then a general version whose facts all lack a label and which has no notes would be
captioned over empty space. Drawing the caption only over something is true in both cases and needs no
new prop. The words for nothing shown say nothing about everyone, so they stay true whether or not the
rule has a version for everyone.

## How it is checked

- The `AsksFirst` story, watched failing with the caption and sentence drawn regardless of what is
  shown.
- Web lint, the type checker, and the RuleAnswer and Guide stories in the four Storybook projects, one
  project at a time; the build.
- Pushed, then the two permit guides and Anmeldung looked at on the live site in en and fa.

Checked on 2026-09-15. The check approved deriving the caption from what is shown, with one boolean for
the caption and the panel, and gave the panel's words over a rule with no version for everyone, taken
as given without a heading's full stop. It also pointed out that a `needsReview` answer can carry
needs, which Guide.tsx drops, so a reader could be shown an ambiguity that a detail would settle with
no way to give it. That is not this card's exit, and is SB-276.
