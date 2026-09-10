import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Country {
  @Field(() => String, { description: 'ISO 3166-1 alpha-2, lowercased, as it appears in a URL.' })
  code!: string

  @Field(() => String, { description: 'In the language asked for where there is one, else the canonical name.' })
  name!: string
}
