import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 45:637's exported shapes, geometry VERBATIM, painting currentColor.

export const HeaderGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="10.3" y="9.5" width="1.8" height="5" rx="0.9" transform="rotate(45 10.3 9.5)" />
  </SvgIcon>
)
