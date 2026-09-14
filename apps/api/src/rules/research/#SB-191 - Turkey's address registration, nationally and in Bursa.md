# SB-191, Turkey's address registration, nationally and in Bursa

**Exit:** on the deployed API, a reader who holds a residence permit and lives in
Bursa is told the twenty working days, the fines and Bursa's appointment and UETS
account, each naming its page, a reader elsewhere in Turkey is told the national
answer, and a reader on a visa exemption is not told the duty.

## Why

It is the first duty a newcomer meets, and Bursa is the one place difference the
research found where a reader lives. The owner, 2026-09-14: a rule belongs to a place
at any level, a narrower place inherits the country's rule and states only what
differs, and a reader is shown the answer for their place. SB-210 put Turkey's 81
provinces on the deployed database, so a reader can now say they live in Bursa, or
anywhere else, and be answered.

## What stays exactly as it is

- **SB-190's loader and its rule for choosing a page, SB-194's statuses, SB-209's
  notes and SB-210's regions.** No loader change, no schema change, no migration.
- **SB-186's inheritance.** Bursa's version narrows the national one by place alone,
  so it takes every fact it does not state from it.
- **`seed.ts`'s sample `register-your-address`**, the sample guide linked to it, and
  every spec that reads them.

## A new obligation beside the sample's

**`report-your-address`**, a `registration`, titled "Report your address and any
change to it" and "اعلام نشانی محل سکونت و هر تغییر آن". Not `register-your-address`:
the seed's sample Turkish version of that slug has no criteria, so in every test
database it reaches every reader, and `test/research-rules.e2e.spec.ts` runs the seed,
so there a visitor on a visa exemption would be told the sample's duty, which is what
the exit says they are not told. Removing the sample would rewrite five specs that
demonstrate the diff with it, and samples go when SB-197 and SB-199 replace them.
SB-192 and SB-194 took their own slugs beside the samples too. Which German duty this
one is compared with is SB-170's decision.

## Two residence statuses

The research verified the duty for three statuses, and Turkey's file has one of them.
Two are added, each with nothing above it, written before any version as SB-194's are:

- `tr.international-protection`, "International protection, applied for or granted",
  "حمایت بین‌المللی، درخواست‌شده یا اعطاشده": an applicant, a refugee, a conditional
  refugee or a subsidiary protection holder, the persons the regulation's Article
  110(3) names;
- `tr.temporary-protection`, "Temporary protection", "حمایت موقت".

No kinds under either: no rule here tells them apart.

## Six versions, all from `agreed/turkey/address-registration.md`

Every version is valid from the day its pages were read, 2026-09-14, as every other
Turkish version is.

**Three national versions, one per status**, each with one `residenceStatus` criterion
and three facts:

| status | `reportAddressChangeWithin`, 20 working days | the two fines |
|---|---|---|
| `tr.residence-permit` | the regulation's Article 23(2), `yukk-reg-23-2-twenty-working-days` | NVI's address services page, `nvi-fines-2026` |
| `tr.international-protection` | the regulation's Article 110(3), `yukk-reg-110-3-twenty-working-days` | the same |
| `tr.temporary-protection` | the Temporary Protection Regulation's Article 33(2)(d), `gk-reg-33-2-d-twenty-working-days` | the same |

The fines are `lateAddressNotificationFine`, 814 TRY, and
`falseAddressDeclarationFine`, 17,051 TRY. Each version's own source is the provision
for its status.

**Three Bursa versions**, one narrowing each national version: the same status, and
`residenceRegion` TR-16. Each states two facts from Bursa's notice,
`bursa-appointment-2026`, and nothing else: `appointmentBookedThrough`, the text
`randevu.goc.gov.tr`, and `uetsAccountRequired`, the text `yes`. The rest a reader in
Bursa is told comes from the national version, with its own page.

**Why a Bursa version for every status.** The notice sets how Bursa's provincial
migration directorate carries out address registration from 1 June 2026 and names no
status, so a version for permit holders alone would tell a Bursa permit holder and not a
Bursa protection applicant the same directorate's procedure. It does not say where each
status must register: NVI's FAQ lets a permit holder report to the population
directorate or the migration directorate. So each Bursa note opens with the condition
the notice itself sets, registering at that directorate.

**Pages, chosen as SB-169 says.** Article 23(2) over NVI's FAQ that repeats it for
permit holders; Article 110(3), a whole sentence naming its persons, over Law 6458's
Article 90(1)(c), a clause in a list; Article 33(2)(d), the only page for temporary
protection; NVI's address services page, the only page for the 2026 fines and national;
Bursa's own notice, whose scope is Bursa. That the fines rise each year is a note, not a
fact, and rests on Law 5326's Article 17(7), not on Istanbul's FAQ, whose scope is one
province.

## Notes, per version

Each opens with who it binds, as SB-196's and SB-193's do, and says only what the agreed
document says.

- **Residence permit:** "For a residence permit holder. The notification period for a
  change of address is 20 working days, but we could not verify an explicit starting
  event for foreigners from a current official source. Do not assume that giving your
  address in e-İkamet completes address registration. The population directorate's FAQ
  says you report to the population directorate or the provincial migration directorate, and the Migration
  Presidency's page reads as though you file with both: ask at whichever you go to
  first whether you also need the other. The fines are national figures at 2026 rates,
  usually revised each January."
- **International protection:** "For an international protection applicant or status
  holder. The notification period for a change of address is 20 working days, but we
  could not verify an explicit starting event for foreigners from a current official
  source. The fines are national figures at 2026 rates, usually revised each January."
- **Temporary protection:** the same, opening "For a temporary protection beneficiary."
- **Each Bursa version:** "Where you register your address at Bursa's provincial
  migration directorate: from 1 June 2026 it carries out address registration by
  appointment through randevu.goc.gov.tr, and lists a UETS account among the documents.
  We could not verify a national UETS requirement for address registration."

A Bursa reader is given the national note first and Bursa's after it, as SB-209 orders
them.

## Files

`src/rules/research/turkey.ts` and `test/research-rules.e2e.spec.ts`. No loader,
schema or document change.

## What this card does not do

It writes no fact for a work-permit holder, whose later moves the research did not
establish; no starting event for the 20 working days; no first registration's deadline
from a permit's delivery, entry or issuance, which the research verified but this card
does not carry; no office, e-Devlet service or other province, since the research found
no other provincial notice dated 2025 or 2026 and said that is not knowing Bursa is
alone; and no guide change.

## The step I am least sure of

**A Bursa version for all three statuses, conditioned on the directorate.** The notice
names no status and no other page says whom it covers; the condition keeps the note
true for a reader who registers elsewhere.

**A new slug beside the sample's.** Two obligations for one duty until the samples go.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`, after a load, for each of the three
statuses:

- a reader holding it who lives in Bursa, TR-16, is told the national version's three
  facts and Bursa's two, each on its own page, with the national note and then Bursa's;
- one who lives in Istanbul, TR-34, is told the national three and its note only;
- one who has not said where they live is asked for `residenceRegion`;
- each national version's 20 working days rest on the provision for its status, by label.

And a visitor on a visa exemption, in Bursa or not, is not told the duty; a reader who
has not said what they hold is asked for `residenceStatus`; the two statuses exist; and a
second load adds nothing, which the existing test already counts.

Then planted faults, each watched failing: Bursa's permit version without its status
criterion, Bursa's version restating the 20 working days from its own page, the
international protection version citing Article 23(2), and the national permit version
without its criterion. Then the full API suite, lint and `lint:tsc`, the build, and the
compiled loader twice on a fresh database. After the push, on the deployed API: a
residence permit holder in Bursa is told the five facts on their pages, one in Istanbul
the national three, and a visitor on a visa exemption nothing.
