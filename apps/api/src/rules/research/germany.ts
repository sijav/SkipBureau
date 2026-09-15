import { compose } from './compose.js'
import { CASE as STATES } from './germany/states.js'
import { CASE as CITIES } from './germany/cities.js'
import { CASE as ANMELDUNG } from './germany/anmeldung.js'
import type { ResearchRules } from './rows.js'

// Written from research/agreed/germany and nothing else, one file per research case in germany/,
// composed in this order, so a Land comes before its cities (SB-232).

export const GERMANY: ResearchRules = compose('de', 'germany', [STATES, CITIES, ANMELDUNG])
