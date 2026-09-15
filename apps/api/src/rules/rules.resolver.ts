import { Args, Query, Resolver } from '@nestjs/graphql'
import { GraphQLError } from 'graphql'
import { LOCALE } from '../locale.js'
import { ProfileError } from './eligibility.js'
import { DiffEntry, ResearchRowCount } from './rules.model.js'
import { RulesService } from './rules.service.js'

// A refused profile is the caller's mistake, and BAD_USER_INPUT is the code a
// GraphQL client reads as that. A GraphQLError, because the Apollo driver
// passes one through as it is, where a Nest HttpException would arrive as
// BAD_REQUEST (SB-168).
const asInputError = (error: unknown): never => {
  if (error instanceof ProfileError) {
    throw new GraphQLError(error.message, { extensions: { code: 'BAD_USER_INPUT', codes: error.codes } })
  }
  throw error
}

const RESIDENCE =
  'Where this person lives: region codes, one per country, so a move between countries can carry one on each side. A province or state by its ISO 3166-2 code such as TR-34, or a place inside one by its key such as TR-34.kadikoy.'
const WORK = 'Where this person works, the same way. Some rules follow the place of work rather than where a person lives.'
const STATUS =
  'What this person holds in each country: residence status codes, one per country, such as tr.residence-permit, or a kind of one such as tr.residence-permit.student.'
const FROM_RESIDENCE =
  'Where this person lives before the move, in place of residenceRegions on that side. Left out, residenceRegions applies; an empty list says nowhere. This is how a move within one country names both places.'
const TO_RESIDENCE = 'Where this person will live after the move, in place of residenceRegions on that side, the same way.'
const FROM_WORK = 'Where this person works before the move, in place of workRegions on that side, the same way.'
const TO_WORK = 'Where this person will work after the move, in place of workRegions on that side, the same way.'

@Resolver(() => DiffEntry)
export class RulesResolver {
  constructor(private readonly rules: RulesService) {}

  @Query(() => [ResearchRowCount], {
    description: 'How many versions, places, statuses and groups of this database each research file owns, so a publish can be read back.',
  })
  async researchRows(): Promise<ResearchRowCount[]> {
    return this.rules.researchRows()
  }

  @Query(() => [DiffEntry], { description: 'What changes for this person on moving between two countries, or between two places in one.' })
  async move(
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('locale', LOCALE) locale: string,
    @Args('nationality', { type: () => String, nullable: true }) nationality?: string,
    @Args('situation', { type: () => String, nullable: true }) situation?: string,
    @Args('at', { type: () => String, nullable: true }) at?: string,
    @Args('residenceRegions', { type: () => [String], nullable: true, description: RESIDENCE }) residenceRegions?: string[],
    @Args('workRegions', { type: () => [String], nullable: true, description: WORK }) workRegions?: string[],
    @Args('fromResidenceRegions', { type: () => [String], nullable: true, description: FROM_RESIDENCE }) fromResidenceRegions?: string[] | null,
    @Args('toResidenceRegions', { type: () => [String], nullable: true, description: TO_RESIDENCE }) toResidenceRegions?: string[] | null,
    @Args('fromWorkRegions', { type: () => [String], nullable: true, description: FROM_WORK }) fromWorkRegions?: string[] | null,
    @Args('toWorkRegions', { type: () => [String], nullable: true, description: TO_WORK }) toWorkRegions?: string[] | null,
    @Args('residenceStatuses', { type: () => [String], nullable: true, description: STATUS }) residenceStatuses?: string[],
  ): Promise<DiffEntry[]> {
    // GraphQL tells a list left out from one given as null. Left out, a side
    // takes the shared list, and an empty list says nowhere; null says neither,
    // so it is the caller's mistake (SB-186).
    const sides = { fromResidenceRegions, toResidenceRegions, fromWorkRegions, toWorkRegions }
    const nulls = Object.entries(sides)
      .filter(([, list]) => list === null)
      .map(([name]) => name)
    if (nulls.length > 0) {
      throw new GraphQLError(`${nulls.join(', ')} cannot be null: leave a list out to use the shared one, or give an empty list for nowhere.`, {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    const person = { nationality, situation, residenceStatuses }
    return this.rules
      .move(
        { country: from, profile: { ...person, residenceRegions: fromResidenceRegions ?? residenceRegions, workRegions: fromWorkRegions ?? workRegions } },
        { country: to, profile: { ...person, residenceRegions: toResidenceRegions ?? residenceRegions, workRegions: toWorkRegions ?? workRegions } },
        at ? new Date(at) : new Date(),
        locale,
      )
      .catch(asInputError)
  }

  @Query(() => [DiffEntry], { description: 'What changed in one country between two dates, for this person.' })
  async changes(
    @Args('country', { type: () => String }) country: string,
    @Args('since', { type: () => String }) since: string,
    @Args('until', { type: () => String }) until: string,
    @Args('locale', LOCALE) locale: string,
    @Args('nationality', { type: () => String, nullable: true }) nationality?: string,
    @Args('situation', { type: () => String, nullable: true }) situation?: string,
    @Args('residenceRegions', { type: () => [String], nullable: true, description: RESIDENCE }) residenceRegions?: string[],
    @Args('workRegions', { type: () => [String], nullable: true, description: WORK }) workRegions?: string[],
    @Args('residenceStatuses', { type: () => [String], nullable: true, description: STATUS }) residenceStatuses?: string[],
  ): Promise<DiffEntry[]> {
    return this.rules
      .changes(country, { nationality, situation, residenceRegions, workRegions, residenceStatuses }, new Date(since), new Date(until), locale)
      .catch(asInputError)
  }
}
