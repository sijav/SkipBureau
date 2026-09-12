# What the research means for the schema

**My analysis, not agreed text.** These conclusions were drawn here from the
cases in `agreed/`, and they are kept out of those files on purpose: the
agreed documents hold what the research established, and a reader asking "is
all of this within the evidence?" should not have to wade through my reasoning
about our own data model, which the research cannot verify either way.

That separation was learned the hard way. The fixed-point pass over the agreed
texts objected to sentences like "Turkey's third rule case in a row" and
"nothing in the schema models this" - correctly, because nothing in that
conversation established them. They were mine to assert, in my own file.


## germany/anmeldung

Turkey answered twice that the law is national and only administration varies.
**Germany answers differently, and it is the answer that decides the design:**

> Store the federal registration duty and the Land fee rule **separately**.
> Hamburg's charge is a legally prescribed regional rule, not an office
> practice. The two-week duty has no regional variation; the fee does.

So a region must be able to hold a **rule**, with facts of its own like a fee,
and not merely a note attached to a national rule. A design that only allowed
regional notes would have had nowhere to put Hamburg's €16, and would have been
chosen on Turkish evidence alone.

Three levels, then: **federal duty**, **Land rules** where a Land has
legislated, and **municipal procedure**, which is not a rule at all.


## germany/business-registration

**A fourth distinction, and the sharpest one yet: who SETS a rule is not who
ADMINISTERS it.** Cologne's €26 is NRW's tariff, collected by the city. A model
that recorded "Cologne charges €26" would be storing the collector as though it
were the author, and would not know that every NRW city charges the same.

So a regional rule needs **the level it belongs to**, not merely the place a
reader happens to be standing. Together with Saxony's place-of-employment
trigger, SB-168 now has two reasons why a bare "region" column is not enough.

**And this case has two classifications for one activity**, decided by two
authorities who need not agree. Nothing in the schema models "two bodies
classify the same fact differently", and this is the first rule that needs it.
Filed rather than guessed at.


## germany/health-insurance

Until this case, every regional difference found was a **region attaching its own
charge to a national duty**: Hamburg's €16, Istanbul's and Antalya's chamber
tariffs. Saxony is not that. It is a **federal rule that itself carries a
regional variant**, written into federal law.

And the trigger is **where the employment is, not where the reader lives**. A
region dimension keyed only on residence would return the wrong contribution for
somebody living in Brandenburg and working in Dresden.

So a rule's region needs to say **what kind of connection it is**: where you
live, where you work, or where the transaction happens. SB-168 should not assume
residence.


## germany/residence-permit

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


## turkey/address-registration

No regional variation **in law** was found: the 20-working-day deadlines are
national. What Bursa supplies is evidence about **administrative procedure**.
So this rule is stored once, nationally, with a provincial note attached to
Bursa, which is the shape SB-168 should build.

Two things are stored as **unknown rather than absent**, because they are
different and a reader deserves the difference: whether one office or two, and
what the online service completes.


## turkey/company-formation

**A second regional rule that carries money**, after Hamburg's €16: the chamber
charge differs by city, Istanbul 3,305 against Antalya 4,875, and that is a
published tariff rather than an office habit. Turkey's law is still national
throughout; what is regional here is a **fee set by a local body**, which is the
same shape as Hamburg and the same argument for SB-168.

**Everything with a date in it changes on a schedule**: the minimum wage in
January, the chamber tariffs annually, the notary tariff annually. The guide's
verified date is doing real work on this page.


## turkey/health-insurance

**A fifth shape, and it is not regional at all.** Annex 1 names **twenty
specific hospitals** whose coverage tier differs, prescribed nationally. The
answer to "what will this cost me" depends on the *institution*, not the place.
A model with country, region and nothing else cannot express it, and neither can
one that assumes a distinction must be geographic.

**And a number that is a formula.** ₺7,927.20 is 12% of twice a minimum wage
that changes every January. Storing the figure would be storing something that
is wrong four months from now; storing the rule and the dated wage is not.


## turkey/short-term-residence-permit

**The fee is the first real case for eligibility by nationality.** Five bands
plus an outside-every-group tariff plus an exemption list is not a number on a
guide; it is a rule with a nationality criterion, which
`EligibilityCriterion` already models. Storing one figure would be wrong for
almost everybody.

**No regional variation in law**, again: the tariff, the insurance standards
and the address evidence are national. Istanbul's district restriction is
administrative and belongs in a provincial note, stored as **unknown rather
than absent**.


## turkey/tax-number

**National, with no regional variation verified anywhere in this case.** Turkey's
third rule case in a row with nothing for a province to hold.

**Three "you need this for X" claims did not survive**, which is a pattern worth
carrying into every country: the errands a guide sends people on are the part
least likely to have a rule behind them, because nobody ever checks a step that
sounds plausible.


## turkey/work-permit

**National throughout, with no regional variation found anywhere in this case**:
the criteria, the fees, the reserved professions and the ten-day provision are
all national. Turkey's second rule case in a row with nothing for a province to
hold, which is why Germany, not Turkey, decided SB-168.

**The salary rule is a computation, not a constant**, and the minimum wage it
rests on changes every January. Storing the five multipliers and a dated minimum
wage is right; storing five lira figures would be a guide that goes wrong on 1
January without anybody touching it.
