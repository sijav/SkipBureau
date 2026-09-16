import { RESEARCHED } from 'api/rules/research/countries'
import { expect, test } from 'vitest'
import { SITUATION_LABELS } from './situationLabels'

// SB-286: the panel's Role row offers the situations a country's researched rules name, each by the name the interface
// gives it. A situation a research file adds with no name here fails now, rather than reaching a reader as its code.
test('every situation a researched rule names has a name', () => {
  const situations = new Set(
    RESEARCHED.flatMap((rules) =>
      rules.versions.flatMap((version) =>
        version.criteria.filter((criterion) => criterion.dimension === 'situation').map((criterion) => criterion.value),
      ),
    ),
  )

  expect(situations.size, 'the research names no situation at all').toBeGreaterThan(0)

  // SB-297: named in the message, because the research publish runs this test and keeps only the lines that say what
  // failed. A diff of two arrays is not one of them, so without this the publish would refuse and not say what for.
  const unnamed = [...situations].filter((situation) => !(situation in SITUATION_LABELS))
  expect(unnamed, `situationLabels.ts has no name for: ${unnamed.join(', ')}`).toEqual([])
})
