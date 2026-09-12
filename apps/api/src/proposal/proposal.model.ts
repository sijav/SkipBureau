import { Field, InputType, ObjectType } from '@nestjs/graphql'

@InputType({ description: 'A suggested change to one guide, as a visitor writes it.' })
export class SuggestUpdateInput {
  @Field(() => String) country!: string
  @Field(() => String, { description: 'The guide, by slug.' }) guide!: string
  @Field(() => String, { description: 'The language the visitor was reading in.' }) locale!: string
  @Field(() => String, { description: 'What changed. Required.' }) change!: string
  @Field(() => String, { nullable: true }) source?: string | null
  @Field(() => String, { nullable: true, description: 'Only to follow up. Never published.' }) email?: string | null

  // A field a person never sees, which a form-filling bot fills (SB-050).
  @Field(() => String, { nullable: true, description: 'Leave empty. A hidden field; anything in it is taken for a machine.' })
  website?: string | null
}

@ObjectType({ description: 'What became of a suggestion.' })
export class SuggestUpdateResult {
  @Field(() => Boolean, { description: 'True when it was stored for review.' }) received!: boolean

  @Field(() => String, { nullable: true, description: 'Why it was not stored: a field to fix (change, source, email), an unknown guide, tooMany when a limit was reached, or bot.' })
  problem!: string | null
}
