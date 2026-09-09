import { Args, Query, Resolver } from '@nestjs/graphql'
import { PrismaService } from '../prisma/prisma.service.js'
import { Country } from './country.model.js'

@Resolver(() => Country)
export class CountryResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Country], { description: 'Every country SkipBureau covers.' })
  async countries(): Promise<Country[]> {
    return this.prisma.country.findMany({ orderBy: { code: 'asc' } })
  }

  @Query(() => Country, { nullable: true, description: 'One country, or null where we do not cover it.' })
  async country(@Args('code', { type: () => String }) code: string): Promise<Country | null> {
    return this.prisma.country.findUnique({ where: { code } })
  }
}
