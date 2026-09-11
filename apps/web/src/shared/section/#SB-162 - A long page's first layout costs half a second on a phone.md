# SB-162, A long page's first layout costs half a second on a phone

**Exit:** on the live guide with the phone profile, the trace's first layout
before first paint is measurably shorter and first paint no later, measured the
same way before and after; the page does not shift as sections come into view,
and the pages e2e passes.

## Measured before

Live guide, phone profile, three traces: the task before first paint is 439,
346 and 353 ms, of which Layout is 383, 308 and 311 ms, beginning at about
0.63 s. First paint lands at 0.99 to 1.01 s and is still the largest paint.
The browser is laying out the whole guide, every section down to the sources,
to paint the first screen of it.

## The change

`content-visibility: auto` on the page's sections, in the two components that
draw one: `Section` (the hubs and home) and the guide's `SectionFrame`. A
section in view renders as it does now; one below the fold has its layout and
paint skipped until it comes near. `contain-intrinsic-size: auto 400px` gives
the skipped ones a placeholder height, and `auto` makes the browser remember
each one's real height once measured, so the scrollbar settles rather than
jumping as the reader scrolls.

The markup does not change. The text stays in the DOM, in the accessibility
tree, and findable: Chrome renders skipped content for find in page and for an
anchor jump.

## Least sure of

- **Paint containment clips.** `content-visibility: auto` contains layout,
  style and paint even while a section is visible, so anything drawn outside a
  section's box, a focus ring with a positive offset at the very edge, a
  shadow, would be cut. The rows and cards inside have their own padding, so
  nothing should reach the edge, but this is checked by tabbing through a
  guide in a browser and looking, not by reasoning.
- **Search engines.** The content is in the DOM and rendered on demand, which
  is the documented difference from `content-visibility: hidden`. Since SEO
  outranks the half second here, the live file is read back after deploying to
  confirm the text is still in the HTML, and the pages e2e, which asserts the
  guide's body in the file, is the guard.

## Measured after

Live guide, phone profile, three traces and three loads:

- the first Layout before first paint is 239 and 268 ms, from 308 to 383 ms,
  but a second pass of 62 to 81 ms now follows it in the same task, for the
  sections coming into view: **the layout work in total is about what it was**,
  which is not what this card expected;
- first paint and LCP are 908 to 960 ms, from 988 to 1008 ms;
- blocking time is 162 to 172 ms, from 230 to 266 ms.

So the win is real but it is in first paint and in blocking time, not in the
layout total. Scrolling a guide through on a phone profile shifts nothing, CLS
0.0000 in both schemes, and the page's height settles from 6948 to 8047 px as
real heights replace the placeholder, which moves a scrollbar and nothing a
reader is reading. Every section's text is still in the live HTML, and the
pages e2e passes against the live site, 10 of 10.

## How it is checked

The same three traces against the live site afterwards, first paint from the
phone script, a scroll through a guide in both schemes watching for shifts and
clipped focus rings, and the pages e2e.
