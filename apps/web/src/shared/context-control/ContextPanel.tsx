import { Trans, useLingui } from '@lingui/react/macro'
import { Autocomplete, Box, ButtonBase, Paper, TextField, Typography, useTheme } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { radius, withOpacity } from 'src/core/theme'

export type Origin = { code: string; name: string }

export type ContextPanelProps = {
  id: string
  /** Where the reader comes from, once they have said. */
  origin: Origin | null
  /** Where they are going, for "City in Turkey". */
  countryName: string
  /** Every country someone can come from, named in the reader's language. */
  options: readonly Origin[]
  onOrigin: (code: string | null) => void
}

const STROKE = 1
// Figma 47:686 draws its strokes inside, so every padding gives one back.
const PAD = 16 - STROKE

/** One ruled line of the record: a mono label in a 140 column, and what we know. */
const Row = ({ label, children }: { label: ReactNode; children: ReactNode }) => {
  const { tokens } = useTheme()
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: `${11 - STROKE}px ${PAD}px 11px`,
        borderTop: `${STROKE}px solid ${tokens.border}`,
      }}
    >
      <Typography variant="caption" sx={{ width: '140px', flexShrink: 0, color: tokens.textSecondary }}>
        {label}
      </Typography>
      <Box sx={{ flex: '1 0 0', minWidth: 0, display: 'flex' }}>{children}</Box>
    </Box>
  )
}

/**
 * Figma 47:686: a record, not a settings form. Ruled rows with mono labels and
 * no input until a row is tapped; an unanswered row says Add in the accent.
 * Only where the reader comes from can be said so far, and it goes into the
 * address; the rest say Coming soon rather than offering an Add that does
 * nothing.
 */
export const ContextPanel = ({ id, origin, countryName, options, onOrigin }: ContextPanelProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const [editing, setEditing] = useState(false)

  const soon = (
    <Typography variant="overline" sx={{ color: tokens.textSecondary }}>
      <Trans>Coming soon</Trans>
    </Typography>
  )

  return (
    <Paper
      id={id}
      role="dialog"
      aria-label={t`What Skipbureau knows about you`}
      sx={{
        width: '400px',
        maxWidth: 'calc(100vw - 32px)',
        border: `${STROKE}px solid ${tokens.border}`,
        borderRadius: `${radius.sm}px`,
        backgroundColor: tokens.surface,
        backgroundImage: 'none',
        filter: `drop-shadow(0 8px 12px ${withOpacity(tokens.textPrimary, 0.07)}) drop-shadow(0 1px 1px ${withOpacity(tokens.textPrimary, 0.05)})`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: `${PAD}px ${PAD}px 12px` }}>
        <Typography variant="button" component="h2">
          <Trans>What Skipbureau knows about you</Trans>
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
          <Trans>We only ask for details when they change your answer.</Trans>
        </Typography>
      </Box>

      <Row label={<Trans>Nationality</Trans>}>
        {editing ? (
          <Autocomplete
            fullWidth
            openOnFocus
            autoHighlight
            size="small"
            options={options}
            value={origin && options.find((option) => option.code === origin.code) ? origin : null}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, chosen) => {
              setEditing(false)
              if (chosen) onOrigin(chosen.code)
            }}
            onBlur={() => setEditing(false)}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                placeholder={t`Type a country`}
                slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': t`Nationality` } }}
              />
            )}
          />
        ) : (
          <ButtonBase
            disableRipple
            onClick={() => setEditing(true)}
            sx={{
              padding: 0,
              color: tokens[origin ? 'textPrimary' : 'accentText'],
              '&:hover': { textDecoration: 'underline' },
              '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
            }}
          >
            <Typography component="span" variant="overline">
              {origin ? <bdi>{origin.name}</bdi> : <Trans>Add</Trans>}
            </Typography>
          </ButtonBase>
        )}
      </Row>
      <Row label={<Trans>Currently in</Trans>}>{soon}</Row>
      <Row label={<Trans>City in {countryName}</Trans>}>{soon}</Row>
      <Row label={<Trans>Residence status</Trans>}>{soon}</Row>
      <Row label={<Trans>Role</Trans>}>{soon}</Row>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: `${12 - STROKE}px ${PAD}px ${14 - STROKE}px`,
          borderTop: `${STROKE}px solid ${tokens.border}`,
          color: tokens.textSecondary,
        }}
      >
        <Typography variant="body2" sx={{ flex: '1 0 0', minWidth: 0 }}>
          <Trans>Nothing here is required.</Trans>
        </Typography>
        <ButtonBase
          disableRipple
          disabled={!origin}
          onClick={() => onOrigin(null)}
          sx={{
            padding: 0,
            color: tokens.textSecondary,
            '&:hover': { textDecoration: 'underline' },
            '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
          }}
        >
          <Typography component="span" variant="overline">
            <Trans>Clear all</Trans>
          </Typography>
        </ButtonBase>
      </Box>
    </Paper>
  )
}
