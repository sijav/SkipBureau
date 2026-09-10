# ContextChip

One piece of the reader's situation, their nationality, city or status, shown
where an answer depends on it. From Figma node `17:27`.

```tsx
<ContextChip name="Nationality" value={nationality} prompt="Add to sharpen answers" onClick={editNationality} />
```

The design: persistent and always editable. So it is always a button, and
`onClick` is required.

Whether it is set follows from `value`. With a value it is quiet: a hairline
stroke on white. Without one it is unset, amber and dashed, and shows `prompt`
instead, because an unanswered context question is the reason an answer may be
wrong for this reader. The dash stays on hover, so the signal does not vanish
under the pointer.

The name is set in small mono capitals in English. In Persian it is set in the
interface face without tracking, because Persian has no capitals and tracking
pulls its joins apart.
