import { Trans, useLingui } from '@lingui/react/macro'
import { Autocomplete, Box, ButtonBase, Paper, TextField, Typography, useTheme } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { radius, withOpacity } from 'src/core/theme'

export type Origin = { code: string; name: string }

/** A choice in a row's list: a place inside another, or a kind of a status, is `depth` levels in and follows it. */
export type DetailOption = Origin & { depth?: number | undefined }

export type ContextPanelProps = {
  id: string
  origin: Origin | null
  country: Origin | null
  countries: readonly Origin[]
  countryName: string
  options: readonly Origin[]
  place?: Origin | null | undefined
  places?: readonly DetailOption[] | undefined
  status?: Origin | null | undefined
  statuses?: readonly DetailOption[] | undefined
  situation?: Origin | null | undefined
  situations?: readonly DetailOption[] | undefined
  /** Where the reader works, a place of the same country, which is not where they live (SB-313). */
  work?: Origin | null | undefined
  onOrigin: (code: string | null) => void
  onCountry: (code: string) => void
  onPlace?: ((code: string) => void) | undefined
  onStatus?: ((code: string) => void) | undefined
  onSituation?: ((code: string) => void) | undefined
  onWork?: ((code: string) => void) | undefined
  onClear?: (() => void) | undefined
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
 * What a row knows, said as text until it is tapped, then an Autocomplete over
 * what the row allows. Nationality offers every country somebody can come from;
 * Currently in only the ones SkipBureau covers (SB-172); City and Residence
 * status the country's places and statuses, each after the one it is inside
 * (SB-256); Role the situations its rules name (SB-286).
 */
const Choice = ({
  label,
  placeholder,
  value,
  options,
  onChoose,
}: {
  label: string
  placeholder: string
  value: Origin | null
  options: readonly DetailOption[]
  onChoose: (code: string) => void
}) => {
  const { tokens } = useTheme()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <Autocomplete
        fullWidth
        openOnFocus
        autoHighlight
        size="small"
        options={options}
        value={value ? (options.find((option) => option.code === value.code) ?? null) : null}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, chosen) => option.code === chosen.code}
        renderOption={({ key, ...props }, option) => (
          <Box component="li" key={key} {...props} sx={{ '&&': { paddingInlineStart: `${16 + (option.depth ?? 0) * 16}px` } }}>
            <bdi>{option.name}</bdi>
          </Box>
        )}
        onChange={(_, chosen) => {
          setEditing(false)
          if (chosen) onChoose(chosen.code)
        }}
        onBlur={() => setEditing(false)}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            // The row was showing the chosen name, so typing replaces it rather than
            // adding to it. Autocomplete selects it on a click in the field, not on autoFocus.
            onFocus={(event) => event.target.select()}
            placeholder={placeholder}
            slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': label } }}
          />
        )}
      />
    )
  }

  return (
    <ButtonBase
      disableRipple
      onClick={() => setEditing(true)}
      sx={{
        padding: 0,
        color: tokens[value ? 'textPrimary' : 'accentText'],
        '&:hover': { textDecoration: 'underline' },
        '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
      }}
    >
      <Typography component="span" variant="overline">
        {value ? <bdi>{value.name}</bdi> : <Trans>Add</Trans>}
      </Typography>
    </ButtonBase>
  )
}

export const ContextPanel = ({
  id,
  origin,
  country,
  countries,
  countryName,
  options,
  place = null,
  places = [],
  status = null,
  statuses = [],
  situation = null,
  situations = [],
  work = null,
  onOrigin,
  onCountry,
  onPlace,
  onStatus,
  onSituation,
  onWork,
  onClear,
}: ContextPanelProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()

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
        <Choice label={t`Nationality`} placeholder={t`Type a country`} value={origin} options={options} onChoose={onOrigin} />
      </Row>
      <Row label={<Trans>Currently in</Trans>}>
        <Choice
          label={t`Currently in`}
          placeholder={t`Type a country`}
          value={country}
          options={countries}
          onChoose={(code) => {
            if (code !== country?.code) onCountry(code)
          }}
        />
      </Row>
      <Row label={<Trans>City in {countryName}</Trans>}>
        {onPlace ? (
          <Choice
            label={t`City in ${countryName}`}
            placeholder={t`Type a place`}
            value={place}
            options={places}
            onChoose={(code) => {
              if (code !== place?.code) onPlace(code)
            }}
          />
        ) : (
          soon
        )}
      </Row>
      <Row label={<Trans>Residence status</Trans>}>
        {onStatus ? (
          <Choice
            label={t`Residence status`}
            placeholder={t`Type a status`}
            value={status}
            options={statuses}
            onChoose={(code) => {
              if (code !== status?.code) onStatus(code)
            }}
          />
        ) : (
          soon
        )}
      </Row>
      <Row label={<Trans>Role</Trans>}>
        {onSituation ? (
          <Choice
            label={t`Role`}
            placeholder={t`Type a role`}
            value={situation}
            options={situations}
            onChoose={(code) => {
              if (code !== situation?.code) onSituation(code)
            }}
          />
        ) : (
          soon
        )}
      </Row>
      {/* SB-313: a rule can turn on where the reader works rather than where they live, so it is asked for on its own,
          from the same places the country has. */}
      <Row label={<Trans>Where you work</Trans>}>
        {onWork ? (
          <Choice
            label={t`Where you work`}
            placeholder={t`Type a place`}
            value={work}
            options={places}
            onChoose={(code) => {
              if (code !== work?.code) onWork(code)
            }}
          />
        ) : (
          soon
        )}
      </Row>

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
          // SB-318: every detail a reader can give, the work place included, or the one way back is dead for them.
          disabled={!origin && !place && !status && !situation && !work}
          onClick={() => (onClear ? onClear() : onOrigin(null))}
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
