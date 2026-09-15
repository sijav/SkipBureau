import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Detail } from '../rules/eligibility.js'
import { RuleFactValue, RuleNote } from '../rules/rules.model.js'

export enum SectionKind {
  beforeYouStart = 'beforeYouStart',
  whatYouNeed = 'whatYouNeed',
  yourOptions = 'yourOptions',
  howToDoIt = 'howToDoIt',
  whereToDoIt = 'whereToDoIt',
  importantToKnow = 'importantToKnow',
  whatToCheck = 'whatToCheck',
  commonProblems = 'commonProblems',
}

registerEnumType(SectionKind, { name: 'SectionKind', description: 'The sections the design draws. Each renders its own way.' })

@ObjectType()
export class GuideStepView {
  @Field(() => Int) position!: number
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) body!: string | null
  @Field(() => String, { nullable: true, description: "A step's own caution or pointer." }) note!: string | null
  @Field(() => String, { nullable: true, description: 'A row label, "In person" or "Online".' }) label!: string | null
}

@ObjectType()
export class GuideLinkView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
}

@ObjectType()
export class GuideSectionView {
  @Field(() => SectionKind) kind!: SectionKind
  @Field(() => Int) position!: number
  @Field(() => String, { nullable: true }) title!: string | null
  @Field(() => String, { nullable: true }) body!: string | null
  @Field(() => String, { nullable: true }) note!: string | null
  @Field(() => String, { nullable: true }) callout!: string | null
  @Field(() => String, { nullable: true }) calloutBody!: string | null
  @Field(() => String, { nullable: true }) calloutSource!: string | null
  @Field(() => GuideLinkView, { nullable: true, description: 'A guide this section points on to.' }) link!: GuideLinkView | null
  @Field(() => [GuideStepView]) steps!: readonly GuideStepView[]
}

@ObjectType()
export class GuideOptionView {
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) body!: string | null
  @Field(() => String, { nullable: true }) bestFor!: string | null
  @Field(() => String, { nullable: true }) caveat!: string | null
}

@ObjectType()
export class GuideSourceView {
  @Field(() => String) url!: string
  @Field(() => String) name!: string
  @Field(() => String) verifiedAt!: string
  @Field(() => String, { nullable: true }) publisher!: string | null
  @Field(() => Boolean, { description: "False for an operator's or a company's own page." }) official!: boolean
  @Field(() => String, { nullable: true, description: 'What this source is the source for.' }) note!: string | null
}

@ObjectType({ description: 'Where a guide sits: its area, and the goal the area belongs to.' })
export class GuidePlaceView {
  @Field(() => String) categorySlug!: string
  @Field(() => String) categoryTitle!: string
  @Field(() => String) goalSlug!: string
  @Field(() => String) goalTitle!: string
  @Field(() => Int, { description: 'How many areas the goal has in this country.' }) goalAreas!: number
}

export enum ObligationResolution {
  general = 'general',
  contextRequired = 'contextRequired',
}

registerEnumType(ObligationResolution, {
  name: 'ObligationResolution',
  description: 'Whether this obligation has one answer for everyone, or needs to know who is asking.',
})

export enum ReaderAnswer {
  answered = 'answered',
  needsDetail = 'needsDetail',
  needsReview = 'needsReview',
  noRule = 'noRule',
}

registerEnumType(ReaderAnswer, {
  name: 'ReaderAnswer',
  description: 'What a guide can tell the reader it was asked for about one obligation (SB-255).',
  valuesMap: {
    answered: { description: 'One rule applies and no detail the reader has not given could change it.' },
    needsDetail: { description: 'A detail the reader has not given could change the answer, named in needs. No provisional rule is given beside it.' },
    needsReview: { description: 'Two rules apply and neither is more specific than the other, said in reason.' },
    noRule: { description: 'No rule held for this obligation in this country applies to what the reader said, including where none is held at all.' },
  },
})

@ObjectType({ description: "One obligation's answer for the reader a guide was asked for (SB-255)." })
export class GuideReaderView {
  @Field(() => ReaderAnswer) answer!: ReaderAnswer

  @Field(() => [Detail], { description: 'Details the reader has not given that could change the answer. Empty unless the answer is needsDetail or needsReview.' })
  needs!: readonly Detail[]

  @Field(() => String, { nullable: true, description: 'Why a person has to decide this one. Null unless the answer is needsReview.' })
  reason!: string | null

  @Field(() => String, { nullable: true, description: 'The most specific rule version that applies. Null unless the answer is answered.' })
  ruleVersionId!: string | null

  @Field(() => [RuleFactValue], { description: 'Each fact with the version, page and day it was read from. Empty unless the answer is answered.' })
  facts!: readonly RuleFactValue[]

  @Field(() => [RuleNote], {
    description: "The notes of the rule that applies and of each wider place's rule one of its facts came from, widest first. Empty unless the answer is answered.",
  })
  notes!: readonly RuleNote[]
}

@ObjectType({ description: 'An obligation this guide explains, with its current facts.' })
export class GuideObligationView {
  @Field(() => String) slug!: string
  @Field(() => String, { nullable: true }) title!: string | null
  @Field(() => ObligationResolution, {
    description: 'contextRequired means every version is scoped to somebody, so there is no general answer to show.',
  })
  resolution!: ObligationResolution

  @Field(() => [GuideObligationFact], {
    description:
      'The facts of the version for everyone. Empty whenever the guide was asked for a reader: read reader then, because the version for everyone beside a question is a provisional answer (SB-176, SB-255).',
  })
  facts!: readonly GuideObligationFact[]

  @Field(() => [RuleNote], {
    description:
      "The notes of the rule this obligation's facts come from, in the language asked for or saying they are not. None where the resolution is contextRequired, and none whenever the guide was asked for a reader.",
  })
  notes!: readonly RuleNote[]

  @Field(() => GuideReaderView, {
    nullable: true,
    description: 'The answer for the reader the guide was asked for, or null where it was asked for nobody in particular (SB-255).',
  })
  reader!: GuideReaderView | null
}

@ObjectType()
export class GuideObligationFact {
  @Field(() => String) key!: string
  @Field(() => String) operator!: string
  @Field(() => String, { nullable: true }) numericValue!: string | null
  @Field(() => String, { nullable: true }) textValue!: string | null
  @Field(() => String, { nullable: true }) unit!: string | null
  @Field(() => String, { nullable: true }) currency!: string | null

  @Field(() => String, { description: 'The page this figure was read on: its own, or where it has none, the page of the rule version it belongs to.' })
  sourceUrl!: string

  @Field(() => String, { description: 'The name of the page this figure was read on.' })
  sourceName!: string

  @Field(() => String, { description: 'The day the page this figure was read on was read, as YYYY-MM-DD.' })
  verifiedAt!: string
}

@ObjectType()
export class GuideView {
  @Field(() => String) slug!: string
  @Field(() => String) countryCode!: string
  @Field(() => String) verifiedAt!: string
  @Field(() => Boolean) showDisclaimer!: boolean
  @Field(() => Boolean) showSuggestUpdate!: boolean

  @Field(() => String, { description: 'The locale this content is actually in, which may not be the one asked for.' })
  locale!: string

  @Field(() => Boolean, { description: 'True when the requested language had no content and another was used.' })
  translationMissing!: boolean

  @Field(() => [String], { description: 'Every language this guide is written in, for the alternates a search engine is told about.' })
  locales!: readonly string[]

  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
  @Field(() => String, { nullable: true, description: 'The page’s opening paragraph; lists show the shorter description.' })
  intro!: string | null
  @Field(() => String, { nullable: true }) quickAnswer!: string | null
  @Field(() => String, { nullable: true }) cost!: string | null
  @Field(() => String, { nullable: true }) time!: string | null
  @Field(() => String, { nullable: true }) deadlines!: string | null
  @Field(() => String, { nullable: true }) costNote!: string | null
  @Field(() => GuidePlaceView, { nullable: true }) place!: GuidePlaceView | null
  @Field(() => [GuideSectionView]) sections!: readonly GuideSectionView[]
  @Field(() => [GuideOptionView]) options!: readonly GuideOptionView[]
  @Field(() => [GuideLinkView]) related!: readonly GuideLinkView[]
  @Field(() => [GuideSourceView]) sources!: readonly GuideSourceView[]
  @Field(() => [GuideObligationView]) obligations!: readonly GuideObligationView[]
}

@ObjectType()
export class TaskView {
  @Field(() => String) slug!: string
  @Field(() => Int) position!: number
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) subtitle!: string | null
}

@ObjectType()
export class CategoryView {
  @Field(() => String) slug!: string
  @Field(() => String) countryCode!: string
  @Field(() => String) taskSlug!: string
  @Field(() => Int) position!: number
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
}

@ObjectType({ description: 'A common question and its short answer, for one country.' })
export class QuestionView {
  @Field(() => String) slug!: string
  @Field(() => Int) position!: number
  @Field(() => String) question!: string
  @Field(() => String) answer!: string

  @Field(() => String, { nullable: true, description: 'The guide that explains the answer in full, where there is one.' })
  guideSlug!: string | null

  @Field(() => String, { description: 'The locale this content is actually in, which may not be the one asked for.' })
  locale!: string

  @Field(() => Boolean, { description: 'True when the requested language had no content and another was used.' })
  translationMissing!: boolean
}

export enum CategoryKind {
  decision = 'decision',
  ifItApplies = 'ifItApplies',
  ongoing = 'ongoing',
  alternativeRoute = 'alternativeRoute',
}

registerEnumType(CategoryKind, {
  name: 'CategoryKind',
  description: 'What kind of area this is, where it differs from a setup step done once. Null for an ordinary step.',
})

@ObjectType({ description: 'An area of a task hub: one of the things a goal involves.' })
export class HubAreaView {
  @Field(() => String) slug!: string
  @Field(() => Int) position!: number
  @Field(() => CategoryKind, { nullable: true }) kind!: CategoryKind | null
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
}

@ObjectType()
export class HubGuideView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String) verifiedAt!: string
}

@ObjectType()
export class HubSourceView {
  @Field(() => String) url!: string
  @Field(() => String) name!: string
  @Field(() => String, { nullable: true }) publisher!: string | null
  @Field(() => String) verifiedAt!: string
}

@ObjectType({ description: 'Figma 81:523: what a goal involves in one country. Its copy may say {country}.' })
export class TaskHubView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) heading!: string | null
  @Field(() => String, { nullable: true }) intro!: string | null
  @Field(() => String, { nullable: true }) areasIntro!: string | null
  @Field(() => String, { nullable: true }) dependsNote!: string | null
  @Field(() => String, { nullable: true }) otherRoutesIntro!: string | null

  @Field(() => Boolean, {
    description: 'True where an area this hub lists, or a guide under one, was written by sample content rather than from the research (SB-302).',
  })
  sample!: boolean

  @Field(() => String, { description: 'The locale this content is actually in, which may not be the one asked for.' })
  locale!: string

  @Field(() => Boolean, { description: 'True when the requested language had no content and another was used.' })
  translationMissing!: boolean

  @Field(() => [HubAreaView]) areas!: readonly HubAreaView[]
  @Field(() => [HubGuideView], { description: 'Guides under any of the areas, for reading before doing.' })
  guides!: readonly HubGuideView[]

  @Field(() => [HubSourceView], { description: 'The official sources behind those guides, each once.' })
  sources!: readonly HubSourceView[]
}

@ObjectType()
export class HubStartView {
  @Field(() => String) guideSlug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true, description: 'Why this is where to start.' }) reason!: string | null
}

@ObjectType()
export class HubSubtopicView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
  @Field(() => Int, { nullable: true }) readingMinutes!: number | null
}

@ObjectType()
export class RelatedGoalView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) subtitle!: string | null
  @Field(() => Boolean, { description: 'Whether the goal has anything in this country yet.' }) open!: boolean
}

@ObjectType({ description: 'Figma 133:523: one area of a goal, its guides and a checklist. Its copy may say {country}.' })
export class CategoryHubView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
  @Field(() => String, { nullable: true }) askPrompt!: string | null
  @Field(() => String) locale!: string
  @Field(() => Boolean) translationMissing!: boolean
  @Field(() => String) goalSlug!: string
  @Field(() => String) goalTitle!: string

  @Field(() => Boolean, { description: 'True where this area, or a guide in it, was written by sample content rather than from the research (SB-302).' })
  sample!: boolean

  @Field(() => Int, { description: 'How many areas the goal has in this country. With one, the goal opens this hub directly.' })
  goalAreas!: number

  @Field(() => String, { nullable: true, description: 'The most recent check of any of its guides.' })
  lastReviewed!: string | null

  @Field(() => HubStartView, { nullable: true }) start!: HubStartView | null
  @Field(() => [HubSubtopicView]) guides!: readonly HubSubtopicView[]
  @Field(() => [String]) checklist!: readonly string[]
  @Field(() => [RelatedGoalView]) related!: readonly RelatedGoalView[]
}

@ObjectType()
export class AskTaskView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) subtitle!: string | null
  @Field(() => Boolean, { description: 'Whether the goal has anything in this country yet.' }) open!: boolean
}

@ObjectType()
export class AskGuideView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String) verifiedAt!: string
}

@ObjectType()
export class SearchGuideView {
  @Field(() => String) slug!: string
  @Field(() => String) title!: string
  @Field(() => String) verifiedAt!: string
  @Field(() => String, { nullable: true, description: 'The sentence that matched best, to show under the title.' })
  snippet!: string | null
  @Field(() => Boolean, { description: 'False for a guide a hub lists that is not written yet.' })
  written!: boolean
}

@ObjectType({ description: 'Everything a question found in one country, for the results page: the same matching as Ask, more of it.' })
export class SearchView {
  @Field(() => [AskTaskView]) tasks!: readonly AskTaskView[]
  @Field(() => [SearchGuideView]) guides!: readonly SearchGuideView[]
  @Field(() => [QuestionView]) answers!: readonly QuestionView[]
}

@ObjectType({ description: 'What Ask found, grouped by what each thing is, Figma 46:659.' })
export class AskView {
  @Field(() => [AskTaskView]) tasks!: readonly AskTaskView[]
  @Field(() => [AskGuideView]) guides!: readonly AskGuideView[]
  @Field(() => [QuestionView]) answers!: readonly QuestionView[]
}
