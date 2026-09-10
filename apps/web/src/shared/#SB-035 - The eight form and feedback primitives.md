# SB-035, the eight form and feedback primitives

**Exit condition:** a story per component showing every named variant and state,
passing in light, dark, ltr and rtl, with no colour literal outside `tokens.ts`.

## The eight, with their nodes

| component | family | variants |
|---|---|---|
| Button | `11:44` | Primary `11:4`, Secondary `11:14`, Ghost `11:24`, Destructive `11:34`, five states each |
| Tag / Status | `13:26` | Official, Verified, Needs context, Deadline, Warning, Blocked, Waiting, Completed |
| Alert | `14:26` | Official, Practical, Warning, Scam, Legal uncertainty, Coverage gap |
| Input | `16:32` | Default, Hover, Focus, Filled, Disabled, Error |
| Select | `16:53` | Default, Hover, Focus, Disabled |
| Search input | `17:17` | Default, Focus, Filled |
| Context chip | `17:27` | Set, Hover, Unset |
| Progress indicator | `17:45` | Steps `17:28`, Bar `17:40` |

## What the first node already changed

`get_design_context` on `11:4` returned more than sizes, which is why the rule
says to call it:

- padding is **16 horizontal, 10 vertical**. Ten is **not on the 8px scale**,
  so it cannot come from `theme.spacing`. It is a real design value and it has
  to live somewhere that is not a literal in a component.
- the label is exactly `type.label`: Archivo SemiBold 14/20, and a letter
  spacing of 0.6px that `theme.ts` does not currently carry.
- the Figma component description carries a constraint no size table would:
  **"One size only in v1; size variants deferred until a screen needs them."**
  So no `size` prop. Adding one would be inventing a variant the design
  explicitly deferred.

## The approach

**The theme carries the design, components carry no styling.** `CLAUDE.md`: if a
component needs an `sx` to match the design, ask whether the theme should carry
it. For MUI primitives the answer is `components.MuiButton.styleOverrides` and
friends, so a `<Button>` anywhere is right without a single prop.

Which means most of these eight are **theme work plus a story**, not new
components:

- **Button, Input, Select, Alert** are MUI components. They get style overrides
  and a story proving every variant and state.
- **Tag/Status, Context chip, Progress indicator, Search input** have no exact
  MUI equivalent as designed. They are built on MUI primitives, `Chip`,
  `Stepper`, `LinearProgress`, `TextField`, rather than hand rolled, per the
  rule about not re-implementing what MUI already does with its keyboard and
  a11y behaviour.

**Story first, then the component**, and stories render from their args.

**One at a time.** `get_design_context` on each family as I reach it, not all
eight up front: eight screenshots and eight code blocks bought in advance is
context spent before it is needed, and the Button already showed that each node
carries a constraint the plan could not have guessed.

## Files

`apps/web/src/shared/<name>/` per component: the story, the component, an
`index.ts`. `src/core/theme/theme.ts` for the overrides. `DESIGN.md` gains the
fills, paddings and weights as they are read, because it currently records
sizes only and the next person should not have to re-open Figma.

## How it meets the exit condition

Every variant and state in one story per component, run in the Storybook vitest
project, which renders each in a real browser. Light, dark, ltr and rtl are the
toolbar's four combinations, and the a11y addon is set to `error`, so a contrast
or role failure fails the run rather than being noticed later.

`tokens.test.ts` already fails on a colour literal anywhere but `tokens.ts`, so
the last clause of the exit condition is enforced rather than promised.

## Corrected by the plan check, and the first one is the important one

**The exit condition is not currently enforceable, and I would have claimed it
anyway.** The Storybook vitest project runs every story once, with the default
globals. `preview.tsx` says so itself: the toolbars are "a review aid, not a
test matrix. Vitest runs each story once, with the default globals below, so
nothing here automatically checks the other three." I wrote that comment and
then wrote an exit condition that pretends otherwise.

So this task builds **four Storybook vitest projects**, through
`storybookTest(..., { initialGlobals: { mode, direction } })`: light/ltr,
light/rtl, dark/ltr, dark/rtl. Every story then really does run in all four,
and the a11y addon set to `error` checks contrast in each. That is
infrastructure this card needs before its own components, and every earlier
component gets it for free.

**A named "Hover" story does not cause `:hover`.** Rendering a story called
Hover proves only that it renders. States need `play` functions that actually
hover, focus and type, which is the same defect as a story asserting mere
visibility.

**Do not invent a density scale from one Button.** The measured 10px goes in
the Button override with its origin recorded in `DESIGN.md`, and a semantic
control-density token waits until a second component establishes the pattern.
That was my own instinct and the check confirmed it rather than softening it.

**Tag/Status becomes a `StatusTag` wrapper with a `status` union**, and Chip's
`color` prop is not exposed. It may be implemented through typed custom
`MuiChip` variants, but the call site stays semantic, because `color` sitting
in the autocomplete is exactly how the meaning gets lost.

**Input and Select states are not on `MuiTextField`.** They live in
`MuiOutlinedInput`, the label, the helper text and the Select slots. Targeting
the TextField root would have been an afternoon of overrides that did nothing.

**`Stepper` is restyleable to 36px**, so its size is not a reason to avoid it.
The question is whether the design is a true sequence of numbered steps, which
is a thing to answer by opening `17:28`, not by guessing now.

**And the exit condition's last clause overstates.** `tokens.test.ts` scans
application source under `src` and deliberately exempts tests. "No colour
literal outside tokens.ts" is true of the code that ships, which is what
matters, and the card should say application source.

## The step I am least sure of

**Whether the ten pixel vertical padding is one value or a pattern.** If Input,
Select and Search each carry their own off-scale padding, the honest answer is a
component-density scale in the theme rather than four one-off overrides, and I
would rather decide that when the second one appears than invent it now for the
first. Getting it wrong means either four scattered magic numbers or a scale
invented for a single use.

The related risk is `Tag/Status`: eight variants that differ only by meaning,
which is exactly the shape that tempts a colour prop. The design names them by
meaning, so the API has to as well, or the next person passes `color="orange"`
and the semantic mapping is gone.

## What building the Button found (1 of 8)

**axe never ran.** Every story carried `a11y: { test: 'error' }` and the check
did not exist: `.storybook/vitest.setup.ts` supplied annotations by hand, which
since Storybook 10.3 stops addon-vitest provisioning the ADDON annotations.
Proven by a planted nameless button that passed, then failed in all four
projects once the setup file was gone. Every contrast claim above this line was
made before that, and was unenforced when made.

**A synthetic hover is not a hover.** `storybook/test`'s `userEvent` dispatches
DOM events and a probe showed neither `:hover` nor `:active` applies. So hover
and pressed are proven where they can be, in `contrast.test.ts` against what
the theme emits in both modes, and shown for looking at through
`storybook-addon-pseudo-states`, tagged `!test`, never claimed as tested.

**The tracking is 0.6 percent, not 0.6px.** `get_design_context` reports it as
0.084px at 14px. The plan above said 0.6px, seven times too much.

**Four tokens had drifted one step from Figma**, moved to rescue MUI's
contained button. Restored; see DESIGN.md. Found only because a planted defect
printed a colour that was not in the node.

**The typefaces are never loaded.** SB-143. The label is 4px narrower than the
node because it renders in Segoe UI.

**The browser pane can be hidden, and then it runs no frames.** CSS transitions
never advance, so `getComputedStyle` returns a transition's START value. MUI's
Button transitions its background over 250ms, so every hover and pressed
reading looked like a bug until `document.visibilityState` said `hidden`.
Measure states with transitions switched off, or not at all. Two false
diagnoses and one reverted fix came from missing this.

## Status tag and information panel (2 and 3 of 8)

**The plan said Alert would be MUI's Alert with overrides. It is not, and should
not be.** MUI's Alert renders `role="alert"`, an assertive live region, so a
guide page with five panels would interrupt a screen reader five times on load;
and its four severities cannot express six kinds, two of them dashed. The panel
is layout primitives with `role="note"`, named by its eyebrow. The plan's rule
was never "use MUI's Alert", it was "do not hand-roll what MUI does correctly",
and here MUI's default is the incorrect part.

**The design's rules went into the types, not the docs.** The tag has no colour
prop. The panel's eyebrow is fixed per kind, and `meta` is required for official
information and practical advice, because the design says those two always name
where they came from. Storybook's inference collapses that union to `never`, so
the panel's story uses a harness taking only `kind`.

**Three theme bugs, each latent until a component used the style:** MUI's
overline is uppercase and createTheme merges into it, so Label Small rendered in
capitals; Metadata tracked at a guessed 0.06em against Figma's 8%; and Mono Data
had no Typography variant at all.

**sx multiplies bare numbers.** A tag with `gap: 4` would have been 32px. Every
length passed through sx is a string with its unit.

**danger restored to Figma's red/700**, with the tag as the first thing to paint
it. Every token the first three primitives use now matches the file's
variables; the other five are compared as each is built.

**Persian was unreadable in the mono styles, and only looking showed it.** The
panel's eyebrow and source line in fa-IR had their letters pulled apart. Two
causes, measured apart: the eyebrow carried the 8% tracking, which breaks a
cursive script's joins, and the source line, with no tracking at all, still
broke, because IBM Plex Mono has no Persian letters and the browser fell through
to a monospaced Arabic face. `face()` now sets every mono style in the UI stack
in Persian and tracks nothing in Persian. The story asserts both treatments in
their own combinations. No test had caught it: axe does not judge letterforms.

## Text input (4 of 8)

**Axe found a real problem in the design, and it was precise about it.** The
disabled field's helper is `text-tertiary` at 3.34 on the light page. Axe
skipped the disabled label and value, which WCAG exempts, and failed only the
helper, which is not part of the inactive control: it is the line that says how
to enable the field. It takes the ordinary helper colour; DESIGN.md records it
as a measured departure. Planted a regression, the error text reverted to
MUI's red `danger`, and both the contrast binding and axe failed it at 3.64.

**The boundary is recorded as a judgment, not claimed as a pass.** The field's
stroke is 1.54 on the page and its fill 1.05, so the stroke is what locates a
filled field, under the 3:1 of 1.4.11. Changing how every input looks is the
owner's decision, so it is asked, not done.

**The composition follows the plan roast's warning.** The states live on
OutlinedInput, FormLabel and FormHelperText, not TextField, and the label sits
above the field because MUI's outlined TextField would float it into a notch.
MUI's own defaults were overridden where the design disagrees: it thickens a
focused outline to 2px, turns the label primary on focus and red on error,
fades the placeholder, and paints disabled text through
-webkit-text-fill-color.

## Select (5 of 8)

**The icon rule and the colour rule met, and neither gave.** The exported
chevron baked a hex into each state's SVG, and the colour-literal guard forbids
a hex outside tokens.ts. Both exports turned out to be the same path with a
different fill, and those two fills are exactly `text-secondary` and
`text-tertiary`. So the path is kept verbatim, the layout's offset and rotation
are SVG transforms rather than re-derived geometry, and the fill is
`currentColor` from the theme. Measured rendered: box 9.00 x 6.00, triangle
7.79 x 4.50 in the lower three quarters, 16 from the end, mirrored to the left
in fa-IR.

**An exact assertion caught a quarter pixel.** MUI's select display has a
`min-height` of 1.4375em, 20.125px at 14px, which made the field 40.125 tall. A
tolerance would have hidden it; the story's exact `40px` did not.

## Search input (6 of 8)

**Axe refused two unnamed search landmarks on one page, and it was right.** The
first story put the empty and filled states side by side; landmark-unique
failed in all four combinations. A page has one primary search, so each state
became its own story, and the landmark is named by the field's `label`, which
is required because the design shows no label and a placeholder is not a name.

**The owner's text-field decision applied here without asking again.** He chose
a 3:1 resting stroke for the text field, on the ground that a faint stroke is
all that locates a filled field. The search box is the primary text field, with
the same white fill on the same page, so the same reason holds exactly; it is
flagged to him in the next report rather than decided silently.

**Built on InputBase, not OutlinedInput.** The design's search focuses with a
2px stroke and no ring, is 56 tall and serif; the OutlinedInput overrides carry
the form field's look, and bending them would have been fighting the theme.
