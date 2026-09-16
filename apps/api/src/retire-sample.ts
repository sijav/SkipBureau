import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { GERMANY_SAMPLE_SLUGS, retireSample, TURKEY_SAMPLE_SLUGS } from './sample-content.js'

/**
 * Deletes the sample rows both countries used to have, by the lists that name them.
 *
 * Nothing on the start path runs this (SB-199): the filler that made those rows is gone, the retirement ran once
 * for each country (SB-282, SB-301) and SB-198 read the deployment back and found only the research. It exists
 * for the one case that could put them back, a database restored from a backup taken before that, or one somebody
 * seeded by hand from the fixtures. It refuses a list naming a guide or area the researched loader writes, so it
 * cannot delete the research.
 */
const main = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  try {
    for (const [countryCode, slugs] of [
      ['tr', TURKEY_SAMPLE_SLUGS],
      ['de', GERMANY_SAMPLE_SLUGS],
    ] as const) {
      const retired = await retireSample(prisma, countryCode, slugs)
      console.log(
        `retire-sample: ${countryCode} lost ${retired.questions} question(s), ${retired.guides} guide(s) and ${retired.areas} area(s)`,
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes('retire-sample')) void main()
