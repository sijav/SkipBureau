# RetryNotice

One request on a page failed and the reader can ask again. It is said **beside**
what is still on screen rather than replacing it, which is the whole difference
between it and the `Unreachable` screen: that one stands in for a page that could
not load at all, and this one says that part of a page is missing while the rest
of it is still worth reading.

The design draws no such notice, so it borrows `InformationDisclaimer`'s
register: a recessed surface, no bar and no icon, so it reads as a note rather
than a warning. That is deliberate. A request that failed is not a warning about
the content, and the panels that are warnings say so in their own eyebrow, which
`InfoPanel` fixes per kind so no caller can relabel one register as another.

**It is a live region, `role="status"`, where `InfoPanel` is a `note`.** Same
reasoning, opposite conclusion: a panel is part of the page from the first paint,
so announcing it would interrupt for nothing, while this appears only when
something fails. A reader whose attention is elsewhere on a long guide should be
told that, politely, which is what a status region does and an alert does too
loudly.

The caller owns the sentence. Only it knows what the reader lost, and the same
notice serves any request a reader can ask for again.

## Props

- `children`: what failed, in the caller's words, already translated.
- `onRetry`: called when the reader asks again. The caller decides what is re-run
  and with what policy.
