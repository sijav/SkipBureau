import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { ResultOf } from '@graphql-typed-document-node/core'
import { useId, type ReactNode } from 'react'
import type { GuideQuery } from 'src/core/graphql'
import { InfoPanel } from 'src/shared/info-panel'
import { StepRow } from 'src/shared/step-row'
import { TopicItem } from 'src/shared/topic-item'

export type GuideData = NonNullable<ResultOf<typeof GuideQuery>['guide']>
export type SectionData = GuideData['sections'][number]
type Kind = SectionData['kind']

// A section's heading when the guide gives it none of its own.
const HEADING = {
  beforeYouStart: msg`Before you start`,
  whatYouNeed: msg`What you need`,
  yourOptions: msg`Your options`,
  howToDoIt: msg`How to do it`,
  whereToDoIt: msg`Where to do it`,
  importantToKnow: msg`Important to know`,
  whatToCheck: msg`What to check`,
  commonProblems: msg`Common problems`,
} satisfies Record<Kind, unknown>

/** The frame every section shares, Figma 179:1031 and its siblings: 44 above, an H2, then the body. */
export const SectionFrame = ({ heading, gap = 10, children }: { heading: ReactNode; gap?: number; children: ReactNode }) => {
  const id = useId()
  return (
    <Box component="section" aria-labelledby={id} sx={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, paddingTop: '44px' }}>
      <Typography id={id} variant="h3" component="h2">
        {heading}
      </Typography>
      {children}
    </Box>
  )
}

/** The small print that closes a section. */
const Note = ({ children }: { children: ReactNode }) => {
  const { tokens } = useTheme()
  return (
    <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
      {children}
    </Typography>
  )
}

/** A ruled list of single lines, Figma 179:1015. */
const Lines = ({ items }: { items: readonly ReactNode[] }) => {
  const { tokens } = useTheme()
  return (
    <Box component="ul" sx={{ margin: 0, padding: 0, paddingTop: '4px', listStyle: 'none' }}>
      {items.map((item, index) => (
        <Typography key={index} component="li" variant="body1" sx={{ paddingBlock: '12px', borderTop: `1px solid ${tokens.border}` }}>
          {item}
        </Typography>
      ))}
    </Box>
  )
}

export type GuideSectionProps = {
  section: SectionData
  options: GuideData['options']
  /** Content from the database, marked with the language it is actually in. */
  content: (text: string) => ReactNode
  /** Where a guide this section points on to lives. */
  guidePath: (slug: string) => string
}

/** One section of a guide, drawn the way its kind is drawn in Figma 143:734. */
export const GuideSection = ({ section, options, content, guidePath }: GuideSectionProps) => {
  const { tokens, layout } = useTheme()
  const { i18n } = useLingui()
  const heading = section.title ? content(section.title) : i18n._(HEADING[section.kind])
  const note = section.note ? <Note>{content(section.note)}</Note> : null
  const intro = section.body ? (
    <Typography variant="body1" sx={{ color: tokens.textSecondary, maxWidth: layout.readingWidth }}>
      {content(section.body)}
    </Typography>
  ) : null

  switch (section.kind) {
    case 'yourOptions':
      if (options.length === 0) return null
      return (
        <SectionFrame heading={heading} gap={12}>
          {intro}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: '32px 40px', paddingTop: '6px' }}>
            {options.map((option, index) => (
              <Stack key={index} spacing="6px" sx={{ paddingTop: '14px', borderTop: `2px solid ${tokens.borderStrong}` }}>
                <Typography variant="h4" component="h3">
                  {content(option.title)}
                </Typography>
                {option.body && (
                  <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                    {content(option.body)}
                  </Typography>
                )}
                {option.bestFor && (
                  <Box sx={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                    <Typography variant="caption" sx={{ width: '64px', flexShrink: 0, color: tokens.textSecondary }}>
                      <Trans>Best for</Trans>
                    </Typography>
                    <Typography variant="body2" sx={{ flex: '1 0 0', minWidth: 0 }}>
                      {content(option.bestFor)}
                    </Typography>
                  </Box>
                )}
                {option.caveat && (
                  <Typography variant="body2" sx={{ color: tokens.warningText }}>
                    {content(option.caveat)}
                  </Typography>
                )}
              </Stack>
            ))}
          </Box>
        </SectionFrame>
      )

    case 'beforeYouStart':
    case 'whatToCheck':
      return (
        <SectionFrame heading={heading}>
          {intro}
          <Lines items={section.steps.map((step) => content(step.title))} />
          {note}
        </SectionFrame>
      )

    case 'whatYouNeed':
      return (
        <SectionFrame heading={heading}>
          {intro}
          <Box component="dl" sx={{ margin: 0, paddingTop: '4px' }}>
            {section.steps.map((step) => (
              <Box
                key={step.position}
                sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: '4px 20px', paddingBlock: '14px', borderTop: `1px solid ${tokens.border}` }}
              >
                <Typography component="dt" variant="button" sx={{ width: { xs: '100%', sm: '200px' }, flexShrink: 0, paddingTop: '3px' }}>
                  {content(step.title)}
                </Typography>
                {step.body && (
                  <Typography component="dd" variant="body1" sx={{ flex: '1 0 0', minWidth: 0, margin: 0, color: tokens.textSecondary }}>
                    {content(step.body)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          {note}
        </SectionFrame>
      )

    case 'howToDoIt':
      return (
        <SectionFrame heading={heading}>
          {intro}
          <Box component="ol" sx={{ margin: 0, padding: 0, paddingTop: '4px' }}>
            {section.steps.map((step, index) => (
              <StepRow
                key={step.position}
                number={index + 1}
                title={content(step.title)}
                description={step.body ? content(step.body) : undefined}
                note={step.note ? content(step.note) : undefined}
              />
            ))}
          </Box>
          {note}
        </SectionFrame>
      )

    case 'importantToKnow':
      return (
        <SectionFrame heading={heading} gap={14}>
          {intro}
          {section.callout && (
            <InfoPanel kind="warning" heading={content(section.callout)} meta={section.calloutSource ? content(section.calloutSource) : undefined}>
              {section.calloutBody ? content(section.calloutBody) : null}
            </InfoPanel>
          )}
          {section.steps.length > 0 && <Lines items={section.steps.map((step) => content(step.title))} />}
          {section.link && (
            <TopicItem
              to={guidePath(section.link.slug)}
              title={content(section.link.title)}
              description={section.link.description ? content(section.link.description) : undefined}
            />
          )}
          {note}
        </SectionFrame>
      )

    case 'whereToDoIt':
      return (
        <SectionFrame heading={heading}>
          {intro}
          <Box sx={{ paddingTop: '4px' }}>
            {section.steps.map((step) => (
              <TopicItem
                key={step.position}
                kind={step.label ? content(step.label) : undefined}
                title={content(step.title)}
                description={step.body ? content(step.body) : undefined}
              />
            ))}
          </Box>
          {note}
        </SectionFrame>
      )

    case 'commonProblems':
      return (
        <SectionFrame heading={heading}>
          {intro}
          <Box sx={{ paddingTop: '4px' }}>
            {section.steps.map((step) => (
              <Stack key={step.position} spacing="5px" sx={{ paddingBlock: '16px', borderTop: `1px solid ${tokens.border}` }}>
                <Typography variant="h4" component="h3">
                  {content(step.title)}
                </Typography>
                {step.body && (
                  <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
                    {content(step.body)}
                  </Typography>
                )}
              </Stack>
            ))}
          </Box>
          {note}
        </SectionFrame>
      )
  }
}
