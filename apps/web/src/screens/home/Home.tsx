import { Trans } from '@lingui/react/macro'
import { Box, Divider, Stack, Typography, useTheme } from '@mui/material'
import { useState } from 'react'
import { useQuery } from 'urql'
import { useCountry, withCountry } from 'src/core/country'
import { HomeQuery } from 'src/core/graphql'
import { useLocale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { useAsk } from 'src/shared/ask-panel'
import { AskResultRow } from 'src/shared/ask-result-row'
import { Page } from 'src/shared/page'
import { Section } from 'src/shared/section'
import { TaskTile } from 'src/shared/task-tile'
import { TileGrid } from 'src/shared/tile-grid'
import { Unreachable } from 'src/screens/Unreachable'
import { HomeHero } from './HomeHero'
import { useOwnsAsk } from './useOwnsAsk'

/**
 * Figma 60:587, the public home of one country.
 *
 * Database text is wrapped in <bdi>: it may be in another language than the
 * page, when a translation is missing, and isolating it keeps an English
 * sentence's punctuation where it belongs inside a Persian layout.
 */
export const Home = () => {
  const { tokens, layout } = useTheme()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const [question, setQuestion] = useState('')
  const ask = useAsk({ question, onQuestion: setQuestion })
  const [askField, setAskField] = useState<HTMLDivElement | null>(null)
  useOwnsAsk(askField, layout.headerHeight)

  const [{ data, error }, refetch] = useQuery({ query: HomeQuery, variables: { country, locale } })

  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />

  // A goal is open in this country once it has anything under it; until then
  // it is the design's Coming soon, recessed and not a link.
  const open = new Set(data?.categories.map((category) => category.taskSlug))
  const questions = data?.questions ?? []

  return (
    <Page>
      <HomeHero
        name={name}
        question={question}
        onQuestion={setQuestion}
        onAsk={() => undefined}
        bindings={ask.bindings}
        examples={questions.slice(0, 3).map((entry) => entry.question)}
        askRef={setAskField}
      />
      {ask.panel}

      {data && data.tasks.length > 0 && (
        <>
          <Divider />
          <Section
            title={<Trans>What do you want to do?</Trans>}
            intro={<Trans>Pick a goal. Each one opens a guided process built for your nationality, city and status.</Trans>}
          >
            <TileGrid>
              {data.tasks.map((task) => (
                <TaskTile
                  key={task.slug}
                  title={<bdi>{withCountry(task.title, name)}</bdi>}
                  description={task.subtitle ? <bdi>{withCountry(task.subtitle, name)}</bdi> : null}
                  to={paths.taskHub(locale, country, task.slug)}
                  comingSoon={!open.has(task.slug)}
                />
              ))}
            </TileGrid>
          </Section>
        </>
      )}

      {questions.length > 0 && (
        <>
          <Divider />
          <Section title={<Trans>Common questions</Trans>} intro={<Trans>Short answers with the conditions that actually change them.</Trans>} gap={20}>
            <Box>
              {questions.map((entry) => (
                <AskResultRow
                  key={entry.slug}
                  kind="quickAnswer"
                  title={<bdi>{entry.question}</bdi>}
                  detail={<bdi>{entry.answer}</bdi>}
                  to={entry.guideSlug ? paths.guide(locale, country, entry.guideSlug) : undefined}
                />
              ))}
            </Box>
          </Section>
        </>
      )}

      <Divider />
      <Stack spacing="6px" sx={{ paddingTop: '32px', paddingBottom: '80px', color: tokens.textSecondary }}>
        <Typography variant="caption">
          <Trans>Every guide shows when it was last verified and links to the official source</Trans>
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: layout.askWidth }}>
          <Trans>Figures, timings and requirements shown throughout this design are sample content for review, not verified legal information.</Trans>
        </Typography>
      </Stack>
    </Page>
  )
}
