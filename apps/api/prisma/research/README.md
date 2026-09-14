# The research

The owner's order of 2026-09-12: every rule this product publishes is
researched through GPT, in one conversation per rule, resumed and never
restarted, with each answer judged here and the judgement sent straight back
until both sides are satisfied. Not a batch of questions. A talk.

## How to use it

```bash
python research.py ask   --case turkey/address-registration --file ask.txt
python research.py show  --case turkey/address-registration
python research.py cases
```

`gpt-6-astra`, high effort, web search on. A case is `<country>/<rule>`.

## The three folders, and which one is the truth

| folder | what it is |
|---|---|
| `talk/` | **The argument.** Every question and every answer, in order. This is the record: anyone asking why a guide says what it says can read how it got there. |
| `agreed/` | **What gets published.** The text both sides accepted, after the corrections were applied. Guides are written from here. |
| `turkey.md` | **Superseded.** An early batch of questions, before the owner corrected the shape. Kept because things were first found in it, and because two of its claims were wrong in instructive ways. |

**Nothing in `agreed/` may be softened, sharpened or given colour when it
becomes a guide.** Where it says something could not be verified, that is the
finding, not a gap to fill in later with something that sounds better.

## What has been settled

| case | turns | overclaims found at sign-off |
|---|---|---|
| `turkey/address-registration` | 4 | 7 |
| `turkey/short-term-residence-permit` | 3 | 9 |
| `turkey/work-permit` | 3 | 8 |
| `turkey/company-formation` | 2 | 5 |
| `turkey/tax-number` | 2 | 7 |
| `turkey/health-insurance` | 2 | 5 |
| `germany/anmeldung` | 3 | 6 |
| `germany/residence-permit` | 2 | 5 |
| `germany/health-insurance` | 2 | 11 |
| `germany/business-registration` | 2 | 11 |

All six obligations, both countries. Every one then passed the fixed-point
check above.

Not yet done: whatever countries the owner names next.

## What the sign-off turn is for, and why it is not optional

The last turn of every case puts the **reader-facing wording** in front of the
other side and asks only which sentences claim more than the evidence supports.
It has never once come back empty. It has caught, among others:

- a threshold written **backwards**, which would have told every small Turkish
  company the opposite of the truth;
- an instruction to plead an emergency for a Berlin appointment, when the
  actual answer is that you apply online and need no appointment;
- two sentences of colour invented here with no evidence behind them, "this
  catches people out" and "nobody mentions";
- caveats that were themselves overclaims: "not published" where the truth was
  "we could not find a copy", and "it is not a national rule" where the truth
  was "we could not verify a national rule".

## The fixed-point pass, which is where the exit condition lives

A sign-off turn is not the end. After its corrections are applied, the text goes
back **one more time** with a single question: is there anything left that
claims more than the evidence supports? A one-line "no" is the answer being
asked for, and it is accepted.

**Run first over ten finished documents, only one came back clean.** The rest
split into two kinds, and both were mine:

- **Corrections that never reached the page.** I had written the agreed text
  from the sign-off list and simply missed some: four in Turkish health cover,
  seven in German business registration, two in German health insurance. The
  research was right and the transcription was not, and nothing but this pass
  would have caught it.
- **My own commentary about our schema**, sitting inside the agreed document.
  The other side objected to "Turkey's third rule case in a row" and "nothing in
  the schema models this", and it was right to: nothing in that conversation
  established either. They were mine to assert.

So `agreed/` now holds **only what was agreed**, and the conclusions drawn from
it live in `schema-notes.md`. After the corrections were applied and the
commentary moved, all ten came back clean.

**Do not skip this because the sign-off already happened.** The sign-off checks
the research. This checks whether the research survived contact with me.

## Every figure names the page that states it (SB-174)

Germany's four agreed documents carry a footnote marker after every fee,
deadline, threshold, fine and rate, and one definition per label at the end. The
prose did not change: remove the markers and the agreed text comes back byte for
byte, which the script that wrote them checked before writing anything. Turkey's
six documents are SB-182.

A definition is one line: the label, then the page in angle brackets or the word
`calculated`, then a bar and exactly one JSON object.

```md
[^bmg-17-two-weeks]: <https://www.gesetze-im-internet.de/bmg/__17.html> | {"status": "verified", "read": "2026-09-14", "method": "raw page", "locator": "§ 17 Abs. 1", "evidence": ["Wer eine Wohnung bezieht, hat sich innerhalb von zwei Wochen nach dem Einzug bei der Meldebehörde anzumelden."]}
[^share-at-average]: calculated | {"status": "calculated", "read": "2026-09-14", "inputs": ["sgb5-241-general-rate", "bmg-average-additional-2026", "bmg-half-each"], "formula": "(14.6 per cent plus 2.9 per cent) divided by 2", "rounding": "none"}
```

- **`verified`** carries `evidence`, passages copied exactly from the page, and
  `locator`, where on the page they are. The evidence carries the whole claim:
  the "bis zu", the period, both ends of a range, and any condition the sentence
  depends on. `method` says how the page was read: `raw page`, fetched and its
  text searched; `rendered PDF`, the cited page read as rendered and its text
  layer searched; `browser pane`, a page that renders by script, read in a
  browser.
- **`calculated`** names no page, because no page states the result. `inputs`
  are other labels, each verified, with the `formula` and the `rounding`.
- **One definition per figure a page states**, not one per page. Several labels
  share a URL, and a figure that two pages state carries both markers.

**How it was checked.** Each case's conversation said which page states which
figure, as with every fact here. Every quoted passage was then fetched again and
searched for on its page: 108 passages across the 81 verified definitions that
can be fetched, all found; the other two render by script and were read in the
browser pane. Reading each passage against its sentence found quotes that
stopped short of what the sentence says, a proviso in the law's next sentence, a
fine quoted without the tier that sets its ceiling, a table row without its
column headings, and those were extended from the page. Two figures gained a
second page: the landlord's two weeks, a federal rule that had only a Berlin
page, and applying before your permission expires, a Berlin instruction that had
only the statute.

**The last pass.** Each annotated document then went back into its own
conversation with one question: does any marker attach a figure to a page that
does not state it, or quote evidence that leaves out a condition its sentence
depends on? The residence permit came back no. Anmeldung and business
registration each came back with three quotes missing a condition: the refusal
that triggers §19(2) BMG, the actual move-in that "in diesem Fall" refers to,
what makes an address fictitious (§19(6), now a second definition on the €50,000
fine), a business itself and not only its branches, "actual" turnover in the
first year, and the €25,000 ceiling beside the €100,000 one. Health insurance
settled the one question I could not: the Ministry's table never writes
"monatlich" beside the €1,318.33 base and a Bundestag research paper does, so
that figure carries both, and §240(4) sentence 1 SGB V sets the same minimum for
a self-employed member. With those applied, all three came back no.

**Compare in Unicode's composed form.** The Ministry of Health's care page writes
`fünften` as `u` followed by a combining mark, and a literal search for the
passage fails although every word of it is on the page.

**The random recheck.** A script then drew two verified definitions per document
with the operating system's random source, fetched each page again and searched
for every passage. All eight were found:

- **Anmeldung.** Free in Munich, <https://stadt.muenchen.de/service/info/wohnsitzanmeldung/1063475/n0/>:
  "Gebührenrahmen kostenfrei". One fee for a family sharing both addresses,
  <https://www.luewu.de/wp-content/uploads/2025/08/GVBL_HH_2015-42.pdf>, gazette
  page 274: "Verarbeitung der Anmeldung einer Person oder einer Familie mit
  gleicher Wegzugs- und Zuzugsadresse (§ 17 Absatz 1 BMG)".
- **Residence permit.** Up to seven months in Munich,
  <https://stadt.muenchen.de/service/info/servicestelle-fur-zuwanderung-und-einburgerung/10278359/>:
  "Bearbeitungszeit Bis zu 7 Monate". Applying before your permission expires,
  <https://service.berlin.de/dienstleistung/329328/>: "Damit wird bescheinigt,
  dass Ihr aktueller Aufenthaltstitel (nationales D-Visum oder
  Aufenthaltserlaubnis) über das bisherige Gültigkeitsdatum hinaus im
  Bundesgebiet weiter gültig bleibt", and "(Dies gilt nicht, wenn Sie ein
  Schengen-Visum (C-Visum) für einen kurzfristigen Aufenthalt besitzen oder Ihr
  aktueller Aufenthaltstitel am Tag der Antragstellung bereits abgelaufen ist.)"
- **Health insurance.** The second through fifth child,
  <https://www.gesetze-im-internet.de/sgb_11/__55.html>: "für jedes Kind ab dem
  zweiten Kind bis zum fünften Kind um jeweils einen Abschlag in Höhe von 0,25
  Beitragssatzpunkten". About €222.80 without sickness cash benefit,
  <https://www.bundesgesundheitsministerium.de/beitraege/seite>: the column
  "Monatlicher Beitrag", the row "Mindestbeitrag für Selbstständige/sonstige
  freiwillig Versicherte (Mindestbemessungsgrundlage: 1.318,33 €) nein 222,80
  €**", and its note "Inklusive Zusatzbeitrag (bei Anwendung des
  durchschnittlichen Zusatzbeitragssatzes in Höhe von 2,9 %".
- **Business registration.** €25,000 in the first year,
  <https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-03-18-sonderregelung-kleinunternehmer.pdf?__blob=publicationFile&v=4>,
  page 12: "im Jahr der Aufnahme der Tätigkeit die Grenze von 25.000 € und nicht
  die Grenze von 100.000 € maßgebend". The €24,500 allowance,
  <https://www.gesetze-im-internet.de/gewstg/__11.html>: "1. bei natürlichen
  Personen sowie bei Personengesellschaften um einen Freibetrag in Höhe von 24
  500 Euro".

The €25,000 definition gained its section's first sentence in the last pass,
after it was drawn, and that sentence was found on page 12 as well.

## What it has changed about the product

**SB-168, twice.** Turkey answered three times that the law is national and
only administration varies, which would have made a region a note. Germany's
Anmeldung fee showed a region attaching its own charge to a federal duty, so a
region has to hold a rule. Then Saxony's care-insurance split showed a federal
rule carrying its own regional variant, and its trigger is **where the
employment is, not where the reader lives**.

So the region belongs on the rule, not on the country, and it has to say what
kind of connection it is.

## The rule that makes it worth the round trip

Ask about the thing you are least sure of, and give it room to say no. The
answers that changed this product most were the ones where it said it could not
verify something: three tax-number errands that turned out to have no rule
behind them, a district closure nobody publishes the current state of, and an
"or" against an "and" in two official pages that contradict each other.
