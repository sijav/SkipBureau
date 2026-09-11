import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { useCountry, withCountry } from 'src/core/country'
import { TaskHubQuery } from 'src/core/graphql'
import { formatMonth, useLocale } from 'src/core/i18n'
import { paths, useJourney } from 'src/core/router'
import { useSiteOrigin } from 'src/core/site'
import type { SourceState } from 'src/core/theme'
import { AskResultRow } from 'src/shared/ask-result-row'
import { YourDetails } from 'src/shared/context-control'
import { InfoPanel } from 'src/shared/info-panel'
import { Page } from 'src/shared/page'
import { PageHead } from 'src/shared/page-head'
import { Section } from 'src/shared/section'
import { SourceCard } from 'src/shared/source-card'
import { StructuredData } from 'src/shared/structured-data'
import { TopicItem } from 'src/shared/topic-item'
import { CategoryHub } from 'src/screens/category-hub'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { GuidedSetup } from './GuidedSetup'
import { onlyArea, taskHubData, taskHubHead } from './head'

const KIND = {
  decision: msg`Decision`,
  ifItApplies: msg`If it applies to you`,
  ongoing: msg`Ongoing`,
  alternativeRoute: msg`Alternative route`,
} as const

// A source checked within three months reads as verified; older, as older.
const QUARTER = 1000 * 60 * 60 * 24 * 91
const stateOf = (verifiedAt: string): SourceState => (Date.now() - new Date(verifiedAt).getTime() <= QUARTER ? 'verified' : 'older')

/**
 * Figma 81:523: what one goal involves in one country, without pretending to
 * know which parts apply to this reader. Its copy comes from the database and
 * may say {country}; where a goal has none of its own, general wording stands in.
 * Database text is wrapped in <bdi>, which keeps it readable when it is in
 * another language than the page.
 */
export const TaskHub = () => {
  const { tokens, layout } = useTheme()
  const { t, i18n } = useLingui()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const journey = useJourney()
  const { goal = '' } = useParams()
  const origin = useSiteOrigin()

  const [{ data, fetching, error }, refetch] = useQuery({ query: TaskHubQuery, variables: { country, slug: goal, locale } })

  if (fetching) return null
  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  const hub = data?.taskHub
  // A goal this country has nothing under is Coming soon on Home, not a page.
  if (!hub) return <NotFound />
  const only = onlyArea(hub)
  if (only) return <CategoryHub goal={hub.slug} category={only} />

  const fill = (text: string) => withCountry(text, name)
  const areas = hub.areas.filter((area) => area.kind !== 'alternativeRoute')
  const otherRoutes = hub.areas.filter((area) => area.kind === 'alternativeRoute')
  const latest = hub.sources.reduce<string | null>((newest, source) => (!newest || source.verifiedAt > newest ? source.verifiedAt : newest), null)

  const topic = (area: (typeof hub.areas)[number]) => (
    <TopicItem
      key={area.slug}
      to={paths.categoryHub(journey, hub.slug, area.slug)}
      kind={area.kind ? i18n._(KIND[area.kind]) : undefined}
      title={<bdi>{area.title}</bdi>}
      description={area.description ? <bdi>{area.description}</bdi> : undefined}
    />
  )

  return (
    <Page>
      <PageHead {...taskHubHead(hub, country, name)} />
      <StructuredData data={taskHubData(hub, country, locale, origin, t`Home`, name)} />
      <Box sx={{ maxWidth: layout.columnWidth }}>
        <Stack spacing="14px" sx={{ paddingTop: '56px', paddingBottom: '32px' }}>
          <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
            <Trans>Task hub</Trans>
          </Typography>
          <Typography variant="h2" component="h1">
            <bdi>{fill(hub.heading ?? hub.title)}</bdi>
          </Typography>
          {hub.intro && (
            <Typography variant="subtitle1" sx={{ color: tokens.textSecondary }}>
              <bdi>{fill(hub.intro)}</bdi>
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
              <Trans>What we know about you</Trans>
            </Typography>
            <YourDetails />
          </Box>
        </Stack>

        <GuidedSetup to={paths.setup(journey, hub.slug)} />

        <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '48px', paddingBottom: '24px' }}>
          <Stack spacing="5px">
            <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
              <Trans>Or explore the areas involved yourself.</Trans>
            </Typography>
            <Typography variant="h3" component="h2">
              <Trans>What you’ll need to think about</Trans>
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
              {hub.areasIntro ? (
                <bdi>{fill(hub.areasIntro)}</bdi>
              ) : (
                <Trans>These are the areas most people deal with. They are deliberately not numbered, because the order that applies to you depends on your situation.</Trans>
              )}
            </Typography>
          </Stack>
          <Box>{areas.map(topic)}</Box>
        </Box>

        <Stack spacing="14px" sx={{ paddingTop: '8px', paddingBottom: '48px', alignItems: 'flex-start' }}>
          <InfoPanel kind="legalUncertainty" meta={t`Guided setup works this out with you`} style={{ alignSelf: 'stretch' }}>
            {hub.dependsNote ? (
              <bdi>{fill(hub.dependsNote)}</bdi>
            ) : (
              <Trans>Your nationality, residence status and plans can each change which of these areas apply to you, and in what order.</Trans>
            )}
          </InfoPanel>
          <Button component={Link} to={paths.setup(journey, hub.slug)} variant="secondary">
            <Trans>Start guided setup</Trans>
          </Button>
        </Stack>

        {hub.guides.length > 0 && (
          <>
            <Divider />
            <Section
              block={48}
              gap={16}
              title={<Trans>Guides</Trans>}
              intro={<Trans>Read about a topic before you deal with it. Guides explain how something works; the areas above are things you may need to do.</Trans>}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: '4px 24px' }}>
                {hub.guides.map((guide) => {
                  const verified = formatMonth(guide.verifiedAt, locale)
                  return (
                    <AskResultRow
                      key={guide.slug}
                      kind="guide"
                      title={<bdi>{guide.title}</bdi>}
                      detail={<Trans>Reading · verified {verified}</Trans>}
                      to={paths.guide(journey, guide.slug)}
                    />
                  )
                })}
              </Box>
            </Section>
          </>
        )}

        {otherRoutes.length > 0 && (
          <>
            <Divider />
            <Section
              block={48}
              gap={16}
              title={<Trans>Other routes</Trans>}
              intro={hub.otherRoutesIntro ? <bdi>{fill(hub.otherRoutesIntro)}</bdi> : <Trans>Separate routes some people look into.</Trans>}
            >
              <Box>{otherRoutes.map(topic)}</Box>
            </Section>
          </>
        )}

        <Divider />
        <Stack spacing="14px" sx={{ paddingTop: '40px', paddingBottom: '80px' }}>
          {latest && (
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
              <Trans>Last verified {formatMonth(latest, locale, 'long')}</Trans>
            </Typography>
          )}
          {hub.sources.map((source) => (
            <SourceCard
              key={source.url}
              state={stateOf(source.verifiedAt)}
              publisher={source.publisher ? <bdi>{source.publisher}</bdi> : undefined}
              institution={<bdi>{source.name}</bdi>}
              url={source.url}
              checkedAt={source.verifiedAt}
            />
          ))}
          <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
            <Trans>
              Descriptions on this page are sample content for design review. They deliberately avoid fees, thresholds and eligibility rules, which are
              determined during guided setup against verified sources.
            </Trans>
          </Typography>
        </Stack>
      </Box>
    </Page>
  )
}
