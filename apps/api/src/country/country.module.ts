import { Module } from '@nestjs/common'
import { CountryResolver } from './country.resolver.js'

@Module({ providers: [CountryResolver] })
export class CountryModule {}
