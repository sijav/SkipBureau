# SB-184, Say which Berlin permits the online-before-expiry footnote covers

**Exit:** `berlin-online-before-expiry`, or a definition beside it, quotes an official page whose
words cover every permit the sentence speaks of, or the sentence and the locator name the one permit
the page covers; and the residence-permit conversation's last pass answers no.

## What the sentence claims, and what its page says

The sentence is:

> In Berlin, submit the employment-permit application through the dedicated online application
> before your current permission expires; you do not need to wait for an appointment.

`berlin-online-before-expiry` cites page 329328, which is titled "Aufenthaltserlaubnis für Fachkräfte
mit akademischer Ausbildung beantragen", scopes itself with "Einer Fachkraft mit akademischer
Ausbildung wird eine Aufenthaltserlaubnis zur Ausübung jeder qualifizierten Beschäftigung erteilt",
and names only § 18, § 18b and § 257. "the employment-permit application" is broader than that.
SB-174's check was right.

## The evidence I gathered, and why it does not support the sentence

Four of Berlin's service pages, each fetched at 200 on 2026-09-16, give byte-identical
Verfahrensablauf step 1, "Stellen Sie den Online-Antrag „Befristeter Aufenthaltstitel zur
Beschäftigung“.": 329328 (§ 18b), 305304 (§ 18a), 328457 (§ 18d, § 18e, § 18f) and 350471 (§ 19c,
§ 26 BeschV).

**The first draft of this plan read that as proof the application serves the employment family. It
is not, and the check refused the plan over it.** Four pages prove those four permits use that
application. They say nothing about a permit nobody sampled. Under README.md's rule that a
definition's evidence carries the whole claim, writing "the employment-permit application" on that
basis is synthesis by the author, not a quoted claim.

**The boundary argument was worse, and the fact that kills it was already in my hand.** I used page
328332, freelance work under § 21, which names a different application, as evidence of where the
employment boundary falls. That page is sound only for what it states: freelance applicants are sent
to a differently named form. It cannot establish a category. And page 354301, the Chancenkarte, uses
the *same* application for a **job-seeking** title under § 20a, which positively refutes the claim
that the application is the employment family's. I noted that page and reasoned past it.

## What changes: enumerate the four, never a class

`apps/api/prisma/research/agreed/germany/residence-permit.md` only.

Both checks refuse the class claim and they differ on the remedy. The plan check says scope the
sentence to § 18b and keep one definition, because the API rule only serves § 18b today. The
research conversation says enumerate the four evidenced routes. **I take the enumeration**, and the
reason is not preference: enumerating makes the sentence and the evidence exactly coextensive, which
is what README.md asks, and scoping to § 18b throws away three pages already read and verified and
leaves the guide silent for a reader on § 18a or § 19c who genuinely can use that form. The owner's
order of 2026-09-15 is to take the wording a check gives where it keeps the meaning.

- **The sentence enumerates**, close to the conversation's wording:

  > In Berlin, applicants for the residence permits for academic skilled workers, skilled workers
  > with vocational training, research employment, and employment of certain nationalities submit
  > the online application "Befristeter Aufenthaltstitel zur Beschäftigung" while their current
  > title is still valid; the LEA assigns any necessary in-person appointment after reviewing the
  > online application.

- **Four definitions, one per page**, each `"read": "2026-09-16"`, `"method": "raw page"`,
  `"locator": "Verfahrensablauf, Schritte 1 bis 3"`. Each quotes **both** halves the sentence rests
  on, which the second plan check required and the first draft got wrong:
  - the named application, byte-identical on all four: `Stellen Sie den Online-Antrag „Befristeter
    Aufenthaltstitel zur Beschäftigung“.`
  - **that page's own confirmation condition** about a title not already expired. The sentence says
    "while their current title is still valid", and carrying that evidence only from the § 18b page
    would leave the other three routes partly unsupported. Each page states it for itself.
- **The appointment clause is sourced and reworded.** "the LEA assigns any necessary in-person
  appointment after reviewing" claims something no page states: "any necessary" appears nowhere. The
  check's wording replaces it: **"The LEA reviews the application and, if it is positively reviewed,
  you receive an appointment to attend in person."** That is exactly what steps 2 and 3 say, and
  they are identical on all four pages: "wird das LEA den Antrag prüfen und sich schnellstmöglich
  bei Ihnen melden" and "Wenn Ihr Antrag positiv geprüft wurde, erhalten Sie einen Termin zur
  Vorsprache."
- **The sequence is what answers the reader's question**, which was the risk in dropping "you do not
  need to wait for an appointment". Submit online first, the LEA reviews, a positive review leads to
  an appointment: that tells a reader not to wait for an appointment before applying, without
  claiming more than the pages say.
- `berlin-online-before-expiry` keeps page 329328 and its PDF-confirmation quote, which is what
  "while their current title is still valid" rests on. Its existing `read` stays 2026-09-14.
- The source list gains 305304, 328457 and 350471, each labelled with its permit, the way 329328 is
  already labelled "(§18b)". The closing read-date line gains 2026-09-16 rather than having
  2026-09-12 edited.

**The Chancenkarte stays out**, on Berlin's own words: it is a permit "to search for employment",
and sharing the form is procedural routing rather than evidence that it is an employment permit. The
§ 21 boundary claim from the first draft is deleted outright.

## What was right in the first draft, and stays

Excluding the online form's URL structure, `.../index?parameter=329328`, as evidence. It is
consistent with one form serving many services, and it is an inference from a URL rather than
something a page states, so it is not quotable under this repository's rule. It is named here and
not used.

## Where the research pass is recorded

Corrected from the first draft, which pointed at a file the repository does not keep.
`apps/api/prisma/research/.gitignore` excludes `*.txt` and says why: "What is said goes into the
transcript under `talk/`, which is the record. These are only the way a long message is handed to the
script." So `ask-sb184-germany-berlin-online.txt` is scratch, and the pass is recorded in
**`apps/api/prisma/research/talk/germany/residence-permit.md`**, which is tracked.

**Corrected 2026-09-16: it COULD have been met, and I was wrong to say otherwise.** `roast.mjs`
has no flag for a session, but line 497 reads the id from `sessions["${kind}:${brand}"]` in
`.claude/roast-sessions.json`, which is ordinary project state. Writing the subject's id there
before firing resumes that exact thread. I only read the flag list and concluded it was impossible.
SB-357 carries the sign-off that is still owed, and names the method. What follows is what I
believed at the time and acted on.

**The exit's clause about "the residence-permit conversation" was not met, and this
plan does not pretend it was.** `roast.mjs` takes the session id only from the shared slot for its
kind, `const sessionId = args.fresh ? null : (sessions[sessionKey] ?? null)`, and its whole flag list
is `--title --why --exit-condition --did --files --diff --model --ask --fresh`. There is no way to
name a conversation. So the ten per-subject sessions recorded in the `talk/` headers, residence
permit being `01a093c2-4c44-7dd2-b927-478f5d8922e6`, cannot be resumed by choice: they were kept
only by researching one subject at a time, and the slot has since moved on.

This card's pass therefore went to `01a09371-2c9c-7e33-a46c-8bcb6e01c583`, the current
`search:codex`, a conversation that had not read the residence-permit thread. The answer is still
usable, and it was checked against the pages rather than taken on trust: every quote it relies on
was read from the official pages here on 2026-09-16. But it is not a continuation of the
residence-permit conversation, and the record in `talk/` says so.

## How it is checked

SB-184 is a child of SB-167, so it closes on what covers the file it changes:
`research-rules.e2e.spec.ts` run **whole**, because it loads the research inside an earlier test and
a `-t` filter on a later one sees no researched obligation, plus `research-regions.e2e.spec.ts`. The
definition read-date rule is enforced there: every label a version or fact names must be verified, on
the source's URL, and read on the day the source names.
