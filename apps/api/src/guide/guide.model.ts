import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql'

export enum SectionKind {
  whatYouNeed = 'whatYouNeed',
  yourOptions = 'yourOptions',
  howToDoIt = 'howToDoIt',
  whereToDoIt = 'whereToDoIt',
  importantToKnow = 'importantToKnow',
  whatToCheck = 'whatToCheck',
  commonProblems = 'commonProblems',
}

registerEnumType(SectionKind, { name: 'SectionKind', description: 'The seven sections the design draws, in its order.' })

@ObjectType()
export class GuideStepView {
  @Field(() => Int) position!: number
  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) body!: string | null
}

@ObjectType()
export class GuideSectionView {
  @Field(() => SectionKind) kind!: SectionKind
  @Field(() => Int) position!: number
  @Field(() => String, { nullable: true }) title!: string | null
  @Field(() => String, { nullable: true }) body!: string | null
  @Field(() => [GuideStepView]) steps!: readonly GuideStepView[]
}

@ObjectType()
export class GuideSourceView {
  @Field(() => String) url!: string
  @Field(() => String) name!: string
  @Field(() => String) verifiedAt!: string
}

export enum ObligationResolution {
  general = 'general',
  contextRequired = 'contextRequired',
}

registerEnumType(ObligationResolution, {
  name: 'ObligationResolution',
  description: 'Whether this obligation has one answer for everyone, or needs to know who is asking.',
})

@ObjectType({ description: 'An obligation this guide explains, with its current facts.' })
export class GuideObligationView {
  @Field(() => String) slug!: string
  @Field(() => String, { nullable: true }) title!: string | null
  @Field(() => ObligationResolution, {
    description: 'contextRequired means every version is scoped to somebody, so there is no general answer to show.',
  })
  resolution!: ObligationResolution

  @Field(() => [GuideObligationFact]) facts!: readonly GuideObligationFact[]
}

@ObjectType()
export class GuideObligationFact {
  @Field(() => String) key!: string
  @Field(() => String) operator!: string
  @Field(() => String, { nullable: true }) numericValue!: string | null
  @Field(() => String, { nullable: true }) textValue!: string | null
  @Field(() => String, { nullable: true }) unit!: string | null
  @Field(() => String, { nullable: true }) currency!: string | null
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

  @Field(() => String) title!: string
  @Field(() => String, { nullable: true }) description!: string | null
  @Field(() => String, { nullable: true }) quickAnswer!: string | null
  @Field(() => String, { nullable: true }) cost!: string | null
  @Field(() => String, { nullable: true }) time!: string | null
  @Field(() => [GuideSectionView]) sections!: readonly GuideSectionView[]
  @Field(() => [String]) options!: readonly string[]
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
