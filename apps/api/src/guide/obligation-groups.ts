// The obligations each guide links, as groups of alternatives, most preferred first (SB-255, SB-258), written once.
// sample-content.ts and researched-guides.ts link from here, and the web's label test reads it to know which rule facts
// a guide can show (SB-257), so this module imports nothing: a web test cannot load Prisma.

/** The address guides: the research's duty where it is loaded, else the sample obligation, which has no researched facts. */
export const ADDRESS_GUIDE = [['report-your-address', 'register-your-address']] as const

/** Turkey's short-term residence permit guide: the permit, then the charge nine nationalities do not pay. */
export const TURKEY_SHORT_TERM_RESIDENCE_PERMIT = [['get-a-short-term-residence-permit'], ['pay-the-residence-permit-charge']] as const

/** Germany's residence permit guide. */
export const GERMANY_RESIDENCE_PERMIT = [['get-a-residence-permit-as-a-skilled-worker-with-a-degree']] as const

/** Every group any guide links. */
export const LINKED_OBLIGATION_GROUPS: readonly (readonly (readonly string[])[])[] = [
  ADDRESS_GUIDE,
  TURKEY_SHORT_TERM_RESIDENCE_PERMIT,
  GERMANY_RESIDENCE_PERMIT,
]
