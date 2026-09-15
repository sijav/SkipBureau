import { Module } from '@nestjs/common'
import { RulesResolver } from './rules.resolver.js'
import { RulesService } from './rules.service.js'

@Module({ providers: [RulesResolver, RulesService], exports: [RulesService] })
export class RulesModule {}
