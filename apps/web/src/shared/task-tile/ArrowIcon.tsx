import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 65:1285's exported arrow, path VERBATIM, painting currentColor; its two
// exports differed only by stroke hex, text-secondary and accent-text.
export const ArrowIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <path d="M3 8H12.5M8.5 12L12.5 8L8.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </SvgIcon>
)
