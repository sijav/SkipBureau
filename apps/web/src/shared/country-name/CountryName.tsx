import { Trans } from '@lingui/react/macro'
import { Typography } from '@mui/material'
import { useCountry } from 'src/core/country'

export type CountryNameProps = {
  variant?: 'body2' | 'body1' | 'h6'
}

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
