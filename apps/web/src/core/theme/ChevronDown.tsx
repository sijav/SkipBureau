import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 16:53's exported chevron, path VERBATIM, with the layout's own offset
// and rotation applied as transforms rather than re-derived: the export is a
// 7.79 x 4.5 triangle pointing up, set 0.60 in from each side of a 9 x 6 box
// and turned 180 degrees. Its fill was a hex per state; it paints currentColor
// so the theme can take the colour from a token.
export const ChevronDown = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 9 6" {...props}>
    <g transform="rotate(180 4.5 3)">
      <path transform="translate(0.60289 0)" d="M3.89711 0L7.79423 4.5H0L3.89711 0Z" />
    </g>
  </SvgIcon>
)
