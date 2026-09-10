# SB-025, measure every dark token pair against a contrast target

**Exit condition:** a test computes the contrast of every declared pair in both
modes and fails on any that misses its target, and no pair misses.

## What the measurement actually says

I measured before planning, because the card rests on an assumption and the
assumption is worth checking. WCAG 2.1 relative luminance, 26 candidate pairs,
both modes.

**The card has it backwards.** It says dark "borrows the credibility" of a
light palette that carries measured decisions. In fact:

| mode | passes | misses |
|---|---|---|
| dark, derived by eye | 22 | 4 |
| light, transcribed from Figma | 13 | 13 |

Light is the worse of the two. Nothing about that is surprising once stated:
the Figma file was drawn to look right, and looking right on a designer's
monitor is not the same measurement.

So this task is mostly about **light**, and the card's framing needs correcting
on the board before it misleads whoever picks it up next.

## Not every miss is a failure

This is the substance of the task, and getting it wrong in either direction is
the real risk. A blanket "everything must hit 4.5" would force changes to
colours that are correct, and produce a test that people delete.

**`accent` on `background` measures 2.47 and that is already known and fine.**
`CLAUDE.md` and `DESIGN.md` both record it: `accent` is a fill that carries text
on top, and the thing that has to be visible on its own, the focus ring, is
`accentText`, which measures 6.11. The same reasoning covers `success` and
`warning` against the page. Those pairs are **not declared**, and the file has
to say why, or someone will re-add them.

The pairs I believe are genuinely required, and the ones that genuinely miss:

**Text, 4.5:1**

| pair | light | dark | verdict |
|---|---|---|---|
| `textTertiary` on `background` | 3.34 | 4.82 | light **fails** |
| `textTertiary` on `surface` | 3.51 | 4.36 | **both fail** |
| `textOnAccent` on `accentPressed` | 3.11 | 6.10 | light **fails** |
| `textOnDanger` on `danger` | 3.82 | 3.05 | **both fail** |

Everything else in the text group passes in both modes, including every
body and secondary pair, by comfortable margins.

**Non-text, 3:1.** `borderStrong` measures 1.54 light and 2.03 dark, and the
notice borders are lower still. Whether that is a failure depends on what the
border is doing, and WCAG is specific: a boundary needs 3:1 only when it is
**what identifies the control**. A notice that already has its own background
fill is identified by the fill, not the edge. A text input whose only boundary
is that line is not. **This is the question I am least sure of** and it is the
question for the check.

## The approach

`src/core/theme/contrast.ts`, new:

- `contrastRatio(a, b)`, WCAG 2.1 relative luminance, pure and testable
- `DECLARED`, the pair inventory: foreground, background, target, and **why
  that pair exists on screen**
- `EXEMPT`, the pairs someone will reach for, each with the recorded reason it
  is not required, so `accent` on `background` is answered in the file rather
  than re-litigated

`src/core/theme/contrast.test.ts` walks `DECLARED` across both modes and fails
naming the pair, the measurement and the target.

Then the tokens that genuinely miss are adjusted, smallest change first, and
each change is recorded in `DESIGN.md` with its before and after measurement.

### Changing a light value that came from Figma

The design contract says match Figma exactly, so this needs stating rather than
doing quietly. **The precedent already exists in this repository**: the Figma
swatch said `textOnAccent` was white, and the project overrode it to ink
because white on mint does not reach 4.5, and recorded that in `DESIGN.md`. The
card here says "adjust the values that miss", so adjusting is what was asked
for. Every change follows that precedent: measured reason, recorded, smallest
move that passes.

`textOnDanger` is the one worth flagging. It is white on `#E05252`, 3.82. The
two ways out are ink on the red, which is what was done for the accent but
reads oddly on a destructive control, or darkening the red until white passes.
I intend the second, because white on red is what a destructive button means
and the shade is the less meaningful half of that pair.

## Files

| file | change |
|---|---|
| `src/core/theme/contrast.ts` | new, the ratio and the inventory |
| `src/core/theme/contrast.test.ts` | new, the gate |
| `src/core/theme/tokens.ts` | the values that miss |
| `src/core/theme/index.ts` | export the inventory |
| `DESIGN.md` | each change, with its measurement |

## How it meets the exit condition

The test walks `DECLARED` in both modes and fails on any miss, so "no pair
misses" is what a green run means rather than something I assert. I will watch
it fail by hand by moving one token one step the wrong way, and confirm the
failure names the pair and both numbers.

The pairs currently failing are listed above, so the before and after is
checkable by someone who did not do the work.

## What the check changed, and what the measurement then said

The plan check found a failure neither the card nor I had: `theme.ts` handed
MUI `warningText` as `warning.contrastText`, which is **2.82:1 in light and
1.19:1 in dark**. `warningText` is for text on the subtle fill, where it
measures 5.12. A new `textOnWarning`, ink, fixed all three warning states at
once. That is the single most useful thing this task produced and it came from
asking rather than from measuring what I had already thought of.

It also corrected the shape of the inventory: declare **roles and their
states**, not token pairs, because `contrastText` is one value shared by
normal, hover and pressed. Fixing only the pressed fill can leave the normal
one broken.

Three exemptions came out of it, each recorded in `contrast.ts`:
`textTertiary` is the theme's `text.disabled` and 1.4.3 exempts inactive
controls; `accent`, `success` and `warning` against the page are fills carrying
text, not standalone indicators; the three border tokens are consumed by no
component yet, so whether 1.4.11 applies is not yet a fact.

Final state: **21 declared pairs, both modes, all passing.** Seven token values
changed, each recorded in `DESIGN.md` with its before and after.

Watched failing, by hand: putting `warningText` back as `warning.contrastText`
turned the wiring test red, and moving `accentPressed` back to mint 900 turned
the inventory test red naming the role, both numbers and both hex values.

Verified in the running app rather than inferred: hovering the one primary
button the product currently renders gives `rgb(50, 156, 118)`, the new
`accentPressed`, under ink. Before this it was `#277C5E` at 3.11:1.

**The Storybook pass could not be done.** The embedded browser refuses to
register a service worker, so MSW fails and every story shows an error box.
`fetch` of the same URL returns 200 and valid JavaScript, and the vitest
browser project renders all of them green, so this is the pane rather than the
repository. SB-114 records that, including the wrong diagnosis I filed first.
