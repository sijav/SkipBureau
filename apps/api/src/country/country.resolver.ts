import { Args, Query, Resolver } from '@nestjs/graphql'
import { PrismaService } from '../prisma/prisma.service.js'
import { Country } from './country.model.js'

const LOCALE = { type: () => String, nullable: true, defaultValue: 'en-US' } as const

type Row = { code: string; name: string; texts: { locale: string; name: string }[] }

// The name in the language asked for, or the canonical one.
const named = (row: Row, locale: string): Country => ({
  code: row.code,
  name: row.texts.find((text) => text.locale === locale)?.name ?? row.name,
})

@Resolver(() => Country)
export class CountryResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Country], { description: 'Every country SkipBureau covers.' })
  async countries(@Args('locale', LOCALE) locale: string): Promise<Country[]> {
    const rows = await this.prisma.country.findMany({ orderBy: { code: 'asc' }, include: { texts: true } })
    return rows.map((row) => named(row, locale))
  }

  @Query(() => Country, { nullable: true, description: 'One country, or null where we do not cover it.' })
  async country(@Args('code', { type: () => String }) code: string, @Args('locale', LOCALE) locale: string): Promise<Country | null> {
    const row = await this.prisma.country.findUnique({ where: { code }, include: { texts: true } })
    return row ? named(row, locale) : null
  }
}
