import { compose } from './compose.js'
import { CASE as STATES } from './germany/states.js'
import { CASE as CITIES } from './germany/cities.js'
import { CASE as ANMELDUNG } from './germany/anmeldung.js'
import { CASE as RESIDENCE_PERMIT } from './germany/residence-permit.js'
import { CASE as HEALTH_INSURANCE } from './germany/health-insurance.js'
import { CASE as BUSINESS_REGISTRATION } from './germany/business-registration.js'
import type { ResearchRules } from './rows.js'

// Written from research/agreed/germany and nothing else, one file per research case in germany/,
// composed in this order, so a Land comes before its cities and a status before the rules naming it (SB-232).

export const GERMANY: ResearchRules = compose('de', 'germany', [
  STATES,
  CITIES,
  ANMELDUNG,
  RESIDENCE_PERMIT,
  HEALTH_INSURANCE,
  BUSINESS_REGISTRATION,
])
