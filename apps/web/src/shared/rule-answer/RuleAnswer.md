# RuleAnswer

One rule a guide links, shown for the reader (SB-257). The design draws no rule
answer, so this is a departure recorded in DESIGN.md's Guide Detail section.

A rule's words are its notes, the agreed prose, each in its own language. Each
fact is a line: what it is, from the interface's labels; what it says, the
value; and the page it was read on with the day it was checked. A fact with no
label shows no line.

**The rule for everyone** is the country-wide rule, shown where a detail the
reader has not given can change it, with that detail named and a way to give it.
It is never presented as the reader's own answer. The caption names the lines and
notes under it, so a rule with no version for everyone, which has none, is never
called that: it shows only the detail that decides the answer and the way to give
it (SB-271). **For you** is the answer for what the reader has said, with the
facts it takes from wider places. A rule that does not apply says so.

**Two rules that both apply** show why and pick neither, and name the detail that
could settle it with a way to give it (SB-276). The wording says *could help*
rather than promising a resolution: `needs` means a detail may break the
ambiguity, and the resolver can still answer `needsReview` once it is given. The
rule for everyone's facts stay on such a card, because they come from the
unpersonalised guide query and are a baseline the reader can still use, not a
claim that either competing rule is theirs.

## Props

- `title`: The obligation's title.
- `state`: `answered`, `general`, `needsReview` or `noRule`.
- `lines`: Each labelled fact, with its value and its page.
- `notes`: The rule's notes, each with its language.
- `asks`: The detail that can change the rule for everyone, or decides a rule that has no such version, or could
  settle which of two rules that both apply is the reader's, in words.
- `reason`: Why two rules apply, for `needsReview`.
- `onAsk`: Opens the details panel, where the reader gives the detail. Left out
  when nothing can take that detail yet, and then the card says so in place of
  asking: a button that opens a panel with no row for the question is worse than
  no button (SB-300).
