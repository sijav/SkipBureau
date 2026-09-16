# SB-185, Source the monthly €1,318.33 minimum base from a page about the self-employed, not pensioners

**Exit:** the €1,318.33 marker in `agreed/germany/health-insurance.md` names an official page stating
the minimum base as monthly for self-employed or all voluntary members, or a calculated definition
from § 240(4) SGB V and the 2026 monthly reference value with every input verified; and the
health-insurance conversation's last pass answers no.

## The fault

The figure carries two definitions. `bmg-minimum-assessment-base`, the Health Ministry's
contributions table, names the self-employed but gives the base only as a bare parenthetical,
`(Mindestbemessungsgrundlage: 1.318,33 €)`, with no period word. And
`bundestag-wd-minimum-base-monthly`, whose own locator gives it away: *Beiträge von Altersrentnern
zur Krankenversicherung in unterschiedlichen Fallkonstellationen, Seite 8*. It states the monthly
period, in a paper about **voluntarily insured pensioners**. A reader following that footnote lands
on a document about pensioners and may conclude the figure is not theirs.

## What I read myself, 2026-09-16

- **The BMG page again**, in case the card was wrong. It is not. The page uses period words where it
  means them, `Beitragsbemessungsgrenze (Monat) 5.812,50 Euro` and `(Jahr) 69.750 Euro`, and
  attaches none to the minimum base. It stays as the source for the figure and for who it applies
  to, and it is not the source for the period.
- **§ 240(4) Satz 1 SGB V**: *"Als beitragspflichtige Einnahmen gilt für den Kalendertag mindestens
  der neunzigste Teil der monatlichen Bezugsgröße."* A floor **per calendar day**. It never states
  €1,318.33 and never states a monthly minimum, which is exactly why a second source was reached for.
- **§ 240(2) letzter Satz SGB V**: *"Die §§ 223 und 228 Abs. 2, § 229 Abs. 2 und die §§ 238a, 247
  Satz 1 und 2 und § 248 Satz 1 und 2 dieses Buches sowie § 23a des Vierten Buches gelten
  entsprechend."* This is what carries § 223 to voluntary members.
- **§ 223(2) Satz 2 SGB V**: *"Für die Berechnung ist die Woche zu sieben, der Monat zu dreißig und
  das Jahr zu dreihundertsechzig Tagen anzusetzen."* The 30 day month, in statute.
- **§ 1 SVBezGrV 2026**: *"Die Bezugsgröße nach § 18 des Vierten Buches Sozialgesetzbuch für das Jahr
  2026 beträgt 47 460 Euro. Umgerechnet auf den Monat ergeben sich 3 955 Euro."*

€3,955 ÷ 90 × 30 = €1,318.333…, shown as €1,318.33.

## The route, and what the two checks changed

The first draft proposed a **two** input calculation and called the 30 day month a phrase in the
formula. **The plan check refused that**, and correctly: "per month of 30 days" was an unsourced
transformation hidden inside a formula. It is now a third input, § 223(2), and the whole chain is
statutory.

The health-insurance conversation found § 223(2) and the § 240(2) route, which is better than the
GKV-Spitzenverband principles PDF the plan check suggested, because it is statute rather than an
association's rules. It also found a **BKK24** leaflet stating *"Mindestbemessungsgrenze in Höhe von
monatlich 1.318,33 €"* directly. **That is not used.** BKK24 is one statutory insurer's information
sheet, not an official page in the sense this repository means, and a statutory chain every step of
which is law is stronger than one Kasse's leaflet.

## What changes

**Two files, not one.** The plan check caught that the first draft named only one.

`apps/api/prisma/research/agreed/germany/health-insurance.md`:

- The marker becomes `**€1,318.33**[^bmg-minimum-assessment-base][^minimum-base-monthly]`.
- `bundestag-wd-minimum-base-monthly` is replaced by `minimum-base-monthly`, a `"status":
  "calculated"` definition in the shape `threshold-monthly-equivalent` already uses in this file,
  naming three inputs and the formula `3,955 Euro divided by 90 days, times a 30 day month`.
- Three verified inputs are added: `sgb5-240-4-daily-minimum`, `sgb5-223-2-thirty-day-month` (with
  the § 240(2) sentence in the same definition, since it is what makes § 223 apply) and
  `svbezgrv-2026-bezugsgroesse-monthly`, each `"read": "2026-09-16"`.
- The source list gains the three gesetze-im-internet pages, and the closing `All read 2026-09-12.`
  line gains 2026-09-16 rather than being edited.

`apps/api/prisma/research/README.md`, line 152, which currently records that the Ministry's page
does not write "monatlich" beside the base **and a Bundestag research paper does**. After this
change that account is false, so it is corrected to describe the calculated definition and its
statutory inputs.

## Corrected from the first draft

It said SB-226 "holds the minimum base out of the rules data until this closes, so that card is told
when it does". **SB-226 is `done`**, with SB-251 and SB-252 still open beneath it. The hold is a
comment in `src/rules/research/germany/health-insurance.ts`, not an open card, and nothing needs
telling. Whether the figure is written into that file is SB-251 and SB-252's business, not this
card's.

## The research pass

**Done**, and this is the first pass in this project that actually honoured the owner's order of
2026-09-12. `roast.mjs` has no flag for a session, but it reads the id from
`sessions["search:codex"]` in `.claude/roast-sessions.json`, so the health-insurance id went in that
file first and the run reported `resuming 01a093c8-fa43-7c12-90e6-57f1465c3219`. Reading that file
afterwards proves nothing, because the roast writes the map back on the way through; the stderr line
is the evidence. The pass is recorded in `talk/germany/health-insurance.md`.

## How it is checked

SB-185 is a child of SB-167, so it closes on what covers the files it changes:
`research-rules.e2e.spec.ts` run whole, because it loads the research inside an earlier test, plus
`research-regions.e2e.spec.ts`, and lint and the type checker.
