import type { ResearchCase, ResearchVersion } from '../rows.js'

// Written from research/agreed/germany/business-registration.md and nothing else, one file per research case, which the
// country's file composes (SB-232). Every version is for a reader starting a business on their own account, a freelance
// practice included (SB-227).

// The day SB-174 read the pages Germany's rule documents cite.
const READ = '2026-09-14'

// The day SB-227 read again the pages whose definitions it extended, and first the ones it added.
const REREAD = '2026-09-15'

const FOUNDER: ResearchVersion['criteria'] = [{ dimension: 'situation', value: 'company-founder' }]

const TRADE_NOTES =
  'This applies only if your activity is a trade under trade law. Calling yourself a freelancer settles neither trade registration nor IHK membership. The tax office and trade office classify your activity separately; the tax classification does not bind the trade office. If unsure, give both authorities your actual services, qualifications and representative projects. Register where the business is established when you start; there is no nationwide grace period. Registration does not complete every separate obligation.'

const BERLIN_NOTES =
  "The fee follows the business's establishment in Berlin, not where you live. Other legal forms and additional representatives can change the charge. The online fee applies where Berlin's online procedure supports your legal form."

const HAMBURG_NOTES =
  "The fee follows the business's establishment in Hamburg, not where you live. Other legal forms and additional representatives can change the charge."

const COLOGNE_NOTES =
  "The fee follows the business's establishment in Cologne, not where you live. Other legal forms and additional representatives can change the charge. The four-week and six-month timings describe possible enforcement measures, not extensions of the registration deadline."

const ACCIDENT_INSURER_NOTES =
  'This also applies to a freelance practice. Notify the responsible statutory accident insurer within one week of opening, unless you have already made a Gewerbeanmeldung: that satisfies this notification obligation.'

const QUESTIONNAIRE_NOTES =
  'Do not wait for the tax office to contact you. Submit the questionnaire electronically, normally through ELSTER, within one month of opening or starting your freelance activity. Gewerbeanmeldung does not replace it. On application, the tax office may allow the prescribed paper form to avoid undue hardship. Your tax number is communicated in writing; we could not verify a processing time.'

const TRADE_TAX_NOTES =
  'This concerns income classified as a trade for tax purposes. The nationwide allowance applies to individuals and partnerships, not turnover. Registering a Gewerbe does not itself determine your tax classification. Reclassification can affect earlier years, but the allowance means it does not automatically produce trade tax to pay.'

const CHAMBER_NOTES =
  "These contributions apply only to a business that is a trade and belongs to the IHK. Calling yourself a freelancer settles neither trade registration nor IHK membership. Membership is normally compulsory; contribution relief does not remove membership. These are profit-based tests, not turnover tests: use Gewerbeertrag, with business profit substituted only where no Gewerbesteuermessbetrag is assessed. Founder relief requires all the listed conditions and applies for the listed years. Check the chamber's annual rules: it may lower the exemption thresholds under the statutory condition."

const VAT_NOTES =
  'This covers qualifying domestic supplies by a business established in Germany, including a freelance practice. Use the relevant turnover for this rule, not profit. The limits are nationwide; the opening-year limit uses actual relevant turnover for that calendar year. Once it is crossed, the whole crossing transaction loses this exemption; ordinary VAT rules, including any other exemption, apply. The exemption applies automatically unless waived. Waiving it binds you for at least five calendar years; using it does not.'

const TITLE_NOTES =
  'The same federal permission rule applies to both documents. Check the work conditions before starting, including freelance work. If you are being granted or already hold an Aufenthaltserlaubnis for another purpose, §21(6) may allow self-employment while keeping that purpose. This is not an entitlement; other required professional or business permissions must have been granted or their grant promised. We could not verify that the trade office will refuse registration without the immigration permission.'

// The same rule for each residence title the research covers. A Schengen visa is a title too, and a visa-free stay is
// none, but what either allows was not researched (SB-253).
const onTitle = (status: string): ResearchVersion => ({
  obligation: 'check-your-title-allows-self-employment',
  document: 'business-registration',
  validFrom: REREAD,
  criteria: [...FOUNDER, { dimension: 'residenceStatus', value: status }],
  source: 'residenceActTitles',
  labels: ['aufenthg-4-1-titles'],
  facts: [
    {
      key: 'selfEmploymentCountsAsWork',
      operator: 'equals',
      textValue: 'self-employment counts as work (Erwerbstätigkeit) under the Residence Act',
      source: 'residenceActDefinitions',
      labels: ['aufenthg-2-2-gainful-activity'],
    },
    {
      key: 'workOnYourResidenceTitle',
      operator: 'equals',
      textValue:
        "Your residence title generally allows work unless the law prohibits or restricts it. Check the document's work conditions before starting. You need permission for activity beyond a prohibition or restriction. A title issued for a particular job does not allow other work unless and to the extent the competent authority permits it.",
      source: 'residenceActAccessToWork',
      labels: ['aufenthg-4a-1-title-permits-work', 'aufenthg-4a-3-title-shows-restrictions'],
    },
  ],
  notes: { en: TITLE_NOTES },
})

export const CASE: ResearchCase = {
  document: 'business-registration',
  obligations: [
    {
      slug: 'register-a-trade',
      kind: 'registration',
      titles: { en: 'Register a trade', fa: 'ثبت فعالیت تجاری (Gewerbeanmeldung)' },
    },
    {
      slug: 'notify-the-accident-insurer',
      kind: 'registration',
      titles: { en: 'Notify the statutory accident insurer', fa: 'اعلام به بیمه حوادث قانونی' },
    },
    {
      slug: 'send-the-tax-registration-questionnaire',
      kind: 'tax',
      titles: { en: 'Send the tax registration questionnaire', fa: 'ارسال پرسشنامه ثبت مالیاتی' },
    },
    {
      slug: 'pay-trade-tax',
      kind: 'tax',
      titles: { en: 'Pay trade tax', fa: 'پرداخت مالیات تجاری (Gewerbesteuer)' },
    },
    {
      slug: 'pay-chamber-of-commerce-contributions',
      kind: 'fee',
      titles: { en: 'Pay chamber of commerce contributions', fa: 'پرداخت حق عضویت اتاق بازرگانی' },
    },
    {
      slug: 'use-the-vat-small-business-rule',
      kind: 'tax',
      titles: { en: 'Use the VAT small business rule', fa: 'استفاده از قاعده کسب‌وکار کوچک در مالیات بر ارزش افزوده' },
    },
    {
      slug: 'check-your-title-allows-self-employment',
      kind: 'permit',
      titles: { en: 'Check your residence title allows self-employment', fa: 'بررسی اجازه خوداشتغالی در اجازه اقامت' },
    },
  ],
  sources: {
    tradeCodeNotification: {
      url: 'https://www.gesetze-im-internet.de/gewo/__14.html',
      name: 'Gewerbeordnung (GewO), § 14 Anzeigepflicht; Verordnungsermächtigung',
      read: READ,
    },
    tradeCodeFines: {
      url: 'https://www.gesetze-im-internet.de/gewo/__146.html',
      name: 'Gewerbeordnung (GewO), § 146 Verletzung sonstiger Vorschriften über die Ausübung eines Gewerbes',
      read: READ,
    },
    berlinTradeRegistration: {
      url: 'https://service.berlin.de/dienstleistung/121921/',
      name: 'Service Berlin, Gewerbe anmelden',
      read: READ,
    },
    hamburgTradeRegistration: {
      url: 'https://www.handelskammer-hamburg.de/gruendung-sicherung-nachfolge/gewerbe-an-um-melden/gewerbeanmeldung-6598040',
      name: 'Handelskammer Hamburg, Gewerbeanmeldung, -ummeldung und -abmeldung',
      read: READ,
    },
    koelnTradeRegistration: {
      url: 'https://www.stadt-koeln.de/service/produkte/00554/index.html',
      name: 'Stadt Köln, An-, Ab- und Ummeldung eines Gewerbebetriebes',
      read: READ,
    },
    accidentInsuranceRegistration: {
      url: 'https://www.dguv.de/de/versicherung/unternehmensnummer/anmeldung/index.jsp',
      name: 'Deutsche Gesetzliche Unfallversicherung (DGUV), Ein neues Unternehmen anmelden',
      read: REREAD,
    },
    taxCodeNotification: {
      url: 'https://www.gesetze-im-internet.de/ao_1977/__138.html',
      name: 'Abgabenordnung (AO), § 138 Anzeigen über die Erwerbstätigkeit',
      read: REREAD,
    },
    tradeTaxAllowance: {
      url: 'https://www.gesetze-im-internet.de/gewstg/__11.html',
      name: 'Gewerbesteuergesetz (GewStG), § 11 Steuermesszahl und Steuermessbetrag',
      read: READ,
    },
    chamberContributions: {
      url: 'https://www.gesetze-im-internet.de/ihkg/__3.html',
      name: 'Gesetz zur vorläufigen Regelung des Rechts der Industrie- und Handelskammern (IHKG), § 3',
      read: REREAD,
    },
    vatSmallBusinesses: {
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__19.html',
      name: 'Umsatzsteuergesetz (UStG), § 19 Besteuerung der Kleinunternehmer',
      read: REREAD,
    },
    financeMinistrySmallBusinesses: {
      url: 'https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-03-18-sonderregelung-kleinunternehmer.pdf?__blob=publicationFile&v=4',
      name: 'Bundesministerium der Finanzen, Schreiben vom 18. März 2025, Sonderregelung für Kleinunternehmer',
      read: READ,
    },
    residenceActDefinitions: {
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__2.html',
      name: 'Aufenthaltsgesetz (AufenthG), § 2 Begriffsbestimmungen',
      read: REREAD,
    },
    residenceActTitles: {
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__4.html',
      name: 'Aufenthaltsgesetz (AufenthG), § 4 Erfordernis eines Aufenthaltstitels',
      read: REREAD,
    },
    residenceActAccessToWork: {
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__4a.html',
      name: 'Aufenthaltsgesetz (AufenthG), § 4a Zugang zur Erwerbstätigkeit',
      read: REREAD,
    },
  },
  versions: [
    // The trade office's duty everywhere, and a sole trade's fee where the business has its establishment in a place whose
    // own page states it (SB-227).
    {
      obligation: 'register-a-trade',
      document: 'business-registration',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'tradeCodeNotification',
      labels: ['gewo-14-at-the-same-time'],
      facts: [
        {
          key: 'notifyTradeOfficeWhen',
          operator: 'equals',
          textValue: 'at the same time as you start the business',
          source: 'tradeCodeNotification',
          labels: ['gewo-14-at-the-same-time'],
        },
        {
          key: 'lateOrMissingTradeNotificationFine',
          operator: 'atMost',
          numericValue: 1000,
          currency: 'EUR',
          source: 'tradeCodeFines',
          labels: ['gewo-146-late-notification-fine'],
        },
      ],
      notes: { en: TRADE_NOTES },
    },
    {
      obligation: 'register-a-trade',
      document: 'business-registration',
      validFrom: READ,
      criteria: [...FOUNDER, { dimension: 'workRegion', value: 'DE-BE' }],
      source: 'berlinTradeRegistration',
      labels: ['berlin-trade-registration-26'],
      facts: [
        {
          key: 'soleTradeRegistrationFee',
          operator: 'equals',
          numericValue: 26,
          currency: 'EUR',
          textValue: 'for each sole trade, or each partner of a partnership; other legal forms can cost differently',
          source: 'berlinTradeRegistration',
          labels: ['berlin-trade-registration-26'],
        },
        {
          key: 'onlineTradeRegistrationFee',
          operator: 'equals',
          numericValue: 15,
          currency: 'EUR',
          textValue: "where Berlin's online procedure is available for the legal form",
          source: 'berlinTradeRegistration',
          labels: ['berlin-trade-registration-online-15'],
        },
      ],
      notes: { en: BERLIN_NOTES },
    },
    {
      obligation: 'register-a-trade',
      document: 'business-registration',
      validFrom: READ,
      criteria: [...FOUNDER, { dimension: 'workRegion', value: 'DE-HH' }],
      source: 'hamburgTradeRegistration',
      labels: ['handelskammer-hh-registration-25'],
      facts: [
        {
          key: 'soleTradeRegistrationFee',
          operator: 'equals',
          numericValue: 25,
          currency: 'EUR',
          source: 'hamburgTradeRegistration',
          labels: ['handelskammer-hh-registration-25'],
        },
      ],
      notes: { en: HAMBURG_NOTES },
    },
    {
      obligation: 'register-a-trade',
      document: 'business-registration',
      validFrom: READ,
      criteria: [...FOUNDER, { dimension: 'workRegion', value: 'DE-NW.koeln' }],
      source: 'koelnTradeRegistration',
      labels: ['koeln-trade-registration-26'],
      facts: [
        {
          key: 'soleTradeRegistrationFee',
          operator: 'equals',
          numericValue: 26,
          currency: 'EUR',
          textValue: 'for a natural person',
          source: 'koelnTradeRegistration',
          labels: ['koeln-trade-registration-26'],
        },
        {
          key: 'warningFineCanBeChargedAfter',
          operator: 'equals',
          numericValue: 4,
          unit: 'weeks',
          textValue: 'once the business started more than four weeks ago',
          source: 'koelnTradeRegistration',
          labels: ['koeln-warning-fine-four-weeks'],
        },
        {
          key: 'fineProceedingsCanStartAfter',
          operator: 'equals',
          numericValue: 6,
          unit: 'months',
          textValue: 'once the business started more than six months ago',
          source: 'koelnTradeRegistration',
          labels: ['koeln-fine-proceedings-six-months'],
        },
      ],
      notes: { en: COLOGNE_NOTES },
    },
    {
      obligation: 'notify-the-accident-insurer',
      document: 'business-registration',
      validFrom: REREAD,
      criteria: FOUNDER,
      source: 'accidentInsuranceRegistration',
      labels: ['dguv-one-week'],
      facts: [
        {
          key: 'notifyAccidentInsurerWithin',
          operator: 'within',
          numericValue: 1,
          unit: 'weeks',
          textValue: 'of opening the business; a trade registration already counts as this notification',
          source: 'accidentInsuranceRegistration',
          labels: ['dguv-one-week'],
        },
      ],
      notes: { en: ACCIDENT_INSURER_NOTES },
    },
    {
      obligation: 'send-the-tax-registration-questionnaire',
      document: 'business-registration',
      validFrom: REREAD,
      criteria: FOUNDER,
      source: 'taxCodeNotification',
      labels: ['ao-138-one-month'],
      facts: [
        {
          key: 'sendTaxQuestionnaireWithin',
          operator: 'within',
          numericValue: 1,
          unit: 'months',
          textValue:
            'of opening the business or taking up a freelance activity, electronically, unless the tax office agrees to a paper form to avoid undue hardship',
          source: 'taxCodeNotification',
          labels: ['ao-138-one-month'],
        },
      ],
      notes: { en: QUESTIONNAIRE_NOTES },
    },
    {
      obligation: 'pay-trade-tax',
      document: 'business-registration',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'tradeTaxAllowance',
      labels: ['gewstg-11-allowance'],
      facts: [
        {
          key: 'tradeIncomeAllowance',
          operator: 'equals',
          numericValue: 24500,
          currency: 'EUR',
          textValue: 'for individuals and partnerships',
          source: 'tradeTaxAllowance',
          labels: ['gewstg-11-allowance'],
        },
      ],
      notes: { en: TRADE_TAX_NOTES },
    },
    {
      obligation: 'pay-chamber-of-commerce-contributions',
      document: 'business-registration',
      validFrom: REREAD,
      criteria: FOUNDER,
      source: 'chamberContributions',
      labels: ['ihkg-3-exempt-up-to-5200'],
      facts: [
        {
          key: 'contributionExemptionThreshold',
          operator: 'equals',
          numericValue: 5200,
          currency: 'EUR',
          textValue:
            'no contribution while Gewerbeertrag, or business profit under income-tax law where no Gewerbesteuermessbetrag is assessed for the year, does not exceed it, for an individual or partnership outside the commercial register; the chamber can lower it',
          source: 'chamberContributions',
          labels: ['ihkg-3-exempt-up-to-5200', 'ihkg-3-thresholds-can-be-lowered'],
        },
        {
          key: 'founderReliefThreshold',
          operator: 'equals',
          numericValue: 25000,
          currency: 'EUR',
          textValue:
            'no basic contribution and no levy in the opening year and the year after, and no levy in years three and four, while Gewerbeertrag or business profit does not exceed it, for an individual outside the commercial register who had no income from agriculture or forestry, a trade or self-employment in the five financial years before opening and no direct or indirect holding of more than one tenth in a corporation in that period; the chamber can lower it',
          source: 'chamberContributions',
          labels: ['ihkg-3-founder-relief', 'ihkg-3-five-years', 'ihkg-3-more-than-one-tenth', 'ihkg-3-thresholds-can-be-lowered'],
        },
        {
          key: 'levyBaseAllowance',
          operator: 'equals',
          numericValue: 15340,
          currency: 'EUR',
          textValue: 'deducted from the levy base for individuals and partnerships',
          source: 'chamberContributions',
          labels: ['ihkg-3-levy-allowance'],
        },
      ],
      notes: { en: CHAMBER_NOTES },
    },
    {
      obligation: 'use-the-vat-small-business-rule',
      document: 'business-registration',
      validFrom: REREAD,
      criteria: FOUNDER,
      source: 'vatSmallBusinesses',
      labels: ['ustg-19-thresholds'],
      facts: [
        {
          key: 'previousYearTurnoverThreshold',
          operator: 'equals',
          numericValue: 25000,
          currency: 'EUR',
          textValue:
            'of relevant turnover under §19(2) in the previous calendar year, for a business established in Germany that has not waived the exemption',
          source: 'vatSmallBusinesses',
          labels: ['ustg-19-thresholds', 'ustg-19-waiver-five-years'],
        },
        {
          key: 'currentYearTurnoverThreshold',
          operator: 'equals',
          numericValue: 100000,
          currency: 'EUR',
          textValue:
            'of relevant turnover under §19(2) in the current calendar year, for a business established in Germany that has not waived the exemption',
          source: 'vatSmallBusinesses',
          labels: ['ustg-19-thresholds', 'ustg-19-waiver-five-years'],
        },
        {
          key: 'firstYearTurnoverThreshold',
          operator: 'equals',
          numericValue: 25000,
          currency: 'EUR',
          textValue: 'of actual relevant turnover in the calendar year the business starts',
          source: 'financeMinistrySmallBusinesses',
          labels: ['bmf-first-year-ceiling'],
        },
        {
          key: 'exemptionLostFrom',
          operator: 'equals',
          textValue: 'the whole transaction that crosses the ceiling, not only the excess',
          source: 'financeMinistrySmallBusinesses',
          labels: ['bmf-exemption-lost-in-full'],
        },
        {
          key: 'waiverBindsFor',
          operator: 'atLeast',
          numericValue: 5,
          unit: 'calendar years',
          source: 'vatSmallBusinesses',
          labels: ['ustg-19-waiver-five-years'],
        },
      ],
      notes: { en: VAT_NOTES },
    },
    onTitle('de.residence-permit'),
    onTitle('de.national-visa'),
  ],
}
