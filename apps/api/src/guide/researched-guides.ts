import type { Prisma, PrismaClient } from '../generated/prisma/client.js'
import type { GuideDetailSeed } from '../sample-types.js'
import { TASKS } from '../tasks.js'
import { ADDRESS_GUIDE, GERMANY_RESIDENCE_PERMIT, TURKEY_SHORT_TERM_RESIDENCE_PERMIT } from './obligation-groups.js'

// Guides written from the agreed research, not sample content (SB-258): each section is one of its document's paragraphs
// under the bold lead that opens it, whole sentences in the document's order with only footnote markers, bold and list
// markers taken out, and nothing the template would give emphasis the document does not, no quick answer, cost strip,
// steps, note or callout. The description is the first sentence of the first section, which starts after it.
// test/researched-guides.spec.ts holds every text to its document.

export type ResearchedGuide = {
  country: string
  /** The global goal the area hangs on, from src/tasks.ts. */
  task: string
  /** The area of that goal in this country, titled as the research file titles the obligation. */
  area: { slug: string; en: string; fa: string }
  guide: { slug: string; verifiedAt: string; en: { title: string; description: string } }
  detail: GuideDetailSeed
  /** The duties it explains, each a group of alternatives, most preferred first. */
  obligations: readonly (readonly string[])[]
}

export const RESEARCHED_GUIDES: readonly ResearchedGuide[] = [
  // Written from research/agreed/turkey/short-term-residence-permit.md.
  {
    country: 'tr',
    task: 'get-a-residence-permit',
    area: { slug: 'short-term-residence-permit', en: 'Get a short-term residence permit', fa: 'دریافت اجازه اقامت کوتاه‌مدت' },
    guide: {
      slug: 'short-term-residence-permit',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Getting a short-term residence permit in Turkey',
        description: 'Apply online through e-İkamet while your visa or visa-exempt stay is still valid.',
      },
    },
    detail: {
      slug: 'short-term-residence-permit',
      sections: [
        {
          kind: 'howToDoIt',
          title: { en: 'When to apply.' },
          body: {
            en: 'The deadline is the end of your own permitted stay, not ninety days after you arrive. Under a visa or visa exemption the ceiling is ninety days in any hundred and eighty, and a shorter allowance applies if your visa gives you fewer. Getting a new passport does not restart the allowance.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'If your stay runs out while you wait.' },
          body: {
            en: 'The completed application form covers you until your appointment, even if your previous lawful stay ends first. Missing the appointment can leave a first applicant treated as an overstayer. After you submit, the provincial directorate issues a residence permit application document (*İkamet İzni Müracaat Belgesi*). The implementing regulation, Article 21(9)(ç), says that document gives you the right to stay until your application is decided. An older application guide instead describes ninety days. We have not verified what happens when a printed validity runs out during a longer wait.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'Leaving and coming back while you wait.' },
          body: {
            en: 'With the directorate-approved application document, your passport, and evidence you paid the fee unless you are recorded as exempt, you may travel within the requested permit period and return without a visa if you return within fifteen days of each departure. Beyond fifteen days, ordinary visa rules apply. The appointment form on its own is not the document that does this.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'What it costs.' },
          body: {
            en: "Two separate charges, and sometimes a third. The card costs 964 lira in 2026; the fee page lists no nationality-based exemption. The permit charge depends on your nationality. Turkey sets it on a reciprocity basis under Law 492, Schedule 6, section III, and the Migration Presidency publishes the country groups as an image. Most countries are in a main group of 158 at twenty-five US dollars for the first month and five for each month after; four smaller groups pay fourteen, nine, seven and five dollars for the first month (and 3.5, 2.5, 1.5 and 0.5 after). For an adult in the main group, without an applicable exemption or reduction, the twelve-month permit charge is eighty US dollars, collected as its lira equivalent. Countries outside every group, which the fee page names as Serbia, Fiji, Norway and the Northern Mariana Islands, pay the lira tariff instead. Citizens of Czechia, Denmark, Ireland, Kosovo, Nepal, Sri Lanka, Syria, Turkmenistan, Northern Cyprus and Palestine pay no permit charge, though they still pay for the card. If you entered visa-free you may also owe a single-entry visa fee. A 2014 Revenue Administration letter specifies conversion at the central bank effective selling rate on the permit document's issue date. We have not verified how today's e-İkamet assessment implements that instruction. We have not established the image's publication date.",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'Proving you have health cover.' },
          body: {
            en: 'Any one of these, and the institutional documents must all carry the prescribed signature or e-signature and stamp or seal: the provincial social security certificate confirming healthcare entitlement under a bilateral agreement; an SGK provision document; an SGK general health insurance application certificate; or a private policy meeting the official minimum coverage requirements (the SEDDK standard). It must cover the period you are asking for. Applicants under eighteen and over sixty-five are exempt from obtaining health insurance for the application; official guidance says existing valid cover must still be submitted.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'Proving your address.' },
          body: {
            en: "A lease is not the only accepted way to prove your accommodation. The checklist accepts a notarised copy of your rental agreement with the landlord's details; or, if you are staying in someone's home, a notarised undertaking from them, and from their spouse if married, with a recent electricity, water, gas or landline-telephone bill, or the corresponding subscription agreement for a new subscriber, in that person's name; or a signed or e-signed and stamped or sealed dormitory document confirming your stay; or, in a hotel, proof of the stay with a receipt covering the requested period; or, if you own the home, the title deed and a house-numbering document.",
          },
        },
        {
          kind: 'beforeYouStart',
          title: { en: 'Istanbul, and this is the part we cannot answer.' },
          body: {
            en: 'Official notices closed certain Istanbul districts to first applications: Esenyurt and Fatih from January 2021, with exceptions for investment-based short-term permits, for property-based short-term permits where the property is in Esenyurt, and for student residence permits for students registered at universities in the respective district; ten districts from October 2022, restated in July 2023. We could not verify whether any of that is in force today, and we found no maintained official list of what is closed now, which is not the same as knowing none exists. We also could not verify what happens to an application made at such an address today. Ask the Istanbul provincial directorate or YİMER 157 before you commit to a lease.',
          },
        },
      ],
      sources: [
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6458.pdf', name: 'Yabancılar ve Uluslararası Koruma Kanunu (6458), Madde 11' },
        { url: 'https://www.mfa.gov.tr/vize-genel-bilgileri.tr.mfa', name: 'Dışişleri Bakanlığı, Vize Genel Bilgileri' },
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
          name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 21',
        },
        {
          url: 'https://e-ikamet.goc.gov.tr/Ikamet/IstenenBelgeler/BasvuruFormuBelgelerIliskinAciklamalar',
          name: 'e-İkamet, Başvuru Belgelerine İlişkin Açıklamalar',
        },
        {
          url: 'https://ms.hmb.gov.tr/uploads/sites/3/2025/12/2026-Degerli-Kagitlar-Tebligi-a3f95f2236d8ad45.pdf',
          name: 'Muhasebat Genel Müdürlüğü Genel Tebliği (Sıra No: 97) Değerli Kağıtlar',
        },
        { url: 'https://www.goc.gov.tr/belge-bedeli-ve-harc-miktari', name: 'Göç İdaresi Başkanlığı, Belge Bedeli ve Harç Miktarı' },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf', name: '492 sayılı Harçlar Kanunu' },
        {
          url: 'https://www.goc.gov.tr/kurumlar/goc.gov.tr/Kanunlar/u%CC%88lkelere_go%CC%88re_harc_miktarlari.png',
          name: 'Göç İdaresi Başkanlığı, Ülkelere göre harç miktarları',
        },
        {
          url: 'https://e-ikamet.goc.gov.tr/Ikamet/BasvuruIstenenBelgeler/BasvuruFormuIstenenBelgeler?tur=0',
          name: 'e-İkamet, Kısa Dönem İkamet İzni Başvurularında İstenen Belgeler',
        },
        { url: 'https://www.goc.gov.tr/ikamet-genel-bilgiler', name: 'Göç İdaresi Başkanlığı, İkamet Genel Bilgiler' },
        {
          url: 'https://istanbul.goc.gov.tr/ikamet-izni-talepleri-hakkinda',
          name: 'İstanbul İl Göç İdaresi Müdürlüğü, İkamet İzni Talepleri Hakkında',
        },
        {
          url: 'https://www.goc.gov.tr/istanbulda-39-ilcenin-yabancilarin-ikamet-izinlerine-kapatildigi-iddialarina-iliskin-basin-aciklamasi',
          name: 'Göç İdaresi Başkanlığı, “İstanbul’da 39 İlçenin Yabancıların İkamet İzinlerine Kapatıldığı” İddialarına İlişkin Basın Açıklaması',
        },
        {
          url: 'https://istanbul.goc.gov.tr/istanbul-ilinde-bulunan-yabancilar-hakkinda-basin-aciklamasi-01112022',
          name: 'İstanbul İl Göç İdaresi Müdürlüğü, İstanbul İlinde Bulunan Yabancılar Hakkında Basın Açıklaması (01.11.2022)',
        },
      ],
    },
    obligations: TURKEY_SHORT_TERM_RESIDENCE_PERMIT,
  },
  // Written from research/agreed/germany/residence-permit.md.
  {
    country: 'de',
    task: 'get-a-residence-permit',
    area: {
      slug: 'residence-permit',
      en: 'Get a residence permit as a skilled worker with a degree',
      fa: 'دریافت اجازه اقامت به‌عنوان نیروی کار متخصص دارای مدرک دانشگاهی',
    },
    guide: {
      slug: 'residence-permit',
      verifiedAt: '2026-09-15',
      en: {
        title: 'Getting a residence permit in Germany',
        description:
          "The Ausländerbehörde where you live decides your application and issues the permit: in Berlin the Landesamt für Einwanderung, in Munich the city's Servicestelle für Zuwanderung und Einbürgerung.",
      },
    },
    detail: {
      slug: 'residence-permit',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'Who decides.' },
          body: { en: 'The employment agency may have to consent to your job, but it does not issue the permit.' },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'What it costs, and this one is federal.' },
          body: {
            en: 'A first residence permit for employment, issued as an electronic card, costs €100, whether it runs for a year or longer. It is set in the federal Aufenthaltsverordnung §45(1), not by your city. If you see €56 quoted in Berlin, that is the federal reduction for the exceptional sticker format under §78a, not a Berlin price. Exemptions and reductions exist.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'What happens while you wait, and this is the part to read twice.' },
          body: {
            en: "Applying before your national D visa or residence permit expires normally preserves that title under §81(4); applying during a lawful visa-free stay without a residence title makes your stay count as permitted until the authority decides, if you apply while your stay is still lawful (§81(3)); if the application is late, only your deportation is suspended until the decision. For a national §41(1) names, the application deadline is within 90 days of entry, unless it ends earlier because of expulsion or a time restriction imposed under §12(4) AufenthG. Applying while you hold a Schengen (C) visa does not keep that visa valid automatically, and §81(3) does not protect your stay either: once the visa expires, the application alone gives you no permission to stay. Whether an authority can order a late application to keep a Schengen visa valid, to avoid undue hardship under §81(4) sentence 3, is not settled by any official source we opened. These rules apply nationwide. Applying does not automatically let you work, and it does not automatically let you travel. Under §81(4), your existing permission to work continues with the restrictions it already had, and applying does not let you switch to a different job. With a valid §81(4) Fiktionsbescheinigung and a valid passport, you can travel and come back. Under §81(3), the application by itself does not let you work, and an §81(3) Fiktionsbescheinigung does not let you re-enter Germany. Leaving may mean you cannot get back in. Two more things about working. Under §81(5a), once the authority has started issuing your employment permit, the specified work is allowed while the card is being produced, and that permission must be recorded on your certificate. And arriving visa-free does not by itself let you get an employment residence permit inside Germany: normally you enter with the visa for that purpose. §41(1) AufenthV lets nationals of Australia, Israel, Japan, Canada, the Republic of Korea, New Zealand and the United States, and British nationals as the Withdrawal Agreement defines them, enter visa-free and apply inside Germany for the residence title they need, within 90 days of entry; that deadline ends earlier if you are expelled or your stay is limited in time. §41(2) gives nationals of Andorra, Brazil, El Salvador, Honduras, Monaco and San Marino the same only if they do not intend to work, apart from a few short activities that do not count as employment, so it is not a route to a skilled worker's permit. Neither applies to an ICT card. Otherwise, §39 No. 3 AufenthV may let a national of a state in Annex II of Regulation (EU) 2018/1806 who is lawfully in Germany, or the holder of a valid short-stay Schengen visa, obtain the skilled-worker residence permit inside Germany, provided the conditions for an entitlement to its issue arose after entry; no official page we opened says how that applies when the job offer was made before entry. Separately, the authority may waive the visa requirement where the conditions of an entitlement are met, and must where the particular circumstances make catching up the visa procedure unreasonable (§5(2) sentence 2 AufenthG). The Withdrawal Agreement's British nationals are British citizens, British subjects under Part IV of the British Nationality Act 1981 who have the right of abode in the United Kingdom, and British overseas territories citizens whose citizenship comes from a connection with Gibraltar. Other kinds of British nationality, such as British National (Overseas), are not among them.",
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'If you cannot get an appointment.' },
          body: {
            en: "This is real and officially acknowledged: Berlin says some departments have nothing available for months. In Berlin, submit the employment-permit application through the dedicated online application before your current permission expires; you do not need to wait for an appointment. For additional help in a documented emergency, use the responsible department's contact form. Berlin assesses emergency requests for urgent travel within the next four weeks evidenced by a booking, or threatened job loss or benefit termination because of missing valid documentation, evidenced by an employer's or Jobcenter/Sozialamt's letter. If it accepts the emergency, it can send a Fiktionsbescheinigung or offer a prompt appointment.",
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'The mistake to avoid.' },
          body: {
            en: 'Believing that applying settles all three questions at once. Staying, working and travelling are separate. Existing work permission continues under §81(4); new work permission under §81(5a) arises when issuance of the qualifying title is initiated and must be recorded on the certificate. Re-entry requires the appropriate valid travel documents. An application receipt is not the same document as a Fiktionsbescheinigung that is valid for travel.',
          },
        },
      ],
      sources: [
        {
          url: 'https://www.gesetze-im-internet.de/aufenthv/__45.html',
          name: 'Aufenthaltsverordnung (AufenthV), § 45 Gebühren für die Aufenthaltserlaubnis, die Blaue Karte EU, die ICT-Karte und die Mobiler-ICT-Karte',
        },
        {
          url: 'https://service.berlin.de/dienstleistung/329328/',
          name: 'Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit akademischer Ausbildung beantragen',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthv/__45b.html',
          name: 'Aufenthaltsverordnung (AufenthV), § 45b Gebühren für Aufenthaltstitel in Ausnahmefällen',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__81.html',
          name: 'Aufenthaltsgesetz (AufenthG), § 81 Beantragung des Aufenthaltstitels',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthv/__41.html',
          name: 'Aufenthaltsverordnung (AufenthV), § 41 Vergünstigung für Angehörige bestimmter Staaten',
        },
        {
          url: 'https://www.berlin.de/einwanderung/termine/termin-vereinbaren/',
          name: 'Landesamt für Einwanderung Berlin, Termin vereinbaren',
        },
      ],
    },
    obligations: GERMANY_RESIDENCE_PERMIT,
  },
  // Written from research/agreed/turkey/address-registration.md, in the sample address guide's own row (SB-281).
  {
    country: 'tr',
    task: 'getting-settled',
    area: { slug: 'register-your-address', en: 'Report your address and any change to it', fa: 'اعلام نشانی محل سکونت و هر تغییر آن' },
    guide: {
      slug: 'register-your-address',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Telling Turkey where you live',
        description:
          'Residence-permit holders, international-protection applicants and status holders, and temporary-protection beneficiaries must report address changes within 20 working days.',
      },
    },
    detail: {
      slug: 'register-your-address',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'Who this applies to.' },
          body: {
            en: 'An initial address-registration duty for work-permit holders is verified; their subsequent-move rule was not independently established. For someone here solely on a visa or visa exemption, outside those categories, we could not verify the same registration and change-notification duty. Article 8 of Population Services Law 5490 authorises the Interior Ministry to assign identity numbers to foreigners covered by Law 6458 and record them in the foreigners register; diplomatic mission members are outside this provision. The validity of foreigner identity numbers, the documents required during and after an application, and other details are determined by an Interior Ministry regulation.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'When the clock starts.' },
          body: {
            en: 'Moving house: the notification period is 20 working days, but we could not verify an explicit starting event for foreigners from a current official source. A residence permit, work permit or work-permit exemption confirmation obtained from a consulate: from the day you enter Turkey. An ordinary first residence permit issued in Turkey: the regulation starts the period when the permit document is delivered. A humanitarian residence permit: the statutory period starts on issuance. The national short-term application checklist instead says "following approval"; that wording conflicts with the regulation\'s delivery trigger, and we are not hiding the conflict.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'Your application is not your registration.' },
          body: {
            en: 'Do not assume that giving your address in e-İkamet completes address registration. The national short-term application checklist expressly requires first applicants to complete address-registration transactions after approval. We did not verify the categorical claim that an application never propagates an address.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'One office or two.' },
          body: {
            en: "The population directorate's FAQ says the population directorate or the provincial migration directorate. The Migration Presidency's page reads as though you file with both. We found official references to two potentially relevant instructions, an 8 December 2022 instruction no. 130606 and Article 33 of a 15 January 2025 implementation directive, but could not locate publicly accessible copies or verify whether they resolve this conflict. Ask at whichever you go to first whether you also need the other.",
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'Online.' },
          body: {
            en: "An e-Devlet service for foreigners' address registration was announced officially in 2022. We could not confirm what it does today, nor whether completing it there leaves no office visit owing.",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'Bursa.' },
          body: {
            en: 'Bursa publishes an appointment-and-document procedure for address registration, effective 1 June 2026, notice dated 19 May 2026: an appointment through `randevu.goc.gov.tr`, and among the documents a UETS account. We could not verify a national UETS requirement for address registration; the national requirement we verified concerns renewal and transfer applications from 15 April 2024, and applicants under 18 need not provide their own UETS account. We found no other matching provincial notice dated 2025 or 2026, which is not the same as knowing Bursa is alone.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'If you are late.' },
          body: {
            en: '814 lira for late notification, 17,051 lira for a false address declaration, at 2026 rates. National figures, usually revised each January.',
          },
        },
      ],
      sources: [
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
          name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 22, 23, 44 ve 110',
        },
        { url: 'https://nvi.gov.tr/sss-adres-hizmetleri', name: 'Nüfus ve Vatandaşlık İşleri, Adres Hizmetleri sıkça sorulan sorular' },
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6458.pdf',
          name: 'Yabancılar ve Uluslararası Koruma Kanunu (6458), Madde 26, 46 ve 90',
        },
        {
          url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20146883&MevzuatTur=21&MevzuatTertip=5',
          name: 'Geçici Koruma Yönetmeliği (Bakanlar Kurulu Kararı 2014/6883), Madde 33',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5490.pdf', name: 'Nüfus Hizmetleri Kanunu (5490), Madde 8' },
        {
          url: 'https://www.icisleri.gov.tr/kurumlar/icisleri.gov.tr/IcSite/mulkiyeteftis/Teftis-Rehberleri/IL-GOC-IDARESI-MUDURLUGU-TEFTIS-REHBERI.pdf',
          name: 'İçişleri Bakanlığı Mülkiye Teftiş Kurulu, İl Göç İdaresi Müdürlüğü Teftiş Rehberi',
        },
        {
          url: 'https://e-ikamet.goc.gov.tr/Ikamet/BasvuruIstenenBelgeler/BasvuruFormuIstenenBelgeler?tur=0',
          name: 'e-İkamet, Kısa Dönem İkamet İzni Başvurularında İstenen Belgeler',
        },
        {
          url: 'https://hatay.goc.gov.tr/e-devlet-kapisi-httpswwwturkiyegovtr-uzerinden-adres-tescil-islemleri-hizmetinin-acilmasi',
          name: 'Hatay İl Göç İdaresi Müdürlüğü, E-Devlet Kapısı Üzerinden Adres Tescil İşlemleri Hizmetinin Açılması',
        },
        { url: 'https://bursa.goc.gov.tr/adreskayit', name: 'Bursa İl Göç İdaresi Müdürlüğü, Adres Kayıt İşlemleri' },
        {
          url: 'https://www.goc.gov.tr/ikamet-izni-uzatma-basvurularinda-ulusal-elektronik-tebligat-sistemi-hakkinda-duyuru',
          name: 'Göç İdaresi Başkanlığı, İkamet İzni Uzatma Başvurularında Ulusal Elektronik Tebligat Sistemi Hakkında Duyuru',
        },
        { url: 'https://www.nvi.gov.tr/adres-hizmetleri', name: 'Nüfus ve Vatandaşlık İşleri, Adres Hizmetleri' },
        { url: 'https://www.nvi.gov.tr/istanbul/adres-islemleri', name: 'İstanbul İl Nüfus ve Vatandaşlık Müdürlüğü, Adres İşlemleri' },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5326.pdf', name: 'Kabahatler Kanunu (5326), Madde 17' },
      ],
    },
    obligations: ADDRESS_GUIDE,
  },
]

// As long as the research rules' own load may take, waiting on another container's (src/rules/research/load.ts).
const TIMEOUT_MS = 120_000

const LOCALES = [
  ['en-US', 'en'],
  ['fa-IR', 'fa'],
] as const

/**
 * Each researched guide onto a database, owned as a research module's rules are (SB-202, SB-261): every start writes the
 * guide, its area and its links to exactly what the file says and removes what the file does not list, one transaction a
 * guide. Only the goal is shared, with sample content, so it is made sure of and never rewritten.
 * test/researched-guides.spec.ts holds a file to the fields written here: a section's title and body, a source's address
 * and name.
 */
export const loadResearchedGuides = async (
  prisma: PrismaClient,
  guides: readonly ResearchedGuide[] = RESEARCHED_GUIDES,
): Promise<string[]> => {
  const loaded: string[] = []
  for (const researched of guides) {
    const goal = TASKS.find((task) => task.slug === researched.task)
    if (!goal) throw new Error(`src/tasks.ts has no goal ${researched.task} for ${researched.country}/${researched.guide.slug}.`)
    const named = researched.obligations.flat()
    const repeated = [...new Set(named.filter((slug, index) => named.indexOf(slug) !== index))]
    if (repeated.length > 0) {
      throw new Error(
        `${researched.country}/${researched.guide.slug} names ${repeated.join(', ')} in more than one of its obligation groups.`,
      )
    }

    const task = await prisma.task.upsert({ where: { slug: goal.slug }, update: {}, create: { slug: goal.slug, position: goal.position } })
    for (const [locale, title, subtitle] of [
      ['en-US', goal.en, goal.enSub],
      ['fa-IR', goal.fa, goal.faSub],
    ] as const) {
      const where = { taskId_locale: { taskId: task.id, locale } }
      if (!(await prisma.taskText.findUnique({ where })))
        await prisma.taskText.create({ data: { taskId: task.id, locale, title, subtitle } })
    }

    await prisma.$transaction((tx) => writeGuide(tx, task.id, researched), { timeout: TIMEOUT_MS })
    loaded.push(`${researched.country}/${researched.guide.slug}`)
  }
  return loaded
}

const writeGuide = async (tx: Prisma.TransactionClient, taskId: string, researched: ResearchedGuide): Promise<void> => {
  const { country: countryCode, detail } = researched
  const verifiedAt = new Date(researched.guide.verifiedAt)

  const areaRow = { taskId, position: 0, kind: null, startGuideId: null }
  const area = await tx.category.upsert({
    where: { countryCode_slug: { countryCode, slug: researched.area.slug } },
    update: areaRow,
    create: { countryCode, slug: researched.area.slug, ...areaRow },
  })
  for (const [locale, title] of [
    ['en-US', researched.area.en],
    ['fa-IR', researched.area.fa],
  ] as const) {
    const written = { title, description: null, startReason: null, askPrompt: null }
    await tx.categoryText.upsert({
      where: { categoryId_locale: { categoryId: area.id, locale } },
      update: written,
      create: { categoryId: area.id, locale, ...written },
    })
  }

  const guideRow = { categoryId: area.id, verifiedAt, position: 0, showDisclaimer: false, showSuggestUpdate: true, readingMinutes: null }
  const guide = await tx.guide.upsert({
    where: { countryCode_slug: { countryCode, slug: researched.guide.slug } },
    update: guideRow,
    create: { countryCode, slug: researched.guide.slug, ...guideRow },
  })

  const text = { ...researched.guide.en, intro: null, quickAnswer: null, cost: null, time: null, deadlines: null, costNote: null }
  await tx.guideText.upsert({
    where: { guideId_locale: { guideId: guide.id, locale: 'en-US' } },
    update: text,
    create: { guideId: guide.id, locale: 'en-US', ...text },
  })
  await tx.guideText.deleteMany({ where: { guideId: guide.id, locale: { not: 'en-US' } } })

  await tx.guideSection.deleteMany({ where: { guideId: guide.id, kind: { notIn: detail.sections.map((section) => section.kind) } } })
  for (const [position, section] of detail.sections.entries()) {
    const row = await tx.guideSection.upsert({
      where: { guideId_kind: { guideId: guide.id, kind: section.kind } },
      update: { position, linkGuideId: null },
      create: { guideId: guide.id, kind: section.kind, position },
    })
    await tx.guideStep.deleteMany({ where: { sectionId: row.id } })
    for (const [locale, language] of LOCALES) {
      const title = section.title?.[language]
      const body = section.body?.[language]
      if (title === undefined && body === undefined) {
        await tx.guideSectionText.deleteMany({ where: { sectionId: row.id, locale } })
        continue
      }
      const written = { title: title ?? null, body: body ?? null, note: null, callout: null, calloutBody: null, calloutSource: null }
      await tx.guideSectionText.upsert({
        where: { sectionId_locale: { sectionId: row.id, locale } },
        update: written,
        create: { sectionId: row.id, locale, ...written },
      })
    }
  }

  await tx.guideOption.deleteMany({ where: { guideId: guide.id } })
  await tx.relatedGuide.deleteMany({ where: { fromGuideId: guide.id } })

  // A source has no key but its id, so the file's are matched by address, and a second row of one address goes too.
  const stored = await tx.guideSource.findMany({ where: { guideId: guide.id }, orderBy: { position: 'asc' } })
  const kept = new Set<string>()
  for (const [position, source] of detail.sources.entries()) {
    const written = { url: source.url, name: source.name, publisher: null, official: true, note: null, verifiedAt, position }
    const row = stored.find((candidate) => candidate.url === source.url && !kept.has(candidate.id))
    if (row) {
      kept.add(row.id)
      await tx.guideSource.update({ where: { id: row.id }, data: written })
    } else {
      kept.add((await tx.guideSource.create({ data: { guideId: guide.id, ...written } })).id)
    }
  }
  await tx.guideSource.deleteMany({ where: { guideId: guide.id, id: { notIn: [...kept] } } })

  // Each group's first obligation the database has, at the group's index, and no other link.
  const rows = await tx.obligation.findMany({ where: { slug: { in: researched.obligations.flat() } }, select: { id: true, slug: true } })
  const idOf = new Map(rows.map((row) => [row.slug, row.id]))
  const chosen = researched.obligations.map((group) => group.map((slug) => idOf.get(slug)).find((id) => id !== undefined))
  await tx.guideObligation.deleteMany({ where: { guideId: guide.id, obligationId: { notIn: chosen.filter((id) => id !== undefined) } } })
  for (const [position, obligationId] of chosen.entries()) {
    if (obligationId === undefined) continue
    await tx.guideObligation.upsert({
      where: { guideId_obligationId: { guideId: guide.id, obligationId } },
      update: { position },
      create: { guideId: guide.id, obligationId, position },
    })
  }
}
