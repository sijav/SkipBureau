import type { ResearchCase, ResearchVersion } from '../rows.js'

// Written from research/agreed/turkey/address-registration.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-14'

// The 2026 fines every status's address duty carries, national (SB-191).
const ADDRESS_FINES: ResearchVersion['facts'] = [
  {
    key: 'lateAddressNotificationFine',
    operator: 'equals',
    numericValue: 814,
    currency: 'TRY',
    source: 'addressServices',
    labels: ['nvi-fines-2026'],
  },
  {
    key: 'falseAddressDeclarationFine',
    operator: 'equals',
    numericValue: 17051,
    currency: 'TRY',
    source: 'addressServices',
    labels: ['nvi-fines-2026'],
  },
]

const ADDRESS_CHANGE_PERIOD =
  'The notification period for a change of address is 20 working days, but we could not verify an explicit starting event for foreigners from a current official source.'

const ADDRESS_FINES_NOTE = 'The fines are national figures at 2026 rates, usually revised each January.'

// One status's duty to report its address: the national version, its 20 working
// days from the provision for that status, and Bursa's, which states only what
// Bursa's migration directorate's notice sets and inherits the rest. The notice
// names no status, so every status has one, conditioned on registering there.
const addressDuty = (status: string, provision: { source: string; label: string }, notes: string): ResearchVersion[] => [
  {
    obligation: 'report-your-address',
    document: 'address-registration',
    validFrom: READ,
    criteria: [{ dimension: 'residenceStatus', value: status }],
    source: provision.source,
    labels: [provision.label],
    facts: [
      {
        key: 'reportAddressChangeWithin',
        operator: 'within',
        numericValue: 20,
        unit: 'working days',
        source: provision.source,
        labels: [provision.label],
      },
      ...ADDRESS_FINES,
    ],
    notes: { en: notes },
  },
  {
    obligation: 'report-your-address',
    document: 'address-registration',
    validFrom: READ,
    criteria: [
      { dimension: 'residenceStatus', value: status },
      { dimension: 'residenceRegion', value: 'TR-16' },
    ],
    source: 'bursaAddressRegistration',
    labels: ['bursa-appointment-2026'],
    facts: [
      {
        key: 'appointmentBookedThrough',
        operator: 'equals',
        textValue: 'randevu.goc.gov.tr',
        source: 'bursaAddressRegistration',
        labels: ['bursa-appointment-2026'],
      },
      {
        key: 'uetsAccountRequired',
        operator: 'equals',
        textValue: 'yes',
        source: 'bursaAddressRegistration',
        labels: ['bursa-appointment-2026'],
      },
    ],
    notes: {
      en: "Where you register your address at Bursa's provincial migration directorate: from 1 June 2026 it carries out address registration by appointment through randevu.goc.gov.tr, and lists a UETS account among the documents. We could not verify a national UETS requirement for address registration.",
    },
  },
]

export const CASE: ResearchCase = {
  document: 'address-registration',
  statuses: [
    {
      code: 'tr.international-protection',
      parent: null,
      names: {
        en: 'International protection, applied for or granted',
        fa: 'حمایت بین‌المللی، درخواست‌شده یا اعطاشده',
      },
    },
    {
      code: 'tr.temporary-protection',
      parent: null,
      names: { en: 'Temporary protection', fa: 'حمایت موقت' },
    },
  ],
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
    foreignersRegulationArticle23: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
      name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 23',
      read: READ,
    },
    addressServices: {
      url: 'https://www.nvi.gov.tr/adres-hizmetleri',
      name: 'Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü, Adres Hizmetleri',
      read: READ,
    },
    bursaAddressRegistration: {
      url: 'https://bursa.goc.gov.tr/adreskayit',
      name: 'Bursa İl Göç İdaresi Müdürlüğü, Adres Kayıt İşlemleri Hk.',
      read: READ,
    },
    foreignersRegulationArticle110: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
      name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 110',
      read: READ,
    },
    temporaryProtectionRegulation: {
      url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20146883&MevzuatTur=21&MevzuatTertip=5',
      name: 'Geçici Koruma Yönetmeliği, Madde 33',
      read: READ,
    },
  },
  versions: [
    ...addressDuty(
      'tr.residence-permit',
      {
        source: 'foreignersRegulationArticle23',
        label: 'yukk-reg-23-2-twenty-working-days',
      },
      `For a residence permit holder. ${ADDRESS_CHANGE_PERIOD} Do not assume that giving your address in e-İkamet completes address registration. The population directorate's FAQ says you report to the population directorate or the provincial migration directorate, and the Migration Presidency's page reads as though you file with both: ask at whichever you go to first whether you also need the other. ${ADDRESS_FINES_NOTE}`,
    ),
    ...addressDuty(
      'tr.international-protection',
      {
        source: 'foreignersRegulationArticle110',
        label: 'yukk-reg-110-3-twenty-working-days',
      },
      `For an international protection applicant or status holder. ${ADDRESS_CHANGE_PERIOD} ${ADDRESS_FINES_NOTE}`,
    ),
    ...addressDuty(
      'tr.temporary-protection',
      {
        source: 'temporaryProtectionRegulation',
        label: 'gk-reg-33-2-d-twenty-working-days',
      },
      `For a temporary protection beneficiary. ${ADDRESS_CHANGE_PERIOD} ${ADDRESS_FINES_NOTE}`,
    ),
  ],
}
