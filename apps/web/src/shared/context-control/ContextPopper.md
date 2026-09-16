# ContextPopper

The context panel, open beneath its control: a click elsewhere or Escape puts it
away.

**Those two closes are not the same, and SB-275 is why.** Escape is the reader
asking for the panel to go, so focus goes back to whatever opened it, which may
be this control or a rule's Tell us far down a page. A click elsewhere has
already put the reader somewhere they chose, so taking focus back from it would
be wrong. The popper says which kind of close happened and the shell decides
where focus lands; this component no longer focuses the anchor itself, because
the anchor is not always the opener.

## Props

- `anchor`: The control it opens beneath, which toggles it itself.
- `onClose`: Called when the panel should close, with whether focus should be
  put back where it was when the panel opened: `true` from Escape, `false` from
  a click elsewhere.
