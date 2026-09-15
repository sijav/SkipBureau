import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { loadResearchRules } from './rules/research/load.js'
import { RESEARCHED } from './rules/research/countries.js'

/**
 * Researched rules onto the deployed database, on every start (SB-190).
 *
 * Only what src/rules/research holds reaches it: rules written from the agreed
 * research, every fact tied to the page that states it. The sample rules in
 * seed.ts never run here. Idempotent and serialised with any other container
 * starting at the same time, so it runs on every start, and afterwards every row
 * a research file owns says what that file says: a research that passed is on
 * the database from the start that follows its push (SB-202).
 */
const load = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  const started = Date.now()

  try {
    const report = await loadResearchRules(prisma, RESEARCHED)
    const counted = (noun: string, added: number, changed: number, removed: number) => `${noun} ${added} added, ${changed} changed, ${removed} removed`
    console.log(
      `research rules in ${Date.now() - started} ms: ${[
        counted('versions', report.versionsAdded, report.versionsChanged, report.versionsRemoved),
        counted('places', report.regionsAdded, report.regionsChanged, report.regionsRemoved),
        counted('statuses', report.statusesAdded, report.statusesChanged, report.statusesRemoved),
        counted('groups', report.groupsAdded, report.groupsChanged, report.groupsRemoved),
        `memberships ${report.membershipsAdded} added, ${report.membershipsRemoved} removed`,
        `obligations ${report.obligationsAdded} added`,
      ].join('; ')}`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

void load()
