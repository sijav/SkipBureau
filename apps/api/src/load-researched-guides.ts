import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { loadResearchedGuides, RESEARCHED_GUIDES } from './guide/researched-guides.js'

/**
 * Guides written from the agreed research onto the deployed database, on every start, after sample content (SB-258).
 *
 * Not sample content: it stays when sample content comes out before a launch, and it makes sure of the goal it hangs
 * each area on itself. A start after changes nothing, except that a guide or area the research has stopped naming is
 * removed here rather than left behind to describe itself as sample content (SB-305).
 */
const load = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  const started = Date.now()
  try {
    // SB-305: the one caller that passes the whole manifest, so the one that may remove what it no longer
    // names. Every other caller loads a subset and must stay write only.
    const guides = await loadResearchedGuides(prisma, RESEARCHED_GUIDES, { reconcile: true })
    console.log(`researched guides in ${Date.now() - started} ms: ${guides.join(', ')}`)
  } finally {
    await prisma.$disconnect()
  }
}

void load()
