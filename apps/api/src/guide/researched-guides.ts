import type { Prisma, PrismaClient } from '../generated/prisma/client.js'
import type { GuideDetailSeed } from '../sample-types.js'
import { TASKS } from '../tasks.js'
import {
  ADDRESS_GUIDE,
  GERMANY_BUSINESS_REGISTRATION,
  GERMANY_HEALTH_INSURANCE,
  GERMANY_RESIDENCE_PERMIT,
  TURKEY_COMPANY_FORMATION,
  TURKEY_HEALTH_INSURANCE,
  TURKEY_SHORT_TERM_RESIDENCE_PERMIT,
  TURKEY_WORK_PERMIT,
} from './obligation-groups.js'

// Guides written from the agreed research, not sample content (SB-258): each section is one of its document's paragraphs
// under the bold lead that opens it, whole sentences in the document's order with only footnote markers, bold and list
// markers taken out, and nothing the template would give emphasis the document does not, no quick answer, cost strip,
// steps, note or callout. The description is the first sentence of the first section, which starts after it.
// test/researched-guides.spec.ts holds every text to its document.

export type ResearchedGuide = {
  country: string
  /**
   * The research file that wrote this guide, `turkey` or `germany`, which is the vocabulary the rules loader
   * already uses (SB-305). Not the country code: a country can have more than one research file, and the two
   * would silently diverge the first time it does.
   */
  research: string
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
    research: 'turkey',
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
            en: 'The completed application form covers you until your appointment, even if your previous lawful stay ends first. Missing the appointment can leave a first applicant treated as an overstayer. After you submit, the provincial directorate issues a residence permit application document (İkamet İzni Müracaat Belgesi). The implementing regulation, Article 21(9)(ç), says that document gives you the right to stay until your application is decided. An older application guide instead describes ninety days. We have not verified what happens when a printed validity runs out during a longer wait.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'Leaving and coming back while you wait.' },
          body: {
            en: 'While your residence permit application is awaiting a decision, you may travel during the requested permit period with the residence permit application document approved by the provincial migration directorate and the required residence-charge receipts. You may return without a visa if you return within fifteen days of each departure. Beyond fifteen days, ordinary visa rules apply. The appointment form on its own is not the document that does this.',
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
          url: 'https://www.goc.gov.tr/ikamet-sss',
          name: 'Göç İdaresi Başkanlığı, İkamet İzni Sıkça Sorulan Sorular',
          // Read for SB-215, after this guide was verified, so its card carries its own day rather than the guide's.
          read: '2026-09-16',
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
    research: 'germany',
    task: 'get-a-residence-permit',
    area: {
      slug: 'residence-permit',
      en: 'Get a residence permit as a skilled worker with a degree',
      fa: 'دریافت اجازه اقامت به‌عنوان نیروی کار متخصص دارای مدرک دانشگاهی',
    },
    guide: {
      slug: 'residence-permit',
      verifiedAt: '2026-09-14',
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
            en: "This is real and officially acknowledged: Berlin says some departments have nothing available for months. In Berlin, applicants for the residence permits for academic skilled workers, skilled workers with vocational training and research employment submit the online application \"Befristeter Aufenthaltstitel zur Beschäftigung\" if they already hold a residence permit or another residence title, a national D visa for example, or if their nationality lets them apply after entering without a visa; applying before such a title expires is what keeps it valid until the decision, which does not hold for a Schengen C visa. Berlin takes the application no earlier than four months before a national D visa or a current employment residence permit expires. For employment of certain nationalities Berlin sets the condition by nationality instead: nationals of Australia, Israel, Japan, Canada, the Republic of Korea, New Zealand, the United Kingdom and the United States entered no more than ninety days ago or already hold a residence permit or another residence title, while nationals of Albania, Andorra, Bosnia and Herzegovina, Kosovo, Monaco, Montenegro, North Macedonia, Serbia and San Marino entered on a national D visa a German mission abroad issued for employment, and they submit the same application. The LEA reviews the application and, if it is positively reviewed, you receive an appointment to attend in person. For additional help in a documented emergency, use the responsible department's contact form. Berlin assesses emergency requests for urgent travel within the next four weeks evidenced by a booking, or threatened job loss or benefit termination because of missing valid documentation, evidenced by an employer's or Jobcenter/Sozialamt's letter. If it accepts the emergency, it can send a Fiktionsbescheinigung or offer a prompt appointment.",
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
          read: '2026-09-14',
        },
        {
          url: 'https://service.berlin.de/dienstleistung/329328/',
          name: 'Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit akademischer Ausbildung beantragen',
          read: '2026-09-17',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthv/__45b.html',
          name: 'Aufenthaltsverordnung (AufenthV), § 45b Gebühren für Aufenthaltstitel in Ausnahmefällen',
          read: '2026-09-14',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__81.html',
          name: 'Aufenthaltsgesetz (AufenthG), § 81 Beantragung des Aufenthaltstitels',
          read: '2026-09-15',
        },
        {
          url: 'https://www.gesetze-im-internet.de/aufenthv/__41.html',
          name: 'Aufenthaltsverordnung (AufenthV), § 41 Vergünstigung für Angehörige bestimmter Staaten',
          read: '2026-09-15',
        },
        // SB-370: the three Berlin permits beside the academic one, which the restored sentence names. Their place here
        // is the order their footnotes are DEFINED in the document, which is what pagesCited emits, and each name is
        // the page's own heading, as the academic permit's already is.
        {
          url: 'https://service.berlin.de/dienstleistung/305304/',
          name: 'Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit Berufsausbildung beantragen',
          read: '2026-09-17',
        },
        {
          url: 'https://service.berlin.de/dienstleistung/328457/',
          name: 'Service Berlin, Aufenthaltserlaubnis für eine Beschäftigung zum Zweck der Forschung beantragen',
          read: '2026-09-17',
        },
        {
          url: 'https://service.berlin.de/dienstleistung/350471/',
          name: 'Service Berlin, Aufenthaltserlaubnis zur Beschäftigung bestimmter Staatsangehöriger beantragen',
          read: '2026-09-17',
        },
        {
          url: 'https://www.berlin.de/einwanderung/termine/termin-vereinbaren/',
          name: 'Landesamt für Einwanderung Berlin, Termin vereinbaren',
          read: '2026-09-14',
        },
      ],
    },
    obligations: GERMANY_RESIDENCE_PERMIT,
  },
  // Written from research/agreed/turkey/address-registration.md, in the sample address guide's own row (SB-281).
  {
    country: 'tr',
    research: 'turkey',
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
            en: 'Bursa publishes an appointment-and-document procedure for address registration, effective 1 June 2026, notice dated 19 May 2026: an appointment through randevu.goc.gov.tr, and among the documents a UETS account. We could not verify a national UETS requirement for address registration; the national requirement we verified concerns renewal and transfer applications from 15 April 2024, and applicants under 18 need not provide their own UETS account. We found no other matching provincial notice dated 2025 or 2026, which is not the same as knowing Bursa is alone.',
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
  // Written from research/agreed/turkey/tax-number.md (SB-279), its charge from Law 492 (SB-206).
  {
    country: 'tr',
    research: 'turkey',
    task: 'banking-and-money',
    area: { slug: 'tax-number', en: 'Get a tax number', fa: 'دریافت شماره مالیاتی' },
    guide: {
      slug: 'tax-number',
      verifiedAt: '2026-09-14',
      en: {
        title: 'The number that makes you exist in Turkey',
        description:
          'You may receive a potential tax number before receiving a 99 number; once you have the 99 number, it serves as your tax identifier.',
      },
    },
    detail: {
      slug: 'tax-number',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'Two numbers, and one of them takes over.' },
          body: {
            en: 'That has been the rule since 1 July 2010. We could not establish what happens to an earlier potential tax number once the 99 number arrives, so we will not tell you it is merged or cancelled.',
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'You do not need a residence permit to get a tax number.' },
          body: {
            en: "A person who has just arrived can apply. You can apply through the tax administration's foreigners page; the published instructions describe the number appearing after successful submission. At a counter you bring your original passport, a copy of its identity page, and a signed application that includes your address. Istanbul's migration directorate published a notice in 2020 directing applicants online and keeping the counter for cases where identity verification fails; we could not verify whether that is still enforced. GİB documents an intermediary application route for nonresident investors through a bank, broker or custodian. We could not verify whether prior entry into Turkey is necessary, or whether someone abroad can complete the ordinary online application. Law 492 lists no fee for issuing a tax identification number. We have not verified whether another rule imposes a charge. Published instructions describe online issuance after successful submission, but we could not verify a guaranteed processing time.",
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'What you actually need it for, which is less than you have been told.' },
          body: {
            en: "Türkiye's official country note identifies banking transactions as subject to a legal tax-identifier requirement; we did not verify the operative provision specifically governing account opening. Buying property requires one for the land registry transaction. We could not verify a current tax-number requirement for signing an ordinary residential lease or obtaining a mobile line. A 2021 official decision quotes telecom rules accepting foreigners' passports, but we did not verify the complete current rules. For residence-permit fees, Migration Management expressly provides payment using the residence application number. If somebody tells you to go and get a tax number before doing one of those three, ask them which rule says so.",
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'When it goes wrong.' },
          body: {
            en: 'The failure that is documented is identity or passport verification failing even when you entered everything correctly, and the published remedy is to apply at a tax office. We could not verify an official account of somebody receiving duplicate potential tax numbers, or an official procedure for merging duplicates or correcting identity details on an issued tax record.',
          },
        },
      ],
      sources: [
        {
          url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv/fileadmin/kur_mali_beklentiler_raporlari/2010/2010_Kur_Mali_Beklentiler_Raporu.pdf',
          name: 'Maliye Bakanlığı Gelir İdaresi Başkanlığı, 2010 Yılı Kurumsal Mali Durum ve Beklentiler Raporu',
          read: '2026-09-14',
        },
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf',
          name: 'Presidency’s legislation system, 492 sayılı Harçlar Kanunu',
          read: '2026-09-16',
        },
      ],
    },
    obligations: [],
  },
  // Written from research/agreed/turkey/health-insurance.md (SB-279).
  {
    country: 'tr',
    research: 'turkey',
    task: 'health-and-insurance',
    area: { slug: 'health-insurance', en: 'Join general health insurance', fa: 'ثبت‌نام در بیمه سلامت عمومی' },
    guide: {
      slug: 'health-insurance',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Health cover in Turkey',
        description: 'The insurance regulator sets it, in circular 2016/16 as amended by 2024/34, in force since 1 April 2025.',
      },
    },
    detail: {
      slug: 'health-insurance',
      sections: [
        {
          kind: 'whatYouNeed',
          title: { en: 'The policy your permit needs has a legal minimum.' },
          body: {
            en: 'Per year: | Where you are treated | Outpatient | Your share | Inpatient | Your share | |---|---:|---:|---:|---:| | A provider your insurer has contracted with | ₺15,000 | 20% | unlimited | 0% | | Non-contracted, and public hospitals outside Annex 1 | ₺15,000 | 40% | ₺150,000 | 20% | | The 20 public hospitals named in Annex 1 | ₺15,000 | 20% | ₺250,000 | 0% | Treatment for sudden illness cannot be excluded, subject to the waiting-period rules. We located the 2022/7 waiting-period amendment but could not read its operative text, so we cannot promise immediate cover for every illness.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'Do not assume the policy you already own counts.' },
          body: {
            en: 'For an application made inside Turkey, the policy must be concluded in Turkey with an insurer authorised for the relevant branch, including an authorised Turkish establishment of a foreign insurer. The circular allows a policy concluded with an insurer abroad for a residence application made abroad, provided it supplies the required minimum cover in Turkey; migration management says residence applications are not yet accepted abroad. So do not assume the travel policy you flew in with is the one your permit accepts.',
          },
        },
        {
          kind: 'beforeYouStart',
          title: { en: 'SGK, and the year.' },
          body: {
            en: 'A foreigner with more than a year of continuous residence under a residence permit may apply for foreign-resident general health insurance, subject to the other eligibility conditions, including their existing insurance status. Official guidance says residence under a residence permit and does not restrict it to a particular permit type. We could not verify exactly how the year is calculated or how many days abroad break it, so ask SGK rather than trusting a number you read. Joining is not automatic on your anniversary: for an eligible applicant, GSS registration starts the day after the request. Routine treatment entitlement normally also requires thirty contribution days in the preceding year and, for this category, no outstanding premium-related debt, subject to statutory exceptions.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'What it costs, and it is not small.' },
          body: {
            en: "The premium is 12% of twice the gross minimum wage. With the 2026 minimum wage of ₺33,030 that is a base of ₺66,060 and a premium of ₺7,927.20 a month. Those last two figures were calculated here from the official rate and the official wage; the same calculation also appears in a copy of an SGK circular hosted by an accountants' chamber, which we could not verify on SGK's own host.",
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'If you get a job, this changes.' },
          body: {
            en: 'Employment insurance starts on the day you start work (Law 5510, Art 7). Being insured from day one is not the same as being entitled to routine treatment from day one: SGK normally wants thirty days of contributions in the preceding year, though it waives that when you move between categories or from being a dependant. Somebody posted to Turkey under a social security agreement may stay insured in their home country instead.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'Emergency care is not automatically free to an uninsured foreign visitor.' },
          body: {
            en: 'Under the 2025 regulation covering visitors, emergency services and emergency transport are chargeable. The regulation requires treatment to be provided unconditionally and without delay, with collection afterwards; that is a legal duty on the provider, not a guarantee of how a given hospital behaves. The exception is a traffic accident, where SGK pays under the applicable legislation and the patient cannot be charged personally. For a residence permit holder without SGK, an official state-hospital pricing page says services are charged under the public tariff; that page does not resolve every emergency exemption for settled residents, and we did not verify them.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'By province.' },
          body: {
            en: 'The verified legal rules are national, with no provincial variation. We could not verify whether office procedures or additional document requests differ locally. For the private permit-policy minimum standard, Annex 1 public hospitals receive more favourable minimum coverage terms than non-listed public hospitals, and provider network status affects the required coverage terms.',
          },
        },
      ],
      sources: [
        {
          url: 'https://www.seddk.gov.tr/upload/Vize%20ve%20%C4%B0kamet%20%C4%B0zni%20Taleplerinde%20Yapt%C4%B1r%C4%B1lacak%20Sa%C4%9Fl%C4%B1k%20Sigortalar%C4%B1na%20%C4%B0li%C5%9Fkin%20Genelgede%20De%C4%9Fi%C5%9Fiklik%20Yap%C4%B1lmas%C4%B1na%20Dair%20Genelge%20%282024-34%29.pdf',
          name: 'SEDDK, Genelge 2024/34',
        },
        { url: 'https://seddk.gov.tr/upload/Bas%C4%B1n%20duyurusu.27-12-24.pdf', name: 'SEDDK basın duyurusu, 27 Aralık 2024' },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf', name: '5510 sayılı Kanun, Madde 61' },
        {
          url: 'https://www.sgk.gov.tr/Download/DownloadFileStatics?d=YAYINLARIMIZ&f=GSS_Sistemi_Kitabi_TR.pdf',
          name: 'SGK, Genel Sağlık Sigortası Sistemi kitabı',
        },
        {
          url: 'https://www.sgk.gov.tr/Content/Post/4d85599f-e810-4755-a81b-02be5c253d60/Yurtici-2022-08-23-04-08-30',
          name: 'SGK, Sağlık Hizmetlerinden Yararlanma Şartları Nelerdir?',
        },
        {
          url: 'https://www.csgb.gov.tr/tr/poco-pages/asgari-ucret/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Asgari Ücretin Net Hesabı ve İşverene Maliyeti',
        },
      ],
    },
    obligations: TURKEY_HEALTH_INSURANCE,
  },
  // Written from research/agreed/turkey/work-permit.md (SB-279).
  {
    country: 'tr',
    research: 'turkey',
    task: 'work',
    area: { slug: 'work-permit', en: 'Get a work permit', fa: 'دریافت مجوز کار' },
    guide: {
      slug: 'work-permit',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Working in Turkey',
        description: 'Normally your employer applies for you, electronically.',
      },
    },
    detail: {
      slug: 'work-permit',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'Who applies.' },
          body: {
            en: 'For the ordinary in-country route, the application is made against a residence permit that was issued for at least six months and is still valid on the day of the application. Note what that does not say: it is not six months remaining. A one-year permit with five months left still satisfies it.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'Whether your job can produce a permit at all.' },
          body: {
            en: 'The Ministry publishes national criteria, and they are about your employer as much as you. A business keeping a balance sheet needs five Turkish employees for each foreigner. A new business needs 500,000 lira of paid-in capital; an established one needs that, or 8 million lira of net sales, or 150,000 US dollars of exports. Your salary must be at least the applicable multiple of the gross minimum wage in force on the day you apply: five times for senior executives and pilots, four for engineers and architects, three for other managers, twice for jobs requiring expertise or mastery, and once for domestic and other work. The gross minimum wage for 2026 is 33,030 lira a month (net 28,075.50). We give you the multipliers and the wage separately because the Ministry publishes them separately; we did not verify an official page publishing the multiplied figures.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'The exemptions are worth checking before you give up.' },
          body: {
            en: 'Fifty million lira of annual net sales waives the employee quota for five foreigners. Since 3 August 2026, domestic applications can receive employment and financial-criteria relief for up to three foreigners who spent at least one year within the preceding three lawfully in Turkey under a work permit, residence permit or international protection; in a workplace using that relief, foreign permit-holders must not outnumber its Turkish employees. (Corrected 2026-09-14 in SB-193: this said "per workplace", which criterion 4.1 does not; the three is its own limit, and the workplace appears only in 4.2\'s headcount limit.) Long-term residence permit holders and foreigners living in a marital union with a Turkish citizen for at least three years are exempt from the employment, financial and salary criteria. There is conditional relief in IT, research, education, public projects, tourism and livestock. For balance-sheet businesses, an applicant partner needs at least a 500,000-lira capital share and twenty per cent ownership, and the business needs at least 500,000 lira paid-in capital; five Turkish employees are required monthly from month seven of the initial permit. A capital share of at least US$100,000 waives these tests.',
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'Passing those tests is not the same as being allowed to do the job.' },
          body: {
            en: 'Some professions are reserved to Turkish citizens. The Ministry publishes a consolidated list with the law behind each entry, covering dentistry, pharmacy, veterinary medicine, advocacy, notarial work, private security and tourist guiding among others. Check that list, then confirm the provision and any exception that applies to your own profession. Health and education work can need separate authorisation first.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'If you leave the job or lose it.' },
          body: {
            en: "Your permit does not move with you. Working for a different employer needs a new permit, and the law treats that application as a first application rather than a transfer. When the employment ends the permit is liable to cancellation, and your employer must tell the Ministry within fifteen days. That fifteen days is the employer's reporting duty and it is not a grace period for you. There is a separate ten-day window for a residence-permit application: Article 21(6) of the regulation implementing Law 6458 lets someone whose work permit has been cancelled or has ended apply for a residence permit within ten days. The residence right that came from the work permit ends with it; a separate, still-valid residence permit is not invalidated by that cancellation. We could not verify whether the days before that application count as lawful residence, or exactly which date the ten days run from, and the provision gives neither permission to work nor an unconditional period to look for a job.",
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'Do not assume a pending application protects you.' },
          body: {
            en: 'If your residence permit expires while a first work permit application is being decided, we could not find a rule that extends your stay. The Ministry permits continued work while a timely extension application is assessed, for no more than ninety days and with the same work and workplace; this does not cover a first application. The Presidency says plainly that residence permits are not issued for the purpose of applying for a work permit.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'Fees.' },
          body: {
            en: 'The standard 2026 fee for a fixed-term work permit of up to one year is 12,574.90 lira, plus 964 lira for the card. The tariff distinguishes independent, permanent and temporary-protection permits.',
          },
        },
      ],
      sources: [
        {
          url: 'https://www.csgb.gov.tr/uigm/calisma-izni/calisma-izni-degerlendirme-kriterleri/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Çalışma İzni Değerlendirme Kriterleri',
        },
        {
          url: 'https://www.csgb.gov.tr/sikca-sorulan-sorular/uluslararasi-%C4%B1sgucu-genel-mudurlugu/calisma-%C4%B1zni/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Çalışma İzni Sıkça Sorulan Sorular',
        },
        {
          url: 'https://www.csgb.gov.tr/tr/poco-pages/asgari-ucret/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Asgari Ücretin Net Hesabı ve İşverene Maliyeti',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6735.pdf', name: '6735 sayılı Kanun, Madde 22' },
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
          name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 21',
        },
        {
          url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.39337.pdf',
          name: 'Uluslararası İşgücü Kanunu Uygulama Yönetmeliği, Madde 27',
        },
        {
          url: 'https://www.csgb.gov.tr/uigm/genel-bilgi/harc-ve-degerli-k%C3%A2git-bedelinin-odenmesi/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Harç ve Değerli Kâğıt Bedelinin Ödenmesi',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf', name: '492 sayılı Harçlar Kanunu' },
        {
          url: 'https://ms.hmb.gov.tr/uploads/sites/3/2025/12/2026-Degerli-Kagitlar-Tebligi-a3f95f2236d8ad45.pdf',
          name: 'Muhasebat Genel Müdürlüğü Genel Tebliği (Sıra No: 97) Değerli Kağıtlar',
        },
      ],
    },
    obligations: TURKEY_WORK_PERMIT,
  },
  // Written from research/agreed/turkey/company-formation.md (SB-279).
  {
    country: 'tr',
    research: 'turkey',
    task: 'start-a-business',
    area: { slug: 'company-formation', en: 'Form a limited company', fa: 'تأسیس شرکت با مسئولیت محدود' },
    guide: {
      slug: 'company-formation',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Starting a limited company in Turkey as a foreigner',
        description: 'For an ordinary business, yes, and you need no investment permission to do it.',
      },
    },
    detail: {
      slug: 'company-formation',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'Can you even own one?' },
          body: {
            en: 'A foreigner can be the sole shareholder, there is no Turkish partner requirement and no minimum foreign shareholding. Living abroad does not disqualify you. Some sectors are different: private security is subject to reciprocity and needs operating permission, and broadcasting caps direct foreign capital at half the paid-up capital and must be an anonim şirket rather than a limited one. We verified those two; we did not check every sector, so check yours.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'The five Turkish employees.' },
          body: {
            en: 'This is the thing that stops people, and it is misplaced. There is no obligation on a company to employ five Turkish citizens simply because it exists or has a foreign shareholder. The five belongs to the work permit assessment for a foreign partner, and it starts from the seventh month of that first work permit, not from incorporation. A partner with a capital share of US$100,000 or more is exempt from it.',
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'What it costs.' },
          body: {
            en: "The minimum capital is 50,000 lira. For cash capital, no statutory payment is required before registration; the full subscribed amount must be paid within twenty-four months after registration, or earlier under the payment schedule in the articles or set by the managers. This rule is national. The capital is your company's money, not a fee. The fees written in Law 492 for forming the company are zero: Article 123 exempts the formation of a limited company from the fees written in that Law, and Istanbul's registry tariff shows the formation harç line as exempt. That exemption is Law 492's own fees, wider than a registry charge and narrower than the cost of forming a company, which the levy, the Gazette and your chamber all add to below. What you actually pay is the Competition Authority levy at 0.04 per cent of subscribed capital, which is 20 lira at the minimum; the Trade Registry Gazette at 2.48 lira per word of your announcement; and your chamber's own charges, which differ by city. Istanbul's published 2026 tariff lists 2,160 lira for formation certification, 2,760 for opening-book certification and 250 for publication expenses; chamber registration for a new capital company is 3,305 lira. These are verified tariff entries, not a confirmed complete bill: a signature declaration is separately listed at 1,720 lira in the general tariff, while the limited-company formation cost sheet includes signature declarations in its 2,160 lira service fee. Antalya's equivalent new registration is 4,875 lira. We verified national notarial tariff components, not an all-inclusive formation quote: the notary's fee is 30 per cent of the applicable statutory notarial harç, minimum 58.82 lira; writing and copying are 80.68 lira per chargeable page; translation under Article 4 is 667.67 lira per page, halved for pages containing ten lines or fewer. Istanbul's chamber charges a registration fee. Annual dues follow, and none are charged in the year you register. Istanbul assesses annual dues by registered capital or net assets; its 2026 band from 25,001 to 250,000 lira carries 3,500 lira a year, collected in June and October, with supplementary dues of 0.5 per cent of commercial balance-sheet profit, within statutory limits.",
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'What happens after registration, which is where the deadlines are.' },
          body: {
            en: 'Your tax registration is transmitted by the registry, so you do not file a separate commencement notification the way a sole trader does; check that it has actually been established. Apply for electronic tax notifications within fifteen days of commencement. Get your tax certificate within a month of your tax liability starting, then renew it by 31 May each year, or, for a special accounting period, within one month after the declaration deadline. Your SGK workplace registration is created automatically by the registry-based formation. An employee must normally be registered at least a day before they start.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'The municipal licence has no grace period.' },
          body: {
            en: 'If your premises and activity need an opening and operating licence, you need it before you open, and premises operating without one can be closed. A 2026 change worth knowing: companies registered from 1 January 2026 keep their share register and general meeting minutes electronically in the ETDS system, opened automatically with registration.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'Where your company can live.' },
          body: {
            en: 'We could not verify a nationwide yes or no on registering at a home address or a virtual office, and we could not verify a universal requirement to hold a commercial lease. What is clear is that registering a company and being allowed to operate from a place are two different permissions, and some activities have premises requirements that a home or a mailbox cannot meet. We did not find a verified comparison of two named cities accepting different facts, so we are not claiming one.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'A bookkeeper.' },
          body: {
            en: 'We could not establish that every new limited company must retain an external accountant within a fixed period. National rules require professional signatures for specified tax returns from covered taxpayers, subject to exemptions. We could not verify the applicable 2026 asset and net-sales thresholds from a government source. The available evidence does not establish that professional involvement becomes mandatory only above a size threshold.',
          },
        },
      ],
      sources: [
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6112.pdf', name: '6112 sayılı Kanun, Madde 19' },
        {
          url: 'https://www.rtuk.gov.tr/izin-ve-tahsisler-dairesi-baskanligi/3923',
          name: 'RTÜK İzin ve Tahsisler Dairesi Başkanlığı, sıkça sorulan sorular',
        },
        {
          url: 'https://www.csgb.gov.tr/uigm/calisma-izni/calisma-izni-degerlendirme-kriterleri/',
          name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Çalışma İzni Değerlendirme Kriterleri',
        },
        {
          url: 'https://www.resmigazete.gov.tr/eskiler/2023/11/20231125-23.pdf',
          name: 'Resmî Gazete, 25 Kasım 2023, Cumhurbaşkanı Kararı 7887',
        },
        {
          url: 'https://www.resmigazete.gov.tr/eskiler/2023/11/20231126-5.htm',
          name: 'Resmî Gazete, 26 Kasım 2023, 7887 sayılı Cumhurbaşkanı Kararı ile ilgili düzeltme',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf', name: '6102 sayılı Türk Ticaret Kanunu, Madde 580' },
        { url: 'https://ticaret.gov.tr/ic-ticaret/sirketler/sirket-bilgiler', name: 'Ticaret Bakanlığı, Şirket Bilgileri' },
        {
          url: 'https://www.ito.org.tr/tr/hizmetler/ticaret-sicili-islemleri/tescil-islemleri/limited-sirketler',
          name: 'İTO, Limited Şirketler',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf', name: '492 sayılı Harçlar Kanunu' },
        {
          url: 'https://www.ito.org.tr/documents/Ticaret-Sicil/onemli_bilgiler_ve_duyurular/harc.pdf',
          name: 'İTO, 2026 Yılı Ticaret Sicili Harçları, TTSG İlan Ücretleri, Hizmet Bedelleri',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4054.pdf', name: '4054 sayılı Kanun, Madde 39' },
        {
          url: 'https://www.ito.org.tr/documents/Ticaret-Sicil/ltd_kurulus_surec/teknoktadalimitedsirketkurulususurecmaliyettr.pdf',
          name: 'İTO, Tek Noktada Limited Şirket Kuruluşu, Süreç ve Maliyet',
        },
        { url: 'https://ito.org.tr/tr/hizmetler/aidat-islemleri', name: 'İTO, Aidat İşlemleri' },
        { url: 'https://www.atso.org.tr/tr/hizmetler/uye-rehberi/uye-ucretleri', name: 'Antalya Ticaret ve Sanayi Odası, Üye Ücretleri' },
        {
          url: 'https://higm.adalet.gov.tr/Resimler/SayfaDokuman/202512301701273242026%20YILI%20NOTERL%C4%B0K%20%C3%9CCRET%20TAR%C4%B0FES%C4%B0.pdf',
          name: '2026 Yılı Noterlik Ücret Tarifesi',
        },
        {
          url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2Fise_yeni_baslayan_kurumlar_vergisi_mukellefleri_2026.pdf',
          name: 'Gelir İdaresi Başkanlığı, İşe Yeni Başlayan Kurumlar Vergisi Mükelleflerinin Hak ve Ödevleri',
        },
        {
          url: 'https://gib.gov.tr/mevzuat/kanun/434/teblig/8006',
          name: "Gelir İdaresi Başkanlığı, 408 Sıra No'lu Vergi Usul Kanunu Genel Tebliği",
        },
        {
          url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2Fmuk_hak_odev_elektr_uyg_ceza_rehberi.pdf',
          name: 'Gelir İdaresi Başkanlığı rehberi, Vergi levhasının alınması ve bulundurulması',
        },
        {
          url: 'https://www.sgk.gov.tr/Content/Post/d9d838d8-6585-40f5-bbcc-47bd43c59bb4/Isverenin-Yukumlulukleri-2022-05-15-06-17-29',
          name: 'SGK, İşverenin Yükümlülükleri',
        },
        { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf', name: '5510 sayılı Kanun, Madde 8' },
        {
          url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20059207&MevzuatTur=21&MevzuatTertip=5',
          name: 'İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik (Bakanlar Kurulu Kararı 2005/9207)',
          read: '2026-09-16',
        },
        {
          url: 'https://ticaret.gov.tr/data/5e0f1da813b87658f03c9b74/Bakkall%C4%B1k%20Meslek%20K%C4%B1lavuzu.pdf',
          name: 'Ticaret Bakanlığı, Bakkallık Meslek Kılavuzu',
        },
        {
          url: 'https://ticaret.gov.tr/haberler/1-ocak-2026-tarihinden-sonra-kurulacak-sirketlerde-elektronik-ticari-defter-sistemi-zorunlu-olacak',
          name: 'Ticaret Bakanlığı, 1 Ocak 2026 tarihinden sonra kurulacak şirketlerde Elektronik Ticari Defter Sistemi zorunlu olacak',
        },
      ],
    },
    obligations: TURKEY_COMPANY_FORMATION,
  },
  // Written from research/agreed/germany/anmeldung.md (SB-299).
  {
    country: 'de',
    research: 'germany',
    task: 'getting-settled',
    area: { slug: 'anmeldung', en: 'Register where you live', fa: 'ثبت نشانی محل سکونت' },
    guide: {
      slug: 'anmeldung',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Registering where you live in Germany',
        description:
          'Unless a statutory exemption or exception applies, anyone who moves into a dwelling must register with the Meldebehörde within two weeks of moving in.',
      },
    },
    detail: {
      slug: 'anmeldung',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'The rule, and it is the same everywhere.' },
          body: {
            en: 'It is §17(1) Bundesmeldegesetz, it is federal, and no Land can lengthen or shorten it. Your nationality does not matter and neither does being an EU citizen. For a child under sixteen, the person whose dwelling they move into registers them.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'Two weeks, not three months.' },
          body: {
            en: 'If you are moving to Germany to live and you take a flat, you have two weeks from moving in. The three-month figure is real but it describes other situations: a temporary stay by somebody who otherwise lives abroad and is not registered in Germany, where registration falls due within two weeks after the stay passes three months (§27(2)); and a stay in a hotel or similar by somebody with no registered German dwelling, on the same pattern (§29(1)). The temporary-stay exception under §27(2) does not apply to asylum seekers or other foreign nationals who move temporarily into a reception facility or other assigned accommodation (§27(3)).',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'If you miss it.' },
          body: {
            en: 'Failing to register on time, deliberately or carelessly, can be fined up to €1,000 (§54(2)(1), (3)). That is a ceiling, not a standard charge. The €50,000 figure you may read about is for offering somebody a fictitious registration address and has nothing to do with being late.',
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'The landlord confirmation, and what to do without one.' },
          body: {
            en: "The person who provides your accommodation, which for a subtenant is the main tenant rather than the owner, must confirm your move within two weeks, either in a signed written confirmation or electronically directly to the Meldebehörde through the procedure under §19(4). It must carry their name and address, the owner's name if that is somebody else, the date you actually moved in, the address, and the names of everyone registering. If they refuse or are late you must tell the registration office without delay (§19(2)), and federal guidance says the registration must go ahead anyway if you really did move in, with the confirmation supplied afterwards. A lease is not a substitute for it. A provider who refuses, delays or confirms falsely can also be fined up to €1,000.",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'What it costs, and this is where Germany differs from itself.' },
          body: {
            en: "Registration is free in Berlin, Munich, Düsseldorf, Wiesbaden, Freiburg and under Saxony's state guidance. Hamburg charges €16, set by its own fee ordinance and raised to that figure on 1 January 2026. The charge is for one person or for a family who share both the address they left and the address they are arriving at, so a qualifying family pays €16 once, not each. We could not establish which relationships count as a family for that tariff, so do not assume it covers housemates or relatives arriving separately. Hamburg's fee comes from Hamburg's general fee legislation rather than from the federal registration law, which is why it can exist at all while the two-week deadline cannot vary.",
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'What registering gets you.' },
          body: {
            en: 'Your tax identification number arrives on its own after your first registration and is yours for life; if no letter comes within three months the Federal Central Tax Office has a procedure for asking again. A bank account is a separate application and, as a matter of law, registration is not a precondition: the financial regulator expressly includes people with no fixed residence among those who may be entitled to a basic account. Health insurance is also separate and registering does not enrol you in health insurance. Official guidance for newcomers expects you to be covered from the day you arrive, so do not wait for your Anmeldung to arrange it.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'Cities differ in their registration procedures.' },
          body: {
            en: "Berlin registers by appointment, in person or through an authorised representative, and its online route is for moves within Germany rather than a first arrival from abroad. Munich also allows a representative and publishes a form for a missing landlord confirmation. Hamburg's page for arrivals from abroad says everyone moving in must attend in person, which sits awkwardly with federal guidance allowing representation, and we could not find a Hamburg rule that overrides it. The service pages we checked for Berlin, Munich and Hamburg do not offer ordinary registration by post.",
          },
        },
      ],
      sources: [
        { url: 'https://www.gesetze-im-internet.de/bmg/__17.html', name: 'Bundesmeldegesetz (BMG), § 17' },
        { url: 'https://www.gesetze-im-internet.de/bmg/__27.html', name: 'Bundesmeldegesetz (BMG), § 27' },
        { url: 'https://www.gesetze-im-internet.de/bmg/__54.html', name: 'Bundesmeldegesetz (BMG), § 54' },
        { url: 'https://www.gesetze-im-internet.de/bmg/__19.html', name: 'Bundesmeldegesetz (BMG), § 19' },
        { url: 'https://service.berlin.de/dienstleistung/120686/', name: 'Service Berlin, Alleinige Wohnung oder Hauptwohnung anmelden' },
        {
          url: 'https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_27092022_VII2201041418.htm',
          name: 'Allgemeine Verwaltungsvorschrift zur Durchführung des Bundesmeldegesetzes (BMGVwV)',
        },
        {
          url: 'https://stadt.muenchen.de/service/info/wohnsitzanmeldung/1063475/n0/',
          name: 'Landeshauptstadt München, Wohnsitzanmeldung',
        },
        {
          url: 'https://service.duesseldorf.de/suche/-/egov-bis-detail/dienstleistung/227/show',
          name: 'Serviceportal Düsseldorf, Anmeldung eines Wohnsitzes',
        },
        { url: 'https://www.wiesbaden.de/vv/produkte/34/Wohnungsanmeldung', name: 'Landeshauptstadt Wiesbaden, Wohnungsanmeldung' },
        { url: 'https://www.freiburg.de/pb/-/205332/vbid6020109', name: 'Stadt Freiburg, Wohnsitz anmelden' },
        { url: 'https://amt24.sachsen.de/zufi/leistungen/6007623', name: 'Amt24 Sachsen, Serviceportal Zuständigkeitsfinder' },
        { url: 'https://www.hamburg.de/service/info/111142065/n0/', name: 'hamburg.de, Umzug nach Hamburg aus dem Ausland melden' },
        {
          url: 'https://www.luewu.de/gvbl/ausgabe-nr-43-vom-16-12-2025-seiten-723-786-groesse-48-mb/',
          name: 'Hamburgisches Gesetz- und Verordnungsblatt Nr. 43 vom 16. Dezember 2025, Elfte Verordnung zur Änderung von Gebührenordnungen aus dem Bereich der Behörde für Inneres und Sport',
        },
        {
          url: 'https://www.luewu.de/wp-content/uploads/2025/08/GVBL_HH_2015-42.pdf',
          name: 'Hamburgisches Gesetz- und Verordnungsblatt Nr. 42 vom 13. Oktober 2015, Seite 274, Tarifnummer 2',
        },
        {
          url: 'https://online.portal.bzst.de/SharedDocs/Leistungsbeschreibung/DE/erneute_mitteilung_der_ID-Nr.html',
          name: 'BZSt online.portal, Steueridentifikationsnummer erhalten',
        },
        {
          url: 'https://www.make-it-in-germany.com/de/leben-in-deutschland/geld-versicherung/krankenversicherung',
          name: 'Make it in Germany, Krankenversicherung',
        },
      ],
    },
    obligations: ADDRESS_GUIDE,
  },
  // Written from research/agreed/germany/business-registration.md (SB-299).
  {
    country: 'de',
    research: 'germany',
    task: 'start-a-business',
    area: { slug: 'business-registration', en: 'Register a business', fa: 'ثبت کسب‌وکار' },
    guide: {
      slug: 'business-registration',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Registering a business in Germany',
        description: 'The tax office decides whether your income is from a liberal profession under §18 EStG or from a trade.',
      },
    },
    detail: {
      slug: 'business-registration',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'There are two questions, not one, and two authorities answer them separately.' },
          body: {
            en: 'The trade office decides, on its own, whether you must register a Gewerbe. The Federal Administrative Court has held that the tax classification does not bind the trade authority, so you can be freiberuflich for the tax office and still have to register. Calling yourself a "freelancer" does not determine which you are.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'If you work as a self-employed software developer, you need to establish which classifications apply.' },
          body: {
            en: 'Engineering-like work can qualify as a liberal profession. What matters is both the work you actually do and the breadth and depth of your knowledge. A relevant degree helps and self-taught people can qualify, but they have to show comparable knowledge. Having a degree, programming professionally or calling yourself an IT consultant settles neither question. If you are unsure, put your actual services, your qualifications and some representative projects to both authorities. A tax number is not a ruling, and the binding ruling you can ask the tax office for under §89 AO does not settle the trade question.',
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'Getting it wrong.' },
          body: {
            en: 'If you should have registered a Gewerbe and did not, registration can be required retrospectively and a late or missing notification can be fined up to €1,000 (§146 GewO); a tax reclassification can create trade tax for earlier years, though the nationwide €24,500 Gewerbeertrag allowance for individuals and partnerships means reclassification does not automatically mean trade tax to pay. If you registered something that was never a trade, the registration does not put you into commercial tax treatment. Ask the trade office to correct it and the tax office to classify you correctly. We could not verify a uniform official procedure for cancelling retrospectively or refunding fees and chamber contributions.',
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'Registering the Gewerbe.' },
          body: {
            en: "You notify the trade office where the business is located, and the federal deadline is at the same time as you start the business (§14 GewO). There is no nationwide grace period. Cologne's published guidance says a warning fine may be imposed when commencement was more than four weeks ago, and fine proceedings may be initiated after more than six months. These are possible enforcement measures, not extensions of the deadline.",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'There is no uniform federal registration fee.' },
          body: {
            en: "In these three examples the fees come from Land ordinances, and each concerns an individual registering a sole business; other legal forms and additional representatives can change the charge. The examples do not establish who fixes the amount everywhere in Germany. | City | Fee | Set by | |---|---|---| | Berlin | €26, or €15 online | Berlin's Land administrative-fee ordinance | | Hamburg | €25 | Hamburg's economic-administration fee ordinance | | Cologne | €26 | NRW's tariff, collected by the city | Whether you can do it online depends on the responsible authority, and sometimes on your legal form; Berlin lists forms for which there is no online route.",
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'What registering sets off.' },
          body: {
            en: "Your notification is transmitted, within statutory purpose limits and subject to a recipient waiving regular transmission, to the tax office, the chambers, DGUV for forwarding to the responsible accident insurer, the employment agency, customs, the immigration authority and others. Transmission is not the same as somebody contacting you, and it does not complete every separate obligation. It does complete one: a Gewerbeanmeldung made within one week of the business starting satisfies the business-notification obligation to the statutory accident insurer; otherwise that notification is due within one week. Chamber membership is normally compulsory for an ordinary commercial business and there is no general opt-out, but the contribution can be nothing. For IHK contributions: an eligible individual or partnership not in the commercial register is exempt where its Gewerbeertrag, or its business profit under income-tax law where no Gewerbesteuermessbetrag is assessed for that year, is no more than €5,200. A qualifying non-register individual pays no basic contribution and no levy in the opening year and the year after, and no levy in years three and four, provided trade income or profit is no more than €25,000, provided they had no income from agriculture or forestry, a commercial business or self-employment in the preceding five financial years, and no direct or indirect corporate holding above ten per cent in that period. These are profit tests, not turnover tests, and §3 IHKG permits a chamber to lower the €5,200 and €25,000 exemption thresholds under a specified condition, so check its annual rules. One chamber's 2026 rates charge a non-register business with €10,000 of profit €35 a year, or nothing with founder relief.",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'What a foreigner needs.' },
          body: {
            en: "A German residence permit or national (D) visa generally allows work, including self-employment, unless the law prohibits or restricts it. Check the document's work conditions before starting. You need permission for activity beyond a prohibition or restriction. A title issued for a particular job does not allow other work unless and to the extent the competent authority permits it. You do not always need a separate self-employment permit: §21(6) lets self-employment be authorised while you keep another residence purpose. We would not tell you that the trade office will refuse your registration without that authorisation, because we could not verify it.",
          },
        },
        {
          kind: 'howToDoIt',
          title: { en: 'The tax questionnaire.' },
          body: {
            en: 'Do not wait for the tax office to send you anything. Within one month of starting you must submit the Fragebogen zur steuerlichen Erfassung electronically, normally through ELSTER (§138 AO); a hardship exception is available on application. Registering the Gewerbe does not replace it. The tax office then communicates your Steuernummer in writing. We could not verify how long that takes.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'The small business rule.' },
          body: {
            en: 'For a business established in Germany that has not waived the exemption, qualifying domestic supplies are VAT-exempt where relevant turnover under §19(2) was no more than €25,000 in the previous calendar year and remains no more than €100,000 in the current calendar year. In the year the business first starts, the ceiling is €25,000 of actual relevant turnover. These are turnover, not profit, and the thresholds are nationwide.',
          },
        },
        {
          kind: 'whatToCheck',
          title: {
            en: 'The transaction that crosses the applicable current-year ceiling loses the exemption in full, not merely for the excess.',
          },
          body: {
            en: 'Ordinary VAT rules then apply, including any other applicable exemption. The exemption applies automatically and you can waive it, but a waiver binds you for at least five calendar years. Simply using the exemption does not impose that five-year commitment.',
          },
        },
      ],
      sources: [
        { url: 'https://www.gesetze-im-internet.de/gewo/__146.html', name: 'Gewerbeordnung (GewO), § 146' },
        { url: 'https://www.gesetze-im-internet.de/gewstg/__11.html', name: 'Gewerbesteuergesetz (GewStG), § 11' },
        { url: 'https://www.gesetze-im-internet.de/gewo/__14.html', name: 'Gewerbeordnung (GewO), § 14' },
        {
          url: 'https://www.stadt-koeln.de/service/produkte/00554/index.html',
          name: 'Stadt Köln, An-, Ab- und Ummeldung eines Gewerbebetriebes',
        },
        { url: 'https://service.berlin.de/dienstleistung/121921/', name: 'Service Berlin, Gewerbe anmelden' },
        {
          url: 'https://www.handelskammer-hamburg.de/gruendung-sicherung-nachfolge/gewerbe-an-um-melden/gewerbeanmeldung-6598040',
          name: 'Handelskammer Hamburg, Gewerbeanmeldung, -ummeldung und -abmeldung',
        },
        { url: 'https://www.dguv.de/de/versicherung/unternehmensnummer/anmeldung/index.jsp', name: 'DGUV, Ein neues Unternehmen anmelden', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/sgb_7/__192.html', name: 'Sozialgesetzbuch Siebtes Buch (SGB VII), § 192', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/ihkg/__3.html', name: 'IHK-Gesetz (IHKG), § 3', read: '2026-09-15' },
        {
          url: 'https://www.ihk.de/rhein-neckar/ueber-uns/beitrag/beitragsaetze-2017-2026-4653446',
          name: 'IHK Rhein-Neckar, Beitragssätze 2017 bis 2026',
        },
        { url: 'https://www.gesetze-im-internet.de/ao_1977/__138.html', name: 'Abgabenordnung (AO), § 138', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/ustg_1980/__19.html', name: 'Umsatzsteuergesetz (UStG), § 19', read: '2026-09-15' },
        {
          url: 'https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-03-18-sonderregelung-kleinunternehmer.pdf?__blob=publicationFile&v=4',
          name: 'Bundesministerium der Finanzen, BMF-Schreiben vom 18. März 2025, Sonderregelung für Kleinunternehmer',
        },
        { url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__2.html', name: 'Aufenthaltsgesetz (AufenthG), § 2', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__4.html', name: 'Aufenthaltsgesetz (AufenthG), § 4', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__6.html', name: 'Aufenthaltsgesetz (AufenthG), § 6', read: '2026-09-15' },
        { url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__4a.html', name: 'Aufenthaltsgesetz (AufenthG), § 4a', read: '2026-09-15' },
      ],
    },
    obligations: GERMANY_BUSINESS_REGISTRATION,
  },
  // Written from research/agreed/germany/health-insurance.md (SB-299).
  {
    country: 'de',
    research: 'germany',
    task: 'health-and-insurance',
    area: { slug: 'health-insurance', en: 'Get health insurance', fa: 'تهیه بیمه درمانی' },
    guide: {
      slug: 'health-insurance',
      verifiedAt: '2026-09-14',
      en: {
        title: 'Health insurance in Germany, which is not optional',
        description: 'Anyone with a residence in Germany must hold qualifying health insurance unless an exception applies.',
      },
    },
    detail: {
      slug: 'health-insurance',
      sections: [
        {
          kind: 'beforeYouStart',
          title: { en: 'You must have it, and living here is what triggers it.' },
          body: {
            en: 'It is §193(3) VVG, and it attaches to residing here, not to holding a permit and not to having a job. Not working does not excuse you.',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'Which system you are in is mostly decided for you.' },
          body: {
            en: 'An employee is normally compulsorily in the statutory system (§5(1)(1) SGB V). A student at a recognised university normally is too, until thirty (§5(1)(9)). Someone self-employed as their main occupation normally is not. A permit on its own does not get you into the statutory system: the uninsured-person fallback in §5(1)(13) is restricted by §5(11) for third-country nationals and is not a general door for newcomers. Cross-border rules may also leave you insured by another country.',
          },
        },
        {
          kind: 'whatToCheck',
          title: { en: 'The threshold, and a three month window.' },
          body: {
            en: "The general employee threshold is €77,400 in 2026, equivalent to €6,450 a month. Someone starting employment above it is generally outside compulsory employee membership. Someone crossing it during an existing compulsory membership normally leaves only at year-end, provided their pay also exceeds the following year's threshold. Private insurance is an option above the threshold, not an obligation. If this is your first employment in Germany and you are over the threshold, you can join the statutory system voluntarily without the usual prior-insurance history, but you must tell the fund within three months of starting work (§9(1)(3)).",
          },
        },
        {
          kind: 'whatYouNeed',
          title: { en: 'What it costs.' },
          body: {
            en: "The general statutory rate is 14.6%, plus an additional contribution each fund sets for itself. The Ministry announces an average additional rate ahead of each year, and for 2026 that is 2.9%; the rates the funds were charging averaged 3.13% as of 1 April 2026, and your contribution normally uses your own fund's rate. Employer and employee normally split the general and additional contributions equally, which at the announced average is 8.75% each, an illustration, not a prediction of your own contribution, up to the monthly assessment ceiling of €5,812.50. Special contribution-sharing rules apply, including for midijobs. An ordinarily voluntarily insured self-employed GKV member pays the whole contribution, assessed on at least €1,318.33 monthly even with lower income. At the announced average additional rate the monthly minimum is about €222.80 without sickness cash benefit or €230.71 with it, which is the rate the Ministry's table assumes; your fund's rate can differ, and higher assessable income means higher contributions, up to the ceiling.",
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'Care insurance is on top, and it is where Saxony differs.' },
          body: {
            en: 'The standard social care-insurance rate is 3.6%. Childless members normally pay 4.2% from the month after their twenty-third birthday, subject to statutory exceptions. Discounts apply for the second through fifth qualifying children, until the end of the month in which each turns, or would have turned, twenty-five. For employment located in Saxony, the standard split is 2.3% employee and 1.3% employer; elsewhere it is 1.8 each. These figures are before child-related adjustments and special rules such as midijobs. The geographic trigger is the place of employment, not where the employee lives (§58 SGB XI).',
          },
        },
        {
          kind: 'importantToKnow',
          title: { en: 'The weeks before your job starts.' },
          body: {
            en: "Compulsory statutory membership through employment begins when the employment begins (§186(1)), not when you sign the contract. For the gap, the Foreign Office's visa guidance says incoming or travel insurance normally suffices as a bridge, provided it actually covers the interval and is not invalidated by an exclusion for intending to live in Germany; ending the policy when statutory cover starts is permitted, not required. That is visa-administration guidance; it is not certification that such a product satisfies §193 VVG.",
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'Do not carry that assumption into the permit office.' },
          body: {
            en: "Travel insurance accepted for your visa is not automatically enough for the first residence permit issued inside Germany. Hamburg's guidance separates those two stages explicitly. Berlin and Hamburg publish different requirements, which is not the same as verified acceptance decisions: Berlin's leaflet generally wants an annual deductible of no more than €300, with more allowed after individual assessment; Hamburg refers to a €5,000 ceiling and, for statutory insurance, says a copy of your health card is not enough on its own, it wants a current membership certificate.",
          },
        },
        {
          kind: 'commonProblems',
          title: { en: 'Being late is not automatically a bill back to your arrival.' },
          body: {
            en: 'Whether you owe back contributions depends on when your membership legally began; if it begins with your employment, that does not create contributions for the weeks before it. Where the uninsured-person route applies, late notification can produce contributions owed from the legal membership start; §256a provides for appropriately reducing those back contributions and fully waiving the associated late-payment surcharges, subject to its implementing rules. For the private-insurance duty, §193(4) VVG provides a separate premium surcharge when the application to conclude the required contract is made more than one month after that duty arose.',
          },
        },
        {
          kind: 'whereToDoIt',
          title: { en: 'What is the same everywhere.' },
          body: {
            en: "The duty, the earnings threshold, the statutory rates and the assessment limits are federal and identical wherever you live. What differs is which funds you can join, since some depend on where you live or work (§173 SGB V); what each fund charges as its additional contribution; what your city's immigration office accepts as evidence; and the Saxon care-insurance split.",
          },
        },
      ],
      sources: [
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__5.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 5' },
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__9.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 9', read: '2026-09-15' },
        {
          url: 'https://www.bundesgesundheitsministerium.de/gesetzlich-versicherte',
          name: 'Bundesministerium für Gesundheit, Versicherte in der gesetzlichen Krankenversicherung',
        },
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__6.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 6' },
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__241.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 241' },
        {
          url: 'https://www.bundesgesundheitsministerium.de/beitraege/seite',
          name: 'Bundesministerium für Gesundheit, Beiträge der gesetzlichen Krankenversicherung (GKV)',
        },
        {
          url: 'https://www.bundesgesundheitsministerium.de/finanzierung-gkv',
          name: 'Bundesministerium für Gesundheit, Finanzierung der gesetzlichen Krankenversicherung',
          read: '2026-09-16',
        },
        {
          url: 'https://www.bundesgesundheitsministerium.de/service/begriffe-von-a-z/b/beitragsbemessungsgrenze/seite',
          name: 'Bundesministerium für Gesundheit, Beitragsbemessungsgrenze',
        },
        {
          url: 'https://www.bundesgesundheitsministerium.de/themen/pflege/online-ratgeber-pflege/die-pflegeversicherung/finanzierung',
          name: 'Bundesministerium für Gesundheit, Finanzierung der Pflegeversicherung',
          read: '2026-09-15',
        },
        { url: 'https://www.gesetze-im-internet.de/sgb_11/__55.html', name: 'Sozialgesetzbuch Elftes Buch (SGB XI), § 55' },
        { url: 'https://www.gesetze-im-internet.de/sgb_11/__58.html', name: 'Sozialgesetzbuch Elftes Buch (SGB XI), § 58' },
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__186.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 186' },
        {
          url: 'https://welcome.hamburg.de/resource/blob/17560/c987410a6f2d85efdd62e238305eac16/merkblatt-der-bis-zum-nachweis-kv-data.pdf',
          name: 'welcome.hamburg.de, Merkblatt zum Nachweis der Krankenversicherung',
        },
        {
          url: 'https://www.berlin.de/einwanderung/_assets/merkblatt_zur_krankenversicherung.pdf',
          name: 'Landesamt für Einwanderung Berlin, Merkblatt zur Krankenversicherung',
        },
        { url: 'https://www.gesetze-im-internet.de/sgb_5/__256a.html', name: 'Sozialgesetzbuch Fünftes Buch (SGB V), § 256a' },
        { url: 'https://www.gesetze-im-internet.de/vvg_2008/__193.html', name: 'Versicherungsvertragsgesetz (VVG), § 193' },
      ],
    },
    obligations: GERMANY_HEALTH_INSURANCE,
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
/**
 * SB-305: reconciling is OFF unless asked for, and only the production load asks.
 *
 * `guides` is deliberately called with one guide subsets by tests, which then restore the full set in a `finally`. A
 * cleanup that ran on every call would read such a subset as that country's whole manifest and delete the other rows
 * the research still names. So removal is an explicit choice made by the one caller that passes the whole manifest.
 */
export type LoadOptions = { reconcile?: boolean }

export const loadResearchedGuides = async (
  prisma: PrismaClient,
  guides: readonly ResearchedGuide[] = RESEARCHED_GUIDES,
  { reconcile = false }: LoadOptions = {},
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
  if (reconcile) await removeWhatTheResearchNoLongerNames(prisma, guides)
  return loaded
}

/**
 * Rows this research owns and no longer names, removed (SB-305).
 *
 * Owned means the `research` column holds one of the names this load carries, so every sample and editor written row,
 * whose column is null, is out of reach by construction rather than by a filter someone has to remember.
 *
 * Guides go before areas, and that order is not cosmetic: `Guide.categoryId` is `onDelete: SetNull`, so removing an
 * area does not skip a guide inside it, it quietly uncategorises it. An unowned guide sitting in an area about to go is
 * refused by name instead, because deleting someone else's row and orphaning it are both worse than stopping.
 */
const removeWhatTheResearchNoLongerNames = async (prisma: PrismaClient, guides: readonly ResearchedGuide[]): Promise<void> => {
  const owners = [...new Set(guides.map((researched) => researched.research))]
  const namedGuides = new Set(guides.map((researched) => `${researched.country}/${researched.guide.slug}`))
  const namedAreas = new Set(guides.map((researched) => `${researched.country}/${researched.area.slug}`))

  const ownedGuides = await prisma.guide.findMany({ where: { research: { in: owners } }, select: { id: true, countryCode: true, slug: true } })
  const staleGuides = ownedGuides.filter((row) => !namedGuides.has(`${row.countryCode}/${row.slug}`))

  const ownedAreas = await prisma.category.findMany({
    where: { research: { in: owners } },
    select: { id: true, countryCode: true, slug: true, guides: { select: { id: true, slug: true, research: true } } },
  })
  const staleAreas = ownedAreas.filter((row) => !namedAreas.has(`${row.countryCode}/${row.slug}`))

  const going = new Set(staleGuides.map((row) => row.id))
  const stranded = staleAreas.flatMap((area) =>
    area.guides.filter((guide) => !going.has(guide.id)).map((guide) => `${area.countryCode}/${area.slug} still holds ${guide.slug}`),
  )
  if (stranded.length > 0) {
    throw new Error(`the research no longer names ${stranded.join(', ')}, and removing the area would leave it with no area; nothing was deleted.`)
  }

  if (staleGuides.length === 0 && staleAreas.length === 0) return
  await prisma.$transaction(
    async (tx) => {
      if (staleGuides.length > 0) await tx.guide.deleteMany({ where: { id: { in: staleGuides.map((row) => row.id) } } })
      if (staleAreas.length > 0) await tx.category.deleteMany({ where: { id: { in: staleAreas.map((row) => row.id) } } })
    },
    { timeout: TIMEOUT_MS },
  )
  console.log(
    `researched guides: removed ${staleGuides.length} guide(s) and ${staleAreas.length} area(s) the research no longer names`,
  )
}

const writeGuide = async (tx: Prisma.TransactionClient, taskId: string, researched: ResearchedGuide): Promise<void> => {
  const { country: countryCode, detail } = researched
  const verifiedAt = new Date(researched.guide.verifiedAt)

  const areaRow = { taskId, position: 0, kind: null, startGuideId: null, research: researched.research }
  const area = await tx.category.upsert({
    where: { countryCode_slug: { countryCode, slug: researched.area.slug } },
    update: areaRow,
    create: { countryCode, slug: researched.area.slug, ...areaRow },
  })
  // SB-260: the area's English row carries the guide's own description, so its hub page has a meta
  // description instead of leaving a search engine to write one from whatever is on the page. No
  // sentence is invented: the agreed documents state none for an area, and this one is already agreed
  // and already served as the guide's. Persian stays null deliberately, since there is no agreed
  // Persian sentence and this loader keeps no translated guide text either.
  for (const [locale, title, description] of [
    ['en-US', researched.area.en, researched.guide.en.description],
    ['fa-IR', researched.area.fa, null],
  ] as const) {
    const written = { title, description, startReason: null, askPrompt: null }
    await tx.categoryText.upsert({
      where: { categoryId_locale: { categoryId: area.id, locale } },
      update: written,
      create: { categoryId: area.id, locale, ...written },
    })
  }

  const guideRow = { categoryId: area.id, verifiedAt, position: 0, showDisclaimer: false, showSuggestUpdate: true, readingMinutes: null, research: researched.research }
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

  // SB-307: the position is a section's identity, so the file's order is what stands and the tail beyond it goes.
  await tx.guideSection.deleteMany({ where: { guideId: guide.id, position: { gte: detail.sections.length } } })
  for (const [position, section] of detail.sections.entries()) {
    const row = await tx.guideSection.upsert({
      where: { guideId_position: { guideId: guide.id, position } },
      update: { kind: section.kind, linkGuideId: null },
      create: { guideId: guide.id, kind: section.kind, position },
    })
    await tx.guideStep.deleteMany({ where: { sectionId: row.id } })
    // The file writes English. Any other language on this row described whatever used to sit at this position.
    await tx.guideSectionText.deleteMany({ where: { sectionId: row.id, locale: { not: 'en-US' } } })
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
    // SB-215: a guide cites pages read on different days, and a card stamping the guide's day on all of them tells a
    // reader a page was checked when it was not. A source's own day where it has one, the guide's otherwise.
    const written = {
      url: source.url,
      name: source.name,
      publisher: null,
      official: true,
      note: null,
      verifiedAt: source.read ? new Date(source.read) : verifiedAt,
      position,
    }
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
