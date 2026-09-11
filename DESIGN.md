# The design contract

Figma file `Xk7m6KtxdfGtZb6CO32K74`. Every value here was read from a node, not
estimated. Node ids are given so any component can be checked against its source
before it is built, which is the rule: **match the design exactly**.

**This document is not sufficient on its own to match a component exactly, and
it does not pretend to be.** It was built from `get_metadata`, which gives
names, sizes, positions and structure. It does not give per-node fills, strokes,
paddings, corner radii or font weights. Those come from `get_design_context` on
the specific node, which is why every node id is recorded here. **Call it on the
node before building the component**; this file tells you which node, what its
variants are, and what rules govern it.

| page | node | what is on it |
|---|---|---|
| 01 Foundations & Components | `0:1` | tokens, type, spacing, 16 component families |
| 02 App Shell | `5:2` | header, ask, context, profile, navigation rules |
| 03 Core Screens | `5:3` | **empty** |
| 04 States | `5:4` | **empty**, states are per component on `0:1` |
| 05 Mobile | `5:5` | **empty. There is no mobile design.** |
| 03 Home & Explore | `58:523` | home, the twelve task tiles, scroll handoff |
| 04 Task Hub | `78:523` | topic rows, guided setup, context behaviour |
| 05 ARCHIVED Pre-MVP | `90:523` | **archived, do not build from this** |
| 06 Category Hub | `132:523` | subtopics, checklist panel |
| 07 Guide Detail | `142:523` | the guide template and its content model |

Frames whose name begins **`NOT IN PUBLIC MVP`** are out of scope. They are the
signed-in states, and there are no end-user accounts in this product.

---

## The rules that are easy to break

Measurements are checkable. These are not, and every one of them is a decision
the file states in words, with its reasoning, which means breaking one is not a
near miss but a different product. Each links to the section that details it.

1. **One primary Ask entry point is visible at a time.** Home owns it until it
   scrolls away, then the header takes it, and internal pages always use the
   header. Two ask fields on one screen is the failure this rule exists to
   prevent. [The app shell](#the-app-shell-page-52)

2. **Context is not a filter, and it is asked for after a question.** There are
   no nationality or city dropdowns beside Ask, by design. The control states
   what SkipBureau knows, in words, never as a flag, and it is requested only
   when it changes the answer. [Context control](#context-control)

3. **Twelve goals, no grouping layer.** A person should recognise their own
   situation in five seconds without first decoding a category system. Two
   alternatives were considered and archived on the page as history: grouped
   rows, and an index grid. They are not options to revisit casually.
   [The twelve goals](#the-twelve-goals)

4. **Guided setup and the topic list are peers, not a funnel.** Someone who
   already knows what they need goes straight to a topic without being pushed
   through questions. [Task hub](#task-hub-page-78523)

5. **A hub shows what a goal involves without pretending to know which parts
   apply to this person.** That only becomes definite inside a process.
   [Task hub](#task-hub-page-78523)

6. **The guide template must stay coherent when any optional field is empty.**
   Every field is content, not layout. This is what lets a thin guide ship
   instead of waiting to be complete. [The content model](#the-content-model-quoted-from-151995)

7. **`Your options` is removed entirely where there is no meaningful choice, not
   hidden.** An empty section heading tells the reader there is a decision they
   have not found. [The reading column](#the-reading-column)

8. **The last verified date is required, and appears in three places:** the
   header, the sources section, and the footer note. It is the only visible
   signal that the content is current, which is what this product is actually
   selling. [The content model](#the-content-model-quoted-from-151995)

9. **The category hub checklist saves nothing, and the page has to say so.** A
   checklist that looks like it remembers, and does not, loses someone their
   place in a bureaucratic process.
   [The checklist saves nothing](#the-checklist-saves-nothing-and-says-so)

10. **A submission is reviewed before it changes a guide, and the reader is told
    that.** Someone who submits into silence does not submit twice.
    [Suggest an update](#suggest-an-update-145865-1440x940)

11. **The header is 68 high, and 60 once scrolled.** Nothing added to it may
    change either number. This is the constraint the owner attached to the
    language control request: a control that alters the height has destroyed
    the thing the request was protecting.
    [Where the language control goes](#where-the-language-control-goes)

12. **Hover tints the surface, focus keeps the resting surface and adds a 2px
    `accent-text` outline.** The same escalation on every row and every tile.
    One row inventing its own makes keyboard use unreadable.
    [Topic item](#topic-item-78552-860x82-or-100-with-a-kind-label)

13. **There is no mobile design, and the file says so by being empty.** Every
    screen is drawn at 1440. What happens below that is not a detail to
    improvise. [Three pages of the design are empty](#three-pages-of-the-design-are-empty)

---

## Comparing two countries

The owner asked for this on 2026-09-10 and it is an **invention**: nothing in
the Figma file describes it. It is also the thing that separates SkipBureau from
a folder of articles. Someone who has already done all of this once in Iran and
is now doing it in Turkey does not want to read Turkey from scratch. They want
to know what is different.

### Why it needs two tables, not one

You cannot diff `Turkey: register within 20 days` against `Germany: Anmeldung
within 14 days` if each is a paragraph, or even if each is a row, because
nothing says they are the same thing.

- **`Obligation`** is the concept, country and language independent:
  `register-your-address`, `get-a-tax-number`, `hold-health-insurance`.
- **`RuleVersion`** is one country's version of one obligation, for a
  particular kind of person, in force over a period, with its source.

The diff is then a join on the obligation, and it falls out in four kinds:
identical, changed, only in the destination, and stops on leaving.

**Deciding that two national requirements are the same obligation is editorial
work, and there is no shortcut.** LegalRuleML can represent formal legal rules
but supplies no catalogue of "the same obligation" across countries, and
CPSV-AP is useful prior art for eligibility, evidence and cost metadata rather
than a ready-made comparison schema. The semantic alignment is the product's
own work. Nobody should go looking for a standard that does it for us.

### Why the values are rows

A rule is not one deadline. It can carry several deadlines, a fee, a list of
documents and an exception at once, so values live in `RuleFact` rows with a
key, an operator, a number or a text, a unit and a currency. Rules are only
compared when they share an obligation, so the keys line up.

**That is what makes the answer specific.** "Something is different about
registering your address" is what a folder of articles already tells you. "The
deadline is 14 days rather than 20, and Germany also wants a
Wohnungsgeberbestaetigung" is the product.

### Who a rule applies to, and what happens when that is unclear

Eligibility is child rows, not nullable columns, so age, income, length of stay
and family status can be added later without migrating every rule. A version
with no criteria applies to everyone.

Specificity is **set inclusion, not a count**. A rule for EU nationals and a
rule for students each have one criterion and neither is more specific than the
other, so both survive and the answer is **`needsReview`**, naming the versions
that clash.

**That refusal is the same decision the Ask section already made.** This
product does not guess at a rule a reader will act on. Picking one of two
applicable residence permit rules is the same class of harm as inventing one.

### Time is the same machinery

`validFrom` and `validTo`, half open, so `validFrom <= at < validTo` and a rule
ending on the first of the month does not overlap one starting that day. **A
change is a new row, never an edit**, which is what lets the identical
resolution answer "what changed here since I arrived" with two dates instead of
two countries.

Nationality group membership is dated too, or a question about 2020 is answered
with today's groups.

**That rule is how the content is written. It is not, yet, what the database
guarantees.** `20260909232307_rule_history_is_append_only` enforces exactly
this much: **a closed version row, and a fact already on a closed version,
cannot be updated or deleted by ordinary DML.** A third trigger refuses two
versions of the same obligation, country and scope from being in force at once.

Everything else is still editable, including an **open** version, which is most
of the history, and dated group membership, which is not immutable despite
being dated. TECH-DEBT.md lists every gap and names SB-081 as the card that
closes them. Until then, do not read a verified date as a promise about what a
past query returns.

---

## What a SkipBureau address contains

Decided in SB-033, and reshaped by the owner on 2026-09-10 (SB-147, SB-148):
pages are named in words, and the first segment says where the reader comes
from once they have said it. His reading of `/en-TR/DE`: in English, from
Turkey, moving to Germany. The Figma file says nothing about URLs, and this
product is one people send each other, so the address is part of the design.

```
/:reader/:country                            Home
/:reader/:country/tasks/:goal                Task hub
/:reader/:country/tasks/:goal/:category      Category hub
/:reader/:country/guides/:guide              Guide detail
/:reader/:country/guides/:guide/suggest      Suggest an update
/:reader/:country/search?q=                  What a question found
/:reader/:country/guides                     Every guide (Coming soon)
/:reader/:country/setup/:goal                Guided setup (Coming soon)
```

`/en/TR/guides/sim-card`, or `/fa-IR/TR/guides/sim-card` for a Persian reader
from Iran. The reader is the language's short public form, `en`, not the lingui
tag, and then the origin's ISO code once the reader has set it in the context
panel; it is never guessed. Countries are written in capitals. The mapping lives
in `locales.ts` next to `dir`, so a locale cannot be added without deciding what
it looks like in a URL. Every older form still resolves, by redirecting: lowercase
countries, and the `/t/` and `/g/` markers pages had before, so a link already
shared keeps working while one page keeps one address.

**Country is in the path because a guide is about a country.** "Get a SIM card
in Turkey" and the same guide for Germany are different documents with different
sources and different verified dates, not one document filtered two ways. This
is a different thing from the context control, which is nationality and city,
and which the file says explicitly is not a filter.

**An unknown language or country is Not Found, never a redirect to one we do
have.** A stale link reading `/en/ZZ/guides/residence-permit` must not quietly become
Turkey's rules. Someone would act on them.

`/` is the only place a language is guessed, from a stored choice and then the
browser's languages. Every address below it names its own.

### What GitHub Pages costs, stated rather than hidden

Pages has no rewrite rule, so a deep link matches no file and Pages serves
`404.html`. The build writes a copy of the app shell there, so the link opens
the guide. **The HTTP status is still 404.** A search engine reads that as a
page that does not exist and does not index it.

For a product whose value is being findable, that is not a small compromise, and
it is the one thing about the hosting choice worth revisiting. It is recorded
here rather than discovered later: the deep link works for a person who was sent
one, and does not work for a person searching. `e2e/pages.spec.ts` asserts both
halves against the built site served the way Pages serves it, including the 404
status, so nobody has to trust this paragraph.

### A guide in one language, read in another

Decided in SB-049. Interface text is lingui; guide content is rows, one per
language: `GuideText`, `GuideSectionText` and the rest are keyed by the row and
a `locale`, so a guide can exist in English before anyone writes it in Persian,
and adding a language needs no migration. A missing row means not translated;
a present row with empty columns means deliberately empty. Keeping those apart
is why no reader-facing text lives on the parent table.

**A reader who asks for a language the guide is not written in gets the guide
in the language it has, and is told.** The API answers `locale`, the language
the text is actually in, `translationMissing`, and `locales`, every language the
guide exists in. The page marks the text with its real language, so it is read
and pronounced correctly inside the other interface, and shows a Not yet
verified style panel, "Not in your language yet", naming the language it is in.
Nothing at all would send the reader away; the wrong language unannounced would
be worse. Search engines are told the same: the page's canonical is the
language the text is in, and it names no alternate it does not have (SB-086).

---

## Colour

Semantic tokens only. A component binds to the name, never to a primitive and
never to a raw hex. Mint is the brand. Amber and red are reserved for meaning:
amber means a date or a condition is at stake, red means the user is stopped,
refused, or at risk.

| token | value | primitive |
|---|---|---|
| `background` | `#F8FAF8` | paper/base |
| `surface` | `#FFFFFF` | paper/white |
| `surface-subtle` | `#F1F5F2` | paper/sunk |
| `text-primary` | `#1D2421` | ink/900 |
| `text-secondary` | `#5F6964` | ink/600 |
| `text-tertiary` | `#828B86` | ink/400 |
| `text-on-accent` | `#1D2421` | ink/900, **not white** |
| `border` | `#DDE5E0` | rule/300 |
| `border-strong` | `#C4CEC8` | rule/500 |
| `accent` | `#3EB489` | mint/700 |
| `accent-subtle` | `#E3F5EE` | mint/100 |
| `accent-subtle-hover` | `#D3EEE4` | mint/150 |
| `accent-hover` | `#329C76` | mint/800 |
| `accent-pressed` | `#277C5E` | mint/900 |
| `accent-text` | `#1F6B50` | mint/950 |
| `success` | `#3EB489` | mint/700, same as accent |
| `warning` | `#F2A93B` | orange/700 |
| `warning-subtle` | `#FFF3DC` | orange/100 |
| `warning-hover` | `#DD9226` | orange/800 |
| `warning-pressed` | `#C77B17` | orange/900 |
| `warning-border` | `#F6D18B` | orange/300 |
| `warning-text` | `#96590B` | orange/950 |
| `danger` | `#E05252` | red/700 |
| `danger-subtle` | `#FDEAEA` | red/100 |
| `danger-hover` | `#C94343` | red/800 |
| `danger-pressed` | `#AE3636` | red/900 |
| `danger-border` | `#F3B8B8` | red/300 |
| `danger-text` | `#AE3636` | red/900 |
| `danger-deep` | `#8E2A2A` | red/950 |
| `text-on-danger` | `#FFFFFF` | paper/white |

**`text-on-accent` is near-black, and the swatch says "was white".** That note is
in the file; the reason is not, so treat this sentence as reasoning rather than
transcription: white on `#3EB489` does not reach 4.5:1, ink on it does. Anything placed
on `accent` uses `text-on-accent`, and `accent-text` is the darker mint for text
and focus rings on light backgrounds.

Dark mode is not in the Figma file. It has to be derived from these tokens and
checked for contrast, not invented per component.

### Where the shipped palette departs from this table, and why

The table above is what Figma says. Everything here is what the app actually
ships, with the measurement that forced it. SB-025 measured every pair the
product renders, in both modes, and `contrast.test.ts` fails on any that
misses. SB-121 then made the binding required and moved the pairs nothing
paints yet into a recorded exemption list, so the inventory is twelve entries
rather than twenty one: the colours did not change, the claim about what
renders them got honest. **These are measured departures, not preferences, and each one is the
smallest move that clears the target.**

The surprise, for the record: dark, which was derived by eye, passed 22 of 26
candidate pairs. Light, transcribed from Figma, missed 13. Drawn to look right
is not the same as measured.

| token | Figma | shipped | why |
|---|---|---|---|
| `text-on-warning` | did not exist | `#1D2421` ink/900 | The theme was handing MUI `warning-text` as the label colour for an amber fill. That is `2.82:1` in light and `1.19:1` in dark. `warning-text` is for text on the SUBTLE fill, where it measures `5.12`, and the two are not interchangeable. |
| `danger` | `#E05252` red/700 | `#E05252` red/700, **restored** | Was moved to red/800 for white on a danger fill, `3.82:1`. Restored in SB-035 when the status tag became the first thing to paint `danger` itself: nothing draws a danger fill with a label on it, because the Destructive button rests on `danger-hover`. As an indicator it clears 3:1 on the page (`3.64`) and on `danger-subtle` (`3.30`). |
| `danger-hover` | `#C94343` red/800 | `#C94343` red/800, **restored** | Was moved to red/900 to follow `danger` down. Restored in SB-035: see below. |
| `danger-pressed` | `#AE3636` red/900 | `#AE3636` red/900, **restored** | The same. |
| `accent-hover` | `#329C76` mint/800 | `#329C76` mint/800, **restored** | Was moved to mint/750 alongside `accent-pressed`. Restored in SB-035. |
| `accent-pressed` | `#277C5E` mint/900 | `#277C5E` mint/900, **restored** | Was moved to mint/800 because MUI's contained button hovered to `palette.primary.dark`, which was `accent-pressed`, putting ink on mint/900 at `3.11:1`. Restored in SB-035. |
| a text input's resting stroke | `border-strong` | `text-tertiary` | The owner's decision, 2026-09-10. `1.54:1` against the page, with the field's fill at `1.05`, left a filled field with no visible edge; now `3.34`. |
| a disabled input's helper | `text-tertiary` | `text-secondary` | SB-035. `3.34:1` on the light page, and axe failed it. The disabled field's label and value are exempt as parts of an inactive control; this line is not, because it tells the reader how to enable the field. The ordinary helper colour is the smallest move that clears 4.5. |
| `text-on-danger`, dark only | `#FFFFFF` | `#1D2421` ink/900 | Dark lightens the semantic fills, so white on them is the wrong way round: `3.05:1` on the dark danger fill. Ink is what dark already does for `text-on-accent`, for exactly this reason. |
| `danger-pressed`, dark only | derived `#E05252` | `#E86262` | With ink as the label, the darkest red in the dark ramp measured `4.14`. Lifted until it clears, keeping it darker than the base fill. |

**The four restorations, 2026-09-10 (SB-035).** Every one of those four
moves rescued the same thing: MUI's contained button, which painted its hover
from `palette.primary.dark` and its error fill from `palette.error.main`. The
Button now follows Figma 11:44 exactly, and the design never puts a label where
those rescues were aimed. Primary rests on `accent` (ink at `6.10`) and hovers
and presses to `accent-hover` (`4.64`); `accent-pressed` is only the press
STROKE. Destructive rests on `danger-hover` (white at `4.81`), hovers to
`danger-pressed` and presses to `danger-deep`, so it never puts white on
`danger` at all. With those paint paths the design's own values clear every
target, so the departures had no reason left, and keeping them made the Button
render one step darker than Figma on hover and press. `danger` followed with
the status tag, above. `palette.primary.dark` and `success.dark` now point at
`accent-hover`, since MUI's `dark` slot is a filled control's hover. MUI's
default error TEXT reads `error.main`, which is now `3.82` on white, so no
component may leave it at that default: the Input takes its error text from its
own node, and axe fails any story that does not.

**Button, node 11:44**, read with `get_design_context`, one size only:

| | value | note |
|---|---|---|
| height | 40 | every style and state, including focus |
| padding | 10 vertical, 16 horizontal | 10 is off the 8px scale; it is the Button's own value |
| radius | `radius-sm`, 4 | |
| label | Archivo SemiBold 14/20, tracking 0.6% | 0.6 PERCENT, 0.084px at 14px, not 0.6px |
| strokes | inside the frame | a 1px border on every style, transparent where there is none, and 9/15 padding |
| focus | 2px `accent-text`, inside | an outline offset inward, so focusing moves nothing |

| style | label | rest | hover | pressed | disabled |
|---|---|---|---|---|---|
| Primary | `text-on-accent` | `accent` | `accent-hover` | `accent-hover` + `accent-pressed` stroke | `surface-subtle`, `text-tertiary` |
| Secondary | `text-primary` | `surface` + `border-strong` stroke | `surface-subtle` | `surface-subtle` + `text-secondary` stroke | `surface-subtle` + `border` stroke, `text-tertiary` |
| Ghost | `accent-text` | none | `accent-subtle` | `accent-subtle-hover` | none, `text-tertiary` |
| Destructive | `text-on-danger` | `danger-hover` | `danger-pressed` | `danger-deep` | `surface-subtle`, `text-tertiary` |

**Status tag, node 13:26**, one size:

| | value | note |
|---|---|---|
| height | 24 | 1 + 3 + 16 + 3 + 1, the stroke inside |
| padding | 4 vertical, 8 horizontal | `spacing-xs`, `spacing-sm` |
| gap | 4 | between the mark and the label |
| radius | `radius-xs`, 2 | |
| label | Archivo SemiBold 12/16, tracking 1.2% | Label Small, sentence case: MUI's overline default is capitals, overridden |
| mark | 6 x 6, radius 1 | decoration, optional |

| status | label | fill | stroke | mark |
|---|---|---|---|---|
| official | `accent-text` | `accent-subtle` | `accent` | `accent` |
| verified | `accent-text` | `surface` | `accent` | `accent` |
| needs context, deadline, warning | `warning-text` | `warning-subtle` | `warning` | `warning` |
| blocked | `danger-text` | `danger-subtle` | `danger` | `danger` |
| waiting | `text-secondary` | `surface-subtle` | `border-strong` | `border-strong` |
| completed | `text-secondary` | `surface` | `border` | `accent` |

**Information panel, node 14:26** (Figma: "Alert / Information panel"). Built as
a `note`, not MUI's Alert, whose `role="alert"` is announced on render:

| | value | note |
|---|---|---|
| padding | 16 | the strokes are INSIDE and not counted: text sits 16 from the outer edge, bar included |
| gap | 8 | between eyebrow, body and source line |
| bar | 3px on the reading-start side | mirrored to the right in fa-IR |
| stroke | 1px elsewhere, solid, or dashed when incomplete | |
| radius | `radius-xs`, 2 | |
| eyebrow | IBM Plex Mono Medium 11/14, uppercase, tracking 8% | Metadata; was 0.06em in the theme, now the measured 0.08em |
| body | Source Serif 4 14/22 | Body Small |
| source line | IBM Plex Mono 13/20 | Mono Data, now a Typography variant of its own |

| kind | eyebrow | fill | stroke |
|---|---|---|---|
| official information | `accent-text` | `accent-subtle` | `accent` |
| practical advice | `text-secondary` | `surface` | `border-strong` |
| warning | `warning-text` | `warning-subtle` | `warning` |
| scam warning | `danger-text` | `danger-subtle` | `danger` |
| legal uncertainty | `warning-text` | `surface` | `warning`, dashed |
| coverage gap | `text-secondary` | `surface-subtle` | `border-strong`, dashed |

Body is `text-primary` and the source line `text-secondary` in every kind.

**Text input, node 16:32**, composed from FormControl, FormLabel,
OutlinedInput and FormHelperText, because the label sits ABOVE the field:

| | value | note |
|---|---|---|
| label | Archivo SemiBold 14/20, `text-primary` | stays `text-primary` on focus and error, where MUI would recolour it |
| gap | 8 | label to field, field to helper |
| field | 40 high, value inset 10/16, radius 4 | the stroke is inside, as MUI's fieldset outline already is |
| value | Archivo 14/20, `text-primary` | placeholder `text-secondary`, opaque, not MUI's faded currentColor |
| helper | Source Serif 4 14/22, `text-secondary` | the error REPLACES it, in `danger-text` |
| focus | 1px `accent` stroke and a 4px `accent-text` ring | MUI would thicken the stroke to 2px |

| state | fill | stroke |
|---|---|---|
| rest, filled | `surface` | `text-tertiary`, by the owner's decision below |
| hover | `surface` | `text-secondary` |
| focus | `surface` | `accent` |
| error | `surface` | `danger` |
| disabled | `surface-subtle` | `border` |

**Decided by the owner, 2026-09-10: the resting stroke is `text-tertiary`.**
The design's `border-strong` measured `1.54:1` against the page, and the field's
white fill is `1.05`, so the stroke is what shows where a filled field is; WCAG
1.4.11 asks 3:1. `text-tertiary` is `3.34` on the page and `3.51` on the fill in
light, `4.82` and `4.36` in dark, and hover still steps darker to
`text-secondary`. **Figma follow-up, suggested not made:** set the Input
component's Default and Filled strokes to `text-tertiary` in node 16:32, so the
file and the code agree.

**Select, node 16:53**: the text input's field, fill, strokes and focus ring,
plus a chevron. No helper line.

| | value | note |
|---|---|---|
| chevron box | 9 x 6, 16 from the end | the reserve for it is 16 + 9 + 8 = 33, where MUI reserves 32 |
| chevron | the exported 7.79 x 4.5 triangle, verbatim | offset 0.60 and turned 180 degrees by transforms; `currentColor`, from `text-secondary`, disabled `text-tertiary` |
| height | 40 | MUI's select floor is 1.4375em, 20.125px at 14px, overridden |
| label | required | the design: a placeholder standing in for a label is gone once a value is chosen |

The open menu is not in the design, so it takes the theme's defaults.

**Search input, node 17:17**, the product's primary entry point. Built on MUI's
bare InputBase, since OutlinedInput carries the form field's look:

| | value | note |
|---|---|---|
| height | 56 | |
| padding | 16 at the start, 8 at the end | strokes inside; mirrored in fa-IR |
| icon | 18 x 18, the exported shapes verbatim | `text-tertiary` empty, `text-secondary` with a question in it, as the two exports |
| text | Source Serif 4 18/29, Body Large | serif on purpose: "it invites a sentence, not a keyword" |
| stroke | 1px `text-tertiary` | the owner's text-field decision, applied: the design's `border-strong` is 1.54 on the page |
| focus | 2px `accent-text`, inward, no ring | an outline over the 1px border, so focusing moves nothing |
| name | `label`, required, invisible | names the field and its search landmark; a placeholder is not a name |

**Context chip, node 17:27**, a button, because the design says it is always
editable:

| | value | note |
|---|---|---|
| height | 26 | 1 + 4 + 16 + 4 + 1, the stroke inside |
| padding | 5 vertical, 8 horizontal | gap 4 |
| name | Metadata, IBM Plex Mono Medium 11/14, capitals, 8% | the interface face, untracked, in Persian |
| answer | Label Small, Archivo SemiBold 12/16 | |
| set | `surface`, 1px `border` | hover `surface-subtle`, `border-strong` |
| unset | `surface`, 1px dashed `warning`, the invitation in `warning-text` | the dash stays on hover |
| focus | the button's 2px `accent-text` outline, inward | the design draws none; the system's is used |

**Progress indicator, node 17:45.** Steps is the default; bar is for aggregate
dashboards only. Steps is not MUI's Stepper: its segments carry no number, label
or icon, so it is a determinate progressbar drawn in pieces.

| | value | note |
|---|---|---|
| label | IBM Plex Mono 13/20, `text-secondary` | Mono Data; the count in the reader's own digits, a plural |
| gap | 8 | label to track |
| steps | 8 high, 4 between, equal widths, radius 1 | 36.44 each at 360; done `accent`, current `border-strong`, remaining `surface-subtle` |
| bar | 6 high, radius 1 | fill `accent`, remainder `surface-subtle` |

**Kept as designed by the owner's decision, 2026-09-10, to revisit in Figma.**
In light mode the remaining segments are
`1.05` against the page, the current `1.54`, and done `2.47`. The count is in
the label at `5.42`, so no reader loses it, but the design's aim, that a reader
sees nine things, is not met, and no token swap fixes it without making a
remaining segment darker than a done one.

Three pairs are deliberately NOT measured, and `contrast.ts` records why in
code so the reasons travel with the values: `text-tertiary`, which is the
theme's disabled text and so outside 1.4.3; `accent`, `success` and `warning`
against the page, which are fills carrying text rather than standalone
indicators; and the three border tokens, of which only `border-strong` is rendered, as
the secondary button's stroke, and a labelled button is identified by its
label rather than its stroke; the other two no component consumes yet, so
whether 1.4.11 applies to them is not yet a fact to encode.

## Typography

Three typefaces, three jobs. Archivo runs the interface: navigation, buttons,
labels. Source Serif carries anything meant to be read at length, so a serif
paragraph signals explanation rather than a control. IBM Plex Mono marks anything
that came from a record: dates, reference numbers, costs, verification stamps.

| style | size / line | face |
|---|---|---|
| Display | 44 / 48 | Archivo Bold |
| H1 | 32 / 38 | Archivo Bold |
| H2 | 24 / 30 | Archivo SemiBold |
| H3 | 18 / 24 | Archivo SemiBold |
| Body Large | 18 / 29 | Source Serif 4 |
| Body | 16 / 26 | Source Serif 4 |
| Body Small | 14 / 22 | Source Serif 4 |
| UI Text | 14 / 20 | Archivo Regular |
| Label | 14 / 20 | Archivo SemiBold |
| Label Small | 12 / 16 | Archivo SemiBold |
| Metadata | 11 / 14 | IBM Plex Mono Medium, uppercase |
| Mono Data | 13 / 20 | IBM Plex Mono |

## Spacing and radius

An 8px system. **4px exists only as a half-step for tight internal padding inside
tags and chips. It is never used for layout.**

`none 0` · `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `2xl 48` · `3xl 64` ·
`4xl 96`

Radius: `none 0` · `xs 2` · `sm 4` · `md 6` · `lg 8`

**There is deliberately no full or pill radius token.** The file says why: pill
tags are the strongest visual tell of generic SaaS, and this product should read
closer to a well-set document than to a dashboard.

---

## Components

Sixteen families on page `0:1`. Every variant below is a real node, so each can
be opened and measured. Sizes are the frame sizes in the file.

### Button `11:44`, 146x40

Four styles, five states each: **Default, Hover, Focus, Pressed, Disabled**.

- Primary `11:4` · Secondary `11:14` · Ghost `11:24` · Destructive `11:34`

### Tag / Status `13:26`, height 24

By meaning, not by colour: Official `13:2`, Verified `13:5`, Needs context
`13:8`, Deadline `13:11`, Warning `13:14`, Blocked `13:17`, Waiting `13:20`,
Completed `13:23`.

### Alert / Information panel `14:26`, width 560

Official information `14:2` (126h), Practical advice `14:6`, Warning `14:10`,
Scam warning `14:14`, Legal uncertainty `14:18`, Coverage gap `14:22` (126h).

The last two matter: the design has a panel for admitting the law is unclear and
a panel for admitting the guide does not cover something.

### Input `16:32`, 320x98, error 320x120

Default `16:2`, Hover `16:7`, Focus `16:12`, Filled `16:17`, Disabled `16:22`,
Error `16:27`. The error state is 22px taller: the message is inside the
component, not floating under it.

### Select `16:53`, 320x68

Default `16:33`, Hover `16:38`, Focus `16:43`, Disabled `16:48`.

### Search input `17:17`, 720x56

Default `17:2`, Focus `17:7`, Filled `17:12`.

### Context chip `17:27`, height 26

Set `17:18`, Hover `17:21`, Unset `17:24` (wider, 239 against 141).

### Progress indicator `17:45`

Steps `17:28` (360x36), Bar `17:40` (360x34).

### Guide card `18:14`, 360x154

Default `18:2`, Hover `18:8`.

### Process card `18:40`, 360x158

Default `18:15`, Hover `18:20`, In progress `18:25` (150h).

### Document card `18:65`, 360x178

Not started `18:41`, Ready `18:47`, Missing `18:53`, Expiring `18:59`.

### Checklist item `27:218`, 640x64

Required `27:2`, Completed `27:31`, Optional `27:62`, Missing `27:91`, Expired
`27:122`, Needs verification `27:154`, Not applicable `27:187`.

Seven states, all the same height. "Not applicable" is a state, which means the
checklist adapts to the person rather than showing them work they do not have to
do.

### Deadline item `28:46`, 380x66

Normal `28:2`, Upcoming `28:9`, Due soon `28:16`, Today `28:24`, Overdue
`28:32`, Completed `28:39`.

### Saved item `28:101`, 560x88

Guide, Process and Document, each with Default and Hover: `28:47` `28:56`
`28:65` `28:74` `28:83` `28:92`.

### Source citation card `30:84`, 520x180

Official / verified `30:2`, Recently checked `30:18`, Older source `30:34`,
Source unavailable `30:50`, Verification pending `30:66`.

Five states for how much a source can be trusted, including one for the source
being gone. This is the component that carries the product's honesty about
outdated information.

### Roadmap step `32:437`, width 720

Collapsed, 73h (Upcoming is 56h): Completed `31:2`, Current `31:13`, Upcoming
`31:24`, Waiting `31:35`, Blocked `31:48`, Needs user input `31:59`.

Expanded: Completed `32:2` (915h), Current `32:74` (839h), Upcoming `32:111`
(822h), Waiting `32:148`, Blocked `32:187`, Needs user input `32:224`.

---

## The app shell, page `5:2`

### The governing rule, quoted from the file

> "One primary Ask entry point is visible at a time."

At the top of Home the page owns Ask, so the header has none. Once that field
scrolls away, and on every internal page, which never has one, the header carries
a compact Ask instead. **The two never appear together.**

### Four mental models

The shell is organised around how people arrive, not around the content model.

| destination | the user's thought | what it is |
|---|---|---|
| **Explore** | "I know what I want to do." | Task discovery. Move to Turkey, start a business, hire someone. Not a category page, not a list of articles. |
| **Guides** | "I want to understand something." | Reading and reference. Guides explain; Explore starts work. |
| **Ask Skipbureau** | "I have a specific question." | Natural language in, structured answer out. Large on Home, compact in the header everywhere else. |
| **My processes** | "I already started something." | Signed in only, because it only means anything then. **Not in the public MVP.** |

### Header `45:637`, width 1440

- Public / Default `45:523`, **68 high**
- Public / Scrolled `45:548`, **60 high**
- Logged in / Default `45:573`, Logged in / Scrolled `45:605`, not in MVP

Scrolling drops the height 68 to 60 and strengthens the bottom rule. **No shadow,
no blur.**

Parts: Wordmark `43:523` (104x24) · Nav link `43:535` (Default `43:526`, Hover
`43:529`, Active `43:532`) · Header ask field `43:551` (420x40: Rest `43:536`,
Hover `43:541`, Active `43:546`) · Context control `44:542` (No context `44:523`,
Partial `44:527`, Complete `44:532`, Open `44:537`) · Profile control `44:553`
(54x34: Default `44:543`, Open `44:548`).

### Context control

> "Iranian · İzmir is text, never a flag, and it states what Skipbureau knows,
> not what is filtered."

There are no nationality or city dropdowns beside Ask, by design: **context is
requested after a question, and only when it changes the answer.**

Context panel `47:686` (400x312): Empty `47:617`, Partial `47:640`, Complete
`47:663`.

### Ask

Ask result row `46:610` (640x66): Task `46:591`, Guide `46:596`, Quick answer
`46:601`, Recent `46:606` (42h).

Ask panel `46:659` (640): Empty `46:611` (313h), Results `46:637` (317h).

#### What Ask does, and what it refuses to do

The file never says what answers a question, so it was decided here, SB-034.

**Ask searches SkipBureau's own content. It does not generate answers.** A
question returns rows pointing at things we wrote and dated: a task, a guide, a
guide's stored quick answer, or something the reader looked at recently. It
never composes prose about a bureaucratic rule.

**This is a product decision, not something the design forced.** Nothing in the
file forbids a generative backend; the row variants could have been rendered
from a model. The reason is below, and the design is the corroboration rather
than the argument. Recording it that way so that whoever revisits it argues with
the reason instead of with a component name.

**The reason: the only asset this product has is being correct and current.**
Every guide carries a required last verified date printed in three places. A
generated paragraph has no verified date, no source and no editor, and a reader
acts on a residence permit deadline. An empty result costs a reader a search; an
invented rule costs them an appointment, a fee, or a legal status. That
asymmetry is the whole decision.

The design corroborates it in three places, read off the nodes rather than
inferred from their names:

1. **Every result kind is a pointer.** The row has exactly four variants and
   three are our records; the fourth is the reader's own history. There is no
   answer variant.

2. **Quick answer is a badge, not a body.** `46:601` contains
   `Content` `46:602` holding `Title` (503x20) and `Sub` (503x22), plus a
   `Kind` label (89x14). `46:596`, the Guide variant, is the same structure with
   the same two text nodes and a 37px `Kind`. The only difference between them
   is the width of the label, which tracks the length of the word in it. A 22px
   `Sub` cannot hold a generated answer. And `Quick answer` `151:1007` is a
   field in the guide content model that an editor fills in, rendered third on
   Guide Detail at `182:1054`, so the row is showing that field.

3. **The same row appears where nothing has been asked.** Home's
   `Common questions` band `60:738` is four of these at full 1280 width, and the
   Task hub's `Guides` section `81:655` is six in two columns. Both are curated
   lists. A row that serves as a static list item is not the output of a
   generative call.

**So Ask, in this version:**

- Matches the question against guide and task titles, descriptions and quick
  answers, and returns the `Task`, `Guide` and `Quick answer` rows.
- **Matches within one language, over separate fields per language.** A Persian
  query does not retrieve an English-only guide, because a hit a reader cannot
  read is not a hit. What the reader sees instead is SB-049's business.
- **`Recent` is not a search result.** It is the reader's own history from this
  browser, in its own labelled section of the panel, never ranked in among
  matches. It needs no account and no server.
- **No match means no match.** Nothing adjacent is promoted to fill the panel.
  The empty state `46:611` is 313 high and what fills it is curated entry
  points, the same editorial content as Home's `Common questions` band `60:738`,
  plus the suggest-an-update route. Curated is not the same as adjacent: it is
  chosen by an editor, not by a scorer that ran out of good answers.

**It does not** answer in prose, summarise several guides into one reply, or
answer about a country or a topic we have not covered.

**What would change this.** A model call becomes reasonable as a **router**, not
an author: turning a question into the right guide without writing any claim of
its own, still showing our dated content as the answer. That needs enough
content that finding the right guide is genuinely hard, a budget the free tier
does not have, and an evaluation showing routing beats plain search on real
questions. Until those three, the decision stands.

### Where the language control goes

The owner requires a language control in the topbar that does not destroy the
design. The **profile control** occupies the right end of the header at 54x34,
and every logged-in frame is marked `NOT IN PUBLIC MVP`. There are no end-user
accounts in this product, so **that slot is free in the public header**, at a
size and position the design already accounts for.

That is the placement to build, and it is why the header height must not change:
the design specifies 68 and 60, and a control that alters either has destroyed
the thing it was asked not to destroy.

### Assembled shell frames

Public: Home top `48:617`, Home scrolled `55:1043`, Context open `48:697`,
Internal page default `48:886`, Internal page search active `48:644`.

Marked `NOT IN PUBLIC MVP`: `48:751`, `55:1121`, `48:785`, `48:850`.

---

## Home and Explore, page `58:523`

**Home is the Explore experience.** Three intentions, three paths: ask a
question, pick a goal, or continue something already started. There is no
separate Explore page.

### Home ask field `58:538`, 760x64

Rest `58:524`, Focus `58:531`. This is the large field that owns the top of
Home. Compare the header's compact one at 420x40.

### Task tile `65:1285`, 302x100

Default `65:1261`, Hover `65:1267`, Focus `65:1273`, Pressed `65:1279`,
Coming soon `137:1391` (302x120).

Quoted from the file, on why Hover and Focus differ:

> "Hover tints the surface for a pointer, Focus keeps the resting surface and
> adds a 2px outline for a keyboard. The outline uses accent-text rather than
> accent, the lighter accent measures 2.47:1 against the page ground and misses
> the 3:1 minimum for non-text indicators."

So the focus ring is `accent-text` `#1F6B50`, and that is a measured decision,
not a preference.

> "The whole tile is the target. There is no button inside it, because the tile
> already is the button."

### The twelve goals

Chosen direction, and the file is explicit that it is chosen: **twelve goals, no
grouping layer.** A user should recognise their own situation in five seconds
without first decoding a category system.

Getting Settled · Get a residence permit · Study in Turkey · Work in Turkey ·
Hire someone · Start a business · Banking & money · Taxes · Renting a Home ·
Transportation · Health & Insurance · Family

Two rejected alternatives are kept on the page as design history, not as
options: **Option B**, grouped rows, archived because it asks the user to
understand a category system first; **Option C**, an index grid, archived
because without a clarifier line the labels are ambiguous to exactly the person
this product exists for.

### The tile grid

Four columns, tile 302 wide, **24px gutter** (326 pitch). Three rows at y 0,
144, 288. The first eight tiles are **120 high**; the last four are **100 high**.
Total block 1280x388.

### Public home `60:587`, 1440 wide

Content column **1280, inset 80 left and right**. Header 68, then Body:

| band | node | height | notes |
|---|---|---|---|
| Hero | `60:629` | 372 | H1 at y72, sub at y130 (640 wide), ask at y208, examples at y292 |
| Rule | `60:647` | 1 | a 1px rule separates every band |
| Tasks | `60:648` | 584 | heading at y56, tiles at y140 |
| Common questions | `60:738` | 456 | four Ask result rows, full 1280 width |
| Trust | `60:764` | 176 | one line, not a badge section |

Hero copy in the file: **"What do you need to do in Turkey?"** with the sub
"Clear, step-by-step guidance for living, studying, working and doing business
in Turkey." Three example questions sit under the field, prefixed "Try".

**This copy is Turkey-specific and the product is not.** The design was drawn
against the first country. Every one of these strings goes through lingui with
the country as a variable, or the second country cannot be added without a code
change.

The trust band, quoted:

> "Every guide shows when it was last verified and links to the official source"

and beneath it, a note that the figures in the design are sample content and not
verified legal information.

### Scroll handoff `62:849`

The four steps, from the file:

1. **At the top of Home** the large Ask field owns the page. The header carries
   no Ask at all.
2. **The user scrolls** and the Homepage Ask field leaves the viewport.
3. **The header takes over.** Show ask flips ON and the header switches to its
   Scrolled variant, 68px to 60px, rule strengthens.
4. **Continuity, not duplication.** The compact "Ask Skipbureau..." is the same
   action in a smaller place. The two are never on screen together.

### Task row `58:551`, 560x70

Default `58:539`, Hover `58:545`. Used by the archived Option B, and by grouped
lists elsewhere.

### Logged-in home `61:704`, NOT IN PUBLIC MVP

Recorded because it explains the ordering rule: same Ask, same tiles, reordered
page. "Continue where you left off" sits directly under Ask, because an
unfinished process almost always outranks starting a new one, and the shift
comes from position and padding rather than bigger type.

---

## Guide Detail, page `142:523`

The template every guide renders through. `Guide Detail / Template` `143:523`,
1440 wide, and two worked examples: `Get a SIM Card or eSIM` `143:734` and
`Register Your Foreign Phone / IMEI` `187:1088`. A first-viewport study at
`182:4376` (1440x900) shows what must be above the fold.

### The reading column

Body 1440 → Main **1080** → most sections **720 wide**. The reading measure is
720, and only `Your options` `182:1074` breaks out to the full 1080. Body text is
Source Serif at 16/26. Why 720 is not stated in the file.

### The sections, in order

Breadcrumb `182:1040` (1080x54) · Guide header `182:1045` · Quick answer
`182:1054` · **Your options** `182:1074` (1080 wide) · Before you get a SIM
`182:1058` · What you need `182:1102` · How to do it `182:1115` · Important to
know `182:1142` · What to check `182:1155` · Cost and time `182:1165` · Where to
do it `182:1178` · Common problems `182:1195` · Official sources `182:1204` ·
Related guides `182:1227` · Something changed `182:1251` · Page footer note
`182:1257`.

Quick answer comes **third**, before any of the detail. Official sources and the
footer note both carry the verified date.

### The content model, quoted from `151:995`

> "Every field below is content, not layout: the template must stay coherent
> when any optional one is empty."

| field | node | notes |
|---|---|---|
| Guide title | `151:1001` | |
| Guide description | `151:1004` | |
| Quick answer | `151:1007` | |
| Content sections | `151:1010` | "What you need, Your options, How to do it, Where to do it each optional, each variable in length" |
| Steps | `151:1013` | |
| Options | `151:1016` | "Variable count, or omitted entirely where there is no meaningful choice" |
| Cost and time | `151:1019` | |
| Official sources | `151:1022` | |
| **Last verified date** | `151:1025` | **Required.** "Appears in the header, the sources section and the footer note." |
| Related guides | `151:1028` | |
| Disclaimer visibility | `151:1031` | |
| Suggest-update visibility | `151:1034` | |

This is the shape the Prisma schema has to hold, and the reason nearly every
field is nullable: the template is required to survive any of them being absent.
`Last verified date` is the one that is not, and it appears in three places.

### Suggest an update `145:865`, 1440x940

The anonymous contribution screen. Textarea `142:542` (660x626), and the file
states the policy:

> "If you know this information is outdated or incorrect, let us know. We review
> submissions before updating the guide."

Reviewed before it changes anything, which is the moderation queue in SB-010 and
SB-011.

### Other parts

Step row `142:524` (720x95) · Information disclaimer `149:988` (720x102).

`Your options` carries the note: **"Optional section. Remove it entirely on
guides where there is no meaningful choice."** Not hidden, removed.

---

## Category Hub, page `132:523`

Template `133:523` (1440x1839) with a worked example, `Getting Settled`
`133:690`. This is the layer between a task tile and a guide.

### Checklist line `132:537`, 344x40

Unchecked `132:524`, Hover `132:527`, Focus `132:530`, Checked `132:533`.

### The sections

| section | node | size |
|---|---|---|
| Breadcrumb | `133:565` | 1280x50, `Home / Category name` |
| Category introduction | `133:570` | 1280x121, title, one line, `Last reviewed: Month Year` |
| Recommended starting point | `133:574` | 1280x164, a boxed guide with a 96x40 button |
| Main columns | `133:582` | 1280x692 |
| Related guides | `133:650` | 1280x344, rows of 840x82 |
| Ask | `133:674` | 1280x200, ask field **640x64** |
| Page footer note | `133:685` | 1280x200 |

**Main columns** is 840 + 392 with a 48 gutter: the subtopic list on the left,
six **Subtopic rows** of 840x100, and a **Checklist panel** on the right,
392 wide, holding six Checklist lines.

### The checklist saves nothing, and says so

> "You can use this checklist as a simple guide. Your progress is not saved."

That line is in the design, on the panel. It follows from there being no
end-user accounts: the checklist is a client-side convenience and the interface
admits it rather than pretending.

### Ask appears again at the bottom

"Still have a question? Ask about this category and find the most relevant
guide." The field here is **640** wide, not the 760 of Home. Same component,
different measure.

---

## Task Hub, page `78:523`

The bridge between a goal and a process. Worked example: `Start a Business /
Public` `81:523` (1440x2697).

> "It shows what the goal involves without pretending to know which parts apply
> to this particular person. That only becomes definite inside a Process."

### Where it sits

```
Home  ->  Task hub
Start guided setup  ->  Guided setup  ->  Personalised process
Choose a topic      ->  Guide
```

> "Guided setup and the topic list are peers, not a funnel. A user who already
> knows what they need goes straight to a topic without being pushed through
> questions."

### Topic item `78:552`, 860x82, or 100 with a Kind label

Default `78:524`, Hover `78:531`, Focus `78:538`, Pressed `78:545`.

Named generically because the same row serves every future hub: residence,
study, work, moving. **Rows rather than tiles**, because these are parts of one
goal, while the Homepage tiles are twelve separate goals.

An optional **Kind** label appears on only four of eight items, `Decision`, `If
it applies to you`, `Ongoing`, where the nature of the item differs from a
one-off setup step. Those rows are 100 high; the rest are 82.

Interaction matches the task tile and the file says so: hover tints the surface
for a pointer, focus keeps the resting surface and adds a **2px `accent-text`
outline** for a keyboard. Same escalation, different container.

### The sections, Main is 860 wide

| section | node | height |
|---|---|---|
| Intro | `81:566` | 270, eyebrow `Task hub`, H1, description, `What we know about you` + Context control |
| Guided setup | `81:577` | 124, boxed, 151x40 button |
| Topics | `81:584` | 934, eight Topic items |
| Depends | `81:646` | 236, an Alert panel plus a button |
| Guides | `81:655` | 404, six Ask result rows in **two columns of 418**, 24 gutter |
| Other routes | `81:691` | 272 |
| Sources | `81:703` | 386, `Last verified August 2026` + Source citation card |

> "These are the areas most founders deal with. They are deliberately not
> numbered. The order that applies to you depends on your situation."

And the distinction the product rests on:

> "Guides explain how something works; the areas above are things you may need
> to do."

### How context changes the hub `83:873`

> "The hub never claims to know the user's legal path. Context changes emphasis
> and wording. It does not unlock or hide the areas, because the areas are what
> the goal involves regardless of who is reading."

| context | behaviour |
|---|---|
| Unknown | Chip reads "Add your details". Page otherwise unchanged, all eight areas, same descriptions. |
| **Partial** | Nationality and city known, status not. **This is the main public state.** The uncertainty note stays, because status is exactly what would change the answer. |
| Known | Wording sharpens; areas stay the same; the uncertainty note narrows rather than disappears. "Never becomes a definitive checklist. That only exists inside a Process." |
| Active process | Guided setup is replaced by the process card and Continue. Not in the public MVP. |

---

## Three pages of the design are empty

`03 Core Screens` `5:3`, `04 States` `5:4` and `05 Mobile` `5:5` contain no
nodes at all. They are named placeholders.

Two of those do not matter: states are drawn per component on `0:1`, and the
core screens live on the later pages. **The third one does.**

**There is no mobile design.** Every screen in this file is drawn at 1440, and
the only widths that exist anywhere are 1440, 1280, 1080, 860, 840, 720 and 640.
Nothing states what happens below that, and the instruction is to match the
design exactly.

So responsive behaviour cannot be read from the file, and anything built for
small screens is invention rather than transcription.

### What the owner decided, 2026-09-10

He looked and agreed there is nothing there. The decision, in his words: build
the MVP from the desktop screens, but **the infrastructure has to support a
phone correctly from the start**, using MUI properly so the result displays
correctly, with the shape taken from allaboutberlin.com. Testing on a phone
waits until later. Infrastructure first, then the big things in front of the
eyes, then the details.

That splits into three rules.

1. **Every measurement in this file is a desktop measurement, and it is
   transcribed.** Nothing below 1440 is transcription, so nothing below 1440 may
   be recorded here as though it were.

2. **A design width becomes a max-width, a gap, or a column count. Never a fixed
   width.** A guide card is `360x154` on the desktop frame, which means at most
   360 wide, not exactly 360. A component that hardcodes the number cannot
   reflow, and a page of them needs horizontal scrolling on a phone. This is the
   rule that has to exist before the component library is built, which is why
   SB-071 blocks it.

3. **Derived is labelled derived.** Breakpoints, the collapsed header, the
   drawer, the tile grid stepping from four columns to two to one: all of it is
   invention, recorded as invention, the same way the dark palette is. When
   mobile frames ever arrive they replace it wholesale rather than being
   reconciled with it.

SB-071 builds the foundation, SB-072 tests it on a phone once the desktop MVP
stands up.

### The foundation, as built

**MUI's breakpoints are kept as they are**: xs 0, sm 600, md 900, lg 1200, xl
1536. The Figma numbers are content constraints, not viewport thresholds, and
the two are different things: a 1080 guide column is not a claim about a 1080
screen. So the design's widths are named caps in `layout`, and the breakpoints
stay the ones every MUI component already speaks.

Four primitives, and screens are assembled from them rather than from pixels:

| what | is | from the design |
|---|---|---|
| `Page` | the content column, `maxWidth` 1280 or 1080, inset stepping 80, 24, 16 | `60:587` content column 1280 inset 80 |
| `Reading` | the prose measure, `maxWidth` 720 | the reading measure, the one width the file explains |
| `AppShell` | header slot, `main`, footer slot, `100dvh`, `overflow-x: clip` | the shell, `5:2` |
| `TileGrid` | a column COUNT, stepping 4 to 2 to 1, gap 24 | `60:648`, four columns of 302 on a 24 gutter |

302 is what 1280 minus three 24px gutters divides into. It is a result, not an
input, and typing it in is what makes a grid that cannot reflow.

`100dvh` rather than `vh`, because mobile browser chrome makes `vh` taller than
the visible area and the page then scrolls a little for no reason.

**What proves it.** `e2e/responsive.spec.ts` loads five routes at ten widths,
360 through 1440, including both sides of every MUI breakpoint, in English and
Persian, and asserts that **no element anywhere** has an edge outside the
viewport. Breakpoint edges rather than round device widths, because a layout
that breaks does it one pixel either side of a threshold. It also checks the
Persian heading starts on the right at every width, which a text assertion
would not catch. `src/shared/layout.test.ts` is a tripwire for a design width
written as `width:` instead of `maxWidth:`. Both were proven by planting a
failure and watching them fire.
