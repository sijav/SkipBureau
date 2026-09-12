import { Module } from '@nestjs/common'
import { ProposalResolver } from './proposal.resolver.js'
import { SubmissionLimit } from './submissionLimit.js'

// The limiter is a singleton on purpose: what it remembers is what makes it a
// limiter, and one per request would remember nothing.
@Module({ providers: [ProposalResolver, SubmissionLimit] })
export class ProposalModule {}
