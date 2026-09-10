# SearchInput

The product's primary entry point, from Figma node `17:17`.

```tsx
<SearchInput
  label="Search the guides"
  placeholder="Ask a question or describe what you are trying to do"
  value={query}
  onChange={setQuery}
  onSubmit={ask}
/>
```

The placeholder is serif on purpose, the design's own words: it invites a
sentence, not a keyword. Enter sends the whole question to `onSubmit`.

`label` is required even though nothing shows it. The design has no visible
label, so this is the name screen readers announce, for the field and for its
search landmark. A placeholder cannot do that job: it is not a name, and it is
gone the moment typing starts.

It is not the form input. It is 56 tall, set in Body Large, and it focuses with
a 2px stroke and no ring. Its resting stroke follows the owner's decision for
text fields: dark enough to find the field once it is filled. The icon deepens
when there is a question in the box.
