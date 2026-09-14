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
}

@ObjectType()
export class ResolvedRule {
  @Field(() => String) obligationSlug!: string
  @Field(() => String) ruleVersionId!: string
  @Field(() => [RuleFactValue]) facts!: readonly RuleFactValue[]
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
