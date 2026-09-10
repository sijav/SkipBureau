import { Module } from '@nestjs/common'
import { GuideResolver } from './guide.resolver.js'
import { GuideService } from './guide.service.js'

@Module({ providers: [GuideResolver, GuideService] })
export class GuideModule {}
