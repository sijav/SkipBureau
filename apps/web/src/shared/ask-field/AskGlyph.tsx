import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 58:538's exported glyph, geometry VERBATIM. Not the search icon: a
// 5.1 ring at 1.8 in a 20 box. Its exports differed only by hex, text-secondary
// at rest and text-primary on focus, so it paints currentColor.
export const AskGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 20 20" {...props}>
    <circle cx="7.5" cy="7.5" r="5.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="12.5" y="11.5" width="2" height="6" rx="1" transform="rotate(45 12.5 11.5)" />
  </SvgIcon>
)
