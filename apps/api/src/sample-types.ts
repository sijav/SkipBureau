/** A piece of copy in English and, where it has been translated, Persian. */
export type Localised = { en: string; fa?: string }

export type SectionKindName = 'beforeYouStart' | 'whatYouNeed' | 'yourOptions' | 'howToDoIt' | 'whereToDoIt' | 'importantToKnow' | 'whatToCheck' | 'commonProblems'

export type StepSeed = { title: Localised; body?: Localised; note?: Localised; label?: Localised }

export type SectionSeed = {
  kind: SectionKindName
  title?: Localised
  body?: Localised
  note?: Localised
  callout?: Localised
  calloutBody?: Localised
  calloutSource?: Localised
  /** A guide in the same country, by slug, that the section points on to. */
  link?: string
  steps?: StepSeed[]
}

export type OptionSeed = { title: Localised; body?: Localised; bestFor?: Localised; caveat?: Localised }

export type SourceSeed = { url: string; name: string; publisher?: string; official?: boolean; note?: string }

/**
 * The body of a guide that already has a row: everything the guide page draws
 * below its title. Filled in level by level where it is missing, so a guide
 * created bare, with only a title for a hub to list, fills out on a later start.
 */
export type GuideDetailSeed = {
  slug: string
  showDisclaimer?: boolean
  /** The page's opening paragraph, longer than the description a hub lists. */
  intro?: Localised
  quickAnswer?: Localised
  cost?: Localised
  time?: Localised
  deadlines?: Localised
  costNote?: Localised
  sections: SectionSeed[]
  options?: OptionSeed[]
  sources: SourceSeed[]
  /** Guides in the same country, by slug. */
  related?: string[]
}
