# SelectField

A labelled select for context fields such as city, nationality and status, from
Figma node `16:53`.

```tsx
<SelectField
  label="City in Turkey"
  placeholder="Select a city"
  options={[{ value: 'istanbul', label: 'Istanbul' }]}
  value={city}
  onChange={setCity}
/>
```

`label` is required. The design's rule: a select always carries its own label,
because a placeholder standing in for one is gone the moment a value is chosen.
The label names the control for screen readers too, so a filled select still
says what it is asking.

The field is the text input's, the same fill, strokes and focus ring. The only
addition is the chevron, drawn from the design's exported shape.

It is controlled: pass `value`, `''` for none, and handle `onChange`. An empty
select shows its `placeholder`.
