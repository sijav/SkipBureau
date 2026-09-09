import { Args, Query, Resolver } from '@nestjs/graphql'
import { DiffEntry } from './rules.model.js'
import { RulesService } from './rules.service.js'

@Resolver(() => DiffEntry)
export class RulesResolver {
  constructor(private readonly rules: RulesService) {}

  @Query(() => [DiffEntry], { description: 'What changes for this person on moving between two countries.' })
  async move(
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('nationality', { type: () => String, nullable: true }) nationality?: string,
    @Args('situation', { type: () => String, nullable: true }) situation?: string,
    @Args('at', { type: () => String, nullable: true }) at?: string,
  ): Promise<DiffEntry[]> {
    return this.rules.move(from, to, { nationality, situation }, at ? new Date(at) : new Date())
  }

  @Query(() => [DiffEntry], { description: 'What changed in one country between two dates, for this person.' })
  async changes(
    @Args('country', { type: () => String }) country: string,
    @Args('since', { type: () => String }) since: string,
    @Args('until', { type: () => String }) until: string,
    @Args('nationality', { type: () => String, nullable: true }) nationality?: string,
    @Args('situation', { type: () => String, nullable: true }) situation?: string,
  ): Promise<DiffEntry[]> {
    return this.rules.changes(country, { nationality, situation }, new Date(since), new Date(until))
  }
}
