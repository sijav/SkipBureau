import { GERMANY } from '../src/rules/research/germany.js'
import type { ResearchFact, ResearchRules, ResearchVersion } from '../src/rules/research/rows.js'

// SB-249: a copy of Germany's file with two more Anmeldung versions, one for where a reader works (Saxony) and one for
// where they live and work (Hamburg and Saxony). The work version and Hamburg's both state `specTie`, the same value on
// two pages, or with `differ` two values, so the mixed version's answer takes it from the page that sorts first, or is
// disputed. The work version states nothing else, so its note reaches the mixed answer only through that tie.

export type WorkPlaces = {
  rules: ResearchRules
  federal: ResearchVersion
  hamburg: ResearchVersion
  work: ResearchVersion
  mixed: ResearchVersion
}

export const withWorkPlaces = (differ = false): WorkPlaces => {
  const address = GERMANY.versions.filter((version) => version.obligation === 'report-your-address')
  const federal = address.find((version) => version.criteria.length === 0)
  const inHamburg = address.find((version) => version.criteria.some((criterion) => criterion.value === 'DE-HH'))
  if (!federal || !inHamburg) throw new Error("Germany's file has no federal or Hamburg Anmeldung version")

  const tie = (source: string, labels: readonly string[], textValue: string): ResearchFact => ({
    key: 'specTie',
    operator: 'equals',
    textValue,
    source,
    labels,
  })
  const hamburg: ResearchVersion = {
    ...inHamburg,
    facts: [...inHamburg.facts, tie(inHamburg.source, inHamburg.labels, 'stated on two pages')],
  }
  const work: ResearchVersion = {
    ...federal,
    criteria: [{ dimension: 'workRegion', value: 'DE-SN' }],
    facts: [tie(federal.source, federal.labels, differ ? 'stated differently' : 'stated on two pages')],
    notes: { en: 'Spec: for work in Saxony.' },
  }
  const mixed: ResearchVersion = {
    ...federal,
    criteria: [
      { dimension: 'residenceRegion', value: 'DE-HH' },
      { dimension: 'workRegion', value: 'DE-SN' },
    ],
    facts: [
      {
        key: 'specMixedOnly',
        operator: 'equals',
        textValue: 'for living in Hamburg and working in Saxony',
        source: inHamburg.source,
        labels: inHamburg.labels,
      },
    ],
    notes: { en: 'Spec: for living in Hamburg and working in Saxony.' },
  }
  const versions = GERMANY.versions.map((version) => (version === inHamburg ? hamburg : version))
  return { rules: { ...GERMANY, versions: [...versions, work, mixed] }, federal, hamburg, work, mixed }
}
