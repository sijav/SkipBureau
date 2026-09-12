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
