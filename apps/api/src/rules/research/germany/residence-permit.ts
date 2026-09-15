import type { ResearchCase, ResearchFact, ResearchVersion } from '../rows.js'

// Written from research/agreed/germany/residence-permit.md and nothing else, one file per research case, which the
// country's file composes (SB-232). Its fee waits for its reductions (SB-240). The statute pages were read again for a
// visa-free stay and a Schengen visa (SB-234, SB-241).

const READ = '2026-09-14'

const STATUTES_READ = '2026-09-15'

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

const VISA_FREE_41_NOTES =
  'As a national of Australia, Israel, Japan, Canada, the Republic of Korea, New Zealand or the United States, you can enter Germany visa-free and apply inside Germany for the residence title you need, within 90 days of entry (§41(1) and (3) AufenthV), unless that deadline ends earlier because of expulsion or a time restriction imposed under §12(4) AufenthG. None of this applies to an ICT card. If you apply while your stay is still lawful, your stay counts as permitted until the authority decides (§81(3)); if the application is late, only your deportation is suspended until the decision. The application by itself does not let you work, and a §81(3) Fiktionsbescheinigung does not let you re-enter Germany: leaving may mean you cannot get back in. Once the authority has started issuing your employment permit, the specified work is allowed while the card is being produced, and that permission must be recorded on your certificate (§81(5a)).'

const VISA_FREE_NOTES =
  "Arriving visa-free does not by itself let you get an employment residence permit inside Germany: normally you enter with the visa for that purpose. §41(1) AufenthV lets nationals of Australia, Israel, Japan, Canada, the Republic of Korea, New Zealand and the United States, and British nationals as the Withdrawal Agreement defines them, enter visa-free and apply inside Germany within 90 days of entry, unless that deadline ends earlier because of expulsion or a time restriction imposed under §12(4) AufenthG. Those British nationals are British citizens, British subjects under Part IV of the British Nationality Act 1981 who have the right of abode in the United Kingdom, and British overseas territories citizens whose citizenship comes from a connection with Gibraltar; other kinds of British nationality, such as British National (Overseas), are not among them. §41(2) gives nationals of Andorra, Brazil, El Salvador, Honduras, Monaco and San Marino the same only if they do not intend to work, apart from a few short activities that do not count as employment, so it is not a route to a skilled worker's permit. Otherwise, §39 No. 3 AufenthV may let a national of a state in Annex II of Regulation (EU) 2018/1806 who is lawfully in Germany obtain the skilled-worker residence permit inside Germany, provided the conditions for an entitlement to its issue arose after entry; no official page we opened says how that applies when the job offer was made before entry. Separately, the authority may waive the visa requirement where the conditions of an entitlement are met, and must where the particular circumstances make catching up the visa procedure unreasonable (§5(2) AufenthG). If you apply while your stay is still lawful, your stay counts as permitted until the authority decides (§81(3)); if the application is late, only your deportation is suspended until the decision. The application by itself does not let you work, and a §81(3) Fiktionsbescheinigung does not let you re-enter Germany: leaving may mean you cannot get back in. Once the authority has started issuing your employment permit, the specified work is allowed while the card is being produced, and that permission must be recorded on your certificate (§81(5a))."

const SCHENGEN_NOTES =
  'Applying while you hold a Schengen (C) visa does not keep that visa valid automatically, and §81(3) does not protect your stay either: once the visa expires, the application alone gives you no permission to stay. Whether an authority can order a late application to keep a Schengen visa valid, to avoid undue hardship under §81(4) sentence 3, is not settled by any official source we opened. §39 No. 3 AufenthV may let the holder of a valid short-stay Schengen visa obtain the skilled-worker residence permit inside Germany, provided the conditions for an entitlement to its issue arose after entry; no official page we opened says how that applies when the job offer was made before entry. Separately, the authority may waive the visa requirement where the conditions of an entitlement are met, and must where the particular circumstances make catching up the visa procedure unreasonable (§5(2) AufenthG).'

// What §81(3) gives a visa-free reader who applies, in the same words for a §41(1) national and for anyone else.
const STAY_WHILE_DECIDING: ResearchFact = {
  key: 'stayWhileDeciding',
  operator: 'equals',
  textValue: 'counts as permitted until the decision, if applied for while the stay is still lawful',
  source: 'residenceActApplication',
  labels: ['aufenthg-81-3-lawful-stay'],
}

// A visa-free reader of a nationality §41(1) AufenthV names is told the ninety days and every other visa-free reader
// is not; a Schengen visa holder is told that applying does not keep the visa valid (SB-234, SB-241). No city
// version reaches either, since Berlin's and Munich's statements are for a D visa or a residence permit.
const VISA_FREE_AND_SCHENGEN: ResearchVersion[] = [
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: STATUTES_READ,
    criteria: [
      { dimension: 'residenceStatus', value: 'de.visa-free' },
      { dimension: 'nationalityGroup', value: 'de.aufenthv-41-1' },
    ],
    source: 'residenceOrdinanceStateNationals',
    labels: ['aufenthv-41-ninety-days'],
    facts: [
      {
        key: 'applyInGermanyWithin',
        operator: 'within',
        numericValue: 90,
        unit: 'days',
        textValue: 'of entry, or before the earlier deadline resulting from expulsion or a time restriction under §12(4) AufenthG',
        source: 'residenceOrdinanceStateNationals',
        labels: ['aufenthv-41-ninety-days'],
      },
      STAY_WHILE_DECIDING,
    ],
    notes: { en: VISA_FREE_41_NOTES },
  },
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: STATUTES_READ,
    criteria: [{ dimension: 'residenceStatus', value: 'de.visa-free' }],
    source: 'residenceActApplication',
    labels: ['aufenthg-81-3-lawful-stay'],
    facts: [STAY_WHILE_DECIDING],
    notes: { en: VISA_FREE_NOTES },
  },
  {
    obligation: SLUG,
    document: 'residence-permit',
    validFrom: STATUTES_READ,
    criteria: [{ dimension: 'residenceStatus', value: 'de.schengen-visa' }],
    source: 'residenceActApplication',
    labels: ['aufenthg-81-4-not-a-schengen-visa'],
    facts: [
      {
        key: 'currentTitleWhileDeciding',
        operator: 'equals',
        textValue: 'does not stay valid automatically',
        source: 'residenceActApplication',
        labels: ['aufenthg-81-4-not-a-schengen-visa'],
      },
    ],
    notes: { en: SCHENGEN_NOTES },
  },
]

export const CASE: ResearchCase = {
  document: 'residence-permit',
  // Flat: no rule here is for a group of them.
  statuses: [
    { code: 'de.national-visa', parent: null, names: { en: 'National visa (D visa)', fa: 'ویزای ملی (ویزای D)' } },
    { code: 'de.residence-permit', parent: null, names: { en: 'Residence permit', fa: 'اجازه اقامت' } },
    { code: 'de.schengen-visa', parent: null, names: { en: 'Schengen visa (C visa)', fa: 'ویزای شنگن (ویزای C)' } },
    { code: 'de.visa-free', parent: null, names: { en: 'Visa-free stay', fa: 'اقامت بدون ویزا' } },
  ],
  nationalityGroups: [
    {
      code: 'de.aufenthv-41-1',
      name: 'Nationalities §41(1) AufenthV lets stay visa-free and apply in Germany',
      // The United Kingdom is named there only in the Withdrawal Agreement's sense, which a nationality code cannot tell.
      members: ['au', 'il', 'jp', 'ca', 'kr', 'nz', 'us'].map((nationality) => ({ nationality, from: STATUTES_READ })),
    },
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
      read: STATUTES_READ,
    },
    residenceOrdinanceStateNationals: {
      url: 'https://www.gesetze-im-internet.de/aufenthv/__41.html',
      name: 'Aufenthaltsverordnung (AufenthV), § 41 Vergünstigung für Angehörige bestimmter Staaten',
      read: STATUTES_READ,
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
  versions: [...['de.national-visa', 'de.residence-permit'].flatMap(versionsFor), ...VISA_FREE_AND_SCHENGEN],
}
