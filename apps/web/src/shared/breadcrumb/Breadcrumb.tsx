import { useLingui } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type Crumb = { label: ReactNode; to?: string | undefined }

export type BreadcrumbProps = {
  /** From the top down. The last is the current page and is not a link. */
  trail: readonly Crumb[]
}

/** Figma 133:719: where this page sits, in the Metadata style, the way home in accent text. */
export const Breadcrumb = ({ trail }: BreadcrumbProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()

  return (
    <Box component="nav" aria-label={t`Breadcrumb`}>
      <Box component="ol" sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: 0, padding: 0, listStyle: 'none' }}>
        {trail.map((crumb, index) => {
          const current = index === trail.length - 1
          return (
            <Fragment key={index}>
              {index > 0 && (
                <Typography component="li" variant="caption" aria-hidden sx={{ color: tokens.textSecondary }}>
                  /
                </Typography>
              )}
              <Typography component="li" variant="caption" sx={{ color: tokens.textSecondary }}>
                {crumb.to && !current ? (
                  <Box
                    component={Link}
                    to={crumb.to}
                    sx={{
                      color: tokens.accentText,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                      '&:focus-visible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
                    }}
                  >
                    {crumb.label}
                  </Box>
                ) : (
                  <span aria-current={current ? 'page' : undefined}>{crumb.label}</span>
                )}
              </Typography>
            </Fragment>
          )
        })}
      </Box>
    </Box>
  )
}
