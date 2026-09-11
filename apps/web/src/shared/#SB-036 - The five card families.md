# SB-036, the five card families

Written 2026-09-11, before building. The plan roast waits, by the owner's
order of 2026-09-10.

## Where it stands

The Source citation card `30:84` exists (SB-044). This builds the other four,
each in its own folder under `src/shared/`, read with `get_design_context`:

| component | node | size | states |
|---|---|---|---|
| Guide card | `18:14` | 360x154 | Default, Hover |
| Process card | `18:40` | 360x158, 150 in progress | Default, Hover, In progress |
| Document card | `18:65` | 360x178 | Not started, Ready, Missing, Expiring |
| Saved item | `28:101` | 560x88 | Guide, Process, Document, each Default and Hover |

Strokes are inside the frame and not in its padding, as everywhere in this
file: a card's 16 gives its hairline back.

## Each one

- **Guide card**: the whole card is the link. Category eyebrow in the accent,
  title, one sentence, and the verified date in its 16px foot, which Figma
  fixes and so is kept as a floor. Hover strengthens the border, as drawn;
  focus is the family's 2px accent-text outline.
- **Process card**: cost and duration always up front, in Mono Data. Default
  pitches the process in one sentence; In progress replaces the pitch with a
  segmented track and the next action, and takes the accent border. The track
  reuses `segments()` and `PROGRESS_PAINT` from the progress indicator, at the
  card's own 6px, since it is the same drawing smaller.
- **Document card**: the name, then the name as it appears on the form and the
  office sign, then what it is, the requirement flags as text, and a status
  line coloured by state. Missing and Expiring take a danger or warning border.
  The local name is data: Turkish for Turkey, whatever the country's language
  is elsewhere. Not a link: nothing in the design says where it leads.
- **Saved item**: a ruled row, quieter than a card on purpose. A 72 column
  names the kind, then title, context and date, then Open, or Continue for a
  process, and a remove control. The row is the link and the remove control is
  a button beside it, not inside it, so no control nests in another.

## How it is proved

The exit asks for long content and a missing optional field in each story
without breaking the frame. So each has a Default story measuring its drawn
height, a Long story with a title and sentence three times the design's and
asserting nothing overflows, and a story with the optional fields absent. The
interactive ones get Focus stories with the family's outline. Then the full
suite, the build, and a look in both directions and both modes.

## The step I am least sure of

The Saved item's hover. Figma tints the whole row, but the row holds two
controls. Tinting the container on `:hover` rather than the link keeps it one
row to the eye while the link and the remove button stay separate controls.
