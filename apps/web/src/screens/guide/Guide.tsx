import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material'
import { Fragment, startTransition, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { useCountry } from 'src/core/country'
import { GuideAnswersQuery, GuideQuery, overThePage } from 'src/core/graphql'
import { formatDay, formatMonth, isLocale, locales, useLocale } from 'src/core/i18n'
import { paths, useJourney } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { useSiteOrigin } from 'src/core/site'
import { spacing, type SourceState } from 'src/core/theme'
import { Breadcrumb } from 'src/shared/breadcrumb'
import { DETAIL_PROMPTS } from 'src/shared/context-control'
import { FactStrip } from 'src/shared/fact-strip'
import { InfoPanel } from 'src/shared/info-panel'
import { InformationDisclaimer } from 'src/shared/information-disclaimer'
import { Page } from 'src/shared/page'
import { PageHead } from 'src/shared/page-head'
import { FACT_LABELS, factValue, RuleAnswer, type FactShape, type RuleLine } from 'src/shared/rule-answer'
import { SourceCard } from 'src/shared/source-card'
import { StructuredData } from 'src/shared/structured-data'
import { TopicItem } from 'src/shared/topic-item'
import { ComingSoon } from 'src/screens/coming-soon'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { RetryNotice } from 'src/shared/retry-notice'
import { GuideSection, SectionFrame, type GuideData, type SectionData } from './GuideSection'
import { guideArea, guideData, guideHead, isWritten } from './head'

const QUARTER = 1000 * 60 * 60 * 24 * 91
const stateOf = (verifiedAt: string): SourceState => (Date.now() - new Date(verifiedAt).getTime() <= QUARTER ? 'verified' : 'older')

// Cost and time is the guide's own, not a section; the design puts it after
// what to check and before where to do it.
const COST_BEFORE = new Set<SectionData['kind']>(['whereToDoIt', 'commonProblems'])

const BAR = 3

/** A rule fact as the guide queries send it. */
type RuleFact = FactShape & { key: string; sourceUrl: string; sourceName: string; verifiedAt: string }

export const Guide = () => {
  const { tokens, layout } = useTheme()
  const { t, i18n } = useLingui()
  const { locale } = useLocale()
  const { country, name } = useCountry()
  const journey = useJourney()
  const { setDetailsOpen } = useShell()
  const { guide: slug = '' } = useParams()
  const origin = useSiteOrigin()

  const [{ data, fetching, error }, refetch] = useQuery({ query: GuideQuery, variables: { country, slug, locale } })

  // SB-257: the linked rules answered for the reader the link names. Only in the
  // browser, and never suspending, so the first render is the prerendered
  // file's, the rule for everyone, and the reader's answer replaces it when it
  // comes. A place, a status or a role is sent only where the link has one.
  const obligations = data?.guide?.obligations ?? []
  const reader = {
    ...(journey.origin ? { nationality: journey.origin } : {}),
    ...(journey.place ? { residenceRegions: [journey.place] } : {}),
    ...(journey.status ? { residenceStatuses: [journey.status] } : {}),
    ...(journey.situation ? { situation: journey.situation } : {}),
    ...(journey.work ? { workRegions: [journey.work] } : {}),
  }
  const [{ data: answers, error: answersError }, refetchAnswers] = useQuery({
    query: GuideAnswersQuery,
    variables: { country, slug, locale, reader },
    pause: typeof window === 'undefined' || obligations.length === 0,
    context: overThePage,
  })

  // Only while a retry is in flight now (SB-046): the first render either
  // has its data or suspends, and the page before this one stays up.
  if (fetching && !data) return null
  if (error) return <Unreachable onRetry={() => startTransition(() => refetch({ requestPolicy: 'network-only' }))} />
  const guide: GuideData | null | undefined = data?.guide
  if (!guide) return <NotFound />

  const language = isLocale(guide.locale) ? guide.locale : locale
  const content = (text: string): ReactNode => <bdi lang={language}>{text}</bdi>
  const verified = formatMonth(guide.verifiedAt, locale, 'long')
  const lead = guide.intro ?? guide.description
  const place = guide.place
  const areaPath = guideArea(place, journey)
  const guidePath = (other: string) => paths.guide(journey, other)
  const head = <PageHead {...guideHead(guide, country)} />

  if (!isWritten(guide)) {
    const categoryTitle = place?.categoryTitle ?? ''
    return (
      <>
        {head}
        <ComingSoon
          title={content(guide.title)}
          back={{ to: areaPath, label: place ? <Trans>Back to {categoryTitle}</Trans> : <Trans>Back to the home page</Trans> }}
        >
          {lead && <>{content(lead)} </>}
          <Trans>We are still writing this guide, and checking it against official sources.</Trans>
        </ComingSoon>
      </>
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

  // A fact with no label shows no line: its figure is still in the notes.
  const lineOf = (fact: RuleFact): RuleLine[] => {
    const label = FACT_LABELS[fact.key]
    if (!label) return []
    const { value, content: words } = factValue(fact, i18n, locale)
    return [
      {
        key: fact.key,
        label: i18n._(label),
        value: (
          <>
            {value}
            {value && words ? ' ' : null}
            {words && <bdi lang="en">{words}</bdi>}
          </>
        ),
        source: { url: fact.sourceUrl, name: <bdi>{fact.sourceName}</bdi>, checked: formatDay(fact.verifiedAt, locale) },
      },
    ]
  }
  const answerOf = new Map((answers?.guide?.obligations ?? []).map((row) => [row.slug, row.reader]))
  const ruleAnswers = obligations.flatMap((obligation) => {
    const answer = answerOf.get(obligation.slug) ?? null
    const general = obligation.resolution === 'general'
    const title = obligation.title ? content(obligation.title) : obligation.slug
    const notesOf = (notes: readonly { locale: string; text: string }[]) => notes.map((note) => ({ text: note.text, lang: note.locale }))
    if (answer?.answer === 'answered') {
      return [
        <RuleAnswer
          key={obligation.slug}
          title={title}
          state="answered"
          lines={answer.facts.flatMap(lineOf)}
          notes={notesOf(answer.notes)}
        />,
      ]
    }
    if (answer?.answer === 'noRule') return [<RuleAnswer key={obligation.slug} title={title} state="noRule" lines={[]} notes={[]} />]
    const everyone = { lines: general ? obligation.facts.flatMap(lineOf) : [], notes: general ? notesOf(obligation.notes) : [] }
    // SB-276: hoisted above needsReview, because a review can name the detail that could settle it and the API sends
    // it (guide.service.ts returns side.needs with the ambiguity). A pure lookup, so the !general && !asks guard below
    // is unchanged by moving it earlier.
    const need = answer?.needs[0]
    const asks = need ? i18n._(DETAIL_PROMPTS[need]) : undefined
    if (answer?.answer === 'needsReview') {
      return [
        <RuleAnswer
          key={obligation.slug}
          title={title}
          state="needsReview"
          {...everyone}
          reason={answer.reason}
          asks={asks}
          onAsk={() => setDetailsOpen(true)}
        />,
      ]
    }
    if (!general && !asks) return []
    return [
      <RuleAnswer
        key={obligation.slug}
        title={title}
        state="general"
        {...everyone}
        asks={asks}
        onAsk={() => setDetailsOpen(true)}
      />,
    ]
  })

  return (
    <Page>
      {head}
      <StructuredData data={guideData(guide, country, locale, origin, t`Home`)} />
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

          {/* SB-257, a departure: the design draws no rule answer. */}
          {/* SB-272: answersError opens this section too. When that request fails every obligation falls to the rule
              for everyone, and one whose rule is reader-specific renders nothing at all, so without this the section
              and its notice would both vanish and the failure would be silent twice over. */}
          {(ruleAnswers.length > 0 || answersError) && (
            <SectionFrame heading={<Trans>The rules that apply</Trans>} gap={32}>
              {answersError && (
                <RetryNotice onRetry={() => startTransition(() => refetchAnswers({ requestPolicy: 'network-only' }))}>
                  <Trans>We could not load the answer for you.</Trans>
                </RetryNotice>
              )}
              {ruleAnswers}
            </SectionFrame>
          )}
        </Box>

        {guide.sections.map((section, index) => (
          <Fragment key={section.position}>
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
