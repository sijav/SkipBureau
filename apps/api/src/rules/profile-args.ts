import { GraphQLError } from 'graphql'
import { ProfileError } from './eligibility.js'

// A refused profile is the caller's mistake, and BAD_USER_INPUT is the code a
// GraphQL client reads as that. A GraphQLError, because the Apollo driver
// passes one through as it is, where a Nest HttpException would arrive as
// BAD_REQUEST (SB-168). Every resolver that takes a profile uses it (SB-255).
export const asInputError = (error: unknown): never => {
  if (error instanceof ProfileError) {
    throw new GraphQLError(error.message, { extensions: { code: 'BAD_USER_INPUT', codes: error.codes } })
  }
  throw error
}

export const RESIDENCE =
  'Where this person lives: region codes, one per country, so a move between countries can carry one on each side. A province or state by its ISO 3166-2 code such as TR-34, or a place inside one by its key such as TR-34.kadikoy.'
export const WORK = 'Where this person works, the same way. Some rules follow the place of work rather than where a person lives.'
export const STATUS =
  'What this person holds in each country: residence status codes, one per country, such as tr.residence-permit, or a kind of one such as tr.residence-permit.student.'
