import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { loadResearchRules } from './rules/research/load.js'
import { TURKEY } from './rules/research/turkey.js'

/**
 * Researched rules onto the deployed database, on every start (SB-190).
 *
 * Only what src/rules/research holds reaches it: rules written from the agreed
 * research, every fact tied to the page that states it. The sample rules in
 * seed.ts never run here. Idempotent and serialised with any other container
 * starting at the same time, so it runs on every start, and it stops the start
 * if a deployed version, a residence status or a nationality group's membership
 * the file names no longer matches the file.
 */
const load = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  const started = Date.now()

  try {
    const report = await loadResearchRules(prisma, [TURKEY])
    console.log(
      `research rules: ${report.statusesAdded} residence status(es), ${report.groupsAdded} nationality group(s) with ${report.membershipsAdded} membership(s), ${report.obligationsAdded} obligation(s) and ${report.versionsAdded} version(s) added in ${Date.now() - started} ms, the rest already present`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

void load()
