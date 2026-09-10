# InfoPanel

A panel inside a guide that says what KIND of information it holds, from Figma
node `14:26`, where it is called "Alert / Information panel".

```tsx
<InfoPanel kind="officialInformation" meta="Presidency of Migration Management · verified August 2026">
  A student residence permit application must be submitted within one month of arrival.
</InfoPanel>
```

| kind | for |
|---|---|
| `officialInformation` | a rule, from the institution; needs its source |
| `practicalAdvice` | what applicants report; needs where it came from |
| `warning` | something that gets applications refused |
| `scamWarning` | someone will try to sell you what is free |
| `legalUncertainty` | the answer depends on the reader's situation |
| `coverageGap` | we have not verified this for this place |

The design's rule is that two registers must never blend. So the eyebrow, the
small capitals line naming the kind, is fixed per kind and cannot be passed in,
and `meta` is required by the type for official information and practical
advice: one carries a named source, the other always says where it came from.

Dashed borders mean incomplete. Legal uncertainty and coverage gaps are dashed,
so a reader sees the edge of what we know before reading a word; the eyebrow
says the same thing in words.

It is not MUI's `Alert`. That renders `role="alert"`, which a screen reader
announces the moment it appears, so a guide with five panels would interrupt
five times on load. This is a `note`, named by its eyebrow.
