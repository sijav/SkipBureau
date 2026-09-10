import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 17:17's exported search icon, geometry VERBATIM. Its two exports were
// the same shapes with a different hex; it paints currentColor instead, so the
// state's colour comes from a token.
export const SearchIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 18 18" {...props}>
    <circle cx="6.5" cy="6.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="12" y="11.5" width="2" height="6" rx="1" transform="rotate(45 12 11.5)" />
  </SvgIcon>
)
