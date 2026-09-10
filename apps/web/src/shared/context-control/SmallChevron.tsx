import { SvgIcon, type SvgIconProps } from '@mui/material'

/** Figma 44:542's 14px chevron, geometry VERBATIM, painting currentColor. Also the language control's. */
export const SmallChevron = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 14 14" {...props}>
    <path d="M7 9.25L3.96891 5.875L10.0311 5.875L7 9.25Z" />
  </SvgIcon>
)
