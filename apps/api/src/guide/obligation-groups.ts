// The obligations each guide links, as groups of alternatives, most preferred first (SB-255, SB-258), written once.
// sample-content.ts and researched-guides.ts link from here, and the web's label test reads it to know which rule facts
// a guide can show (SB-257), so this module imports nothing: a web test cannot load Prisma.

/** The address guides: the research's duty where it is loaded, else the sample obligation, which has no researched facts. */
export const ADDRESS_GUIDE = [['report-your-address', 'register-your-address']] as const

/** Turkey's short-term residence permit guide: the permit, then the charge nine nationalities do not pay. */
export const TURKEY_SHORT_TERM_RESIDENCE_PERMIT = [['get-a-short-term-residence-permit'], ['pay-the-residence-permit-charge']] as const

/** Turkey's health cover guide: joining general health insurance (SB-280). */
export const TURKEY_HEALTH_INSURANCE = [['join-general-health-insurance']] as const

/** Turkey's work permit guide: the permit, then the three duties that follow it (SB-280). */
export const TURKEY_WORK_PERMIT = [
  ['get-a-work-permit'],
  ['report-employment-starting-and-ending'],
  ['apply-for-a-residence-permit-after-a-work-permit'],
  ['keep-working-while-an-extension-is-assessed'],
] as const

/** Turkey's company formation guide: forming a limited company, then the five duties after it (SB-280). */
export const TURKEY_COMPANY_FORMATION = [
  ['form-a-limited-company'],
  ['request-electronic-tax-notifications'],
  ['get-a-tax-certificate'],
  ['register-an-employee-for-social-insurance'],
  ['get-a-workplace-licence'],
  ['keep-company-books-electronically'],
] as const

/** Germany's residence permit guide. */
export const GERMANY_RESIDENCE_PERMIT = [['get-a-residence-permit-as-a-skilled-worker-with-a-degree']] as const

/** Germany's business registration guide: the trade notification, then the six duties it sets off (SB-300). */
export const GERMANY_BUSINESS_REGISTRATION = [
  ['register-a-trade'],
  ['notify-the-accident-insurer'],
  ['send-the-tax-registration-questionnaire'],
  ['pay-trade-tax'],
  ['pay-chamber-of-commerce-contributions'],
  ['use-the-vat-small-business-rule'],
  ['check-your-title-allows-self-employment'],
] as const

/** Germany's health insurance guide: joining the statutory system, and the care insurance charged on top (SB-300). */
export const GERMANY_HEALTH_INSURANCE = [['join-statutory-health-insurance'], ['pay-care-insurance-contributions']] as const

/** Every group any guide links. */
export const LINKED_OBLIGATION_GROUPS: readonly (readonly (readonly string[])[])[] = [
  ADDRESS_GUIDE,
  TURKEY_SHORT_TERM_RESIDENCE_PERMIT,
  TURKEY_HEALTH_INSURANCE,
  TURKEY_WORK_PERMIT,
  TURKEY_COMPANY_FORMATION,
  GERMANY_RESIDENCE_PERMIT,
  GERMANY_BUSINESS_REGISTRATION,
  GERMANY_HEALTH_INSURANCE,
]
