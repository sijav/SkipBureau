import { compose } from './compose.js'
import { CASE as PROVINCES } from './turkey/provinces.js'
import { CASE as COMPANY_FORMATION } from './turkey/company-formation.js'
import { CASE as HEALTH_INSURANCE } from './turkey/health-insurance.js'
import { CASE as SHORT_TERM_RESIDENCE_PERMIT } from './turkey/short-term-residence-permit.js'
import { CASE as WORK_PERMIT } from './turkey/work-permit.js'
import { CASE as ADDRESS_REGISTRATION } from './turkey/address-registration.js'
import type { ResearchRules } from './rows.js'

// Written from research/agreed/turkey and nothing else, one file per research case in turkey/,
// composed in this order, so a status comes before its kinds (SB-232). A fact's page is chosen as
// this folder's SB-190 plan says, and test/research-rules.e2e.spec.ts reads every label back from
// the agreed document it names.

export const TURKEY: ResearchRules = compose('tr', 'turkey', [
  PROVINCES,
  COMPANY_FORMATION,
  HEALTH_INSURANCE,
  SHORT_TERM_RESIDENCE_PERMIT,
  WORK_PERMIT,
  ADDRESS_REGISTRATION,
])
