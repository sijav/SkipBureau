import { Args, Query, Resolver } from '@nestjs/graphql'
import { LOCALE } from '../locale.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { Country, Place, ResidenceStatusView } from './country.model.js'

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

  @Query(() => [Place], {
    description: 'Every place in one country that a reader can say they live or work in, each with the place it is inside (SB-255).',
  })
  async places(@Args('country', { type: () => String }) country: string, @Args('locale', LOCALE) locale: string): Promise<Place[]> {
    const rows = await this.prisma.region.findMany({ where: { countryCode: country }, orderBy: { code: 'asc' }, include: { texts: true } })
    return rows.map((row) => ({
      code: row.code,
      parentCode: row.parentCode,
      officialCode: row.officialCode,
      name: named(row, locale).name,
    }))
  }

  @Query(() => [ResidenceStatusView], {
    description: 'Every residence status a reader can hold in one country, each with the status it is a kind of (SB-255).',
  })
  async residenceStatuses(
    @Args('country', { type: () => String }) country: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<ResidenceStatusView[]> {
    const rows = await this.prisma.residenceStatus.findMany({
      where: { countryCode: country },
      orderBy: { code: 'asc' },
      include: { texts: true },
    })
    return rows.map((row) => ({ code: row.code, parentCode: row.parentCode, name: named(row, locale).name }))
  }
}
