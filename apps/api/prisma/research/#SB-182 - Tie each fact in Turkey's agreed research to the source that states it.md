# SB-182, Tie each fact in Turkey's agreed research to the source that states it

**Exit:** in every document in `agreed/turkey`, every fee, deadline, threshold
and fine names the source URL that states it, verified by exact source evidence
or a transcription of the rendered original, or is marked calculated from
verified inputs, and a figure picked at random opens a page that says it.

This card blocks SB-169, which writes Turkey's rule rows, and SB-154 behind it,
which is what the owner asked for on 2026-09-14: a city in Turkey, and changing
destination.

## What carries over from SB-174, unchanged

SB-174 did this for Germany, and its plan's "As built" section and `README.md`
record what worked. All of it applies here:

- a footnote straight after the figure, one definition per figure a page
  states, a line with the page in angle brackets or the word `calculated`, then
  one JSON object;
- `evidence` is a list of exact passages carrying the whole claim, `method` says
  how the page was read, and a passage that crosses a PDF page break is two
  pieces, one per page;
- which page states which figure is argued in each case's own conversation,
  resumed; I then fetch every page, search for every passage literally in
  Unicode's composed form, and read each passage against its sentence;
- the prose does not change, which the script that writes the markers checks by
  stripping them again;
- the last pass sends each annotated document back into its conversation until
  it answers no;
- two verified definitions per document are drawn at random, opened again and
  recorded in `README.md`.

What follows is only what Turkey changes.

## The six documents

About 135 figures, twice Germany's.

| document | figures, roughly | what is hard |
|---|---|---|
| `address-registration` | 12 | the 2026 fines on `nvi.gov.tr`; Law 6458 cited as enacted |
| `short-term-residence-permit` | 30 | the nationality groups are an image; the twelve-month $80 is arithmetic; Law 492 and Law 4761 |
| `work-permit` | 30 | the criteria page's 3 August 2026 change; Law 6735 cited as enacted |
| `company-formation` | 35 | tariffs in PDFs from a chamber and the notaries' tariff; the 20 lira levy is arithmetic |
| `tax-number` | 5 | `dijital.gib.gov.tr` renders by script |
| `health-insurance` | 25 | the SEDDK press release it cites for the limits states none of them; ₺66,060 and ₺7,927.20 are arithmetic |

## A statute is quoted as it is in force, not as it was passed

Law 6458, Law 4761 and Law 6735 are cited from `cdn.tbmm.gov.tr`, the text the
Assembly enacted. A later amendment changes the law and not that page, so a
passage found there, word for word, can state a rule that no longer holds. A
literal search cannot see that.

So a statute's figure is verified against the consolidated text on
`mevzuat.gov.tr`. Its HTML page is a shell that fills in by script, but the
consolidated PDF, `MevzuatMetin/1.5.<number>.pdf`, opens for a script and has a
usable text layer. Probed on 2026-09-14: Law 6458 (48 pages), Law 6735 (15),
Law 492 (76) and Law 5510 (247) all opened, each starting with its title and
`Kanun Numarası`. Law 4761 did not, and should not: it is an amending law, whose
articles live inside the laws it amended, so its figure is verified in the
consolidated law it changed and the locator names both. The PDF marks amended
text with footnote numbers set inline, so a passage is split around one the way
it is split at a page break, and the locator names the article, paragraph and
page. The enacted text on `tbmm.gov.tr` is used only where no consolidated text
carries the provision, with the locator saying "as enacted" and the conversation
asked whether it was amended since. Regulations and circulars follow the same
rule where `mevzuat.gov.tr` carries them.

**A consolidated PDF does not say when it was last consolidated**, and opening
one proves only that it opens. So a statute definition also carries the
amendment trail the PDF prints for the paragraph it quotes: each footnote the
PDF attaches there, copied exactly as one more piece of evidence, with the
locator naming it, or the locator saying the retrieved PDF shows no amendment
note on that paragraph. That records what the PDF displayed on the read date,
not that the paragraph was never amended: an annulment takes effect from its
publication in the Official Gazette and a consolidation can lag it. No
definition claims a consolidation date. Where the conversation knows of an
amendment the PDF does not show, the figure is not verified from that PDF. And
the PDF is never taken as proof that no other instrument changes the rule: an
amount the law leaves to a regulation or a Presidential decision is verified
from that instrument, as its own source.

## Where the page is an image

The residence-permit charge by nationality is a PNG on `goc.gov.tr`. I save it,
read it at full size, and the evidence is an exact transcription of each row the
document relies on: the group's heading as printed, its amounts, and the named
countries the document lists, with `method` `rendered image` and a locator
naming the rows. A number the image does not print, such as the main group's
158 countries, is `calculated`, counted from the transcription, unless a page
states it in words. A transcription is checked by opening the image.

An image at the same address can be replaced without notice, so a definition
transcribed from an image also records the SHA-256 digest of the file I read, in
a `sha256` field, as provenance for the transcription. It is not a test the
figure has to pass and it preserves nothing: a later digest that differs means
the image is read and transcribed again. Only images carry it; a PDF's article,
page and exact passage already show whether its text changed.

## A page that refuses a script

The same ladder as SB-174: a raw fetch, retried through Windows' own `curl` when
Python's certificate check fails; then the browser pane, searching
`document.body.innerText`; then a PDF or image read as rendered. A page behind a
CAPTCHA or a sign-in is not opened, because getting past a bot check is not
something I do. Its figure goes back to the conversation for another page.

## When no page that can be opened states a figure

The card says the case's conversation finds a page that does. If it cannot, the
figure stays `unverified` and goes back once more with a different question:
what can the agreed sentence truthfully say? If both sides agree it claims a
figure no page supports, the correction is made in that conversation and the
agreed document takes the corrected sentence, as every sign-off turn already
did. The folder's rule is that agreed text is not softened or sharpened when it
becomes a guide; correcting it through the conversation that agreed it is how it
was agreed in the first place. Every such correction is recorded in `README.md`
with what someone who reads only the repository needs to audit it: the document
and paragraph, the sentence as agreed, the sentence as corrected, the reason,
what the search for a source found, and the transcript turn where both sides
agreed it. None is made silently.

## SB-169 gets the rule SB-170 got

SB-174's plan check found that a rule row has one `sourceUrl` while a figure can
carry two definitions, and SB-170's card now says how a row picks its source.
SB-169 writes Turkey's rows under the same constraint, and since 2026-09-14 its
card says so in full: a row takes the verified definition whose page directly
states every fact the row asserts; where no single page does, the row is split
by source, or SB-169 adds a relation so a version can hold more than one
source, because `RuleVersion` has one `sourceUrl` today; a calculated
definition is never asserted as a rule fact.

## Order

The inventory turns run two cases at a time through `research.py`. Health
insurance goes first, because the SEDDK limits are the gap most likely to need a
new page or a corrected sentence, and the other five proceed while it is argued.
Verification, annotation and the reading of each passage against its sentence
are mine, one document at a time. The last passes run two at a time.

## Files

The six documents under `agreed/turkey`, their transcripts under `talk/turkey`,
`README.md` (Turkey's checks and draw, the optional `sha256` field, and the
record of any corrected sentence), this plan, and `.claude/todo.db` for
SB-169's card. The scripts
stay out of the repository, as SB-174's did.

## The step I am least sure of

**The consolidated statute PDFs.** A passage can be on a real official page and
still be wrong because that page is the law as passed. The plan moves every
statute figure to `mevzuat.gov.tr`, but that rests on four laws opening once,
and on the PDF's inline amendment footnotes being the only thing that breaks a
literal match. If a consolidated PDF lags an amendment, or its text layer runs
columns together, the same failure comes back from the other side.

## As built

**Counts.** The six documents carry 136 markers and 132 definitions, 129
verified and 3 calculated. The verified ones quote 281 passages: 150 from PDF
pages read as rendered, 80 from raw pages, 25 transcribed from scans, 15 from
the fee image and 11 from pages read in the browser pane. The 230 a script can
search for were all found on their pages, the scans and the image match their
digests, and the five browser-pane definitions were read in the browser. The
estimate above was about 135.

**The step I was least sure of held, with three surprises.** Every consolidated
PDF opened: Laws 492, 4054, 5326, 5490, 5510, 6102, 6112, 6458 and 6735, and the
regulations implementing Law 6458 (`yonetmelik/7.5.21460`) and the
International Labour Force Law (`yonetmelik/7.5.39337`). Law 4761 is quoted
inside Law 492's tariff, as planned. Two regulations exist on `mevzuat.gov.tr`
only as pages a script fills in, the Temporary Protection Regulation and the
regulation on workplace licences, so they were read in the browser pane. The
surprises: a text layer can keep the ligatures `ﬁ` and `ﬂ`; a real hyphen at the
end of a printed line, "15/7/2016-" in Law 492, is folded away like a word
broken across lines, so that passage is split around it; and partway through,
`mevzuat.gov.tr` and `resmigazete.gov.tr` stopped answering any request without
a browser's `User-Agent`, while `ito.org.tr` and `ticaret.gov.tr` reset
connections for a while. The verifier now falls back to Windows' own `curl` on
a reset or a stall as well as on a certificate failure, and refuses any answer
that is an HTTP error, which it was watched doing on a planted missing page.

**Amounts set by another instrument.** The 50,000 lira minimum capital is quoted
from Presidential Decision 7887 itself, a scan whose body has no text layer,
with the Official Gazette correction of 26 November 2023 that put it in force on
1 January 2024. The 2026 notarial tariff was amended on 26 August 2026, and that
amendment changes only its Article 11, not the Articles 1, 3 and 4 quoted.

**Where the build departed from this plan.**

- The main group's 158 countries were to be calculated. The image numbers its
  rows and prints "158 ZİMBABVE" as the main group's last, so 158 is verified
  from the image.
- The table called the 20 lira levy arithmetic. İTO's formation cost sheet
  prints it, "Rekabet kurumu payı (50.000 TL sermayeye göre) 20 TL.", so it is
  verified.
- The tax number did not need `dijital.gib.gov.tr`. Its two figures are quoted
  from GİB's 2010 institutional report and from Bursa Uludağ University's page,
  which the sentence already names. MKK's letter is not used, because MKK is a
  private company.
- GİB's April 2026 brochure has no text layer, so it is a scan with a digest.
  The January 2025 edition, which has one and says the same, was cited beside
  it until the plan check found that a superseded edition could be taken as the
  source of a current rule. It was removed, and SB-169's card now says a
  superseded edition is never a row's source.
- The SEDDK limits are quoted from circular 2024/34 itself, a scan, not from the
  press release.

**Corrections.** Twelve sentences were corrected, each in its own conversation:
five in the inventory turns, because no page states what they said, and seven in
the last pass, because a sentence left out a condition its page states or said
what no page does. The rule above was written for figures no page states. The
last pass widened it to sentences that leave out a condition their page states,
because a footnote that carries the condition does not repair a sentence a
reader acts on. `README.md` records each one with the sentence before and after,
the reason and the turn.

**The last pass.** Health insurance and the tax number came back no at once.
Work permit came back with two quotes missing a condition, the documentary proof
its exemptions require and what makes an extension application timely, and with
both added it came back no. Short-term residence permit, address registration
and company formation came back with sentences to correct, which each
conversation worded or confirmed, and then no.

**The random recheck** drew two verified definitions per document, twelve in
all, and every one held. `README.md` records them.

The scripts stayed out of the repository, as SB-174's did. The draw now checks an
image or a scan by its digest, where it used to search the file's bytes for
text.
