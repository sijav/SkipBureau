import { SvgIcon, type SvgIconProps } from '@mui/material'

// Figma 30:84's exported glyphs, paths VERBATIM, painting currentColor.

export const CheckGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </SvgIcon>
)

export const RingGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <circle cx="8" cy="8" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </SvgIcon>
)

export const DashGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <rect x="3.5" y="7" width="9" height="2" rx="1" fill="currentColor" />
  </SvgIcon>
)

export const DotsGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <circle cx="4.25" cy="7.75" r="1.25" fill="currentColor" />
    <circle cx="8.25" cy="7.75" r="1.25" fill="currentColor" />
    <circle cx="12.25" cy="7.75" r="1.25" fill="currentColor" />
  </SvgIcon>
)

export const ForwardGlyph = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16 16" {...props}>
    <path d="M3 8H12M8.5 11.5L12 8L8.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </SvgIcon>
)
