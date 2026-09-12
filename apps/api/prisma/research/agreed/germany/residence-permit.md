# Getting a residence permit in Germany

**Agreed 2026-09-12**, after two turns in `talk/germany/residence-permit.md`.
Five overclaims found at sign-off. Every sentence below is the corrected one.

The correction worth naming: the draft told a reader who cannot get an
appointment to plead an emergency. The actual answer is that in Berlin you
**submit the online application before your permission expires and do not need
to wait for an appointment at all**. Published as drafted, it would have sent
people to beg for a slot they did not need.

## What a reader is told

**Who decides.** The Ausländerbehörde where you live decides your application
and issues the permit: in Berlin the **Landesamt für Einwanderung**, in Munich
the city's **Servicestelle für Zuwanderung und Einbürgerung**. The employment
agency may have to consent to your job, but it does not issue the permit.

**What it costs, and this one is federal.** A first residence permit for
employment, issued as an electronic card, costs **€100**, whether it runs for a
year or longer. It is set in the federal **Aufenthaltsverordnung §45(1)**, not
by your city. If you see **€56** quoted in Berlin, that is the federal reduction
for the exceptional sticker format under §78a, not a Berlin price. Exemptions
and reductions exist.

**What happens while you wait, and this is the part to read twice.** Applying
before your national **D visa** or residence permit expires normally preserves
that title under **§81(4)**; applying during a lawful **visa-free** stay without
a residence title protects your stay under **§81(3)**. A short-stay **C visa**
does not receive this protection. These rules apply nationwide.

Applying does not automatically let you work, and it does not automatically let
you travel.

- **Under §81(4)**, your existing permission to work continues with the
  restrictions it already had, and applying does not let you switch to a
  different job. With a valid §81(4) Fiktionsbescheinigung and a valid passport,
  you can travel and come back.
- **Under §81(3)**, the application by itself does not let you work, and an
  **§81(3) Fiktionsbescheinigung does not let you re-enter Germany.** Leaving
  may mean you cannot get back in.

Two more things about working. Under **§81(5a)**, once the authority has started
issuing your employment permit, the specified work is allowed while the card is
being produced, and that permission must be recorded on your certificate. And
arriving visa-free as a tourist is not a general route to applying for a work
permit inside Germany: **§41 AufenthV** opens that route only to specified
nationalities, with a **ninety day** deadline.

**If you cannot get an appointment.** This is real and officially acknowledged:
Berlin says some departments have nothing available for months. In Berlin,
**submit the employment-permit application through the dedicated online
application before your current permission expires; you do not need to wait for
an appointment.** For additional help in a documented emergency, use the
responsible department's contact form. Berlin assesses emergency requests for
urgent travel within the next four weeks evidenced by a booking, or threatened
job loss or benefit termination because of missing valid documentation,
evidenced by an employer's or Jobcenter/Sozialamt's letter. If it accepts the
emergency, it can send a Fiktionsbescheinigung or offer a prompt appointment.

**Cities do the same thing differently.** For the same permit, skilled
employment with a degree (§18b):

| | Berlin | Munich |
|---|---|---|
| Applying | online only, payment before submission | online **or by post** |
| Appointment | after a positive assessment | after review |
| Published time | 4-6 weeks for the electronic card after the issuance stage; that page gives no numerical estimate for the whole process | **up to seven months**, with too many applications and not enough staff said plainly |
| Extra evidence | housing size, and what your rent costs | a declaration about the employment, and a certified translation of a foreign degree |

These are differences in **procedure and in what each office lists**, not
different eligibility rules, and neither list is a promise that nothing else
will be asked for. Munich's employment declaration implements **§18(2)(4a)**,
which is federal: it is not a Bavarian condition.

**The mistake to avoid.** Believing that applying settles all three questions at
once. Staying, working and travelling are separate. Existing work permission
continues under §81(4); new work permission under §81(5a) arises when issuance
of the qualifying title is initiated and must be recorded on the certificate.
Re-entry requires the appropriate valid travel documents. An application receipt
is not the same document as a Fiktionsbescheinigung that is valid for travel.

## What this means for the schema

**The fee is federal here**, unlike the Anmeldung, where Hamburg charges its own
€16. So "Germany is a state-based country" is too coarse to be a storage rule:
**some rules are federal and some are regional, in the same country, for the
same reader.** The dimension has to be decided per rule, not per country, which
is another argument for SB-168 storing a region on the rule rather than
partitioning the country.

**One thing Berlin has that has no home in the schema yet:** the
*Verfahrenshinweise* (VAB), an administrative-policy layer that is neither
federal law nor an office's habit, published as interpretations and guidance for
exercising discretion. Its existence is verified; the current PDF could not be
read, so what it changes is **not** verified. If a later case shows it changes
outcomes, it is a third kind of thing and the schema will have to say so.

## Sources

- <https://www.gesetze-im-internet.de/aufenthg_2004/__81.html>, `__71`, `__18`
- <https://www.gesetze-im-internet.de/aufenthv/__45.html>, `__45b`, `__52`, `__41`
- <https://www.gesetze-im-internet.de/gg/art_83.html>, `art_84`
- <https://service.berlin.de/dienstleistung/329328/> (§18b), <https://service.berlin.de/dienstleistung/326233/> (Fiktionsbescheinigung)
- <https://www.berlin.de/einwanderung/termine/termin-vereinbaren/>
- <https://www.berlin.de/einwanderung/service/downloads/artikel.875097.php> (the VAB, unread)
- <https://stadt.muenchen.de/service/info/servicestelle-fur-zuwanderung-und-einburgerung/10278359/>, <https://stadt.muenchen.de/infos/sze-faq.html>

All read 2026-09-12.
