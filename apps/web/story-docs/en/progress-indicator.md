# ProgressIndicator

How far through a process the reader is, from Figma node `17:45`.

```tsx
<ProgressIndicator completed={3} total={9} />
<ProgressIndicator completed={3} total={9} variant="bar" />
```

Steps is the default, and the design says why: bureaucracy is discrete, and a
segmented track lets a reader see there are nine things, not an abstract 33%.
Use `bar` only for aggregate dashboards.

The segment after the last completed one is shown as the current step. The
label states the count in the reader's own digits, and assistive technology
hears it as three of nine rather than a percentage.

It is not MUI's `Stepper`. The design's segments carry no number, label or
icon, so it is a progress bar drawn in pieces, and a Stepper would announce a
wizard that is not there.

One open design question: in light mode the remaining segments are barely
visible against the page. The count is always in the label, so no one loses
the information, but the design's aim of seeing nine things is not yet met.
