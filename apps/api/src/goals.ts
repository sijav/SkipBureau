import type { PrismaClient } from './generated/prisma/client.js'
import { TASKS } from './tasks.js'

// The hub's copy came after the goals did, so a row that exists may still have it empty.
const HUB_FIELDS = ['heading', 'intro', 'areasIntro', 'dependsNote', 'otherRoutesIntro'] as const
type HubCopy = Record<(typeof HUB_FIELDS)[number], string>

/**
 * The twelve goals and their text, in both languages, from src/tasks.ts.
 *
 * They are structural rather than advisory, in the sense bootstrap.ts means: a goal is a name for something a
 * person has to do abroad, the same intention in every country, and saying it exists misleads nobody. So the
 * bootstrap writes them on a deployed database (SB-199), where the sample content used to and no longer runs at
 * all, and the fixtures write them too, through seedContent, so a seeded test database has them as production
 * does.
 *
 * FILL-ONLY, like everything that runs on every start: it creates what is missing, fills a hub column that is
 * still empty, and never overwrites text an editor has written.
 */
export const writeGoals = async (prisma: PrismaClient): Promise<number> => {
  for (const task of TASKS) {
    const row = await prisma.task.upsert({
      where: { slug: task.slug },
      update: {},
      create: { slug: task.slug, position: task.position },
    })

    for (const [locale, title, subtitle, hub] of [
      ['en-US', task.en, task.enSub, 'hub' in task ? task.hub.en : null],
      ['fa-IR', task.fa, task.faSub, 'hub' in task ? task.hub.fa : null],
    ] as const) {
      const where = { taskId_locale: { taskId: row.id, locale } }
      const existing = await prisma.taskText.findUnique({ where })
      if (!existing) {
        await prisma.taskText.create({ data: { taskId: row.id, locale, title, subtitle, ...hub } })
        continue
      }

      // The hub's copy came after the goals did, so a row that exists may
      // still have it empty. Fill-only means empty columns too, never a
      // column an editor has written.
      const missing: Partial<HubCopy> = {}
      for (const field of HUB_FIELDS) if (hub && existing[field] === null) missing[field] = hub[field]
      if (Object.keys(missing).length > 0) await prisma.taskText.update({ where, data: missing })
    }
  }

  return TASKS.length
}
