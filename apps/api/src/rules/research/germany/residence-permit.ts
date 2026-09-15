import type { ResearchCase, ResearchVersion } from '../rows.js'

// Written from research/agreed/germany/residence-permit.md and nothing else, one file per research case, which the
// country's file composes (SB-232). Its fee waits for its reductions (SB-240), and §81(3) and the nationalities
// §41 AufenthV names wait for theirs (SB-234): none has a definition yet.

const READ = '2026-09-14'

const SLUG = 'get-a-residence-permit-as-a-skilled-worker-with-a-degree'

const FEDERAL_NOTES =
  "The Ausländerbehörde where you live decides your application and issues the permit: in Berlin the Landesamt für Einwanderung, in Munich the city's Servicestelle für Zuwanderung und Einbürgerung. The employment agency may have to consent to your job, but it does not issue the permit. Applying before your national D visa or residence permit expires normally preserves that title under §81(4). Applying does not automatically let you work, and it does not automatically let you travel: your existing permission to work continues with the restrictions it already had, and applying does not let you switch to a different job; with a valid §81(4) Fiktionsbescheinigung and a valid passport, you can travel and come back. Once the authority has started issuing your employment permit, the specified work is allowed while the card is being produced, and that permission must be recorded on your certificate (§81(5a)). Staying, working and travelling are separate questions: an application receipt is not the same document as a Fiktionsbescheinigung that is valid for travel."

const MUNICH_NOTES =
  'In Munich you apply online or by post, and an appointment follows after review. The published processing time is up to seven months, with too many applications and not enough staff said plainly. Munich lists a declaration about the employment and a certified translation of a foreign degree; the employment declaration implements §18(2)(4a), which is federal, not a Bavarian condition. These are differences in procedure and in what the office lists, not different eligibility rules, and the list is not a promise that nothing else will be asked for.'

const BERLIN_NOTES =
  "In Berlin you apply online only, paying before you submit, and an appointment follows a positive assessment. Submit the application through the dedicated online application before your current permission expires; you do not need to wait for an appointment. The electronic card takes 4 to 6 weeks after the issuance stage, and the page gives no numerical estimate for the whole process. Berlin lists housing size and what your rent costs as extra evidence. If you see €56 quoted in Berlin, that is the federal reduction for the exceptional sticker format, not a Berlin price. For help in a documented emergency, use the responsible department's contact form: Berlin assesses urgent travel within the next four weeks evidenced by a booking, or threatened job loss or benefit termination because of missing valid documentation evidenced by a letter from an employer, a Jobcenter or a Sozialamt, and if it accepts the emergency it can send a Fiktionsbescheinigung or offer a prompt appointment. These are differences in procedure and in what the office lists, not different eligibility rules."

/**
 * A holder's three versions: the federal one, and Munich's and Berlin's, each carrying the same status so that it
 * narrows the federal version by place alone and takes the facts it does not state from it.
 */
const versionsFor = (status: string): ResearchVersion[] => [
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: READ,
    criteria: [{ dimension: 'residenceStatus', value: status }],
    source: 'residenceActApplication',
    labels: ['aufenthg-81-4-before-expiry'],
    facts: [
      {
        key: 'currentTitleWhileDeciding',
        operator: 'equals',
        textValue: 'stays valid, if applied for before it expires',
        source: 'residenceActApplication',
        labels: ['aufenthg-81-4-before-expiry'],
      },
    ],
    notes: { en: FEDERAL_NOTES },
  },
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: READ,
    criteria: [
      { dimension: 'residenceStatus', value: status },
      { dimension: 'residenceRegion', value: 'DE-BY.muenchen' },
    ],
    source: 'munichSkilledWorkers',
    labels: ['munich-up-to-seven-months'],
    facts: [
      {
        key: 'processingTime',
        operator: 'atMost',
        numericValue: 7,
        unit: 'months',
        source: 'munichSkilledWorkers',
        labels: ['munich-up-to-seven-months'],
      },
    ],
    notes: { en: MUNICH_NOTES },
  },
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: READ,
    criteria: [
      { dimension: 'residenceStatus', value: status },
      { dimension: 'residenceRegion', value: 'DE-BE' },
    ],
    source: 'berlinSkilledWorkers',
    labels: ['berlin-online-before-expiry'],
    facts: [
      {
        key: 'cardReadyAfterIssuance',
        operator: 'atMost',
        numericValue: 6,
        unit: 'weeks',
        source: 'berlinSkilledWorkers',
        labels: ['berlin-card-4-to-6-weeks'],
      },
      {
        key: 'onlineConfirmationKeepsTitleValid',
        operator: 'equals',
        textValue: 'until the decision, if submitted before it expires',
        source: 'berlinSkilledWorkers',
        labels: ['berlin-online-before-expiry'],
      },
      {
        key: 'emergencyTravelWithin',
        operator: 'within',
        numericValue: 4,
        unit: 'weeks',
        source: 'berlinAppointments',
        labels: ['berlin-emergency-four-weeks'],
      },
    ],
    notes: { en: BERLIN_NOTES },
  },
]

export const CASE: ResearchCase = {
  document: 'residence-permit',
  // Flat: no rule here is for a group of them. No version names the Schengen visa, so a reader on one can say so
  // and is told nothing about this protection, which neither the law's verified sentence nor Berlin's page gives them.
  statuses: [
    { code: 'de.national-visa', parent: null, names: { en: 'National visa (D visa)', fa: 'ویزای ملی (ویزای D)' } },
    { code: 'de.residence-permit', parent: null, names: { en: 'Residence permit', fa: 'اجازه اقامت' } },
    { code: 'de.schengen-visa', parent: null, names: { en: 'Schengen visa (C visa)', fa: 'ویزای شنگن (ویزای C)' } },
  ],
  obligations: [
    {
      slug: SLUG,
      kind: 'permit',
      titles: {
        en: 'Get a residence permit as a skilled worker with a degree',
        fa: 'دریافت اجازه اقامت به‌عنوان نیروی کار متخصص دارای مدرک دانشگاهی',
      },
    },
  ],
  sources: {
    residenceActApplication: {
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__81.html',
      name: 'Aufenthaltsgesetz (AufenthG), § 81 Beantragung des Aufenthaltstitels',
      read: READ,
    },
    berlinSkilledWorkers: {
      url: 'https://service.berlin.de/dienstleistung/329328/',
      name: 'Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit akademischer Ausbildung beantragen',
      read: READ,
    },
    berlinAppointments: {
      url: 'https://www.berlin.de/einwanderung/termine/termin-vereinbaren/',
      name: 'Landesamt für Einwanderung Berlin, Termin vereinbaren',
      read: READ,
    },
    munichSkilledWorkers: {
      url: 'https://stadt.muenchen.de/service/info/servicestelle-fur-zuwanderung-und-einburgerung/10278359/',
      name: 'Landeshauptstadt München, Aufenthaltserlaubnis – Fachkräfte mit akademischer Ausbildung',
      read: READ,
    },
  },
  versions: ['de.national-visa', 'de.residence-permit'].flatMap(versionsFor),
}
