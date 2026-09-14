import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Verdict } from './diff.js'
import { Detail } from './eligibility.js'

export { Verdict }

registerEnumType(Verdict, {
  name: 'Verdict',
  description: 'What happens to one obligation when this person moves, or when time passes.',
})

registerEnumType(Detail, {
  name: 'Detail',
  description: 'A detail about a person that can change which rule applies to them.',
})

@ObjectType()
export class RuleFactValue {
  @Field(() => String) key!: string
  @Field(() => String) operator!: string
  @Field(() => String, { nullable: true }) numericValue!: string | null
  @Field(() => String, { nullable: true }) textValue!: string | null
  @Field(() => String, { nullable: true }) unit!: string | null
  @Field(() => String, { nullable: true }) currency!: string | null

  @Field(() => String, {
    description:
      "The rule version this fact was read from. A place's answer takes what its own rule does not change from the wider places' rules, so one answer's facts can come from several versions, each with its own source and verified date.",
  })
  ruleVersionId!: string

  @Field(() => String, { description: 'The page this figure was read on: its own, or where it has none, the page of the rule version it came from.' })
  sourceUrl!: string

  @Field(() => String, { description: 'The name of the page this figure was read on.' })
  sourceName!: string

  @Field(() => String, { description: 'The day the page this figure was read on was read, as YYYY-MM-DD.' })
  verifiedAt!: string
}

@ObjectType({ description: 'What a rule version says that no fact or criterion can, such as who it does not bind, in one language.' })
export class RuleNote {
  @Field(() => String, { description: 'The rule version this note belongs to.' }) ruleVersionId!: string
  @Field(() => String) text!: string
  @Field(() => String, { description: 'The language the text is in.' }) locale!: string

  @Field(() => Boolean, { description: 'True where the version has no note in the language asked for, so the text is in another.' })
  translationMissing!: boolean
}

@ObjectType()
export class ResolvedRule {
  @Field(() => String) obligationSlug!: string

  @Field(() => String, { description: 'The most specific rule version that applies to this person. Each fact names the version it came from.' })
  ruleVersionId!: string

  @Field(() => [RuleFactValue]) facts!: readonly RuleFactValue[]

  @Field(() => [RuleNote], {
    description:
      "The notes of the rule version that applies and of each wider place's version one of its facts came from, widest place first. A wider version this answer takes no fact from gives none.",
  })
  notes!: readonly RuleNote[]
}

@ObjectType()
export class FactDifference {
  @Field(() => String) key!: string
  @Field(() => RuleFactValue, { nullable: true }) from!: RuleFactValue | null
  @Field(() => RuleFactValue, { nullable: true }) to!: RuleFactValue | null

  @Field(() => Boolean, { description: 'False where one side never recorded this fact: a gap in what we know, not a checked difference.' })
  known!: boolean
}

@ObjectType({ description: 'One obligation, and what happens to it.' })
export class DiffEntry {
  @Field(() => String) obligationSlug!: string
  @Field(() => Verdict) verdict!: Verdict
  @Field(() => ResolvedRule, { nullable: true }) from!: ResolvedRule | null
  @Field(() => ResolvedRule, { nullable: true }) to!: ResolvedRule | null
  @Field(() => [FactDifference]) differences!: readonly FactDifference[]

  @Field(() => String, { nullable: true, description: 'Why a person has to decide this one. Null when nobody does.' })
  reason!: string | null

  @Field(() => [Detail], {
    description: 'Details this person has not given that could change the answer, on either side. Empty when none could.',
  })
  needs!: readonly Detail[]
}
