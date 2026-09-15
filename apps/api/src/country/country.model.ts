import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Country {
  @Field(() => String, { description: 'ISO 3166-1 alpha-2, lowercased, as it appears in a URL.' })
  code!: string

  @Field(() => String, { description: 'In the language asked for where there is one, else the canonical name.' })
  name!: string
}

@ObjectType({
  description:
    'A place in a country that a reader can say they live or work in: a province or state, or a city or area inside one (SB-186).',
})
export class Place {
  @Field(() => String, {
    description: 'A province or state by its ISO 3166-2 code, or a place inside one by its key, such as DE-BY.muenchen.',
  })
  code!: string

  @Field(() => String, {
    nullable: true,
    description: 'The place this one is inside, or null for a province or state, whose parent is the country.',
  })
  parentCode!: string | null

  @Field(() => String, {
    nullable: true,
    description: "The state's own identifier for the place where one exists, such as Germany's Amtlicher Gemeindeschlüssel.",
  })
  officialCode!: string | null

  @Field(() => String, { description: 'In the language asked for where there is one, else the official name.' })
  name!: string
}

@ObjectType('ResidenceStatus', {
  description: 'What a reader can hold in a country: a kind of permission to be there, or a kind of one (SB-189).',
})
export class ResidenceStatusView {
  @Field(() => String, { description: 'Lower case under its country, such as tr.residence-permit.student.' })
  code!: string

  @Field(() => String, { nullable: true, description: 'The status this one is a kind of, or null for one with nothing above it.' })
  parentCode!: string | null

  @Field(() => String, { description: 'In the language asked for where there is one, else the canonical name.' })
  name!: string
}
