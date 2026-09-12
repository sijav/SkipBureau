# SB-167, What actually differs by province in Turkey and by state in Germany

**Exit:** a findings document per country, each obligation naming what varies by
region, with an official source URL and a checked date per fact, and a final GPT
pass that raises nothing new.

## Why this is the first thing after the MVP

Every guide on the live site is sample content. It was written by an assistant
who opened no government page, and the entrypoint fills it in on every deploy so
the screens can be seen. The owner calls that database test-only, and it is, but
the product's one real claim is the verified date on a guide: that somebody
checked this rule, on this date, against this official page. Until the content
is researched, that claim is false on every page.

The owner's order of 2026-09-12 says how: through GPT, in one conversation,
resumed, with each answer roasted and sent back in until both sides are
satisfied. It is recorded in CLAUDE.md.

## What the conversation is for, and what it is not

**It is for finding out what is true and where it is written down.** Every fact
comes back with an official source URL and a date. Anything that cannot be
sourced is recorded as unsourced rather than written into a guide.

**It is not for writing the guides.** A model's prose about Turkish
bureaucracy is exactly what this product exists to replace. What the research
produces is a table of obligations and facts; the words a reader sees are
written from that table afterwards, and every one of them points at its source.

## The shape of the questions

One conversation per country, resumed. Each round asks about a small set of
obligations and demands, for each:

- what the obligation is, in one sentence;
- whether the requirement, deadline, fee, office, appointment system or
  documents differ by region, naming which;
- where they differ, two or three named provinces or states and how;
- the official source URL and the date that page was last updated or read;
- plainly, where something is the same nationwide, because "no variation" is an
  answer this product needs as much as a difference;
- plainly, where it could not be verified, because a guessed deadline published
  to somebody standing in an office is the one failure this cannot have.

And a distinction the schema cares about: **a rule that differs in law** is not
the same as **an office that behaves differently**. The first is a rule version
for a region; the second is a note on a guide. Both matter to a reader; storing
them the same way would make the first untrustworthy.

Each answer ends with the list of URLs actually opened. An empty list means the
answer was written from memory, and memory is what this order exists to stop.

## The loop, which is the owner's instruction

1. Ask.
2. Read the answer here, against the product: is every fact sourced, is the
   region question actually answered, is a nationwide claim hiding a difference,
   does a cited page say what the answer says it says.
3. Send that judgement back into the **same** conversation as the next question.
4. Repeat until a round raises nothing new.

Two roasts of the same kind cannot share a conversation, so these run one at a
time, never in parallel.

## Least sure of

- **Whether the cited pages say what the answer says.** A URL in an answer is
  not a verified fact; it is a claim that a page exists. The ones a guide will
  actually rest on are opened and read here before anything is written down.
- **How much genuinely varies by province in Turkey.** It may turn out that the
  law is national and only the offices and waiting times differ, which would
  change SB-168 from a rule dimension into a note on a guide. The research
  decides that, not the schema.
- **Persian and Turkish sources.** The official pages are in Turkish and German;
  an English page on the same site is sometimes older. Where they disagree, the
  local-language page is the source and the disagreement is worth recording.

## How it is checked

The findings document per country, with a source URL and a date against every
fact; a sample of those URLs opened and read here; and a final round that
raises nothing new.
