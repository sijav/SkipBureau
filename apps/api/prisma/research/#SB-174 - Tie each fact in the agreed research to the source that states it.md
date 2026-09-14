# SB-174, Tie each fact in Germany's agreed research to the source that states it

**Exit:** in every document in `agreed/germany`, every fee, deadline, threshold
and fine names the source URL that states it, verified by exact source evidence
or a transcription of the rendered original, or is marked calculated from
verified inputs, and a figure picked at random opens a page that says it.

(The card was titled for all of `agreed/`. Its third plan check split it: this
file keeps its name, and the plan below is for Germany.)

## Why it comes before the rules

SB-170 turns Germany's documents into rule rows, and every row carries one
`sourceUrl`. Today each document lists its sources once, at the end, under one
date. Across the four German documents that is roughly 60 figures and 40 URLs,
and nothing says which page states Hamburg's €16, the €1,000 fine ceiling or the
€25,000 small business ceiling. Whoever writes a row would have to guess.

## Why Germany alone

Three plan checks shaped this card. The third was right that one card across
ten documents lets Turkey's hardest sources hold Germany's rules back. Testing
this plan showed how hard Turkey may be: the SEDDK press release that
`agreed/turkey/health-insurance.md` cites for "the limits and Annex 1" opened as
a one page announcement that states none of the ₺15,000, ₺150,000 or ₺250,000
figures and lists no hospitals. Turkey is SB-182, which blocks SB-169 and builds
on what lands here: the format, the rules for what counts as verified, and the
locks in `research.py`. This card blocks SB-170.

## What counts as a figure

Every number or date a reader could act on: fees and charges, deadlines and
periods, thresholds and ceilings, fines, rates and percentages, and the dates a
rule took effect. A statute citation on its own, `§81(4)`, is not a figure; its
page is already a source.

**No figure is left out by the conversation forgetting it.** Before asking, a
one-off search lists every number, amount, percentage, date and number word
("ninety days", "one month") in a document's narrative text, leaving out its
headings and Sources. That list goes into the transcript beside the inventory,
and each entry on it ends with a footnote or a specific reason it is not a
figure a reader acts on: a paragraph number, a case identifier, a year in a
law's name. It is a search run once, not a tool kept.

**A figure calculated here, rather than read**, is marked `calculated`, and only
once its case's conversation has established the formula, each input and the
rounding, each input itself verified. Looking arithmetical is not enough: the
self-employed monthly minimum of "about €222.80" goes back into its conversation
before it is marked anything. No page states a calculated result, so it cannot
"name the page that states it", which is why the exit says so plainly, and
SB-170 never asserts a calculated figure as a rule fact.

## How a figure names its source

A Markdown footnote straight after the figure, `**€16**[^hh-fees]`, and one
definition **per attributed figure**, not per URL: a page that states several
figures states each in its own words at its own place, so each gets its own
label, evidence and locator, and several labels may share a URL. The shape is
strict, so a script parses it without guessing: the URL in angle brackets, then
exactly one JSON object.

```md
[^bmg-fine-ceiling]: <https://www.gesetze-im-internet.de/bmg/__54.html> | {"status": "verified", "read": "2026-09-14", "locator": "§ 54(3)", "evidence": "in den übrigen Fällen mit einer Geldbuße bis zu tausend Euro geahndet werden"}
[^gkv-self-employed-minimum]: <https://www.bundesgesundheitsministerium.de/beitraege/seite> | {"status": "calculated", "read": "2026-09-14", "inputs": ["gkv-minimum-base", "gkv-general-rate", "gkv-average-additional-rate"], "formula": "base * (general rate + average additional rate)", "rounding": "to the cent, half up"}
[^berlin-vab]: <https://www.berlin.de/einwanderung/service/downloads/artikel.875097.php> | {"status": "unverified", "read": "2026-09-14", "reason": "the page links a document that did not open"}
```

`status` is only ever `verified`, `unverified` or `calculated`. `verified`
carries `evidence`; `unverified` carries `reason`; `calculated` carries
`inputs`, which are other labels, with the `formula` and `rounding` its
conversation established. Where a list line bundles several paragraphs of one
law, each paragraph's figures get their own definitions. JSON rather than pipe-separated fields, because a
locator or a reason can itself contain a pipe. GitHub renders named footnotes,
including straight after bold text, and shows the JSON as the note's text.

**The prose does not change by a word.** The agreed text may not be softened,
sharpened or given colour, and a marker is none of those.

## Who says which page states which figure

The owner's order of 2026-09-12: what a government requires is researched
through GPT, one conversation per case, resumed, and argued until both sides are
satisfied. Which page states Hamburg's €16 is that kind of fact, and I did not
read those pages; each case's conversation did. So, per German case, in its own
session:

1. I send the agreed text and ask for an inventory: every figure, each with the
   single URL it read that states it and the section or page, from the Sources
   list or a deeper page on the same official host, and plainly where no page
   it read states the figure. The inventory stays in the case's transcript.
2. I check it against the script's list of every figure in the text, and
   against the Sources list. Anything missing or off the official host goes back
   into the same session, until a pass raises nothing new.
3. I verify every distinct attribution by opening its page, then write the
   markers, then send the annotated document back once: does any marker attach a
   figure to a page that does not state it? A one-line no is the answer asked
   for.

## Seeing the figure on the page

**What counts as seen**, in this order:

- the page fetched with `curl` and its text searched: the figure present in the
  page's own words, kept exactly as written, `964,00 TL` stays `964,00 TL`;
- a host that refuses `curl`, opened in the browser pane and searched the same
  way in the text it returns;
- a PDF or an image saved and read by me from the rendered original, with the
  page or image named and an exact transcription of what is visible.

A quote from a fetch tool that has a model summarise the page does not count: it
can paraphrase, and it can invent.

**The evidence carries the whole claim, not just the number.** `evidence` is
the page's own words for the value with everything that qualifies it: the
comparator ("bis zu", "mindestens", "no more than"), both ends of a range, the
period ("je Seite", "monatlich"), and a date as the date it is. A figure whose
evidence does not show all of that is not verified: a ceiling quoted without its
"bis zu", or "4 bis 6 Wochen" quoted for "six weeks", fails.

**I compare the evidence with the document's figure by reading both**, and the
definition keeps both side by side, so anyone can check any match without
running anything. The third and fourth plan checks asked for a normalising
script to make that comparison instead. I have not written one: the owner's
order of 2026-09-10 is no new checking apparatus, nothing that blocks, scores or
refuses, and a script that refuses matches is exactly that. What the checks were
guarding against, a fetch tool's model paraphrasing a page, is already ruled
out, because the evidence is copied from the page's raw text and kept.

A page none of those can open leaves its figures `unverified`, with the reason,
and a figure not found on the page it was given goes back into its conversation.

## The random check the exit asks for

An independent check on the verification, not the evidence itself: two figures
per document, drawn from its verified markers by a script rather than chosen by
me, opened again and matched again. Recorded in `README.md` with the figure, the
page and the evidence.

## `research.py` cannot run two cases at once

Every turn writes the answer to one shared `.last-message.tmp` and rewrites the
whole of `sessions.json`, so two cases running together would read each other's
answers. So:

- **the answer file is per case**, `.last-message-<country>-<rule>.tmp`;
- **a case is locked while it has a turn running**, by a lock file created
  exclusively (`O_CREAT | O_EXCL`) holding the process id, the start time and
  the case, so one conversation is never resumed twice at once and a new case is
  never opened twice;
- **`sessions.json` is updated under a short lock of its own**: re-read, merge
  this case's id, write a temporary file, flush it, and `os.replace` it over the
  old one, retrying the replace a few times because Windows refuses it while
  another program holds the file;
- **a lock is never expired by age.** A slow turn and a dead one look the same by
  the clock, and stealing a live turn's lock lets two writers in. A run that
  finds a lock refuses, naming the file, the process and when it started; a lock
  left by a killed run is removed by hand after checking the process is gone.

The owner said this script needs no test, only to work, so it is run: two cases
at once, each answer landing in its own transcript and both ids in
`sessions.json`. Germany's four cases then run two at a time.

## When it is finished

Only when every German figure is `verified`, or `calculated` from verified
inputs. An unverified figure goes back into its conversation for another
official page that states it and can be opened; if it still cannot be verified,
the card stays open and what is left is said plainly.

## Files

The four documents under `agreed/germany`, their transcripts under
`talk/germany`, `research.py`, `.gitignore`, and `README.md`.

## The step I am least sure of

**Comparing evidence with figures by reading, about sixty times.** Recorded
evidence makes every comparison checkable afterwards, but checkable is not the
same as checked: a slip of mine, a "bis zu" I read past, stands until someone
looks. The fixed-point turn and the random recheck are the two looks this card
builds in. I think that is proportionate to the owner's rule against
apparatus, and it is the part of this plan a reviewer should push on.

## As built, 2026-09-14

The plan above is kept as it was checked. This records where the work went
another way, and why.

**A calculated figure names no page.** The plan's example gave one a URL. The
definition reads `[^label]: calculated | {json}` instead, because naming a page
that does not state the result would be the misleading source this card exists
to remove.

**The plan's calculated example is not calculated.** "About €222.80" is stated
by the Ministry of Health's contributions page, in its table of monthly
contributions, with a note tying it to the 2.9% average. It is `verified`, and so
is €230.71.

**`evidence` is a list, and every definition says how its page was read.** A
claim often rests on more than one passage of a page: a list item and the
paragraph that sets its fine, a table row and its column headings. So `evidence`
is a list of exact passages, and `method` is `raw page`, `rendered PDF` or
`browser pane`. A passage that runs over a PDF page break is two pieces, one per
page.

**A figure can carry two definitions.** Where the conversation's page and the
sentence differed in kind, a second page was added: the landlord's two weeks is
a federal rule that had only a Berlin page, and applying before a permit expires
is a Berlin instruction that had only the statute. The €50,000 fine carries
§19(6) BMG beside §54, because §19(6) is what makes an address fictitious, and
€1,318.33 carries a Bundestag research paper beside the Ministry's table,
because only the paper states the base as monthly.

**No German figure is `unverified`.** Every one is verified, or calculated from
verified inputs: 89 definitions on 92 markers, 83 of them verified.

**Pages are compared in Unicode's composed form.** One Ministry page writes
`fünften` with a combining mark, and a literal search for its passage failed
although every word was on the page.

**The fixed-point turn did not come back as a one-line no at first.** Reading
each passage against its sentence found ten quotes that stopped short of what
the sentence says. The turn then found six more, each a condition left out of a
quote: the refusal that triggers §19(2) BMG, the actual move-in that "in diesem
Fall" refers to, what makes an address fictitious, a business itself and not
only its branches, "actual" turnover, and the €25,000 ceiling beside the
€100,000 one. Each was extended from the page, the three documents went back
once more, and all four have now answered no.

**The random draw** is in `README.md`: eight definitions, two per document, all
found. One of them, the first-year €25,000 ceiling, gained a sentence after it
was drawn, and the added sentence was found on its page too.

**The step I was least sure of was the right one to doubt.** Comparing by hand
let sixteen incomplete quotes through at first. Reading again caught ten and the
last pass caught six; neither look alone would have been enough.
