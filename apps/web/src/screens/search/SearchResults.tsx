import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material'
import { startTransition, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { useCountry, withCountry } from 'src/core/country'
import { SearchQuery } from 'src/core/graphql'
import { formatMonth, useLocale } from 'src/core/i18n'
import { paths, useJourney } from 'src/core/router'
import { HomeAskField } from 'src/shared/ask-field'
import { useAsk } from 'src/shared/ask-panel'
import { AskResultRow } from 'src/shared/ask-result-row'
import { Page } from 'src/shared/page'
import { Section } from 'src/shared/section'
import { useOwnsAsk } from 'src/screens/home'
import { Unreachable } from 'src/screens/Unreachable'

export const SearchResults = () => {
  const [params] = useSearchParams()
  const asked = (params.get('q') ?? '').trim()
  // A new question is a new page: its field starts from what was asked.
  return <Results key={asked} asked={asked} />
}

/**
 * Everything a question found, SB-149, grouped by what each thing is, as the
 * Ask panel groups it (Figma 46:659), with room for all of it. The design has
 * no results page; this one is built from the panel's rows and the hubs'
 * sections, and says plainly when nothing matches.
 */
const Results = ({ asked }: { asked: string }) => {
  const { tokens, layout } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const journey = useJourney()
  const [question, setQuestion] = useState(asked)
  const ask = useAsk({ question, onQuestion: setQuestion })
  const [askField, setAskField] = useState<HTMLDivElement | null>(null)
  useOwnsAsk(askField, layout.headerHeight)

  const [{ data, fetching, error }, refetch] = useQuery({ query: SearchQuery, variables: { country, text: asked, locale }, pause: !asked })

  if (error) return <Unreachable onRetry={() => startTransition(() => refetch({ requestPolicy: 'network-only' }))} />

  const found = data?.search
  const tasks = found?.tasks ?? []
  const guides = found?.guides ?? []
  const answers = found?.answers ?? []
  const count = tasks.length + guides.length + answers.length

  const group = (title: ReactNode, rows: ReactNode[]) =>
    rows.length > 0 && (
      <>
        <Divider />
        <Section block={48} gap={16} title={title}>
          <Stack spacing="2px">{rows}</Stack>
        </Section>
      </>
    )

  return (
    <Page>
      <Box sx={{ maxWidth: layout.columnWidth }}>
        <Stack spacing="20px" sx={{ paddingTop: '56px', paddingBottom: '40px' }}>
          <Stack spacing="12px">
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
              <Trans>Search</Trans>
            </Typography>
            <Typography variant="h2" component="h1">
              {asked ? <Trans>Results for “{asked}”</Trans> : <Trans>Ask about {name}</Trans>}
            </Typography>
          </Stack>
          <Box ref={setAskField} sx={{ maxWidth: layout.askWidth }}>
            <HomeAskField
              label={t`Ask Skipbureau`}
              placeholder={t`Ask a question or describe what you’re trying to do…`}
              value={question}
              onChange={setQuestion}
              bindings={ask.bindings}
            />
            {ask.panel}
          </Box>
          {asked && !fetching && found && (
            <Typography variant="caption" role="status" sx={{ color: tokens.textSecondary }}>
              <Plural value={count} one="# result" other="# results" />
            </Typography>
          )}
        </Stack>

        {asked && !fetching && found && count === 0 && (
          <Stack spacing="12px" sx={{ paddingBottom: '48px', alignItems: 'flex-start' }}>
            <Typography variant="h3" component="h2">
              <Trans>Nothing matches yet</Trans>
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.textSecondary, maxWidth: layout.readingWidth }}>
              <Trans>We only search what we have written and checked, so try other words, or start from a goal on the home page.</Trans>
            </Typography>
            <Button component={Link} to={paths.home(journey)} variant="secondary">
              <Trans>Back to the home page</Trans>
            </Button>
          </Stack>
        )}

        {group(
          <Trans>Tasks</Trans>,
          tasks.map((task) => (
            <AskResultRow
              key={task.slug}
              kind="task"
              title={<bdi>{withCountry(task.title, name)}</bdi>}
              detail={task.subtitle ? <bdi>{withCountry(task.subtitle, name)}</bdi> : undefined}
              to={paths.taskHub(journey, task.slug)}
            />
          )),
        )}
        {group(
          <Trans>Guides</Trans>,
          guides.map((guide) => {
            const verified = formatMonth(guide.verifiedAt, locale)
            return (
              <AskResultRow
                key={guide.slug}
                kind="guide"
                title={<bdi>{guide.title}</bdi>}
                detail={
                  guide.snippet ? (
                    <bdi>{guide.snippet}</bdi>
                  ) : guide.written ? (
                    <Trans>Reading · verified {verified}</Trans>
                  ) : (
                    <Trans>Coming soon</Trans>
                  )
                }
                to={paths.guide(journey, guide.slug)}
              />
            )
          }),
        )}
        {group(
          <Trans>Quick answers</Trans>,
          answers.map((answer) => (
            <AskResultRow
              key={answer.slug}
              kind="quickAnswer"
              title={<bdi>{answer.question}</bdi>}
              detail={<bdi>{answer.answer}</bdi>}
              to={answer.guideSlug ? paths.guide(journey, answer.guideSlug) : undefined}
            />
          )),
        )}

        <Stack spacing="6px" sx={{ paddingTop: '8px', paddingBottom: '80px' }}>
          <Divider />
          <Typography variant="body2" sx={{ paddingTop: '10px', color: tokens.textSecondary }}>
            <Trans>We’ll ask about your nationality or city only if it changes the answer.</Trans>
          </Typography>
        </Stack>
      </Box>
    </Page>
  )
}
