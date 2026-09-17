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

| case | research turns before sign-off | overclaims found at sign-off |
|---|---|---|
| `turkey/address-registration` | 3 | 7 |
| `turkey/short-term-residence-permit` | 3 | 9 |
| `turkey/work-permit` | 3 | 8 |
| `turkey/company-formation` | 2 | 5 |
| `turkey/tax-number` | 2 | 7 |
| `turkey/health-insurance` | 2 | 5 |
| `turkey/provinces` | 2 | 0 |
| `germany/anmeldung` | 3 | 6 |
| `germany/residence-permit` | 2 | 5 |
| `germany/health-insurance` | 2 | 11 |
| `germany/business-registration` | 2 | 11 |
| `germany/states` | 2 | 0 |
| `germany/cities` | 2 | 1 |

All six obligations, both countries, Turkey's 81 provinces (SB-210), Germany's
16 states (SB-223) and the five German cities its rules name (SB-228). Every one
then passed the fixed-point check below.
The turns are counted from `talk/`: the sign-off turn, the fixed-point turns and
SB-174's came after them, so `research.py cases`, which counts every turn, shows
more.

Not yet done: whatever countries the owner names next.

## What the sign-off turn is for, and why it is not optional

The last turn of every case puts the **reader-facing wording** in front of the
other side and asks only which sentences claim more than the evidence supports.
For every rule it has come back with something; the two lists of places, Turkey's
provinces and Germany's states, found no overclaim, and Germany's asked only that
one sentence cite a second page. It has caught, among others:

- a threshold written **backwards**, which would have told every small Turkish
  company the opposite of the truth;
- an instruction to plead an emergency for a Berlin appointment, when the
  actual answer is that the online application comes first and an appointment
  follows the LEA's positive review;
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
"monatlich" beside the €1,318.33 base. A Bundestag research paper did, but its
section is about voluntarily insured pensioners, so SB-185 replaced it with a
calculated definition whose inputs are all statute: §240(4) sentence 1 SGB V for
the daily floor, §223(2) sentence 2 for the thirty day month that §240(2) last
sentence carries to voluntary members, and §1 SVBezGrV 2026 for the €3,955
monthly reference value. The Ministry's table stays, for the figure and for who
it applies to. With those applied, Anmeldung and business registration came back
no on 2026-09-15.

**Health insurance came back no a day later, and only after a further round**
(SB-358). What closed on 2026-09-15 was the answer that proposed the change, not
a pass on the result of it, and this file credited it with a fixed point it had
not reached. Put to the corrected document on 2026-09-16, the same conversation
found one thing: the calculated definition claimed `"rounding": "none"` while
€3,955 divided by ninety, times thirty, is €1,318.333 recurring, so the
published €1,318.33 is rounded to the cent. With that field corrected the next
pass came back no. Two decisions taken against that conversation's own earlier
answer were put to it in the same round and confirmed: that the BKK24 leaflet it
offered is not used, one statutory insurer's information sheet not being an
official source in the sense this repository means, and that the cross reference
carrying §223 to voluntary members is §240(2)'s last sentence rather than the
paragraph itself.

**The residence permit's no was overtaken the next day, and took five rounds to
replace** (SB-357). The sentence above is true of the text that existed on
2026-09-15. SB-184 then rewrote the Berlin appointment paragraph on 2026-09-16
to enumerate four permit routes, and sent that turn to whichever conversation
the shared `search:codex` slot happened to hold, one that had never read this
subject. So the document's own thread had never seen what a reader was being
told.

Put to that thread on 2026-09-17, it took five rounds to come back no. It found,
in order: that the document contradicted itself, a preamble still saying you "do
not need to wait for an appointment at all" while the corrected paragraph said an
appointment follows a positive review; that a valid current title was made a
condition for a route whose page sets it by nationality instead; that the same
overclaim survived for the other three routes, each page stating two
alternatives under "Rechtmäßiger Aufenthalt"; that one citation was doing the
work of three; and that all four definitions quoted around Berlin's published
four month timing condition.

**Four of those five findings were in my corrections, not in the original text**,
each time because a page had been quoted partially and the sentence beside the
quote carried a condition. That is the clearest argument this file has for the
rule that a round repeats until it raises nothing: a single closing pass would
have replaced one error with another and called it finished.

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

## Every Turkish figure names the page that states it (SB-182)

Turkey's six agreed documents carry footnotes in the same grammar as Germany's:
a marker after every fee, deadline, threshold, fine and rate, and one definition
per label at the end. Two things were added to the grammar.

- **`rendered image` and `rendered scan`** are two more values of `method`: a
  PNG, or a PDF page with no text layer, read at full size and transcribed by
  hand. The residence-permit charge by nationality is an image on `goc.gov.tr`;
  SEDDK's circular 2024/34, GİB's April 2026 brochure and the body of
  Presidential Decision 7887 are scans.
- **`sha256`**, on those definitions only, is the digest of the file that was
  read. It is provenance for the transcription, not a test: a later digest that
  differs means the file is read and transcribed again. A PDF with a text layer
  needs none, because its article, page and passage already show whether its
  text changed.

**A statute is quoted as it is in force, not as it was passed.** The research
had cited Law 6458 and Law 6735 from the text the Assembly enacted, which no
later amendment changes. Every statute and regulation figure is now quoted from
the consolidated text on `mevzuat.gov.tr`, the PDF `MevzuatMetin/1.5.<number>.pdf`
for a law and `MevzuatMetin/yonetmelik/7.5.<number>.pdf` for a regulation, read
as rendered. Each footnote that PDF prints on the quoted paragraph is copied as
one more passage, and the locator says where it prints none. That records what
the PDF showed on the read date, not that the paragraph was never amended. An
amending law is quoted inside the law it amended, so Law 4761's sentence on
reciprocity is quoted from Law 492's tariff. An amount a law leaves to another
instrument is quoted from that instrument as well: the 50,000 lira minimum
capital from Presidential Decision 7887, with the Official Gazette correction
that put it in force on 1 January 2024. Two regulations that `mevzuat.gov.tr`
shows only through a script, the Temporary Protection Regulation and the
regulation on workplace opening licences, were read in the browser pane.

**How it was checked.** Each case's conversation said which page states which
figure, and where it could not open a page, I opened it. The documents carry 136
markers and 132 definitions, 3 of them calculated. The 129 verified ones quote
281 passages. The 230 a script can search for, on raw pages and on PDF pages
also read as rendered, were all found on their pages. The other 51 are 25
transcribed from scans and 15 from the fee image, each file's digest recorded,
and 11 from five pages read in the browser pane. Reading each passage against
its sentence extended the quotes that stopped short: the 2021 Istanbul notice
is now quoted whole, with its exceptions; the minimum capital carries its own
Presidential decision; and a statute paragraph carries every footnote the PDF
prints on it.

**The last pass.** Each annotated document then went back into its own
conversation with the same question as Germany's. Health insurance and the tax
number came back no. Work permit came back with two quotes missing a condition:
the documentary proof its exemptions require, criterion Ç.1.2, and what makes an
extension application timely, Article 27(1) of the International Labour Force
Law's regulation and the Ministry's FAQ 20. With both added it came back no.
Short-term residence permit, address registration and company formation came
back with seven sentences that said more or less than their pages, listed
below; each conversation worded or confirmed the correction and then found
nothing else.

**Twelve sentences were corrected**, each in its own conversation, and nothing
else in the prose changed. Each corrected sentence is the one its conversation
worded or confirmed, and each entry names the footnotes the corrected sentence
rests on, which is what tells a correction apart from softening. Five were
corrected in the inventory turns, because no page states what they said:

1. **Short-term residence permit, what it costs.** As agreed: "twenty-five US
   dollars for a full first month and five for each month after" and "fourteen,
   nine, seven and five dollars for a full first month". As corrected: "for the
   first month", in both. The image prints "İLK AY" and "DİĞER AYLAR", first
   month and other months, and neither it nor the fee page says anything about
   a part month. Agreed in `talk/turkey/short-term-residence-permit.md`, the turn
   asked 2026-09-14 12:53 UTC. Footnotes: `goc-image-main-group` and the four
   `goc-image-group-*` definitions.
2. **Company formation, the chamber's dues.** As agreed: "Chamber registration
   is once." As corrected: "Istanbul's chamber charges a registration fee."
   İTO's dues page and its formation cost sheet state a registration fee, and
   that no annual dues are charged in the year it is collected; no page opened
   says the fee is charged only once. Proposed in
   `talk/turkey/company-formation.md` in the turn asked 2026-09-14 13:00 UTC and
   confirmed in the turn asked 13:08 UTC. Footnotes:
   `ito-ltd-cost-sheet-registration`, `ito-dues-registration-year`.
3. **Company formation, the municipal licence.** As agreed: "you need it before
   you open, not thirty days after you register, and premises operating without
   one can be closed and fined." As corrected: ", not thirty days after you
   register," removed. No page states a thirty-day period, so denying one handed
   the reader a benchmark nobody sets; Article 6(1) of the licence regulation
   says a workplace may not open or operate without the licence. The same two
   turns. Footnotes: `isyeri-ruhsat-reg-6-before-open`,
   `ticaret-bakkallik-before-open`.
4. **Company formation, a bookkeeper.** As agreed: "The published 2026 framework
   includes corporate taxpayers whose previous-year assets do not exceed
   115,209,000 lira and net sales do not exceed 230,359,000 lira. It does not
   establish that professional involvement becomes mandatory only above a size
   threshold." As corrected: "We could not verify the applicable 2026 asset and
   net-sales thresholds from a government source. The available evidence does
   not establish that professional involvement becomes mandatory only above a
   size threshold." The inventory turn quoted the two amounts from a table
   published by the Ankara chamber of certified accountants, and two further
   turns found no Revenue Administration page that states them. Agreed in the
   turn asked 13:08 UTC. No footnote: the corrected sentence says the amounts
   were not verified.
5. **Address registration, who this applies to.** As agreed: "The foreigners'
   population-register provision covers residence permits issued for at least
   90 days. It does not establish a general exemption from address duties for
   everyone else." As corrected: "Article 8 of Population Services Law 5490
   authorises the Interior Ministry to assign identity numbers to foreigners
   covered by Law 6458 and record them in the foreigners register; diplomatic
   mission members are outside this provision. The validity of foreigner
   identity numbers, the documents required during and after an application,
   and other details are determined by an Interior Ministry regulation." The 90
   days was Article 8 as Law 6458 wrote it in 2013. Law 7148 replaced the whole
   article in 2018, and the consolidated Law 5490 has no "doksan", "90 gün",
   "oturma" or "ikamet izni" anywhere in it. Agreed in
   `talk/turkey/address-registration.md`, the turn asked 2026-09-14 13:27 UTC.
   Footnote: `law5490-8-foreigners-register`.

Seven more were corrected in the last pass, because a sentence left out a
condition its page states, or said what no page does:

6. **Short-term residence permit, what it costs.** As agreed: "Turkey sets it on
   a reciprocity basis under Law 492, Schedule 6, section III, paragraph 1". As
   corrected: "under Law 492, Schedule 6, section III". The reciprocity sentence
   Law 4761 added stands at the end of section III, after its paragraph 2. Found
   in the turn asked 2026-09-14 14:37 UTC and confirmed in the turn asked 14:40
   UTC. Footnote: `law492-tariff-6-iii-reciprocity`.
7. **Short-term residence permit, Istanbul.** As agreed: "Esenyurt and Fatih
   from January 2021, ten districts from October 2022". As corrected: "Esenyurt
   and Fatih from January 2021, with exceptions for investment-based short-term
   permits, for property-based short-term permits where the property is in
   Esenyurt, and for student residence permits for students registered at
   universities in the respective district; ten districts from October 2022".
   The notice of 18 January 2021 states those exceptions. Found in the turn
   asked 14:37 UTC; the conversation worded it in the turn asked 14:40 UTC.
   Footnote: `istanbul-2021-closure`.
8. **Company formation, what it costs.** As agreed: "a signature declaration is
   separately listed at 1,720 lira, and we could not verify when it is
   additionally charged." As corrected: "a signature declaration is separately
   listed at 1,720 lira in the general tariff, while the limited-company
   formation cost sheet includes signature declarations in its 2,160 lira
   service fee." İTO's cost sheet prints "Hizmet ücreti (imza tasdik, imza beyanı
   vs.) 2.160 TL." Worded in `talk/turkey/company-formation.md` in the turn asked
   2026-09-14 14:40 UTC, and confirmed in the turn asked 14:46 UTC. Footnotes:
   `ito-harc-signature-declaration-1720`, `ito-ltd-cost-sheet-service-fee-2160`.
9. **Company formation, the tax certificate.** As agreed: "then renew it by 31
   May each year." As corrected: "then renew it by 31 May each year, or, for a
   special accounting period, within one month after the declaration deadline."
   GİB's Communiqué 408, section 2.3, gives taxpayers with a special accounting
   period that month. The same two turns. Footnotes: `gib-teblig-408-31-may`,
   `gib-teblig-408-special-period`.
10. **Company formation, the municipal licence.** As agreed: "premises operating
    without one can be closed and fined." As corrected: "premises operating
    without one can be closed." The licence regulation's Article 6(1) and the
    Trade Ministry's guide say such premises are closed, and no page quoted
    mentions a fine. The same two turns. Footnotes:
    `isyeri-ruhsat-reg-6-before-open`, `ticaret-bakkallik-before-open`.
11. **Address registration, when the clock starts.** As agreed: "Moving house:
    from the day you move, not the day you sign the lease." As corrected:
    "Moving house: the notification period is 20 working days, but we could not
    verify an explicit starting event for foreigners from a current official
    source." The moving date appeared only in NVI's list of checks for its
    e-Devlet service, which also checks for Turkish citizenship, while Law 5490's
    address paragraph and the regulation's Article 23(2) give 20 working days
    with no starting event. Found in `talk/turkey/address-registration.md` in
    the turn asked 2026-09-14 14:38 UTC; the conversation worded it in the turn
    asked 14:41 UTC. Footnotes: `yukk-reg-23-2-twenty-working-days`,
    `nvi-faq-residence-permit-20-days`.
12. **Address registration, a permit from a consulate.** As agreed: "A first
    permit issued abroad: from the day you enter Turkey." As corrected: "A
    residence permit, work permit or work-permit exemption confirmation obtained
    from a consulate: from the day you enter Turkey." Law 6458 Article 26(2) and
    the regulation's Article 22(12) start the clock at entry only for those
    documents obtained from a consulate. Found in the turn asked 14:38 UTC and
    confirmed in the turn asked 14:41 UTC. Footnotes: `law6458-26-2-from-entry`,
    `yukk-reg-22-12-delivered`.

**Three traps worth knowing before running this again.** A PDF's text layer can
keep a typographic ligature, `ﬁ` for "fi", where the rendered page shows two
letters, so the checks fold the five Latin ligatures before comparing. A real
hyphen at the end of a printed line, as in "15/7/2016-" before "6728/33" in Law
492, is folded away like a word broken across two lines, so such a passage is
split around it. And partway through, `mevzuat.gov.tr` and `resmigazete.gov.tr`
stopped answering any request without a browser's `User-Agent` header, while
answering one with it in under a second, and `ito.org.tr` and `ticaret.gov.tr`
reset connections for a while; a page that failed that way was fetched again.

**The random recheck.** A script drew two verified definitions per document with
the operating system's random source and fetched each page again. It searched a
page for every passage; for an image or a scan it compared the file's digest,
and the transcription was read against the file once more. All twelve held, and
so did the two drawn again for company formation:

- **Short-term residence permit.** Returning within fifteen days, the
  implementing regulation, <https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf>,
  page 10, Article 21(9)(d): "her defasında on beş gün içinde döndükleri takdirde
  ülkeye girişlerinde vize koşulundan muaf tutulurlar". The smallest group's
  charge, the fee image on `goc.gov.tr`, its digest unchanged and its last small
  table read again: "1 FAS", "6 TUNUS", "İLK AY 5 ABD DOLARI, DİĞER AYLAR 0,5 ABD
  DOLARI".
- **Work permit.** The rule in force since 3 August 2026,
  <https://www.csgb.gov.tr/uigm/calisma-izni/calisma-izni-degerlendirme-kriterleri/>:
  criteria 4.1 and 4.2, with "(03.08.2026 tarihi itibarıyla yürürlüktedir.)". The
  card's 964 lira,
  <https://ms.hmb.gov.tr/uploads/sites/3/2025/12/2026-Degerli-Kagitlar-Tebligi-a3f95f2236d8ad45.pdf>:
  "16 - Yabancı çalışma izni belgesi 964,00" and "Bu Tebliğ 1/1/2026 tarihinde
  yürürlüğe girer."
- **Company formation.** The tax certificate within a month, GİB's January 2025
  brochure, page 6: "vergi levhalarını mükellefiyet tesisinden itibaren 1 ay
  içerisinde almaları zorunludur". Half the paid-up capital for a broadcaster,
  <https://www.rtuk.gov.tr/izin-ve-tahsisler-dairesi-baskanligi/3923>: "ödenmiş
  sermayenin yüzde ellisini geçemez". The January 2025 brochure was removed from
  the document after the draw: the plan check found that a superseded edition
  cited beside the April 2026 one could be taken as the source of a current
  rule, and the 2026 edition states the same sentence. So company formation was
  drawn again from its current definitions, and both held: the signature
  declaration, İTO's 2026 tariff, page 3, "Huzurda İmza Beyannamesi Ücreti
  1.720,00 TL"; and 31 May, GİB's Communiqué 408, section 2.3, a browser-pane
  reading reopened in the browser, "kurumlar vergisi mükellefleri için 1
  Mayıstan itibaren, vergi levhalarını 31 Mayıs günü sonuna kadar
  yazdıracaklardır".
- **Address registration.** Twenty working days for international protection,
  the implementing regulation, page 38, Article 110(3): "en geç yirmi iş günü
  içinde il müdürlüğüne bildirmekle yükümlüdürler". Fines rising each January,
  <https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5326.pdf>, page 5, Article 17(7):
  "İdarî para cezaları her takvim yılı başından geçerli olmak üzere".
- **Tax number.** Free,
  <https://www.uludag.edu.tr/en/uluyos/tax-identification-number-information-69202>:
  "Obtaining a Tax ID is free of charge". The rule since 1 July 2010, GİB's 2010
  institutional report, page 10: "01.07.2010 tarihinden itibaren yabancı kimlik
  numaralarının vergi kimlik numarası olarak kullanılmasına".
- **Health insurance.** The limits at the hospitals in Annex 1, SEDDK circular
  2024/34, its digest unchanged and its table read again: "Ayakta Tedavi
  15.000.-TL Sigortalı: %20 Şirket: %80" and "Yatarak Tedavi 250.000.-TL
  Sigortalı: % 0 Şirket: %100". A continuous year, SGK's general health
  insurance book, page 34: "Ülkemizde kesintisiz bir yıldır ikamet etmekte olan
  yabancı ülke vatandaşlarından talepte bulunan kişiler".

## How an agreed figure reaches a reader (SB-190)

A figure in `agreed/` becomes a rule only through `src/rules/research/`, one
module per research case, composed per country (SB-232), loaded onto the deployed
database on every start. After a
load every row a module owns says exactly what the module says: what is new is
added, what changed is written again, and what the module no longer lists is
removed, so loading the earlier module puts the database back, and git holds
what each one said (SB-202, the owner's order of 2026-09-15). A change in the
law is still history, because the module says so: it ends the old version and
adds its successor. Each version names the agreed document it is written from,
and it and each of its facts name the labels of the definitions they rest on. `test/research-rules.e2e.spec.ts` reads every label back from that document
and fails on one that is calculated, unverified, missing, or on another page or
day than the module says.

A fact's page is chosen in order: a verified definition of the same document,
never calculated and never a superseded edition; a page whose own scope covers
the fact's, so a national fact never cites one city's chamber, which is what
SB-184 and SB-185 filed; and among those, the page that states the whole fact
itself, not a change to it or a clause in a longer list. Never marker order, and
never how official a page looks.

A figure whose only verified page is narrower than the fact stays unwritten
until research finds one that is not. Turkey's tax number is the first: its fee
rests only on a university's guidance for its own applicants, which does not set
what the Revenue Administration charges, so no fee is written (SB-195).

## A research is finished when it is live (SB-232)

The owner's order of 2026-09-15: a research that passes is turned into data and
pushed to the live database before the next item starts. Its data is one file,
`src/rules/research/<country>/<case>.ts`, which the country's file composes. Once
the sign-off and the fixed-point turn are done and that file says what the agreed
document says, run one command in the background, from the repository root:

```bash
npm run research:publish -w @skipbureau/api -- src/rules/research/germany/anmeldung.ts
```

It checks the types and the research specs, commits exactly the case's files as
`Research publish: <case>`, pushes, waits until the deployed database's digest for
the country equals the files', and reads the case back through the deployed API.
It will not start while anything else the API is built from has changes that are
not committed, since the checks would read them and the deploy would carry them
unchecked: commit those first. A mistaken command or file ends in one line saying
what failed; that is fixed and the command run again. The research is finished when
it reports live, and the next item starts after that.

**One successor per publish, and never a rewrite afterwards** (SB-207). Before
publishing, look for open cards that touch the same obligation, and combine the
editorial corrections that are already agreed into ONE successor where they share a
source and an effective date. After the publish, that successor is history: the next
correction gets its own version, however small it is. Turkey's limited company
formation earned this rule by taking three versions in two days, two of the
transitions editorial rather than legal, because SB-204 renamed a fee key and
published, and SB-207 then scoped the same version to a situation a day later. Each
card was right on its own and the board picked them in its own order; what was
missing was the look across them before the first publish.

Northflank can build nothing for a push that lands while another build runs. When
no build of the publish's commit has started three minutes after its push, the
command starts one through `.github/workflows/northflank-build.yml` and waits for
it, so there is nothing to do by hand. The same workflow starts a build of any
commit when one is needed:

```bash
gh workflow run northflank-build.yml -f sha=<the full commit id>
```

That leaves `require_tip` off, which is what building an older commit by hand needs:
the workflow builds whatever commit it is given. The publish sets it instead, and the
workflow then refuses a sha that is not the commit GitHub recorded for the branch when
it accepted the dispatch. That is what stops a publish deploying older code over a push
that landed while it was waiting, which the publish's own tip check narrows and cannot
close (SB-338).

While it runs, every commit names its paths, `git commit -- <paths>`, and no
`git stash`, `git pull` or `git merge` runs, because the publish moves the branch
without touching the index. When it reports, run the `git reset -q -- <paths>`
line it prints.

**And this is what happens if you do not** (SB-235). The commit is built in a
temporary index and the branch is moved with `update-ref`, so for exactly the
committed paths the repository's own index still holds the bytes from before the
publish. Until that reset runs, a bare `git commit`, or a `git add` of anything
else followed by one, commits those old entries and is an immediate revert of the
publish. The reset itself updates those named index entries from the now published
`HEAD`, and it does not touch the working tree.

`git checkout -- <path>` and `git restore <path>` copy the index's version into the
working tree, so the order decides what they do (SB-381). Before the reset the index
still holds the pre-publish bytes, so either command restores stale content; the
reset then repairs the index and leaves that working tree file as it was, where a
later `git add <path>`, or a broad add that includes it, can publish it again. After
the reset the index holds the published bytes, so the same commands restore those,
and neither can take a publish back. This is the path only worktree form:
`git checkout <tree-ish> -- <path>` and `git restore --staged <path>` read a named
tree or `HEAD` instead.

The index is deliberately left alone, because git has no compare-and-swap for a
single entry and a write from the background could swallow something staged in the
foreground (SB-232). So the reset is not optional, and it is the whole of the remedy
only while nothing has written to the working tree first.

To take a publish back:

```bash
npm run research:publish -w @skipbureau/api -- --down src/rules/research/germany/anmeldung.ts
```

It restores the data file to what it was before the case's last publish that no
down has reverted, and publishes that. The trace is git's:

```bash
git log --grep "Research-Case: germany/anmeldung"
git log --grep "Research-Action: down"
```

## Turkey's rules checked as a whole (SB-169)

Once SB-191 to SB-196 had written Turkey's agreed documents into rows, all 19 versions
and 69 facts in `src/rules/research/turkey.ts` were read against the rule above together,
on 2026-09-15.

**How.** A script set each fact's chosen definition beside every other verified definition
of the same document whose evidence spells the same value, as a figure, with Turkish
separators or in Turkish words, and flagged a chosen passage that did not spell it and a
page of one place cited for all of Turkey. Every flag and every pair was then read in the
evidence. The 16 flags were the script's reach, not the rows': English values against
Turkish text, `yirmidört` written as one word, `on binde dördü` for 0.04 per cent,
`28.075,50`, and a UETS account in a list of required documents. The three calculated
definitions are named by no fact and no version, and no page is narrower than its fact.

**Where two pages state a figure, the chosen one wins by the rule:**

- the minimum capital, the Ministry of Trade's page, which states the current 50,000, over
  Article 580's 10,000 with its note and decision 7887's raise;
- the 30 premium days, SGK's page, which states them in one sentence and its debt
  condition and exemptions in the paragraphs after it, over Law 5510's Article 67(1)(a), a
  clause of a longer list;
- the premium base, SGK's guide, twice the minimum wage, over Article 80's twice the floor,
  which needs Article 82 to become the minimum wage;
- the residence and work permit card fees and the work permit fee, the Migration
  Presidency's and the Labour Ministry's 2026 fee pages, over rows of the Treasury
  communiqué's table and of Law 492's tariff;
- returning while a residence application is pending, the regulation's Article 21(9)(d),
  over a 2016 e-İkamet guide and İstanbul's notice, which is narrower.

**Ties the rule does not rank**, where two pages each state the whole figure and either is a
correct citation: cover from the day after the request, Law 5510's Article 61(1)(c) and SGK's
guide; 90 days in any 180, Law 6458's Article 11(1) and the foreign ministry's page;
reporting employment within 15 days, Law 6735's Article 22(1) and the Labour Ministry's FAQ
59; working while an extension is assessed, the regulation's Article 27(5) and FAQ 21; and
renewing the tax certificate by 31 May, GİB's April 2026 brochure, Communiqué 408 and GİB's
rights guide. The check adds no tie-break, because one would be a preference the rule does
not state.

**Every page a fact cites is on a Turkish government host**, and nothing was corrected.

**The deployed database, read back.** The deployed API was asked, for each of the 19
versions, as the reader that version reaches: its residence status, its situation, a
nationality of its group, its place, and for a national address version a province other
than Bursa. Every version answered with each of its facts on the file's page, page name and
read day, 78 facts in all counting the ones Bursa inherits, none without a page or a day and
none off a `.gov.tr` host, and each Bursa version with its two facts and the national
version's three.

## Germany's rules checked as a whole (SB-170)

Once SB-223 to SB-227 had written Germany's agreed documents into rows, all 31 versions and 59 facts
`src/rules/research/germany.ts` composes were read against the rule above together, on 2026-09-15.

**How.** A script set each fact's chosen definitions beside every other verified definition of the same document
whose evidence spells the same value, as a figure, with German separators or in German words, and flagged a chosen
passage that did not spell it, a page of one Land or city cited by a version with no place, and a label not verified
or on another page than its fact. A text or none fact has no value to match (SB-222), so each of the 21 was read
against every verified definition of its document. The 6 flags were condition labels beside a label that states the
value on the same page; the other matches were the script's reach, `2` in "Abs. 2", `ein` in every article, `25`
inside `25.000`. No fact rests on a calculated definition, and no page is narrower than its fact.

**Where two pages state a figure, the chosen one wins by the rule:**

- the €5,200 chamber contribution exemption, §3(3) sentence 3 IHKG, over IHK Rhein-Neckar's table, which is one
  chamber's own rates;
- Hamburg's €16 registration fee, hamburg.de's service page, over the 2025 gazette's amendment of the fee tariff, a
  change to it;
- the 0.25 care discount per child, the Health Ministry's care page, which states it whole, over §55(3) SGB XI's
  clause in a longer sentence;
- the two weeks to register, §17(1) BMG, over Saxony's page, which is narrower, and §27(2) BMG's two weeks, which is
  another duty;
- the €1,000 fine for registering late, §54(2) No. 1 BMG, over the fictitious address and the landlord's
  confirmation offences, which share paragraph 3's ceilings;
- the €100,000 current-year VAT threshold, §19(1) UStG, over the Finance Ministry's letter, which names it inside its
  first-year and loss-of-exemption rules.

**Two facts rest on the only definition that states them, on a page that is not a statute, and stand:** the
first-year €25,000 VAT ceiling and the loss of the exemption for the whole transaction, on the Finance Ministry's
letter of 18 March 2025, since §19 UStG states neither; and Hamburg's €25 trade registration fee, on the Handelskammer
Hamburg's page, a public-law corporation stating its own fee. **One did not:** the week to tell the accident insurer
rested on DGUV's page, a registered association's, where §192(1) SGB VII states the whole duty. SB-263 moved it there,
with the condition the statute sets, that a trade registration counts only when it is made within that week.

**Every page a fact cites** is on gesetze-im-internet.de, bundesgesundheitsministerium.de, bundesfinanzministerium.de,
service.berlin.de and berlin.de, hamburg.de, amt24.sachsen.de, stadt.muenchen.de, service.duesseldorf.de, wiesbaden.de,
freiburg.de, stadt-koeln.de or handelskammer-hamburg.de. Nothing else was corrected.

**The deployed database, read back.** The germany research row holds 31 versions, 21 places, 4 statuses and 1
nationality group, with the digest the files give. Then the deployed API was asked, once for each version,
`move(from: "tr", to: "de")` as the reader that version reaches: its residence status, its situation, a nationality of
its group (Australia for §41(1)'s), its place of residence (`toResidenceRegions`) or of work (`toWorkRegions`); where
another version of the same obligation narrows a detail this one does not state, a value no version names,
Niedersachsen for a place and Brazil for a nationality; and on Turkey's side Ankara (`fromResidenceRegions`) and
`tr.residence-permit`, since Turkey has `report-your-address` too and a move's needs cover both sides. Every version
answered with nothing left to ask, each of its facts and each fact it takes from the versions it narrows by place
alone on the file's page, page name and read day, compared by key, value and page: 86 facts, 27 of them inherited,
among them Hamburg's €16 with the federal two weeks and €1,000, Saxony's care shares with the federal rates and the
child discount, Cologne's fee and its four weeks and six months with the federal duty and fine, and Munich's seven
months and Berlin's card, confirmation and emergency weeks with their status's own §81(4) answer.

A rule written on the deployed database outside the file would not show here. No query of the API lists every version
whatever the reader, the research loader is the only code that writes a rule version, no migration inserts one and the
entrypoint does not run `prisma/seed.ts`; an inventory of the deployed database is SB-221's, for both countries.

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
