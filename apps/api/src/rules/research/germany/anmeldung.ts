import type { ResearchCase } from '../rows.js'

// Written from research/agreed/germany/anmeldung.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

// The day SB-174 read the pages Germany's rule documents cite.
const RULES_READ = '2026-09-14'

export const CASE: ResearchCase = {
  document: 'anmeldung',
  obligations: [
    {
      slug: 'report-your-address',
      kind: 'registration',
      titles: {
        en: 'Report your address and any change to it',
        fa: 'اعلام نشانی محل سکونت و هر تغییر آن',
      },
    },
  ],
  sources: {
    registrationLawDeadline: {
      url: 'https://www.gesetze-im-internet.de/bmg/__17.html',
      name: 'Bundesmeldegesetz (BMG), § 17 Anmeldung, Abmeldung',
      read: RULES_READ,
    },
    registrationLawFines: {
      url: 'https://www.gesetze-im-internet.de/bmg/__54.html',
      name: 'Bundesmeldegesetz (BMG), § 54 Bußgeldvorschriften',
      read: RULES_READ,
    },
    hamburgRegistration: {
      url: 'https://www.hamburg.de/service/info/111142065/n0/',
      name: 'hamburg.de, Umzug nach Hamburg aus dem Ausland melden',
      read: RULES_READ,
    },
    berlinRegistration: {
      url: 'https://service.berlin.de/dienstleistung/120686/',
      name: 'Service Berlin, Wohnsitz - Alleinige Wohnung oder Hauptwohnung anmelden',
      read: RULES_READ,
    },
    saxonyRegistration: {
      url: 'https://amt24.sachsen.de/zufi/leistungen/6007623',
      name: 'Amt24 Sachsen, Wohnsitz – alleinige Wohnung oder Hauptwohnung anmelden',
      read: RULES_READ,
    },
  },
  versions: [
    // The Anmeldung for everyone, and the fee only where a Land's own page states it; Munich,
    // Düsseldorf, Wiesbaden and Freiburg wait for their places (SB-228, SB-229).
    {
      obligation: 'report-your-address',
      document: 'anmeldung',
      validFrom: RULES_READ,
      criteria: [],
      source: 'registrationLawDeadline',
      labels: ['bmg-17-two-weeks'],
      facts: [
        {
          key: 'reportAddressChangeWithin',
          operator: 'within',
          numericValue: 2,
          unit: 'weeks',
          source: 'registrationLawDeadline',
          labels: ['bmg-17-two-weeks'],
        },
        {
          key: 'lateAddressNotificationFine',
          operator: 'atMost',
          numericValue: 1000,
          currency: 'EUR',
          source: 'registrationLawFines',
          labels: ['bmg-54-fine-late-registration'],
        },
      ],
      notes: {
        en: 'For anyone who moves into a dwelling in Germany, unless a statutory exemption or exception applies, whatever their nationality and whether or not they are an EU citizen: register with the registration office (Meldebehörde) within two weeks of moving in. It is federal, and no Land can lengthen or shorten it. The three-month figure is real but describes other situations: a temporary stay by somebody who otherwise lives abroad and is not registered in Germany, where registration falls due within two weeks after the stay passes three months, and a stay in a hotel or similar by somebody with no registered German dwelling, on the same pattern; that temporary-stay exception does not apply to asylum seekers or other foreign nationals who move temporarily into a reception facility or other assigned accommodation. The person who provides your accommodation, which for a subtenant is the main tenant rather than the owner, must confirm your move within the same two weeks, in a signed written confirmation or electronically directly to the registration office. If they refuse or are late, tell the registration office without delay; federal guidance says the registration must go ahead anyway if you really did move in, with the confirmation supplied afterwards. A lease is not a substitute for it. Failing to register on time can be fined up to €1,000, which is a ceiling, not a standard charge; the €50,000 figure you may read about is for offering somebody a fictitious registration address. For a child under sixteen, the person whose dwelling they move into registers them.',
      },
    },
    {
      obligation: 'report-your-address',
      document: 'anmeldung',
      validFrom: RULES_READ,
      criteria: [{ dimension: 'residenceRegion', value: 'DE-HH' }],
      source: 'hamburgRegistration',
      labels: ['hh-registration-fee-16'],
      facts: [
        {
          key: 'registrationFee',
          operator: 'equals',
          numericValue: 16,
          currency: 'EUR',
          source: 'hamburgRegistration',
          labels: ['hh-registration-fee-16'],
        },
      ],
      notes: {
        en: "In Hamburg, registration costs €16, set by Hamburg's own fee ordinance and raised to that figure on 1 January 2026. It comes from Hamburg's general fee legislation rather than from the federal registration law, which is why it can exist at all while the two-week deadline cannot vary. The charge is for one person or for a family who share both the address they left and the address they are arriving at, so a qualifying family pays €16 once, not each. We could not establish which relationships count as a family for that tariff, so do not assume it covers housemates or relatives arriving separately. Hamburg's page for arrivals from abroad says everyone moving in must attend in person, which sits awkwardly with federal guidance allowing representation, and we could not find a Hamburg rule that overrides it.",
      },
    },
    {
      obligation: 'report-your-address',
      document: 'anmeldung',
      validFrom: RULES_READ,
      criteria: [{ dimension: 'residenceRegion', value: 'DE-BE' }],
      source: 'berlinRegistration',
      labels: ['berlin-registration-free'],
      facts: [
        {
          key: 'registrationFee',
          operator: 'none',
          source: 'berlinRegistration',
          labels: ['berlin-registration-free'],
        },
      ],
      notes: {
        en: 'In Berlin, registration is free. Berlin registers by appointment, in person or through an authorised representative, and its online route is for moves within Germany rather than a first arrival from abroad. The service page we checked for Berlin does not offer ordinary registration by post.',
      },
    },
    {
      obligation: 'report-your-address',
      document: 'anmeldung',
      validFrom: RULES_READ,
      criteria: [{ dimension: 'residenceRegion', value: 'DE-SN' }],
      source: 'saxonyRegistration',
      labels: ['saxony-registration-free'],
      facts: [
        {
          key: 'registrationFee',
          operator: 'none',
          source: 'saxonyRegistration',
          labels: ['saxony-registration-free'],
        },
      ],
      notes: {
        en: "In Saxony, registration is free under the state's guidance.",
      },
    },
  ],
}
