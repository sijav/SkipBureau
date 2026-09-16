# SB-320, the panel's work place test is skipped for a reason that is not true

**Exit, as its check narrowed it:** run from `apps/web`, `npm run test:e2e` runs the work place case against the e2e
build: choosing Berlin in the panel, reopening it to find the row saying Berlin, the €26 fee, and Saxony's 2.3% split
on the health guide; it fails when the shell drops the work place. Persian is read on the live page by hand, since a
Persian assertion would be a language test the owner forbade.

SB-313 shipped the work place with an end-to-end case that chooses it in the panel, and skipped that case unless
`PAGES_URL` is set, saying the e2e build has no researched German guides. **It has them.**
`e2e/api-server.mjs` line 50 runs `dist/load-researched-guides.js` after `prisma/seed.ts`, in production's own order;
the skip was written from reading `prisma/seed.ts` alone, which fills only the fixtures. So the one automated proof of
that wiring never ran anywhere, and SB-318's two defects were found by a reviewer instead.

Two things the card's wording gets wrong and this plan does not. **CI runs no Playwright at all**: `ci.yml` installs
chromium for the browser-mode vitest projects and runs `test:coverage`, so this case is worth having for the run
before a push, not because CI will catch it, and no CI job is added. And **`npm run test:e2e` does not exist at the
repository root**, whose scripts are empty: it is run from `apps/web`, or with `-w @skipbureau/web`.

## The change

1. **The skip goes.** The case runs against the local built site, which `playwright.config.ts`'s `pages` project
   serves at `localhost:5190` under the repository subpath with the real API beside it, and against the live site when
   `PAGES_URL` is set, where it already ran.
2. **The Berlin case proves the shell, not only the answer.** This is the check's central correction and the reason
   the card exists: with `AddressShell` dropping the work place, the case as SB-313 wrote it still passes, because the
   address is still written, `CountryRoute` still puts the work place in the country context, and the guide still
   renders €26. So after choosing Berlin the case **closes and reopens the panel and reads the row**, which is the
   only assertion SB-318's defect fails.
3. **Saxony**, chosen the same way on the health insurance guide, where the employee's share becomes 2.3% from the
   national 1.8%. It is worth its time because it exercises a different version of a different rule, not another
   value of the same one.
4. **The €26 assertion stops being an exact match.** A fact's line is the figure and the research's words after it, so
   `getByText('€26', { exact: true })` passes only where the value happens to stand alone; the case reads the card's
   text and looks for the figure inside it, which is what the live check had to be corrected to do.
5. **No Persian assertion.** The owner's order of 2026-09-10 is that no test is written for any language, and SB-144,
   which proposed exactly a missing-translation check, was dropped. The Persian side is read on the live page by hand,
   as SB-300's thirty labels were.

## How it is checked

- From `apps/web`: `npx playwright test e2e/pages.spec.ts --project pages`, which is what `npm run test:e2e` runs with
  a filter. The file filter comes before `--project`, which takes a list.
- **Planted**: `AddressShell`'s confirmed work place removed, which is SB-318's defect. With the reopened-row
  assertion the case fails; without it, it would have passed, which is the check's point.
- The web's lint and type checker over the spec.
- The live run too, `PAGES_URL=... --project pages`, since the case now runs in both and deployment parity is the only
  thing the local database cannot show.

**One live run failed and the next passed, and the reason is worth writing down rather than padding a timeout over.**
The failing run was started while the local suite was building the API and the web on the same machine, so the
browser waited on a saturated CPU and the answers query, which the live API serves far more slowly than a local one,
missed the five second default. Run alone, the three cases pass live in about three seconds each. The lesson is not to
lengthen the waits but not to run the two suites at once; if these ever flake when nothing else is running, the answer
is a wait for the answered figure, as the live scripts do, not a longer blanket timeout.

**What the Persian page said, read by hand on 2026-09-16** at `/fa/DE/guides/health-insurance?work=DE-SN`: the card
answers **سهم کارمند از حق بیمهٔ مراقبت ۲٫۳٪** with the employer's **۱٫۳٪** beside it, each with its source and the
day it was checked in Persian digits, and the panel's row reads **محل کار شما Sachsen**. The place keeps its own name,
which is right: it is a proper name the research carries, not a word to translate.

One thing that read-back taught the cases: the deployment names Germany's states in German, Sachsen, while the e2e
build names several of them in English, Bavaria and Baden-Württemberg among them, so the Saxony case matches either
spelling rather than the one this machine happens to show.

## Checked on 2026-09-16, and revised

Three corrections, all taken. The plant would not have failed: the guide answers from the country context, so only a
reopened panel shows the shell's state, and the case now reopens it. The Persian assertion is a language test the
owner forbade, so Persian is checked by hand on the live page. And the command is run from `apps/web`, since the
repository root has no scripts.

It confirmed the rest: the local runner loads the researched rules and guides, so Berlin's €26 and Saxony's 2.3% come
from the same research graph as the deployment, with a live run still needed for parity; the three cases add no extra
build, since the servers start once per invocation; and no CI job should be added, which the owner's order also says.

## What I am least sure of

- How long the pages project takes from cold: it builds the API, seeds PGlite, builds the web and prerenders it
  before the first assertion, which is minutes. If that makes these cases painful to run, the argument for keeping
  them is weaker than the argument for the story SB-318 added.
- Whether the Saxony case should also reopen the panel, or whether proving the shell once is enough for both.
