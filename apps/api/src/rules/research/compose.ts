import type {
  ResearchCase,
  ResearchNationalityGroup,
  ResearchObligation,
  ResearchRegion,
  ResearchRegionSource,
  ResearchRules,
  ResearchSource,
  ResearchStatus,
  ResearchVersion,
} from './rows.js'

const versionKey = (version: ResearchVersion): string =>
  `${version.obligation} from ${version.validFrom} for ${JSON.stringify(version.criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort())}`

const sameObligation = (a: ResearchObligation, b: ResearchObligation): boolean =>
  a.slug === b.slug && a.kind === b.kind && a.titles.en === b.titles.en && a.titles.fa === b.titles.fa

const sameSource = (a: ResearchSource, b: ResearchSource): boolean => a.url === b.url && a.name === b.name && a.read === b.read

/**
 * One country's rules from its research cases, in the order given, so a status comes before its kinds
 * and a place before the places inside it (SB-232). A place, status, group or version two cases list,
 * or a source or obligation two cases list differently, is refused with both cases named; the same
 * source or obligation listed identically is written once. A case's document names it and is written
 * nowhere.
 */
export const compose = (country: string, research: string, cases: readonly ResearchCase[]): ResearchRules => {
  const listedBy = new Map<string, string>()
  const once = (what: string, key: string, document: string): void => {
    const first = listedBy.get(`${what} ${key}`)
    if (first !== undefined) throw new Error(`${research}: ${what} ${key} is listed by both ${first} and ${document}.`)
    listedBy.set(`${what} ${key}`, document)
  }

  const statuses: ResearchStatus[] = []
  const regions: ResearchRegion[] = []
  const nationalityGroups: ResearchNationalityGroup[] = []
  const obligations = new Map<string, { obligation: ResearchObligation; document: string }>()
  const sources = new Map<string, { source: ResearchSource; document: string }>()
  const versions: ResearchVersion[] = []
  let regionsFrom: { from: ResearchRegionSource; document: string } | undefined

  for (const each of cases) {
    for (const status of each.statuses ?? []) {
      once('status', status.code, each.document)
      statuses.push(status)
    }
    for (const region of each.regions ?? []) {
      once('place', region.code, each.document)
      regions.push(region)
    }
    if (each.regionsFrom) {
      if (regionsFrom) throw new Error(`${research}: the places' reading is given by both ${regionsFrom.document} and ${each.document}.`)
      regionsFrom = { from: each.regionsFrom, document: each.document }
    }
    for (const group of each.nationalityGroups ?? []) {
      once('group', group.code, each.document)
      nationalityGroups.push(group)
    }
    for (const obligation of each.obligations ?? []) {
      const had = obligations.get(obligation.slug)
      if (had && !sameObligation(had.obligation, obligation)) {
        throw new Error(`${research}: obligation ${obligation.slug} is listed differently by ${had.document} and ${each.document}.`)
      }
      if (!had)
        obligations.set(obligation.slug, {
          obligation,
          document: each.document,
        })
    }
    for (const [key, source] of Object.entries(each.sources ?? {})) {
      const had = sources.get(key)
      if (had && !sameSource(had.source, source))
        throw new Error(`${research}: source ${key} is listed differently by ${had.document} and ${each.document}.`)
      if (!had) sources.set(key, { source, document: each.document })
    }
    for (const version of each.versions ?? []) {
      once('version', versionKey(version), each.document)
      versions.push(version)
    }
  }

  return {
    country,
    research,
    statuses,
    regions,
    ...(regionsFrom ? { regionsFrom: regionsFrom.from } : {}),
    nationalityGroups,
    obligations: [...obligations.values()].map((entry) => entry.obligation),
    sources: Object.fromEntries([...sources].map(([key, entry]) => [key, entry.source])),
    versions,
  }
}
