import { Args, Query, Resolver } from '@nestjs/graphql'
import { GraphQLError } from 'graphql'
import { RegionProfileError } from './eligibility.js'
import { DiffEntry } from './rules.model.js'
import { RulesService } from './rules.service.js'

// A refused profile is the caller's mistake, and BAD_USER_INPUT is the code a
// GraphQL client reads as that. A GraphQLError, because the Apollo driver
// passes one through as it is, where a Nest HttpException would arrive as
// BAD_REQUEST (SB-168).
const asInputError = (error: unknown): never => {
  if (error instanceof RegionProfileError) {
    throw new GraphQLError(error.message, { extensions: { code: 'BAD_USER_INPUT', codes: error.codes } })
  }
  throw error
}

const RESIDENCE = 'Where this person lives: ISO 3166-2 region codes such as DE-SN, one per country, so a move can carry one on each side.'
const WORK = 'Where this person works, the same way. Some rules follow the place of work rather than where a person lives.'

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
    @Args('residenceRegions', { type: () => [String], nullable: true, description: RESIDENCE }) residenceRegions?: string[],
    @Args('workRegions', { type: () => [String], nullable: true, description: WORK }) workRegions?: string[],
  ): Promise<DiffEntry[]> {
    return this.rules
      .move(from, to, { nationality, situation, residenceRegions, workRegions }, at ? new Date(at) : new Date())
      .catch(asInputError)
  }

  @Query(() => [DiffEntry], { description: 'What changed in one country between two dates, for this person.' })
  async changes(
    @Args('country', { type: () => String }) country: string,
    @Args('since', { type: () => String }) since: string,
    @Args('until', { type: () => String }) until: string,
    @Args('nationality', { type: () => String, nullable: true }) nationality?: string,
    @Args('situation', { type: () => String, nullable: true }) situation?: string,
    @Args('residenceRegions', { type: () => [String], nullable: true, description: RESIDENCE }) residenceRegions?: string[],
    @Args('workRegions', { type: () => [String], nullable: true, description: WORK }) workRegions?: string[],
  ): Promise<DiffEntry[]> {
    return this.rules
      .changes(country, { nationality, situation, residenceRegions, workRegions }, new Date(since), new Date(until))
      .catch(asInputError)
  }
}
