import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { writeGoals } from './goals.js'

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
 * misleads nobody. It writes no obligation and no rule. Researched ones, from
 * the agreed research with every fact tied to the page that states it, are
 * loaded by load-research-rules.ts (SB-190), and nothing else reaches the
 * deployed database.
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

// Each country's name per language. Fill-only, like the rest: an editor's
// correction survives a restart.
const NAMES = [
  { countryCode: 'tr', locale: 'en-US', name: 'Turkey' },
  { countryCode: 'tr', locale: 'fa-IR', name: 'ترکیه' },
  { countryCode: 'de', locale: 'en-US', name: 'Germany' },
  { countryCode: 'de', locale: 'fa-IR', name: 'آلمان' },
  // SB-414: a country's name in every locale the product ships, because it is
  // interpolated into nearly every heading. Without these a Turkish page says "Turkey"
  // and a German one says "Germany", which is the most visible way a half-translated
  // interface announces itself. The rest of the content stays English until SB-418, and
  // that is recorded rather than hidden.
  { countryCode: 'tr', locale: 'tr-TR', name: 'Türkiye' },
  { countryCode: 'tr', locale: 'de-DE', name: 'Türkei' },
  { countryCode: 'de', locale: 'tr-TR', name: 'Almanya' },
  { countryCode: 'de', locale: 'de-DE', name: 'Deutschland' },
]

export const bootstrap = async (prisma: PrismaClient): Promise<void> => {
  const { count } = await prisma.country.createMany({ data: COUNTRIES, skipDuplicates: true })
  console.log(`bootstrap: ${count} country row(s) added, ${COUNTRIES.length - count} already present`)
  const names = await prisma.countryText.createMany({ data: NAMES, skipDuplicates: true })
  console.log(`bootstrap: ${names.count} country name(s) added`)
  // SB-199: the twelve goals, which the sample content used to write on every start and which nothing else writes.
  console.log(`bootstrap: ${await writeGoals(prisma)} goal(s) written or already present`)
}

const main = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  try {
    await bootstrap(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes('bootstrap')) void main()
