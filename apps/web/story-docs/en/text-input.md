# TextInput

A labelled text field, from Figma node `16:32`.

```tsx
<TextInput
  label="Passport number"
  helper="As written in your passport, no spaces"
  error={invalid ? 'Remove the dash, this field takes letters and numbers only' : undefined}
/>
```

The label sits above the field, as the design draws it, not inside MUI's
notched outline. The component is composed from `FormControl`, `FormLabel`,
`OutlinedInput` and `FormHelperText`, and passes everything else to the input.

## The error rule

The design says error text **replaces** the helper and says how to fix the
value, not that it is invalid. So `error` takes the place of `helper` rather than
stacking under it, and the input is marked invalid for assistive technology.
Write it as an instruction: "Remove the dash", never "Invalid passport number".

## Disabled

A disabled field fades its label and value. Its helper does not: the helper is
what tells the reader how to enable the field, so it stays readable. That is a
deliberate departure from the design, recorded in DESIGN.md.
