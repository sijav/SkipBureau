import { Trans } from '@lingui/react/macro'
import Typography from '@mui/material/Typography'
import { useCountry } from 'src/core/country'

export type CountryNameProps = {
  /** How prominent this is. The header wants small, a heading wants large. */
  variant?: 'body2' | 'body1' | 'h6'
}

/**
 * The country the reader is in, named.
 *
 * It does not fetch. `CountryRoute` has already confirmed the country exists
 * and put its name in context, so a second request here would ask the same
 * question twice and could answer it differently.
 */
export const CountryName = ({ variant = 'body2' }: CountryNameProps) => {
  const { name } = useCountry()

  if (!name) {
    return (
      <Typography variant={variant} data-testid="country-name" sx={{ color: 'text.secondary' }}>
        <Trans>Unnamed country</Trans>
      </Typography>
    )
  }

  return (
    <Typography variant={variant} data-testid="country-name">
      {name}
    </Typography>
  )
}
