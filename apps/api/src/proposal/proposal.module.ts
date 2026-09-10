import { Module } from '@nestjs/common'
import { ProposalResolver } from './proposal.resolver.js'

@Module({ providers: [ProposalResolver] })
export class ProposalModule {}
