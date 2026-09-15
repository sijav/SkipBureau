# RuleAnswer

One rule a guide links, shown for the reader (SB-257). The design draws no rule
answer, so this is a departure recorded in DESIGN.md's Guide Detail section.

A rule's words are its notes, the agreed prose, each in its own language. Each
fact is a line: what it is, from the interface's labels; what it says, the
value; and the page it was read on with the day it was checked. A fact with no
label shows no line.

**The rule for everyone** is the country-wide rule, shown where a detail the
reader has not given can change it, with that detail named and a way to give it.
It is never presented as the reader's own answer. **For you** is the answer for
what the reader has said, with the facts it takes from wider places. Two rules
that both apply show why, and pick neither; a rule that does not apply says so.

## Props

- `title`: The obligation's title.
- `state`: `answered`, `general`, `needsReview` or `noRule`.
- `lines`: Each labelled fact, with its value and its page.
- `notes`: The rule's notes, each with its language.
- `asks`: The detail that can change a general answer, in words.
- `reason`: Why two rules apply, for `needsReview`.
- `onAsk`: Opens the details panel, where the reader gives the detail.
