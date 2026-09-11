import { Trans } from '@lingui/react/macro'
import { useCountry } from 'src/core/country'
import { paths, useJourney } from 'src/core/router'
import { ComingSoon } from './ComingSoon'

export const GuidesSoon = () => {
  const journey = useJourney()
  const { name } = useCountry()

  return (
    <ComingSoon
      title={<Trans>Every guide for {name}</Trans>}
      back={{ to: paths.home(journey), label: <Trans>Back to the home page</Trans> }}
    >
      <Trans>
        One list of every guide, to browse by topic. Until it is ready, each guide is a click away from its goal on the home page, or from
        Ask.
      </Trans>
    </ComingSoon>
  )
}
