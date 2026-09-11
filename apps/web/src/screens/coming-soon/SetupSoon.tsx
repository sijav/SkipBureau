import { Trans } from '@lingui/react/macro'
import { useParams } from 'react-router-dom'
import { paths, useJourney } from 'src/core/router'
import { ComingSoon } from './ComingSoon'

export const SetupSoon = () => {
  const journey = useJourney()
  const { goal = '' } = useParams()

  return (
    <ComingSoon title={<Trans>Guided setup</Trans>} back={{ to: paths.taskHub(journey, goal), label: <Trans>Back to the overview</Trans> }}>
      <Trans>
        A few questions about your situation, then only the steps that apply to you, in the order they come. Until it is ready, the overview
        lists every area the goal involves.
      </Trans>
    </ComingSoon>
  )
}
