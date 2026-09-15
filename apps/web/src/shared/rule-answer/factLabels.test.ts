import { expect, test } from 'vitest'
import { LINKED_OBLIGATION_GROUPS } from 'api/guide/obligation-groups'
import { RESEARCHED } from 'api/rules/research/countries'
import { FACT_LABELS } from './factLabels'

// SB-257: a guide shows a line for each fact of the obligations it links, and a
// value alone can mean nothing without its key. So every fact of every
// obligation a guide links, as the research files hold them, has a label, and a
// new link or a new fact without one fails here rather than shipping a line
// that says "yes" or "20%" with no subject.
test('every fact of every obligation a guide links has a label', () => {
  const linked = new Set(LINKED_OBLIGATION_GROUPS.flat(2))
  const facts = RESEARCHED.flatMap((rules) =>
    rules.versions
      .filter((version) => linked.has(version.obligation))
      .flatMap((version) => version.facts.map((fact) => `${version.obligation}.${fact.key}`)),
  )

  expect(facts.length, 'the linked obligations hold no researched facts at all').toBeGreaterThan(0)
  expect(facts.filter((fact) => !((fact.split('.')[1] ?? '') in FACT_LABELS))).toEqual([])
})
