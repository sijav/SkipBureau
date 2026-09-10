# StatusTag

A small label that says where something stands, from Figma node `13:26`. Pick
it by what the status MEANS; the colours follow, and there is no colour prop.

```tsx
<StatusTag status="deadline">Due in 12 days</StatusTag>
```

| status | means |
|---|---|
| `official` | comes from the institution itself |
| `verified` | checked against an official source, with when |
| `needsContext` | the answer depends on the reader's situation |
| `deadline` | a date is at stake |
| `warning` | check before acting, for example before paying |
| `blocked` | the reader is stopped and has to act |
| `waiting` | the reader has to wait for someone else, nothing to do |
| `completed` | done |

Three statuses share amber on purpose, the design's own rule: deadline and
needs-context are both time or situation sensitive, and the label does the
disambiguating, not a third colour. Waiting is neutral because it asks for
patience, not action.

The words carry the meaning, so colour is never the only signal. The small
square in front is decoration and can be turned off with `showMark={false}`.
