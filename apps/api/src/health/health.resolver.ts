import { Query, Resolver } from '@nestjs/graphql'

@Resolver()
export class HealthResolver {
  @Query(() => Boolean, { description: 'True when the API is answering. Nothing more is promised.' })
  health(): boolean {
    return true
  }
}
