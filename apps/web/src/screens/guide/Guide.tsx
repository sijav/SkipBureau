import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material'
import { Fragment, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { useCountry } from 'src/core/country'
import { GuideQuery } from 'src/core/graphql'
import { formatMonth, isLocale, locales, useLocale } from 'src/core/i18n'
import { paths, useJourney } from 'src/core/router'
import { spacing, type SourceState } from 'src/core/theme'
import { Breadcrumb } from 'src/shared/breadcrumb'
import { FactStrip } from 'src/shared/fact-strip'
import { InfoPanel } from 'src/shared/info-panel'
import { InformationDisclaimer } from 'src/shared/information-disclaimer'
import { Page } from 'src/shared/page'
import { PageLanguages } from 'src/shared/page-languages'
import { SourceCard } from 'src/shared/source-card'
import { TopicItem } from 'src/shared/topic-item'
import { ComingSoon } from 'src/screens/coming-soon'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { GuideSection, SectionFrame, type GuideData, type SectionData } from './GuideSection'

const QUARTER = 1000 * 60 * 60 * 24 * 91
const stateOf = (verifiedAt: string): SourceState => (Date.now() - new Date(verifiedAt).getTime() <= QUARTER ? 'verified' : 'older')

// Cost and time is the guide's own, not a section; the design puts it after
// what to check and before where to do it.
const COST_BEFORE = new Set<SectionData['kind']>(['whereToDoIt', 'commonProblems'])

const BAR = 3

/**
 * Figma 143:523, a guide, as its Get a SIM Card or eSIM instance draws it.
 * Every section is optional and the page holds together without any of them.
 * Database text is marked with the language it is actually in, so a guide not
 * yet translated reads correctly inside the reader's language and says so.
 */
export const Guide = () => {
  const { tokens, layout } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const journey = useJourney()
  const { guide: slug = '' } = useParams()

  const [{ data, fetching, error }, refetch] = useQuery({ query: GuideQuery, variables: { country, slug, locale } })

  if (fetching) return null
  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  const guide: GuideData | null | undefined = data?.guide
  if (!guide) return <NotFound />

  const language = isLocale(guide.locale) ? guide.locale : locale
  const content = (text: string): ReactNode => <bdi lang={language}>{text}</bdi>
  const verified = formatMonth(guide.verifiedAt, locale, 'long')
  const lead = guide.intro ?? guide.description
  const place = guide.place
  const areaPath = place
    ? place.goalAreas > 1
      ? paths.categoryHub(journey, place.goalSlug, place.categorySlug)
      : paths.taskHub(journey, place.goalSlug)
    : paths.home(journey)
  const guidePath = (other: string) => paths.guide(journey, other)

  // Listed on a hub, not written yet: its Coming soon page, never an empty guide.
  if (guide.sections.length === 0 && guide.options.length === 0 && !guide.quickAnswer) {
    const categoryTitle = place?.categoryTitle ?? ''
    return (
      <ComingSoon
        title={content(guide.title)}
        back={{ to: areaPath, label: place ? <Trans>Back to {categoryTitle}</Trans> : <Trans>Back to the home page</Trans> }}
      >
        {lead && <>{content(lead)} </>}
        <Trans>We are still writing this guide, and checking it against official sources.</Trans>
      </ComingSoon>
    )
  }

  const facts = [
    guide.cost && { label: <Trans>Typical cost</Trans>, value: content(guide.cost) },
    guide.time && { label: <Trans>Typical setup time</Trans>, value: content(guide.time) },
    guide.deadlines && { label: <Trans>Key deadlines</Trans>, value: content(guide.deadlines) },
  ].filter((fact) => Boolean(fact))
  const costAndTime =
    facts.length > 0 ? (
      <SectionFrame heading={<Trans>Cost and time</Trans>} gap={12}>
        <FactStrip facts={facts.flatMap((fact) => (fact ? [fact] : []))} />
        {guide.costNote && (
          <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
            {content(guide.costNote)}
          </Typography>
        )}
      </SectionFrame>
    ) : null
  const costAt = guide.sections.findIndex((section) => COST_BEFORE.has(section.kind))

  return (
    <Page>
      <PageLanguages path={(each) => paths.guide({ locale: each, origin: null, country }, guide.slug)} languages={guide.locales} shown={guide.locale} />
      {/* Figma 143:762: a 1080 column at the page's start, not centred in it. */}
      <Box sx={{ maxWidth: layout.mainWidth }}>
        <Box sx={{ paddingTop: '40px' }}>
          <Breadcrumb
            trail={[{ label: place ? content(place.categoryTitle) : <Trans>Home</Trans>, to: areaPath }, { label: content(guide.title) }]}
          />
        </Box>

        <Stack spacing="12px" sx={{ paddingTop: '22px', maxWidth: layout.readingWidth }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Typography variant="caption" sx={{ color: tokens.accentText }}>
              <Trans>Guide</Trans>
            </Typography>
            {place && (
              <>
                <Typography variant="caption" aria-hidden sx={{ color: tokens.textSecondary }}>
                  ·
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
                  {content(place.categoryTitle)}
                </Typography>
              </>
            )}
            <Typography variant="caption" aria-hidden sx={{ color: tokens.textSecondary }}>
              ·
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
              <Trans>Last verified: {verified}</Trans>
            </Typography>
          </Box>
          <Typography variant="h2" component="h1">
            {content(guide.title)}
          </Typography>
          {/* The page's own opening, longer than the line a hub lists it with. */}
          {lead && (
            <Typography variant="subtitle1" sx={{ color: tokens.textSecondary }}>
              {content(lead)}
            </Typography>
          )}
        </Stack>

        <Box sx={{ maxWidth: layout.readingWidth }}>
          {guide.translationMissing && (
            <Box sx={{ paddingTop: '24px' }}>
              <InfoPanel kind="coverageGap" heading={<Trans>Not in your language yet</Trans>}>
                <Trans>This guide has not been translated yet, so it is shown in {locales[language].label}.</Trans>
              </InfoPanel>
            </Box>
          )}

          {guide.quickAnswer && (
            <Box sx={{ paddingTop: '24px' }}>
              <Stack
                spacing="8px"
                sx={{
                  padding: `${spacing.lg}px`,
                  paddingInlineStart: `${spacing.lg - BAR}px`,
                  borderInlineStart: `${BAR}px solid ${tokens.accent}`,
                  backgroundColor: tokens.accentSubtle,
                }}
              >
                <Typography variant="caption" sx={{ color: tokens.accentText }}>
                  <Trans>Quick answer</Trans>
                </Typography>
                <Typography variant="subtitle1">{content(guide.quickAnswer)}</Typography>
              </Stack>
            </Box>
          )}
        </Box>

        {guide.sections.map((section, index) => (
          <Fragment key={section.kind}>
            {index === costAt && <Box sx={{ maxWidth: layout.readingWidth }}>{costAndTime}</Box>}
            {/* The options grid runs the full column; every other section keeps the reading measure. */}
            <Box sx={{ maxWidth: section.kind === 'yourOptions' ? 'none' : layout.readingWidth }}>
              <GuideSection section={section} options={guide.options} content={content} guidePath={guidePath} />
            </Box>
          </Fragment>
        ))}
        {costAt === -1 && <Box sx={{ maxWidth: layout.readingWidth }}>{costAndTime}</Box>}

        <Box sx={{ maxWidth: layout.readingWidth }}>
          {guide.sources.length > 0 && (
            <SectionFrame heading={<Trans>Official sources</Trans>} gap={12}>
              <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
                <Trans>Last verified: {verified}</Trans>
              </Typography>
              {guide.sources.map((source) => (
                <SourceCard
                  key={source.url}
                  state={stateOf(source.verifiedAt)}
                  official={source.official}
                  publisher={source.publisher ? content(source.publisher) : undefined}
                  institution={content(source.name)}
                  url={source.url}
                  checkedAt={source.verifiedAt}
                  note={source.note ? content(source.note) : undefined}
                />
              ))}
              {guide.showDisclaimer && <InformationDisclaimer country={name} />}
            </SectionFrame>
          )}

          {guide.related.length > 0 && (
            <SectionFrame heading={<Trans>Related guides</Trans>}>
              <Box>
                {guide.related.map((other) => (
                  <TopicItem
                    key={other.slug}
                    to={guidePath(other.slug)}
                    title={content(other.title)}
                    description={other.description ? content(other.description) : undefined}
                  />
                ))}
              </Box>
            </SectionFrame>
          )}

          {guide.showSuggestUpdate && (
            <Stack
              spacing="12px"
              component="section"
              aria-label={t`Something changed?`}
              sx={{ paddingTop: '48px', alignItems: 'flex-start' }}
            >
              <Typography variant="h3" component="h2">
                <Trans>Something changed?</Trans>
              </Typography>
              <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
                <Trans>
                  If you know this information is outdated or incorrect, let us know. We review submissions before updating the guide.
                </Trans>
              </Typography>
              <Button component={Link} to={paths.suggest(journey, guide.slug)} variant="secondary">
                <Trans>Suggest an update</Trans>
              </Button>
            </Stack>
          )}

          <Stack spacing="6px" sx={{ paddingTop: '48px', paddingBottom: '80px' }}>
            <Divider />
            <Stack spacing="5px" sx={{ paddingTop: '16px', color: tokens.textSecondary }}>
              <Typography variant="caption">
                <Trans>Last verified: {verified}</Trans>
              </Typography>
              <Typography variant="body2">
                <Trans>
                  Sources are listed above with the date we last checked them. Tell us if something here no longer matches what you found.
                </Trans>
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Page>
  )
}
