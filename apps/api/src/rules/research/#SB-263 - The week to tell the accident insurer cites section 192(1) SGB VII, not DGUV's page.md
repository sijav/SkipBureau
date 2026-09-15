# SB-263, The week to tell the accident insurer cites §192(1) SGB VII, not DGUV's page

**Exit:** the deployed API's answer for a founder's notify-the-accident-insurer carries the one
week on <https://www.gesetze-im-internet.de/sgb_7/__192.html> with its read date,
`research-rules.e2e.spec.ts` reads the new label back from the agreed document, and the case's
publish reports live.

## Why

SB-170's plan check found that the founder's one week to tell the accident insurer rests on
DGUV's page, the page of the statutory accident insurers' umbrella association, a registered
association, because it was the only definition in `agreed/germany/business-registration.md`
that states the week. §192(1) SGB VII states the whole duty, so by the rule for choosing a page
(SB-190) the fact moves to it once the document defines it. SB-170, Germany's check of the
whole, waits on this.

## What the page says, read raw on 2026-09-15

§192(1) sentence 1: the entrepreneur tells the competent accident insurer, within one week of
the business starting, its kind and subject, the number of insured people, the opening day or
the day preparatory work began, and in the cases of §130(2) and (3) the representative's name
and residence. Sentence 2: the duty counts as met when a notification under §14 or §55c GewO was
made to the competent office within one week of the business starting.

That second sentence is narrower than what the document and the rows say now. The agreed
sentence reports DGUV: "DGUV says the Gewerbeanmeldung satisfies the business-notification
obligation to the statutory accident insurer; otherwise that notification is due within one
week". The fact's text says "a trade registration already counts as this notification", and
the version's note "unless you have already made a Gewerbeanmeldung: that satisfies this
notification obligation". The statute counts the trade notification only when it is made
within that week.

## Through the conversation first

One turn in `germany/business-registration`, resumed: §192(1) as read, the new definition, and
two questions. Should the one week rest on §192(1), with DGUV's definition kept as evidence?
Do the agreed sentence, the fact's text and the note need the week's condition, and in what
wording the page supports? Corrections are taken as the other side words them unless one
changes the meaning. Then the fixed-point turn, whose answer is to be "No."

The definition, one line, in the page's own passages:

```md
[^sgb7-192-one-week]: <https://www.gesetze-im-internet.de/sgb_7/__192.html> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "§ 192 Abs. 1", "evidence": ["(1) Die Unternehmer haben binnen einer Woche nach Beginn des Unternehmens dem zuständigen Unfallversicherungsträger", "4. in den Fällen des § 130 Abs. 2 und 3 den Namen und den Wohnsitz oder gewöhnlichen Aufenthalt des Bevollmächtigten mitzuteilen.", "Die Mitteilungspflicht gilt als erfüllt, wenn eine Anzeige nach den §§ 14, 55c der Gewerbeordnung binnen einer Woche nach Beginn des Unternehmens gegenüber der zuständigen Stelle erstattet wurde."]}
```

A script fetches the page again, decodes it in its own charset, and finds every passage in its
text, compared in composed form, before the line is written. The marker goes beside DGUV's,
`one week[^dguv-one-week][^sgb7-192-one-week]`, since a figure two pages state carries both,
and removing the markers still gives the agreed text back.

## The data

In `src/rules/research/germany/business-registration.ts`:

- a source `accidentInsuranceLaw`, that URL, named
  `Sozialgesetzbuch (SGB) Siebtes Buch, § 192 Mitteilungs- und Auskunftspflichten von Unternehmern und Bauherren`,
  as the file names Germany's other code pages, read 2026-09-15;
- the notify-the-accident-insurer version and its fact name it as source and
  `sgb7-192-one-week` as label; DGUV's source entry goes, since nothing names it, and its
  definition stays in the agreed document as evidence;
- the fact's text and the note take the agreed wording.

The version keeps its obligation, criteria and validFrom: a page is corrected, not the law, and
the module owns its rows (SB-202).

## The tests

`research-rules.e2e.spec.ts` already reads every version's and fact's labels back from its
agreed document, on the page and the day the file names. Watched failing twice: the new
definition taken out of the agreed document, and the fact's source left on DGUV's page while its
label names §192.

## Publishing

```bash
npm run research:publish -w @skipbureau/api -- src/rules/research/germany/business-registration.ts
```

In the background. It checks the types and the research specs, commits the data file, the
agreed document and the talk, pushes, waits for the deployed digest and reads the case back.
Then the deployed API is asked for a founder's notify-the-accident-insurer answer.

## Files

`prisma/research/agreed/germany/business-registration.md`, its talk and session,
`src/rules/research/germany/business-registration.ts`, and this plan.

## The steps I am least sure of

**Whether the agreed sentence changes.** It reports what DGUV says, and DGUV's page does say it.
If the other side keeps the sentence and adds the condition only to the fact's text and the
note, that is its call.

**The evidence around the four items.** Sentence 1's verb comes after its numbered items, so the
evidence carries the first words and the fourth item with the verb, which the page's text has as
separate elements.

## How it is checked

API lint and lint:tsc, the research specs, the two planted failures, the publish reporting live,
and the deployed answer asked directly. A child of SB-170, so the tests covering the changed
files rather than the full suite.

Checked once on 2026-09-15: sound, and all three wordings, the agreed sentence, the fact's text
and the note, overstate §192(1) without the week's condition, which matters for a freelance
practice, a business §14 GewO does not cover and a late notification. The evidence is enough for
that claim, and the loader rewrites the version with its new page, so a publish that reports
live cannot leave the fact on DGUV's page.
