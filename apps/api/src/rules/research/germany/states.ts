import type { ResearchCase } from '../rows.js'

// Written from research/agreed/germany/states.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-15'

export const CASE: ResearchCase = {
  document: 'states',
  // Every Land, coded as ISO's platform codes it and named as Destatis's list of the
  // Länder names it, both read in research/agreed/germany/states.md (SB-223).
  regions: [
    { code: 'DE-BB', parent: null, name: 'Brandenburg' },
    { code: 'DE-BE', parent: null, name: 'Berlin' },
    { code: 'DE-BW', parent: null, name: 'Baden-Württemberg' },
    { code: 'DE-BY', parent: null, name: 'Bayern' },
    { code: 'DE-HB', parent: null, name: 'Bremen' },
    { code: 'DE-HE', parent: null, name: 'Hessen' },
    { code: 'DE-HH', parent: null, name: 'Hamburg' },
    { code: 'DE-MV', parent: null, name: 'Mecklenburg-Vorpommern' },
    { code: 'DE-NI', parent: null, name: 'Niedersachsen' },
    { code: 'DE-NW', parent: null, name: 'Nordrhein-Westfalen' },
    { code: 'DE-RP', parent: null, name: 'Rheinland-Pfalz' },
    { code: 'DE-SH', parent: null, name: 'Schleswig-Holstein' },
    { code: 'DE-SL', parent: null, name: 'Saarland' },
    { code: 'DE-SN', parent: null, name: 'Sachsen' },
    { code: 'DE-ST', parent: null, name: 'Sachsen-Anhalt' },
    { code: 'DE-TH', parent: null, name: 'Thüringen' },
  ],
  regionsFrom: {
    document: 'states',
    codes: { source: 'isoSubdivisions', label: 'iso-3166-2-de-states' },
    // Destatis prints each Land on its own line, as "- 01 Schleswig-Holstein (SH)".
    names: {
      source: 'destatisLaender',
      label: 'destatis-bundeslaender',
      row: '^- \\d{2} (.+) \\([A-Z]{2}\\)$',
    },
  },
  sources: {
    isoSubdivisions: {
      url: 'https://www.iso.org/obp/ui/#iso:code:3166:DE',
      name: 'ISO Online Browsing Platform, DE - Germany',
      read: READ,
    },
    destatisLaender: {
      url: 'https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Glossar/bundeslaender.html',
      name: 'Statistisches Bundesamt, Gemeindeverzeichnis, Glossar: Bundesländer',
      read: READ,
    },
  },
}
