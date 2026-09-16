# SB-198, what the live site said

The read-back its plan describes, run on **2026-09-16 at 03:41:49Z** against the deployment of commit **c3b94f8**,
the push that carried SB-301's corrections and SB-313. The API is
`https://p01--buildfromgithub--fsy7zpnfgznq.code.run/graphql` and the site is `https://sijav.github.io/SkipBureau/`.
Its script is read-only and takes no credentials; what it asks for is below, so the same questions can be asked again.

## What was asked

**Everything Germany has, rather than what was expected:**

```graphql
{
  guides(country: "de") { slug }
  categories(country: "de") { slug }
  questions(country: "de") { slug }
  sampleQuestions(country: "de")
}
```

**Whether anything is called sample content**, per goal and per area: `taskHub(country: "de", slug: $goal) { sample }`
and `categoryHub(country: "de", goal: $goal, slug: $area) { sample }`.

**Each guide, whole**, compared field by field against its entry in `src/guide/researched-guides.ts`:

```graphql
query G($slug: String!) {
  guide(country: "de", slug: $slug) {
    slug title description verifiedAt intro quickAnswer cost time deadlines costNote
    place { categorySlug goalSlug }
    sections { kind position title body }
    sources { url name publisher official note verifiedAt }
    options { __typename }
    related { slug }
    obligations { slug }
  }
}
```

**Each page**, in both languages: `GET /en/DE/guides/<slug>` and `/fa/DE/guides/<slug>`, for a 200 and the guide's
own title in the file the server sends, before any script runs.

## What it answered

```
# SB-198, the live read-back, 2026-09-16T03:41:49.937Z
# 4 researched German guides in the file: residence-permit, anmeldung, business-registration, health-insurance

## What Germany has, asked for in full
  ok   guides: anmeldung, business-registration, health-insurance, residence-permit
  ok   areas: anmeldung, business-registration, health-insurance, residence-permit
  ok   questions: none
  ok   sampleQuestions: false

## Nothing is called sample content
  ok   goal get-a-residence-permit: sample false
  ok   goal getting-settled: sample false
  ok   goal start-a-business: sample false
  ok   goal health-and-insurance: sample false
  ok   area residence-permit: sample false
  ok   area anmeldung: sample false
  ok   area business-registration: sample false
  ok   area health-insurance: sample false

## Each guide is its entry, whole
  ok   de/residence-permit: title Getting a residence permit in Germany
  ok   de/residence-permit: description is the document's first sentence
  ok   de/residence-permit: verified 2026-09-15
  ok   de/residence-permit: in get-a-residence-permit/residence-permit
  ok   de/residence-permit: 5 sections, in the file's order and words
  ok   de/residence-permit: 6 sources, named and dated as the loader writes them
  ok   de/residence-permit: no quick answer, cost, time, deadlines, intro or cost note
  ok   de/residence-permit: no options and no related guides
  ok   de/residence-permit: rules get-a-residence-permit-as-a-skilled-worker-with-a-degree of 1 group(s)
  ok   de/anmeldung: title Registering where you live in Germany
  ok   de/anmeldung: description is the document's first sentence
  ok   de/anmeldung: verified 2026-09-14
  ok   de/anmeldung: in getting-settled/anmeldung
  ok   de/anmeldung: 7 sections, in the file's order and words
  ok   de/anmeldung: 16 sources, named and dated as the loader writes them
  ok   de/anmeldung: no quick answer, cost, time, deadlines, intro or cost note
  ok   de/anmeldung: no options and no related guides
  ok   de/anmeldung: rules report-your-address of 1 group(s)
  ok   de/business-registration: title Registering a business in Germany
  ok   de/business-registration: description is the document's first sentence
  ok   de/business-registration: verified 2026-09-14
  ok   de/business-registration: in start-a-business/business-registration
  ok   de/business-registration: 10 sections, in the file's order and words
  ok   de/business-registration: 17 sources, named and dated as the loader writes them
  ok   de/business-registration: no quick answer, cost, time, deadlines, intro or cost note
  ok   de/business-registration: no options and no related guides
  ok   de/business-registration: rules register-a-trade, notify-the-accident-insurer,
       send-the-tax-registration-questionnaire, pay-trade-tax, pay-chamber-of-commerce-contributions,
       use-the-vat-small-business-rule, check-your-title-allows-self-employment of 7 group(s)
  ok   de/health-insurance: title Health insurance in Germany, which is not optional
  ok   de/health-insurance: description is the document's first sentence
  ok   de/health-insurance: verified 2026-09-14
  ok   de/health-insurance: in health-and-insurance/health-insurance
  ok   de/health-insurance: 9 sections, in the file's order and words
  ok   de/health-insurance: 17 sources, named and dated as the loader writes them
  ok   de/health-insurance: no quick answer, cost, time, deadlines, intro or cost note
  ok   de/health-insurance: no options and no related guides
  ok   de/health-insurance: rules join-statutory-health-insurance, pay-care-insurance-contributions of 2 group(s)

## Every guide is a page
  ok   en/residence-permit: HTTP 200, its own title true
  ok   fa/residence-permit: HTTP 200, its own title true
  ok   en/anmeldung: HTTP 200, its own title true
  ok   fa/anmeldung: HTTP 200, its own title true
  ok   en/business-registration: HTTP 200, its own title true
  ok   fa/business-registration: HTTP 200, its own title true
  ok   en/health-insurance: HTTP 200, its own title true
  ok   fa/health-insurance: HTTP 200, its own title true

every check ok
```

## What the rules answered, from the cards that shipped them

The rule cards are drawn from the research data rather than from these entries, so they were proved where they were
built and are named here rather than asked again: on 2026-09-16, `/en/DE/guides/business-registration` answered the
Berlin registration fee of **€26** for a reader who chose Berlin as their work place in the panel (SB-313), and
`/en/DE/guides/health-insurance` and its Persian page answered Saxony's **2.3%** employee care share for a reader who
works there, where the national page says 1.8%.

## What this does not say

Its roast named two more gaps, and they are written here rather than left in the wording. The comparison is **not**
the whole of what a reader sees: the guide's breadcrumb and its structured data show the **area's title**, which this
read-back never asked for, since it compared the area by slug (**SB-322**); and a rule card's facts, labels, values
and notes come from the research data through the rules resolver rather than from these entries, so only the slugs of
the rules each guide links were compared (**SB-323**). The answers named above were proved when SB-300 and SB-313
shipped them, which is history, not this check. Each source's publisher, official flag, note and date are what the
loader writes rather than anything the agreed document says, so comparing them holds the loader to itself.

The checker itself is not committed, only its queries and its output, so this record can be repeated by hand but not
re-run (**SB-324**).

The public API lists what a reader can reach. A guide, area or question with **no text row at all** would be invisible
to `guides`, `categories` and `questions`, so this proves no sample content is **served**, not that no unexpected row
exists in the database; reading raw tables would need the database's credentials, which are not in this repository.
And **SB-317** holds the one thing known to survive: a visitor's suggestion made against the Anmeldung guide while
that row was sample content, which is not a row a reader sees and which the API exposes no way to read.
