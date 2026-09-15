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
  expect([...situations].filter((situation) => !(situation in SITUATION_LABELS))).toEqual([])
})
