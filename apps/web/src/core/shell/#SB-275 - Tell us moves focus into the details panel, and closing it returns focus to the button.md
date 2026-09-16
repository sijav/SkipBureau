# SB-275, Tell us moves focus into the details panel, and closing it returns focus to the button

**Exit:** in a story, Enter on Tell us puts focus inside the details panel, Escape closes it and
returns focus to Tell us, and the header control's own open and close behave as before; watched
failing.

## What happens now, and why both paths are broken

**Corrected while building.** This section first said the header was fine and only the page was broken,
which is what the card implies. It is not so, and the baseline story proved it: see the account further
down. The header is stranded in the same way; the page is stranded more obviously.

The panel's open state is the shell's, deliberately, "so a rule's answer on the page can open it too"
(SB-257). Two things open it:

- the header's `ContextControl`, through `YourDetails`, which holds it as `anchor`;
- a rule's **Tell us** on the guide, through `Guide.tsx`'s `onAsk` calling `setDetailsOpen(true)`.

`ContextPopper` already does most of what this card asks:

```tsx
onKeyDown={(event) => { if (event.key !== 'Escape') return; onClose(); anchor?.focus() }}
```

That reads as correct for the header, and it is not. The handler only fires with focus **inside** the
popper, and opening the control leaves focus on the button, so Escape closes nothing there either. For
the page path the same fact bites harder:

1. **Focus never moves into the panel.** From the header, the popper is anchored beside the button, so
   Tab reaches it. From the guide, the popper is anchored to the header while Tell us is far down the
   page, so Tab walks on down the document. The card measured it: one Tab reaches "Visit official
   source".
2. **Escape does nothing**, because that handler is on the popper's own div and focus is still on Tell
   us, outside it.
3. **`anchor?.focus()` restores the wrong element.** It is the header's button, not the button the
   reader pressed.

## Where the fix belongs

The shell, because it is the only thing both entry points share. `YourDetails` knows the header's
anchor and nothing about the page; `Guide.tsx` knows its button and nothing about the panel.

**The shell remembers what was focused when the panel opened, and restores it when it closes.** That
is right for both openers with no change to either caller, and it is what "returns focus to the button
that opened it" actually means when the opener can be anywhere.

**`ContextPopper`'s `anchor?.focus()` then has to go.** If the shell restores the opener and the popper
also focuses the header anchor, two things fight over focus on every close and the page path loses. For
the header the remembered element *is* that anchor, so the restore lands in the same place; what does
change there is that focus now enters the panel on open, and Escape closes from inside it, which is the
improvement recorded below rather than a regression.

## What changes

- `src/core/shell/ShellProvider.tsx`: on the change from closed to open, `setDetailsOpen` records
  `window.document.activeElement` **synchronously, in a ref**, not in an effect. Closing takes a
  `restoreFocus` flag, and only a close that asks for it puts focus back.
- `src/shared/context-control/ContextPopper.tsx`: its `anchor?.focus()` goes, for the reason above.
  Escape and the click-away call close with the flag each deserves.
- `src/shared/context-control/ContextPanel.tsx`: the visible dialog heading takes `tabIndex={-1}` and a
  ref, and is focused when the panel opens.
- `src/core/shell/shell.ts`: `setDetailsOpen` takes an options argument, so a caller can say that this
  particular close must not put focus back.
- `src/shared/context-control/YourDetails.tsx`: `go()` closes without restoring, and the popper's
  `onClose` is wired to pass each close's flag through to the shell.
- The stories the exit names, plus the two cases below that it does not.

## Restoration is deliberate, not universal

The plan first said the shell restores focus on every close, guarded by `window.document.contains`.
That is wrong, and the check named both ways:

- **`go()` must not restore.** React Router can defer a navigation into a later commit, so the old
  button is **still connected** when the close runs. `contains` would pass and focus would land on a
  control belonging to a page that is leaving. My guard tested the wrong property: whether the node is
  connected, not whether the page survives.
- **Click-away must not restore.** MUI's `ClickAwayListener` fires on the trailing `click`, after the
  reader has already pressed something else, so restoring would **steal focus back** from a target they
  chose on purpose. I had not counted click-away as a close path at all.

So: **Escape and the header toggle restore. `go()` and click-away do not.**

## Focus goes to the heading, not to a wrapper

Not the popper's anonymous `div`. The panel's visible heading takes `tabIndex={-1}` and is focused, so
assistive technology starts at something with a name rather than at an unlabelled container, and Escape
still bubbles to the popper's handler. That is the WAI-ARIA dialog pattern, and it also avoids fighting
the `autoFocus` field already inside one of the panel's rows.

Nothing else. No new component, no new string: this is focus behaviour, and it adds nothing a reader
reads.

## How it is checked

The exit names three things and they are three assertions, in the guide's story for Tell us and in
`YourDetails.stories.tsx` for the header control, whose opening and closing must keep working.

**Two cases beyond the exit, because without them the exit can pass while the feature regresses.** A
close that navigates, choosing a city, and a close by clicking elsewhere must each leave focus alone.
The exit's three assertions say nothing about either, so a universal restore would satisfy the exit and
still steal focus from a reader's deliberate click. That is the same shape as SB-394, a branch no story
exercises, and it is cheaper to write now than to find later.

**The header's baseline does not exist yet, so it has to be established rather than preserved.** The
exit says the header control behaves "as before", but every play in `YourDetails.stories.tsx` drives
the panel by mouse: not one presses Escape and not one asserts focus. So "as before" currently rests on
nothing. The keyboard assertions for the header go in first, watched passing against the unchanged
code, and only then does the shell change land. `ContextPanel.stories.tsx` is the house precedent for
how these are written: it both presses keys and asserts focus.

**What that baseline turned out to prove, and why it was then amended.** It was written first and
watched passing, nine tests green against untouched code, and it established two things: the header's
keyboard toggle worked, and focus stayed on the control while the panel was open. The second of those
is exactly what this card removes, so the same story failed the moment the change landed, on
`expect(control).toHaveFocus()`.

That is not a regression and the story was not relaxed to hide one. "Behaves as before" cannot mean
"focus must not move", because moving focus is the card. Opening still opens and clicking the control
still closes; what changes is that a second Enter no longer closes it, because focus has correctly left
the control, and Escape now closes it and hands the control back. **The header had the same defect as
the page** and this fixes both: before, Enter left a keyboard reader stranded on the control with the
panel unreachable and Escape doing nothing. The card reads as though only the page path were broken.

So the baseline did its job, which was to make the claim about the header testable rather than
asserted, and it then became the header half of the exit.

Watched failing by hand, each separately: without the focus-into-the-panel change, Enter on Tell us
leaves the active element on the button; without the shell's restore, Escape leaves focus in the
header or nowhere.

Run with `npm run test:storybook -w @skipbureau/web`, one project at a time, and then the browser,
since focus is a thing to watch rather than infer.

## What the plan check said

It found the defect in the step I had flagged, and gave a better answer than my guard: restoration must
be **deliberate rather than universal**, because `contains` tests connectedness and not survival, and
because click-away closes after the reader has already chosen another target. Both are recorded above,
with what each close path now does.

It corrected the capture too: synchronously on closed to open, in a **ref**, not an effect, which my
plan had left vague.

It replaced my wrapper with the panel's visible **heading**, `tabIndex={-1}` and focused on open, as
the WAI-ARIA dialog pattern asks. Better than my instinct, and it avoids fighting the `autoFocus` field
the panel already has in one of its rows.

It confirmed the header path, which was my third question: `ContextControl`'s `ButtonBase` keeps focus
on the outer button however it is opened, that button is the stored opener, and interacting inside the
panel does not replace it. So removing `anchor?.focus()` is safe once restoration is centralised.

## The step I am least sure of

Whether "the header toggle restores" is one case or two. Clicking the control while the panel is open
closes it, and focus is already on that button, so restoring is a no-op. Pressing Escape inside the
panel is the case that matters. If those turn out to need different handling, this is where it will
show, and the header story is what will show it.
