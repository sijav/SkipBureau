# SB-037, the eight row and tile families

Written 2026-09-11, before building. The plan roast waits: the owner's order of
2026-09-10 is that roasting waits until the product is built.

## Where it stands

Four of the eight exist and are storybooked: Task tile `65:1285`, Topic item
`78:552`, Step row `142:524` and Ask result row `46:610`. This task builds the
other four, each in its own folder under `src/shared/`, with its paint in
`src/core/theme/` beside `topic.ts` and `source.ts`:

| component | node | size | states |
|---|---|---|---|
| Task row | `58:551` | 560x70 | Default, Hover |
| Checklist item | `27:218` | 640x64 | Required, Completed, Optional, Missing, Expired, Needs verification, Not applicable, and details shown |
| Deadline item | `28:46` | 380x66 | Normal, Upcoming, Due soon, Today, Overdue, Completed |
| Roadmap step | `32:437` | 720, 73 collapsed (Upcoming 56) | Completed, Current, Upcoming, Waiting, Blocked, Needs user input, each collapsed and expanded |

Every number above was read with `get_design_context` and `get_metadata`, and
every glyph was downloaded as the SVG Figma exports. Strokes are inside the
frame and not in its padding, as everywhere else in this file, so every padding
gives back its stroke: 1 for a hairline, 3 for the reading-start bar.

## The shared rule

Hover tints the surface: `surface` to `surfaceSubtle`, which is the Task row's
own drawn hover, and the Current roadmap step's `accentSubtle` to
`accentSubtleHover`. Focus keeps the resting surface and adds the 2px
`accentText` outline inset by 2, the Task tile's and Topic item's rule. A row
that leads nowhere has no hover and no focus: the Step row is static, and a
Checklist item with no details or a Deadline item with no link is too.

## Each component

- **Task row**: the whole row is the link. Title in Label, one line in Body
  Small, and the 16px chevron, textSecondary, accentText on hover. The chevron
  polygon sits low in its box in Figma; its geometry is copied verbatim, as the
  context control's chevron already is.
- **Checklist item**: the box carries the state by shape as well as colour,
  as the file asks: dashed for Optional, a bar for Missing, `!` for Expired,
  dots for Needs verification, a check on the accent for Completed. The status
  word is lingui. When the item has details, the row is a disclosure button
  that shows them underneath, label column 140 as drawn.
- **Deadline item**: urgency in three steps, neutral, amber, red, and the day
  count as a lingui plural. Optionally a link.
- **Roadmap step**: the header row is a disclosure button inside an h3. Its
  body is a slot the process screen fills with the components that already
  exist, Checklist item, Information panel, Source card and Button; the story
  composes Figma's expanded Current step from them.

## Where it departs from Figma, and why

- **Not applicable text.** Figma sets the title, flags and status word in
  `textTertiary`, 3.34:1, which axe fails as body text. It takes
  `textSecondary` instead, the same move the text input's disabled helper made;
  the recessed box and dash still carry the state.
- **The roadmap body's text.** Figma sets it at 12px with no text style, so
  the story uses the nearest styles in the scale, Label Small, Body Small and
  Mono Data, rather than inventing a thirteenth.

## How it is proved

Each new row has a story per state that measures its drawn height, a Focus
story that tabs to it and asserts a 2px outline in `accentText`, and a Hover
story for looking, since synthetic events never apply `:hover`. The Ask result
row gets the Focus story it is missing. Then lint, the type checker, the full
suite, and a look in both languages and both modes.

## The step I am least sure of

The Roadmap step's disclosure: an `h3` wrapping a `ButtonBase` whose contents
are flex spans rather than block elements, so the markup stays valid inside a
button while the title is still a heading a screen reader can jump to.
