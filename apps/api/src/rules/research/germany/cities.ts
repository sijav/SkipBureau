import type { ResearchCase } from '../rows.js'

// Written from research/agreed/germany/cities.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-15'

// A city's entry in the statistical offices' municipal directory: its key, then its title, the
// name and after a comma the designation, which is not part of the name (SB-228).
const CITY_TITLE = '^\\d{8} (.+), (?:Landeshauptstadt|Stadt)$'

export const CASE: ResearchCase = {
  document: 'cities',
  regions: [
    // The cities a rule of Germany's agreed research names, each after its Land and named as its
    // directory entry names it, read in research/agreed/germany/cities.md (SB-228).
    {
      code: 'DE-BY.muenchen',
      parent: 'DE-BY',
      name: 'München',
      officialCode: '09162000',
      from: {
        document: 'cities',
        source: 'directoryMuenchen',
        label: 'gv-muenchen-09162000',
        row: CITY_TITLE,
      },
    },
    {
      code: 'DE-NW.duesseldorf',
      parent: 'DE-NW',
      name: 'Düsseldorf',
      officialCode: '05111000',
      from: {
        document: 'cities',
        source: 'directoryDuesseldorf',
        label: 'gv-duesseldorf-05111000',
        row: CITY_TITLE,
      },
    },
    {
      code: 'DE-NW.koeln',
      parent: 'DE-NW',
      name: 'Köln',
      officialCode: '05315000',
      from: {
        document: 'cities',
        source: 'directoryKoeln',
        label: 'gv-koeln-05315000',
        row: CITY_TITLE,
      },
    },
    {
      code: 'DE-HE.wiesbaden',
      parent: 'DE-HE',
      name: 'Wiesbaden',
      officialCode: '06414000',
      from: {
        document: 'cities',
        source: 'directoryWiesbaden',
        label: 'gv-wiesbaden-06414000',
        row: CITY_TITLE,
      },
    },
    {
      code: 'DE-BW.freiburg',
      parent: 'DE-BW',
      name: 'Freiburg im Breisgau',
      officialCode: '08311000',
      from: {
        document: 'cities',
        source: 'directoryFreiburg',
        label: 'gv-freiburg-08311000',
        row: CITY_TITLE,
      },
    },
  ],
  sources: {
    directoryMuenchen: {
      url: 'https://www.statistikportal.de/de/gemeindeverzeichnis/09162000',
      name: 'Statistikportal, Gemeindeverzeichnis: München, Landeshauptstadt',
      read: READ,
    },
    directoryDuesseldorf: {
      url: 'https://www.statistikportal.de/de/gemeindeverzeichnis/05111000',
      name: 'Statistikportal, Gemeindeverzeichnis: Düsseldorf, Stadt',
      read: READ,
    },
    directoryKoeln: {
      url: 'https://www.statistikportal.de/de/gemeindeverzeichnis/05315000',
      name: 'Statistikportal, Gemeindeverzeichnis: Köln, Stadt',
      read: READ,
    },
    directoryWiesbaden: {
      url: 'https://www.statistikportal.de/de/gemeindeverzeichnis/06414000',
      name: 'Statistikportal, Gemeindeverzeichnis: Wiesbaden, Landeshauptstadt',
      read: READ,
    },
    directoryFreiburg: {
      url: 'https://www.statistikportal.de/de/gemeindeverzeichnis/08311000',
      name: 'Statistikportal, Gemeindeverzeichnis: Freiburg im Breisgau, Stadt',
      read: READ,
    },
  },
}
