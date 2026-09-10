import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'

/**
 * The minimum a deployed database needs to answer anything, and nothing more.
 *
 * NOT the seed. `seed.ts` says so in its own first line: illustrative, not
 * verified, written by someone who is not an editor and did not check the
 * government pages that day, and nothing in it should reach a reader until an
 * editor has been through it. Running it on a public database would publish
 * unverified guidance about immigration paperwork to the open internet, which
 * is the one thing this product must never do.
 *
 * So this inserts COUNTRIES, which are structural rather than advisory: a
 * country either exists or it does not, and saying Turkey is called Turkey
 * misleads nobody. Obligations, rule versions and their texts stay out until
 * an editor has approved them, which is what the moderation queue is for.
 *
 * Idempotent, because it runs on every container start.
 *
 * It lives in src/ rather than beside the migrations so that `nest build`
 * compiles it: the runtime image carries dist/ and not src/, and the first
 * version imported the generated client through ../src and died with
 * ERR_MODULE_NOT_FOUND on the first deploy.
 */

const COUNTRIES = [
  { code: 'tr', name: 'Turkey' },
  { code: 'de', name: 'Germany' },
]

const bootstrap = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })

  try {
    const { count } = await prisma.country.createMany({ data: COUNTRIES, skipDuplicates: true })
    console.log(`bootstrap: ${count} country row(s) added, ${COUNTRIES.length - count} already present`)
  } finally {
    await prisma.$disconnect()
  }
}

void bootstrap()
