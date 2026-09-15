import { GERMANY } from './germany.js'
import type { ResearchRules } from './rows.js'
import { TURKEY } from './turkey.js'

/** Every country's researched rules, in the order a start loads them (SB-223). */
export const RESEARCHED: readonly ResearchRules[] = [TURKEY, GERMANY]
