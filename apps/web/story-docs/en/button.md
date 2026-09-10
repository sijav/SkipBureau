# Button

MUI's own `Button`, styled by the theme to Figma node `11:44`. There is no
wrapper: import it from `@mui/material` and pick a style by what the action
means.

## Which style

| style | use it for |
|---|---|
| `primary` | the one action this screen exists for, at most one per screen |
| `secondary` | a real alternative to the primary action; the default |
| `ghost` | navigation away from what the reader is doing |
| `destructive` | something irreversible, used sparingly |

`secondary` is the default because it claims nothing. Ask for `primary` by
name, so a screen never ends up with two of them by accident.

## What you cannot pass

- **No `color`.** The styles are chosen by meaning, not hue. MUI's `color`
  would compile and do nothing, so it is removed from the type.
- **No `size`.** The design has one size in v1 and defers the rest until a
  screen needs one.
- **No `contained`, `outlined` or `text`.** Those are MUI's looks, not the
  design's.

## States

Hover, pressed, keyboard focus and disabled all come from the theme. Focus is a
2px outline drawn inside the button, so focusing never moves the layout. The
hover and pressed stories are for looking at: their colours are proven in
`contrast.test.ts`, against what the theme emits, in light and dark.
