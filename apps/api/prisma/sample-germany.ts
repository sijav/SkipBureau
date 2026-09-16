import { ADDRESS_GUIDE } from '../src/guide/obligation-groups.js'
import { WAS_FIRST_WEEK, type CountrySeed } from '../src/sample-content.js'

/**
 * Germany's sample content, a test fixture since SB-301. The owner answered on 2026-09-15 that every sample row is
 * deleted from the deployed database and never refilled, Germany's as Turkey's, so production's sample content no
 * longer fills it and retires the area an earlier start wrote. prisma/seed.ts fills it for the tests, the e2e build
 * and a local database, which keep the English-only guide text that proves what a Persian reader is told (SB-049).
 *
 * Its anmeldung guide is here for those tests only. On a deployed database that row belongs to the researched
 * loader, which took it over in SB-299, so Germany's retired slugs name the area and no guide.
 */
export const GERMANY_SAMPLE: CountrySeed = {
  code: 'de',
  categories: [
    {
      slug: 'first-week',
      task: 'getting-settled',
      position: 0,
      en: 'Getting Settled',
      fa: 'استقرار اولیه',
      enDesc: 'Essential services to help you start everyday life in Germany.',
      faDesc: 'خدمات ضروری برای شروع زندگی روزمره در آلمان.',
      was: WAS_FIRST_WEEK,
    },
  ],
  guides: [
    {
      slug: 'anmeldung',
      category: 'first-week',
      obligations: ADDRESS_GUIDE,
      en: {
        title: 'Register your address',
        description: 'The Anmeldung, which almost everything else in Germany depends on.',
        quickAnswer:
          'Book a Buergeramt appointment and bring the confirmation your landlord signs. Without this you cannot open a bank account or get a tax id.',
        cost: 'Free',
        time: 'One appointment, but the wait for it can be weeks',
      },
      // Deliberately English only. A Persian reader must be told this exists
      // in English rather than shown a blank page, which is SB-049.
      sections: [
        {
          kind: 'whatYouNeed',
          en: 'Your passport, and a Wohnungsgeberbestaetigung signed by whoever provides the flat.',
        },
        {
          kind: 'importantToKnow',
          en: 'Appointments are scarce. Book before you have moved if you can.',
        },
      ],
      options: [{ en: 'Book online at any Buergeramt in the city, not only your own district.' }],
      sources: [{ url: 'https://www.berlin.de/einwohnermeldeamt/', name: 'Berlin Einwohnermeldeamt' }],
    },
  ],
}
