import { Module } from '@nestjs/common'
import { RulesModule } from '../rules/rules.module.js'
import { GuideResolver } from './guide.resolver.js'
import { GuideService } from './guide.service.js'

@Module({ imports: [RulesModule], providers: [GuideResolver, GuideService] })
export class GuideModule {}
