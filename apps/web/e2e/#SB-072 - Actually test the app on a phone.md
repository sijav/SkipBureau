# SB-072, Actually test the app on a phone

**Exit, as the card states it:** every screen passes at 390x844 and 768x1024 in
both languages, with no horizontal scroll and no tap target under 44px.

**Read as "both directions", not "both languages".** The owner, 2026-09-10:
"RTL is for Indian, Arabian etc too and this project is going to be multi
language, are you going to add test for all those languages?" So the axis is
left-to-right and right-to-left, which is what actually changes a layout, and
Persian is the catalog that happens to be right-to-left.

## What a first sweep found, before writing anything

Every prerendered page, 49 of them, at both sizes, loaded from the built site
served the way GitHub Pages serves it:

- **Nothing scrolls sideways. Nothing sits off the side. No text is clipped
  inside its own box.** That half of the exit condition already holds, on every
  page, at both widths, in both directions. SB-079 was right that the existing
  guard could not have proved this; a sweep of every element's box at those
  widths can, and does.
- **Tap targets are the whole of what is wrong**, and they are the same handful
  repeated on every page because they are all in the header: the wordmark, the
  two navigation links, the language button, Add your details, the Ask field
  and its button. Then a few in the page: a question chip, a source link, and
  Suggest an update.

## There is no mobile design, which decides how to fix them

`DESIGN.md` and SB-019: the Figma file's mobile pages are empty. So at phone
widths there is no design to match, and making a control taller there deviates
from nothing. Above the phone breakpoint the design is the authority and the
sizes stay exactly as they are.

The fix is therefore **hit area, not appearance**, and only under the phone
breakpoint: padding and a minimum height on the control, so what a finger lands
on is 44px while what the eye sees is unchanged. Where a link is a run of text
inside a sentence, it is left alone: WCAG excludes text in a sentence from the
target size rules, and padding one would break the line it sits in.

## The change

- A minimum tap height on the header's controls at phone and tablet widths.
- The same for the Ask field and its button.
- The same for the standalone links that are their own row: a source link,
  Suggest an update, a question chip.
- `e2e/phone.spec.ts` in the **pages** project, against the built site: the
  home, a hub, a guide and the search results at 390x844 and 768x1024, each
  direction, asserting no sideways scroll, nothing off the side, and no target
  under 44px. It goes in that project because it is the one that runs, locally
  and against the deployment; the `dev` project has thirteen failures on stale
  addresses that predate this card (SB-146, SB-115).
- Then the things a script cannot see, in a browser at 390 wide: the Ask panel
  over the keyboard, the context panel, the suggest dialog, and a guide read
  end to end in both directions and both schemes.

## Least sure of

- **Whether 44 is the right number for a text wordmark.** WCAG 2.2's minimum
  is 24x24 (AA); 44x44 is the AAA figure and Apple's guidance. The card says
  44, so 44 it is, but the wordmark reaching it by padding rather than by
  growing is the only way that does not change the header.
- **Whether the sweep's idea of a target matches a finger's.** An input inside
  a padded wrapper is tapped by its wrapper, not its own box, and the first
  version of the sweep reported those as failures. It now measures the wrapper.
  Anything else it reports is checked by looking before it is changed.

## How it is checked

The sweep again, over every page at both sizes, until it is silent; the new
spec, which must fail when a control is made small again; and a phone-sized
browser for what only a person can see.

## What was found and changed

The sweep named ten controls, all of them under 44 and none of them off the
side. Each is now a real 44, below `md` only:

- the header's wordmark, by padding, because it shares a baseline with its mark
  and a taller box would leave the pair at the top of it;
- its navigation links, by padding in both directions, since a short word like
  Guides is under a finger across as well as down, and their own `::after` is
  the current-page underline and could not be borrowed;
- Add your details, the language button, and the header's Ask field;
- every `Button` and every outlined field, in the theme, because the rule is
  about the hand holding the phone rather than about any one control;
- Home's example questions and the checklist rows, which were 24 and 40;
- the source link and How it works, which had to become boxes before they
  could have a height.

**The first version of the fix was invisible and was thrown away.** It grew
what a finger lands on with an absolutely positioned `::after` over each
control, which moves nothing and looks identical. `getBoundingClientRect()`
does not include pseudo-elements, so the sweep reported every one of those
controls as still too small, and would have gone on reporting it however well
the page behaved. A fix a check cannot see is not a fix; the boxes really grow
now.

One thing the sweep could not have found, because the address has no file and
so was never swept: in the suggest dialog at 390 the "No account needed"
caption shares a row with two buttons and had 50 pixels for 52 of text, cut
off. It takes its own line below `md`.

## What was checked, and what it showed

- The sweep, over all 49 prerendered pages at 390 and 768, 98 loads: **nothing
  runs off the side, nothing is clipped, no page scrolls sideways, and nothing
  is under 44**. It is believed because it was watched failing: it named those
  ten controls before the change and named them again, correctly, when the
  first invisible fix was tried.
- `e2e/phone.spec.ts`, four tests over seven addresses each, including the
  three that have no file of their own and arrive as `404.html`: the suggest
  dialog, a search, and a Coming soon page. Planted against a `tapHeight` that
  grows nothing, all four fail; restored, all four pass, and the whole pages
  project is 15 of 15.
- A guide read to its foot at 390 in Persian dark and English light, and the
  Ask panel and the details panel opened on a phone: the panels are 358 wide
  inside a 390 viewport, and nothing scrolls sideways with either open.

