import { Trans } from '@lingui/react/macro'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { useQuery } from 'urql'
import { useCountry } from 'src/core/country'
import { CountriesQuery } from 'src/core/graphql'

export type CountryNameProps = {
  /** How prominent this is. The header wants small, a heading wants large. */
  variant?: 'body2' | 'body1' | 'h6'
}

export const CountryName = ({ variant = 'body2' }: CountryNameProps) => {
  const { country } = useCountry()
  const [{ data, fetching, error }] = useQuery({ query: CountriesQuery })

  if (fetching) return <Skeleton variant="text" width={80} data-testid="country-name-loading" />

  const name = data?.countries.find((each) => each.code === country)?.name

  // A country we cannot name is not worth guessing at: the code is what the
  // URL already says, and showing it is honest where inventing a name is not.
  if (error || !name) {
    return (
      <Typography variant={variant} data-testid="country-name" sx={{ color: 'text.secondary' }}>
        <Trans>Unknown country</Trans>
      </Typography>
    )
  }

  return (
    <Typography variant={variant} data-testid="country-name">
      {name}
    </Typography>
  )
}
