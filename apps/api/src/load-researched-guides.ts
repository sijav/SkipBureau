import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import { loadResearchedGuides } from './guide/researched-guides.js'

/**
 * Guides written from the agreed research onto the deployed database, on every start, after sample content (SB-258).
 *
 * Not sample content: it stays when sample content comes out before a launch, and it makes sure of the goal it hangs
 * each area on itself. Fill-only, so a start after changes nothing.
 */
const load = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  const started = Date.now()
  try {
    const guides = await loadResearchedGuides(prisma)
    console.log(`researched guides in ${Date.now() - started} ms: ${guides.join(', ')}`)
  } finally {
    await prisma.$disconnect()
  }
}

void load()
