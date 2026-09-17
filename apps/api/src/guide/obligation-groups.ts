// The obligations each guide links, as groups of alternatives, most preferred first (SB-255, SB-258), written once.
// prisma/sample-turkey.ts, prisma/sample-germany.ts and researched-guides.ts link from here, so this module imports
// nothing and stays cheap for any of them to load.
//
// It no longer holds a list of every group a guide links (SB-316). That list had one reader, the web's label test, and
// a guide could link a group left out of it while the test silently stopped checking that group's facts. The test now
// takes its slugs from the guides' own obligations, so there is nothing to keep in step.

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

/**
 * Turkey's company formation guide: forming a limited company, then the six duties after it (SB-280). The fifteen day
 * report follows registering an employee, which is the point at which a founder has somebody to report (SB-336). Law
 * 6735 Article 22(1) puts it on the employer, and work-permit.ts scopes a version of it to the founder for that reason.
 */
export const TURKEY_COMPANY_FORMATION = [
  ['form-a-limited-company'],
  ['request-electronic-tax-notifications'],
  ['get-a-tax-certificate'],
  ['register-an-employee-for-social-insurance'],
  ['report-employment-starting-and-ending'],
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

