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

## What a SkipBureau address contains

Decided in SB-033. The Figma file says nothing about URLs, and this product is
one people send each other, so the address is part of the design.

```
/:locale/:country                          Home
/:locale/:country/t/:goal                  Task hub
/:locale/:country/t/:goal/:category        Category hub
/:locale/:country/g/:guide                 Guide detail
/:locale/:country/g/:guide/suggest         Suggest an update
```

`/en/tr/g/get-a-sim-card`. The language is the short public form, `en`, not the
lingui tag; the mapping lives in `locales.ts` next to `dir`, so a locale cannot
be added without deciding what it looks like in a URL. `/en-US/...` still
resolves, by redirecting, so a link already shared keeps working while one page
keeps one address.

**Country is in the path because a guide is about a country.** "Get a SIM card
in Turkey" and the same guide for Germany are different documents with different
sources and different verified dates, not one document filtered two ways. This
is a different thing from the context control, which is nationality and city,
and which the file says explicitly is not a filter.

**An unknown language or country is Not Found, never a redirect to one we do
have.** A stale link reading `/en/zz/g/residence-permit` must not quietly become
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
