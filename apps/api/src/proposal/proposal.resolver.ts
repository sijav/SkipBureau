import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PrismaService } from '../prisma/prisma.service.js'
import { SuggestUpdateInput, SuggestUpdateResult } from './proposal.model.js'

// Bounds, so an open endpoint cannot be handed a novel. Generous for a person.
const LIMIT = { change: 5000, source: 2000, email: 320 }

// An address with something before an @ and a dot in what follows it. The
// only promise is that a person typed an address; whether it reaches anyone is
// not something a form can know.
const looksLikeEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const tidy = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Figma 145:959. A visitor's suggestion is stored for an editor and never
 * edits the guide. No account and no sign-in; the email is optional.
 */
@Resolver()
export class ProposalResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => SuggestUpdateResult, { description: 'Suggest a change to a guide. Stored for review; it never edits the guide.' })
  async suggestUpdate(@Args('input', { type: () => SuggestUpdateInput }) input: SuggestUpdateInput): Promise<SuggestUpdateResult> {
    const change = tidy(input.change)
    const source = tidy(input.source)
    const email = tidy(input.email)

    // The field to fix, named, rather than a generic refusal: the form says
    // how to fix it next to that field.
    if (!change || change.length > LIMIT.change) return { received: false, problem: 'change' }
    if (source && source.length > LIMIT.source) return { received: false, problem: 'source' }
    if (email && (email.length > LIMIT.email || !looksLikeEmail(email))) return { received: false, problem: 'email' }

    const guide = await this.prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: input.country, slug: input.guide } } })
    if (!guide) return { received: false, problem: 'guide' }

    await this.prisma.proposal.create({ data: { guideId: guide.id, locale: input.locale.slice(0, 5), change, source, email } })
    return { received: true, problem: null }
  }
}
