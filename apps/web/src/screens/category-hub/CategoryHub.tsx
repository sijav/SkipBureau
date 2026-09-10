import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Divider, Stack, Typography, useTheme } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { useCountry, withCountry } from 'src/core/country'
import { CategoryHubQuery } from 'src/core/graphql'
import { formatMonth, useLocale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { radius, spacing } from 'src/core/theme'
import { HomeAskField } from 'src/shared/ask-field'
import { useAsk } from 'src/shared/ask-panel'
import { Breadcrumb } from 'src/shared/breadcrumb'
import { ChecklistLine } from 'src/shared/checklist-line'
import { Page } from 'src/shared/page'
import { TopicItem } from 'src/shared/topic-item'
import { useOwnsAsk } from 'src/screens/home'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { RecommendedStart } from './RecommendedStart'

export type CategoryHubProps = {
  /** Given when a goal with a single area opens it directly; otherwise read from the address. */
  goal?: string | undefined
  category?: string | undefined
}

/**
 * Figma 133:523: one area of a goal, its guides, and a checklist that is a
 * reading aid and is never saved. Database text is wrapped in <bdi>, which
 * keeps it readable when it is in another language than the page.
 */
export const CategoryHub = (props: CategoryHubProps) => {
  const { tokens, layout } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const params = useParams()
  const goal = props.goal ?? params['goal'] ?? ''
  const slug = props.category ?? params['category'] ?? ''
  const [question, setQuestion] = useState('')
  const ask = useAsk({ question, onQuestion: setQuestion })
  const [askField, setAskField] = useState<HTMLDivElement | null>(null)
  // One Ask at a time: while this page's field is on screen, the header's steps aside.
  useOwnsAsk(askField, layout.headerHeight, false)

  const [{ data, fetching, error }, refetch] = useQuery({ query: CategoryHubQuery, variables: { country, goal, slug, locale } })

  if (fetching) return null
  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  const hub = data?.categoryHub
  if (!hub) return <NotFound />

  const fill = (text: string) => withCountry(text, name)
  const home = paths.home(locale, country)
  // A goal with one area opens it directly, so the goal is not a step between.
  const trail =
    hub.goalAreas > 1
      ? [{ label: <Trans>Home</Trans>, to: home }, { label: <bdi>{fill(hub.goalTitle)}</bdi>, to: paths.taskHub(locale, country, hub.goalSlug) }, { label: <bdi>{hub.title}</bdi> }]
      : [{ label: <Trans>Home</Trans>, to: home }, { label: <bdi>{hub.title}</bdi> }]
  const reviewed = hub.lastReviewed ? formatMonth(hub.lastReviewed, locale, 'long') : null

  return (
    <Page>
      <Box sx={{ paddingTop: '36px' }}>
        <Breadcrumb trail={trail} />
      </Box>

      <Stack spacing="10px" sx={{ paddingTop: '20px' }}>
        <Typography variant="h2" component="h1" sx={{ maxWidth: '840px' }}>
          <bdi>{hub.title}</bdi>
        </Typography>
        {hub.description && (
          <Typography variant="subtitle1" sx={{ color: tokens.textSecondary, maxWidth: layout.readingWidth }}>
            <bdi>{fill(hub.description)}</bdi>
          </Typography>
        )}
        {reviewed && (
          <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
            <Trans>Last reviewed: {reviewed}</Trans>
          </Typography>
        )}
      </Stack>

      {hub.start && (
        <RecommendedStart
          title={<bdi>{hub.start.title}</bdi>}
          reason={hub.start.reason ? <bdi>{fill(hub.start.reason)}</bdi> : undefined}
          to={paths.guide(locale, country, hub.start.guideSlug)}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start', gap: '48px', paddingTop: '48px' }}>
        <Stack spacing="14px" sx={{ flex: '1 1 840px', minWidth: 0, maxWidth: '840px', width: '100%' }}>
          <Typography variant="h3" component="h2">
            <Trans>What do you need help with?</Trans>
          </Typography>
          <Box>
            {hub.guides.map((guide) => {
              const minutes = guide.readingMinutes
              return (
                <TopicItem
                  key={guide.slug}
                  to={paths.guide(locale, country, guide.slug)}
                  kind={minutes ? <Trans>{minutes} min read</Trans> : undefined}
                  title={<bdi>{guide.title}</bdi>}
                  description={guide.description ? <bdi>{guide.description}</bdi> : undefined}
                />
              )
            })}
          </Box>
        </Stack>

        {hub.checklist.length > 0 && (
          <Box
            component="section"
            aria-label={t`Getting started checklist`}
            sx={{
              flex: '0 1 392px',
              width: '100%',
              maxWidth: '392px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: `${spacing.lg - 1}px`,
              border: `1px solid ${tokens.border}`,
              borderRadius: `${radius.sm}px`,
              backgroundColor: tokens.surface,
            }}
          >
            <Typography variant="h4" component="h2">
              <Trans>Getting started checklist</Trans>
            </Typography>
            <Box>
              {hub.checklist.map((line) => (
                <ChecklistLine key={line} label={<bdi>{line}</bdi>} />
              ))}
            </Box>
            <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
              <Trans>You can use this checklist as a simple guide. Your progress is not saved.</Trans>
            </Typography>
          </Box>
        )}
      </Box>

      {hub.related.length > 0 && (
        <Stack spacing="12px" sx={{ paddingTop: '56px', maxWidth: '840px' }}>
          <Typography variant="h3" component="h2">
            <Trans>Related guides</Trans>
          </Typography>
          <Box>
            {hub.related.map((other) => (
              <TopicItem
                key={other.slug}
                // A goal with nothing in this country yet is the tile's Coming soon.
                to={other.open ? paths.taskHub(locale, country, other.slug) : undefined}
                unavailable={!other.open}
                kind={other.open ? undefined : <Trans>Coming soon</Trans>}
                title={<bdi>{fill(other.title)}</bdi>}
                description={other.subtitle ? <bdi>{fill(other.subtitle)}</bdi> : undefined}
              />
            ))}
          </Box>
        </Stack>
      )}

      <Stack spacing="12px" sx={{ paddingTop: '56px' }}>
        <Typography variant="h3" component="h2">
          <Trans>Still have a question?</Trans>
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.textSecondary, maxWidth: layout.readingWidth }}>
          {hub.askPrompt ? <bdi>{fill(hub.askPrompt)}</bdi> : <Trans>Ask about this and find the most relevant guide.</Trans>}
        </Typography>
        <Box ref={setAskField} sx={{ maxWidth: layout.panelWidth }}>
          <HomeAskField
            label={t`Ask about ${hub.title}`}
            placeholder={t`What do you need help with?`}
            value={question}
            onChange={setQuestion}
            onAsk={() => undefined}
            bindings={ask.bindings}
          />
          {ask.panel}
        </Box>
      </Stack>

      <Stack spacing="6px" sx={{ paddingTop: '56px', paddingBottom: '80px' }}>
        <Divider />
        <Stack spacing="5px" sx={{ paddingTop: '16px', color: tokens.textSecondary }}>
          <Typography variant="caption">
            <Trans>Every guide shows when it was last verified and links to the official source</Trans>
          </Typography>
          <Typography variant="body2" sx={{ maxWidth: layout.readingWidth }}>
            <Trans>Content shown here is sample material for design review.</Trans>
          </Typography>
        </Stack>
      </Stack>
    </Page>
  )
}
